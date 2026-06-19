"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import TutorialGuide from "@/components/TutorialGuide";

interface UserProps {
  id: string;
  name: string;
  username: string;
  role: string;
  limit: number;
  used: number;
}

interface CertificateGeneratorProps {
  user: UserProps;
}

interface CertificatePreview {
  name: string;
  dataUrl: string;
}

type HistoryScope = "all" | "me";
const TEMPLATE_URL = new URL("./sertifikat.jpg", import.meta.url).href;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_");
}

function canvasToPdfBlob(canvas: HTMLCanvasElement): Blob {
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const w = canvas.width;
  const h = canvas.height;
  const orientation = w > h ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
  pdf.addImage(imgData, "JPEG", 0, 0, w, h);
  return pdf.output("blob");
}

export default function CertificateGenerator({ user }: CertificateGeneratorProps) {
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState("Times New Roman, serif");
  const [fontStyle, setFontStyle] = useState("bold");
  const [fontColor, setFontColor] = useState("#2e0909");
  const [posY, setPosY] = useState(40);
  const [textEditable, setTextEditable] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previews, setPreviews] = useState<CertificatePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(user.used);
  const [limit, setLimit] = useState(user.limit);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [historyScope, setHistoryScope] = useState<HistoryScope>("all");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [zipDialogOpen, setZipDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("Sertifikat");
  const router = useRouter();

  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    const image = new globalThis.Image();
    image.src = TEMPLATE_URL;

    image.onload = () => {
      setTemplateImage(image);
      setTemplateLoaded(true);
    };

    image.onerror = () => {
      setStatus("Tidak dapat memuat template sertifikat.");
    };
  }, []);

  const fetchHistoryPreviews = useCallback(async () => {
    if (!templateImage) return;
    setHistoryLoading(true);

    try {
      const response = await fetch(`/api/history?scope=${historyScope}`);
      const data = await response.json();
      const nextPreviews: CertificatePreview[] = [];

      data.history?.forEach((entry: { names?: string[] }) => {
        entry.names?.forEach((name) => {
          const canvas = document.createElement("canvas");
          canvas.width = templateImage.naturalWidth;
          canvas.height = templateImage.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
          ctx.font = `bold 40px Times New Roman, serif`;
          ctx.fillStyle = "#2e0909";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(255,255,255,0.4)";
          ctx.shadowBlur = 6;
          ctx.fillText(name, canvas.width / 2, (canvas.height * 40) / 100);
          ctx.shadowBlur = 0;
          nextPreviews.push({ name, dataUrl: canvas.toDataURL("image/jpeg", 0.95) });
        });
      });

      setPreviews(nextPreviews);
    } catch {
      setPreviews([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyScope, templateImage]);

  useEffect(() => {
    fetchHistoryPreviews();
  }, [fetchHistoryPreviews]);

  const remaining = useMemo(() => {
    if (isAdmin) return Infinity;
    return Math.max(limit - used, 0);
  }, [limit, used, isAdmin]);

  const drawCertificate = useCallback((name: string): HTMLCanvasElement | null => {
    if (!templateImage) return null;

    const canvas = document.createElement("canvas");
    canvas.width = templateImage.naturalWidth;
    canvas.height = templateImage.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,0.4)";
    ctx.shadowBlur = 6;

    const x = canvas.width / 2;
    const y = (canvas.height * posY) / 100;
    ctx.fillText(name, x, y);
    ctx.shadowBlur = 0;

    return canvas;
  }, [templateImage, fontStyle, fontSize, fontFamily, fontColor, posY]);

  const handleGenerateClick = () => {
    if (!templateLoaded) {
      setStatus("Template sertifikat belum siap. Tunggu beberapa detik.");
      return;
    }
    if (!names.length) {
      setStatus("Masukkan minimal satu nama peserta.");
      return;
    }
    if (!isAdmin && names.length > remaining) {
      setLimitDialogOpen(true);
      return;
    }
    setGenerateDialogOpen(true);
  };

  const handleGenerateConfirm = async () => {
    setGenerateDialogOpen(false);
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/user/generate-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: names.length, names }),
      });
      const body = await response.json();
      if (!response.ok) {
        setStatus(body.error || "Terjadi kesalahan saat memperbarui limit.");
        setLoading(false);
        return;
      }
      setUsed(body.used);
      await fetchHistoryPreviews();
    } catch {
      setStatus("Terjadi kesalahan server. Coba lagi nanti.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStatus(`${names.length} sertifikat berhasil di-generate. Preview telah diperbarui.`);
  };

  const downloadPdf = (name: string) => {
    const canvas = drawCertificate(name);
    if (!canvas) return;
    const blob = canvasToPdfBlob(canvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sertifikat_${sanitizeFilename(name)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllClick = () => {
    if (!previews.length) {
      setStatus("Tidak ada preview untuk didownload.");
      return;
    }
    setFolderName("Sertifikat");
    setZipDialogOpen(true);
  };

  const handleDownloadAllConfirm = async () => {
    setZipDialogOpen(false);
    setLoading(true);
    setStatus("Membuat file ZIP...");

    const zip = new JSZip();
    const folder = zip.folder(folderName || "Sertifikat")!;

    previews.forEach((item) => {
      const canvas = drawCertificate(item.name);
      if (!canvas) return;
      const blob = canvasToPdfBlob(canvas);
      folder.file(`Sertifikat_${sanitizeFilename(item.name)}.pdf`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folderName || "Sertifikat"}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLoading(false);
    setStatus(`${previews.length} file berhasil diunduh.`);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    router.refresh();
  };

  const limitExhausted = !isAdmin && remaining <= 0;
  const canDownload = previews.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg object-contain" />
            <span className="text-sm font-semibold text-gray-900">Bundo Kanduang</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            )}
            <div className="hidden items-center gap-3 border-l border-gray-200 pl-3 sm:flex">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900">{user.name}</p>
                <p className="text-[11px] text-gray-500">{user.username}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">Limit</p>
              <p className="mt-0.5 text-xl font-semibold text-gray-900">
                {isAdmin ? "∞" : limit}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">Terpakai</p>
              <p className="mt-0.5 text-xl font-semibold text-gray-900">{used}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">Sisa</p>
              <p className="mt-0.5 text-xl font-semibold text-gray-900">
                {isAdmin ? "∞" : remaining}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            {/* Controls */}
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-gray-900">Template</h2>
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
                  <img className="w-full object-cover" src={TEMPLATE_URL} alt="Template Sertifikat" />
                </div>
              </div>

              {isAdmin && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">Pengaturan Teks</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTextEditable(!textEditable)}
                    >
                      {textEditable ? "Kunci" : "Edit"}
                    </Button>
                  </div>
                  <div className={`mt-4 space-y-3${textEditable ? "" : " pointer-events-none opacity-60"}`}>
                    <div>
                      <Label htmlFor="fontFamily">Font</Label>
                      <select
                        id="fontFamily"
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        disabled={!textEditable}
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-[#7B1111] focus:outline-none focus:ring-1 focus:ring-[#7B1111] disabled:cursor-not-allowed"
                      >
                        <option value="Playfair Display, serif">Playfair Display</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times New Roman, serif">Times New Roman</option>
                        <option value="Garamond, serif">Garamond</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="fontSize">Ukuran</Label>
                        <Input
                          id="fontSize"
                          type="number"
                          min={20}
                          max={120}
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          disabled={!textEditable}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fontStyle">Gaya</Label>
                        <select
                          id="fontStyle"
                          value={fontStyle}
                          onChange={(e) => setFontStyle(e.target.value)}
                          disabled={!textEditable}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-[#7B1111] focus:outline-none focus:ring-1 focus:ring-[#7B1111] disabled:cursor-not-allowed"
                        >
                          <option value="italic">Italic</option>
                          <option value="bold italic">Bold Italic</option>
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="fontColor">Warna</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="fontColor"
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          disabled={!textEditable}
                          className="h-9 w-10 rounded-md border border-gray-200 p-0.5 disabled:cursor-not-allowed"
                        />
                        <span className="font-mono text-xs text-gray-500">{fontColor}</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="posY">Posisi vertikal</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="posY"
                          type="range"
                          min={10}
                          max={90}
                          value={posY}
                          onChange={(e) => setPosY(Number(e.target.value))}
                          disabled={!textEditable}
                          className="h-1.5 w-full appearance-none rounded-full bg-gray-200 accent-[#7B1111] disabled:cursor-not-allowed"
                        />
                        <span className="min-w-8 text-center text-xs font-medium text-gray-500">{posY}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main */}
            <div className="space-y-4">
              {/* Input */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">Nama Peserta</h2>
                    {names.length > 0 && (
                      <span className="rounded-full bg-[#7B1111] px-2 py-0.5 text-[11px] font-medium text-white">
                        {names.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleGenerateClick} disabled={loading || limitExhausted}>
                      Generate
                    </Button>
                    {names.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNames([])}
                      >
                        Hapus semua
                      </Button>
                    )}
                  </div>
                </div>

                {limitExhausted ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                    Limit Anda sudah habis. Hubungi admin untuk menambah limit.
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-gray-200 p-3">
                      {names.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {names.map((name, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() => setNames(names.filter((_, j) => j !== i))}
                                className="ml-0.5 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M3 3l6 6M9 3l-6 6" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = nameInput.trim();
                              if (trimmed) {
                                if (!isAdmin && names.length >= remaining) {
                                  setLimitDialogOpen(true);
                                  return;
                                }
                                setNames([...names, trimmed]);
                                setNameInput("");
                              }
                            }
                          }}
                          placeholder={names.length === 0 ? "Ketik nama lalu tekan Enter atau klik Tambah" : "Tambah nama lagi..."}
                          className="flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        />
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full border-[#7B1111] bg-[#f7ebe8] text-[#7B1111] hover:bg-[#7B1111] hover:text-white focus-visible:ring-[#7B1111]"
                            onClick={() => {
                              const trimmed = nameInput.trim();
                              if (!trimmed) return;
                              if (!isAdmin && names.length >= remaining) {
                                setLimitDialogOpen(true);
                                return;
                              }
                              setNames([...names, trimmed]);
                              setNameInput("");
                            }}
                            disabled={!nameInput.trim()}
                          >
                            <Plus size={14} />
                            Tambah
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Masukkan nama satu per satu. Bisa langsung tekan Enter atau klik Tambah. Tekan Generate setelah semua nama sudah dimasukkan.
                      </p>
                    </div>
                    {names.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNames([])}
                        className="mt-2 text-xs text-gray-400 transition-colors hover:text-red-500"
                      >
                        Hapus semua
                      </button>
                    )}
                  </>
                )}

                {status && (
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    {status}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {previews.length} hasil
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setHistoryScope("all")}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            historyScope === "all"
                              ? "bg-[#7B1111] text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryScope("me")}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            historyScope === "me"
                              ? "bg-[#7B1111] text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Milik Saya
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {historyLoading && (
                      <span className="text-xs text-gray-500">Memuat preview...</span>
                    )}
                    {canDownload && (
                      <Button variant="secondary" size="sm" onClick={handleDownloadAllClick} disabled={loading || historyLoading}>
                        Download Semua
                      </Button>
                    )}
                  </div>
                </div>

                {previews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" />
                    </svg>
                    <p className="text-sm text-gray-400">Belum ada preview</p>
                    <p className="mt-0.5 text-xs text-gray-300">Masukkan nama lalu klik Generate</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {previews.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="group overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                      >
                        <img src={item.dataUrl} alt={`Sertifikat ${item.name}`} className="w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-[11px] text-gray-400">PDF</p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => downloadPdf(item.name)}
                            disabled={loading}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Limit reached dialog */}
      <Dialog open={limitDialogOpen} onClose={() => setLimitDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Limit Tercapai</DialogTitle>
          <DialogDescription>
            Limit Anda tersisa {remaining}. Tidak bisa menambah nama lagi. Hubungi admin untuk menambah limit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setLimitDialogOpen(false)}>Tutup</Button>
        </DialogFooter>
      </Dialog>

      {/* Generate confirmation dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Konfirmasi Generate</DialogTitle>
          <DialogDescription>
            Sertifikat akan digenerate dan <strong>tidak dapat diubah</strong> setelah proses ini. {isAdmin ? "" : `Limit Anda akan berkurang dari ${remaining} menjadi ${Math.max(remaining - names.length, 0)}.`}
          </DialogDescription>
          <DialogDescription>
            Pastikan semua data sudah benar sebelum melanjutkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setGenerateDialogOpen(false)}>
            Periksa Lagi
          </Button>
          <Button onClick={handleGenerateConfirm} disabled={loading}>
            {loading ? "Memproses..." : "Ya, Generate Sekarang"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ZIP folder name dialog */}
      <Dialog open={zipDialogOpen} onClose={() => setZipDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Download Semua Sertifikat</DialogTitle>
          <DialogDescription>
            {previews.length} sertifikat akan diunduh dalam file ZIP. Tentukan nama folder di dalamnya.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="folderName">Nama Folder</Label>
          <Input
            id="folderName"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Sertifikat"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setZipDialogOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleDownloadAllConfirm} disabled={loading}>
            {loading ? "Memproses..." : "Download ZIP"}
          </Button>
        </DialogFooter>
      </Dialog>

      <TutorialGuide />
    </div>
  );
}
