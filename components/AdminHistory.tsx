"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryItem {
  _id: string;
  userName: string;
  names: string[];
  count: number;
  createdAt: string;
}

const PER_PAGE = 10;

export default function AdminHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(history.length / PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return history.slice(start, start + PER_PAGE);
  }, [history, page]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Riwayat Generate</h1>
          <p className="mt-1 text-sm text-gray-500">
            Log semua sertifikat yang pernah di-generate oleh pengguna.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">Log Generate</h2>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {history.length} entri
            </span>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Memuat...</div>
          ) : history.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Belum ada riwayat generate.</div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {paginated.map((item) => (
                  <div key={item._id} className="px-5 py-4 transition-colors hover:bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{item.userName}</span>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                            {item.count} sertifikat
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.names.map((name, i) => (
                            <span
                              key={i}
                              className="inline-block rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                  <p className="text-xs text-gray-500">
                    Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, history.length)} dari {history.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`min-w-7 rounded-md px-1.5 py-1 text-xs font-medium transition-colors ${
                          p === page
                            ? "bg-[#7B1111] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
