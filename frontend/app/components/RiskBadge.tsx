import * as React from "react";
import { AlertTriangle, AlertOctagon, ShieldCheck, Scale, DollarSign } from "lucide-react";

export interface RiskBadgeProps {
  isLeak: boolean;
  riskScore?: number;
  severity?: "high" | "medium" | "low" | "safe";
  detectors?: { rate?: boolean; margin?: boolean };
  size?: "sm" | "md" | "lg";
  showDetectors?: boolean;
  className?: string;
}

export function RiskBadge({
  isLeak,
  riskScore,
  severity,
  detectors,
  size = "md",
  showDetectors = false,
  className = "",
}: RiskBadgeProps) {
  const resolvedSeverity = severity || (isLeak ? (riskScore && riskScore > 0.7 ? "high" : "medium") : "safe");

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-semibold",
  };

  const iconSizes = {
    sm: 13,
    md: 14,
    lg: 16,
  };

  const severityStyles = {
    high: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60",
    medium: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60",
    low: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60",
    safe: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60",
  };

  const getLabel = () => {
    if (!isLeak) return "Aman / Ekonomis";
    if (resolvedSeverity === "high") return "Risiko Tinggi (Bocor)";
    return "Terindikasi Bocor";
  };

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center rounded-full font-medium border shadow-xs transition-colors ${severityStyles[resolvedSeverity]} ${sizeClasses[size]}`}
      >
        {isLeak ? (
          resolvedSeverity === "high" ? (
            <AlertOctagon size={iconSizes[size]} className="shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <AlertTriangle size={iconSizes[size]} className="shrink-0 text-amber-600 dark:text-amber-400" />
          )
        ) : (
          <ShieldCheck size={iconSizes[size]} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <span>{getLabel()}</span>
        {typeof riskScore === "number" && (
          <span className="opacity-80 font-mono text-[10px]">
            ({Math.round(riskScore * 100)}%)
          </span>
        )}
      </span>

      {showDetectors && detectors && (
        <div className="flex items-center gap-1.5">
          {detectors.rate && (
            <span
              className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              title="Detektor Tarif menyala: rasio tarif melebihi ambang batas wajar"
            >
              <Scale size={11} /> Ongkir Mahal
            </span>
          )}
          {detectors.margin && (
            <span
              className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              title="Detektor Margin menyala: ongkir menyerap porsi besar dari harga jual"
            >
              <DollarSign size={11} /> Margin Tergerus
            </span>
          )}
        </div>
      )}
    </div>
  );
}
