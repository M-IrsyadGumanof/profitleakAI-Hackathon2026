import * as React from "react";
import { AlertCircle, X, RotateCcw } from "lucide-react";

export interface ErrorBannerProps {
  title?: string;
  detail: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({
  title = "Terjadi Kesalahan Validasi / Sistem",
  detail,
  onRetry,
  onDismiss,
  className = "",
}: ErrorBannerProps) {
  if (!detail) return null;

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/70 p-4 text-xs text-rose-900 shadow-2xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 ${className}`}
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="flex-1 space-y-1">
        <h5 className="font-semibold">{title}</h5>
        <p className="text-rose-700/90 dark:text-rose-300/90 leading-relaxed">
          {detail}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-200/60 px-2.5 py-1 text-[11px] font-semibold text-rose-900 transition hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-100 dark:hover:bg-rose-900"
          >
            <RotateCcw size={12} /> Coba Lagi
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/50"
          title="Tutup pesan"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
