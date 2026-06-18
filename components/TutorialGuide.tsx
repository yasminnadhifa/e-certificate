"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: "👋",
    title: "Selamat Datang!",
    desc: "Mari pelajari cara membuat sertifikat. Ikuti langkah-langkah berikut ini.",
  },
  {
    icon: "✍️",
    title: "1. Ketik Nama Peserta",
    desc: "Ketik nama peserta di kolom input, lalu tekan tombol Enter di keyboard untuk menambahkan. Ulangi untuk setiap nama.",
  },
  {
    icon: "⚙️",
    title: "2. Klik Generate",
    desc: "Setelah semua nama dimasukkan, tekan tombol Generate. Akan muncul konfirmasi, tekan Ya, Generate.",
  },
  {
    icon: "👀",
    title: "3. Lihat Preview",
    desc: "Sertifikat akan muncul di bagian Preview. Periksa apakah nama sudah benar dan posisinya sudah tepat.",
  },
  {
    icon: "🔢",
    title: "4. Limit Generate",
    desc: "Setiap akun memiliki limit jumlah sertifikat yang bisa di-generate. Limit akan berkurang setiap kali generate. Jika limit habis, hubungi admin untuk menambah.",
  },
  {
    icon: "⬇️",
    title: "5. Download",
    desc: "Tekan Download di setiap sertifikat, atau tekan Download Semua untuk mengunduh semuanya sekaligus dalam file ZIP.",
  },
];

const STORAGE_KEY = "tutorial-seen";

export default function TutorialGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    setStep(0);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const goTo = (next: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 200);
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#7B1111] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
        title="Cara Pakai"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
        </svg>
      </button>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-[#7B1111] transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          {/* Content */}
          <div
            className={`flex flex-col items-center px-8 pb-6 pt-8 text-center transition-all duration-200 ${
              animating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-5xl">
              {current.icon}
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">{current.title}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{current.desc}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 pb-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-[#7B1111]" : "w-2 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => goTo(step - 1)}>
                Sebelumnya
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Lewati
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={handleClose}>
                Mulai Pakai
              </Button>
            ) : (
              <Button size="sm" onClick={() => goTo(step + 1)}>
                Lanjut
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
