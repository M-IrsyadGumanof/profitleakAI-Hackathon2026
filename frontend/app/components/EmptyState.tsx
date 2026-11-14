import * as React from "react";
import { Inbox, FileQuestion, ArrowRight } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "Belum Ada Data Transaksi",
  description = "Silakan unggah berkas CSV atau masukkan data paket pengiriman untuk melihat hasil analisis kebocoran profit.",
  icon,
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {icon || <Inbox size={24} />}
      </div>
      <h4 className="mt-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
        {title}
      </h4>
      <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
        >
          <span>{actionText}</span>
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
