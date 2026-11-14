"use client";

import * as React from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  acceptedFile?: File | null;
  onClearFile?: () => void;
  errorMessage?: string | null;
  className?: string;
  maxRowsWarning?: number;
}

export function UploadDropzone({
  onFileSelect,
  isLoading = false,
  acceptedFile = null,
  onClearFile,
  errorMessage = null,
  className = "",
  maxRowsWarning = 50000,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndPassFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndPassFile(file);
    }
  };

  const validateAndPassFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Hanya berkas format .csv yang didukung.");
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && !acceptedFile && inputRef.current?.click()}
        className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragOver
            ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-950/20"
            : acceptedFile
            ? "border-zinc-300 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-900/40"
            : "border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
        } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Memproses dan menganalisis baris transaksi...
              </p>
              <p className="text-xs text-zinc-500">
                Mengevaluasi tarif ongkir dan rasio risiko margin model v6.
              </p>
            </div>
          </div>
        ) : acceptedFile ? (
          <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-3 truncate">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <FileText size={20} />
                </div>
                <div className="truncate text-left">
                  <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {acceptedFile.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {(acceptedFile.size / 1024).toFixed(1)} KB • Berkas CSV Siap
                  </p>
                </div>
              </div>

              {onClearFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inputRef.current) inputRef.current.value = "";
                    onClearFile();
                  }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Ganti Berkas"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-start text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} /> Berkas valid. Klik tombol &ldquo;Analisis&rdquo; untuk mulai memproses.
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Seret dan lepas file .CSV di sini, atau <span className="text-emerald-600 underline dark:text-emerald-400">pilih berkas</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Kolom wajib: <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">weight_kg, distance_km, volume_cm3, price</code>
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Maksimal analisis: {maxRowsWarning.toLocaleString()} baris per unggahan
              </p>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
