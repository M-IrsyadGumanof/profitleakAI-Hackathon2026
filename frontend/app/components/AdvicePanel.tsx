"use client";

import * as React from "react";
import {
  Sparkles,
  Bot,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Tag,
  ArrowRight,
  Info,
  Layers,
} from "lucide-react";
import type {
  AdviceResponse,
  AdvicePriority,
  AdviceRowNote,
} from "../lib/types";

export type { AdviceResponse, AdvicePriority, AdviceRowNote };

export interface AdvicePanelProps {
  data: AdviceResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectLine?: (line: number) => void;
  className?: string;
}

export function AdvicePanel({
  data,
  loading,
  error,
  onRetry,
  onSelectLine,
  className = "",
}: AdvicePanelProps) {
  // 1. STATE: LOADING (Skeleton Shimmer)
  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-indigo-200/80 bg-white p-6 shadow-xs dark:border-indigo-900/50 dark:bg-zinc-900/90 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Sparkles size={20} className="animate-spin text-indigo-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              AI Menganalisis Transaksi...
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mengevaluasi tarif wajar, risiko margin, dan merumuskan prioritas perbaikan praktis.
            </p>
          </div>
        </div>

        {/* Shimmer Skeletons */}
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-6 w-3/4 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
          <div className="h-4 w-5/6 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
            <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
            <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE: ERROR JARINGAN / SISTEM
  if (error) {
    return (
      <div
        className={`rounded-2xl border border-rose-200/90 bg-rose-50/50 p-6 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/20 ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Gagal Memuat Saran AI
              </h4>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-2xs hover:bg-rose-50 active:scale-95 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={13} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // 3. STATE: IDLE (Sebelum Minta Saran)
  if (!data) {
    return (
      <div
        className={`rounded-2xl border border-zinc-200/90 bg-linear-to-br from-indigo-50/30 via-white to-zinc-50/40 p-6 shadow-xs dark:border-zinc-800/90 dark:from-indigo-950/10 dark:via-zinc-900 dark:to-zinc-900/60 ${className}`}
      >
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-xs dark:bg-indigo-950/70 dark:text-indigo-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Butuh Penjelasan Bahasa Awam?
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Dapatkan rekomendasi prioritas perbaikan dan saran harga jual yang dievaluasi langsung oleh AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Sparkles size={15} />
            <span>Minta Saran AI</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. STATE: SUKSES (Data Tersedia) + 5. FALLBACK NOTATION
  const isGemini = data.source === "gemini";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-xs transition-all dark:bg-zinc-900/95 ${
        isGemini
          ? "border-indigo-200/90 dark:border-indigo-900/50"
          : "border-zinc-200/90 dark:border-zinc-800/80"
      } ${className}`}
    >
      {/* Header Info & Badge Sumber */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/70">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isGemini
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {isGemini ? <Sparkles size={16} /> : <Bot size={16} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Saran & Rekomendasi Tindakan
            </h4>
            <span className="text-[11px] text-zinc-400">
              Dianalisis pada {new Date(data.generated_at).toLocaleTimeString("id-ID")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Sumber (Fallback vs Gemini) */}
          {isGemini ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Sparkles size={12} /> Google Gemini AI
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              title="Saran standar berbasis aturan Python (kunci AI tidak diset atau kuota habis)"
            >
              <Info size={12} /> Saran Standar (AI Tidak Tersedia)
            </span>
          )}

          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Minta ulang saran"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Headline & Ringkasan */}
      <div className="mt-5 space-y-2">
        <h3 className="text-base font-extrabold text-zinc-900 sm:text-lg dark:text-zinc-50">
          {data.headline}
        </h3>
        <p className="text-xs text-zinc-600 leading-relaxed dark:text-zinc-300">
          {data.ringkasan}
        </p>
      </div>

      {/* Bagian Prioritas Tindakan (Maks. 3 Item) */}
      {data.prioritas && data.prioritas.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Layers size={14} /> Prioritas Aksi Perbaikan
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {data.prioritas.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 transition-all hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {idx + 1}
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                      {item.dampak}
                    </span>
                  </div>

                  <h5 className="mt-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {item.judul}
                  </h5>

                  <ul className="mt-2 space-y-1.5">
                    {item.aksi.map((act, actIdx) => (
                      <li
                        key={actIdx}
                        className="flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400"
                      >
                        <CheckCircle2
                          size={12}
                          className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {item.terdampak && item.terdampak.length > 0 && (
                  <div className="mt-4 border-t border-zinc-200/60 pt-2.5 dark:border-zinc-800/60">
                    <span className="text-[10px] font-medium text-zinc-400">Baris terdampak:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.terdampak.map((ln) => (
                        <button
                          key={ln}
                          type="button"
                          onClick={() => onSelectLine?.(ln)}
                          className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-700 shadow-2xs hover:bg-zinc-100 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
                          title={`Lihat baris #${ln} di tabel`}
                        >
                          #{ln}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bagian Per Baris (Saran Penyesuaian Harga) */}
      {data.per_baris && data.per_baris.length > 0 && (
        <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Tag size={14} /> Catatan Khusus Per Baris
          </div>

          <div className="mt-3 space-y-2">
            {data.per_baris.map((rowItem, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800/60 dark:bg-zinc-800/30"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                    Baris #{rowItem.line}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {rowItem.masalah}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <ArrowRight size={13} />
                  <span>{rowItem.saran_harga}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER DISCLAIMER WAJIB */}
      <div className="mt-6 border-t border-zinc-100 pt-4 text-center dark:border-zinc-800/70">
        <p className="text-[11px] text-zinc-400">
          {data.catatan || "Saran AI, bukan nasihat keuangan. Model tidak mencakup HPP & diskon."}
        </p>
      </div>
    </div>
  );
}
