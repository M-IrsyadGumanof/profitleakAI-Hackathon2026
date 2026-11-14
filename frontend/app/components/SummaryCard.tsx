import * as React from "react";

export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  variant?: "default" | "danger" | "warning" | "success" | "info";
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = "default",
  className = "",
}: SummaryCardProps) {
  const variantStyles = {
    default: "border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/90",
    danger: "border-rose-300/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20",
    warning: "border-amber-300/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20",
    success: "border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    info: "border-sky-300/80 bg-sky-50/40 dark:border-sky-900/50 dark:bg-sky-950/20",
  };

  const textColors = {
    default: "text-zinc-900 dark:text-zinc-50",
    danger: "text-rose-600 dark:text-rose-400",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
    info: "text-sky-600 dark:text-sky-400",
  };

  const badgeStyles = {
    default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    danger: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    info: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && (
          <div className="text-zinc-400 dark:text-zinc-500">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl font-extrabold tracking-tight ${textColors[variant]}`}>
          {value}
        </span>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeStyles[variant]}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
