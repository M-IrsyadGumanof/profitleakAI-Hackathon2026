import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface GaugeChartProps {
  ratio: number;
  threshold?: number;
  className?: string;
}

export function GaugeChart({
  ratio = 1.0,
  threshold = 1.102309,
  className = "",
}: GaugeChartProps) {
  const safeRatio = Number.isFinite(ratio) ? ratio : 1.0;
  // Normalize ratio into a scale from 0.5 to 2.0 for visual progress
  const minScale = 0.5;
  const maxScale = 2.0;
  const clampedRatio = Math.min(Math.max(safeRatio, minScale), maxScale);
  const percentage = ((clampedRatio - minScale) / (maxScale - minScale)) * 100;

  // Threshold mark position on the scale
  const thresholdPercentage = ((threshold - minScale) / (maxScale - minScale)) * 100;

  const isLeak = safeRatio > threshold;

  return (
    <div className={`rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Rasio Tarif (Aktual / Prediksi)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${isLeak ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {ratio.toFixed(4)}x
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              (Batas Aman: {threshold.toFixed(4)}x)
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLeak 
              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          }`}>
            {isLeak ? (
              <>
                <AlertCircle size={14} /> Selisih +{((ratio - 1) * 100).toFixed(1)}% (BOCOR)
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Toleransi {((ratio - 1) * 100).toFixed(1)}% (AMAN)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Visual Bar with Threshold Pointer */}
      <div className="relative mt-6 pt-5 pb-2">
        {/* Track Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {/* Safe Zone (Green) */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-emerald-500/70"
            style={{ width: `${thresholdPercentage}%` }}
          />
          {/* Leak Zone (Red) */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-rose-500/80"
            style={{ left: `${thresholdPercentage}%` }}
          />
        </div>

        {/* Threshold Cutoff Line */}
        <div
          className="absolute top-2 bottom-0 w-0.5 bg-zinc-900 shadow-md dark:bg-white"
          style={{ left: `${thresholdPercentage}%` }}
        >
          <div className="absolute -top-4 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900">
            Threshold {threshold.toFixed(2)}x
          </div>
        </div>

        {/* Current Ratio Marker Pointer */}
        <div
          className="absolute top-3.5 -translate-x-1/2 transition-all duration-500"
          style={{ left: `${percentage}%` }}
        >
          <div className={`h-6 w-3 rounded-sm border-2 border-white shadow-md dark:border-zinc-900 ${
            isLeak ? "bg-rose-600 ring-2 ring-rose-400" : "bg-emerald-600 ring-2 ring-emerald-400"
          }`} />
        </div>
      </div>

      {/* Scale Labels */}
      <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
        <span>0.5x (Di bawah estimasi)</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Zona Aman</span>
        <span className="font-medium text-rose-600 dark:text-rose-400">Zona Bocor</span>
        <span>2.0x+ (Mark up tinggi)</span>
      </div>
    </div>
  );
}
