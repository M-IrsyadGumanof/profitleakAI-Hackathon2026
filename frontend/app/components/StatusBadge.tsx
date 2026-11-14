import * as React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export interface StatusBadgeProps {
  isLeak: boolean;
  ratio?: number;
  threshold?: number;
  customText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({
  isLeak,
  ratio,
  threshold = 1.102309,
  customText,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-4.5 py-2 text-base gap-2.5 font-semibold",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  if (isLeak) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-medium transition-colors border shadow-xs bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 ${sizeClasses[size]} ${className}`}
        title={ratio ? `Rasio (${ratio.toFixed(3)}) melebihi batas threshold (${threshold.toFixed(3)})` : undefined}
      >
        <AlertTriangle size={iconSizes[size]} className="shrink-0 text-rose-600 dark:text-rose-400" />
        <span>{customText || "Terindikasi Kebocoran Profit"}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-colors border shadow-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 ${sizeClasses[size]} ${className}`}
      title={ratio ? `Rasio (${ratio.toFixed(3)}) di bawah batas threshold (${threshold.toFixed(3)})` : undefined}
    >
      <ShieldCheck size={iconSizes[size]} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span>{customText || "Tarif Aman / Normal"}</span>
    </span>
  );
}
