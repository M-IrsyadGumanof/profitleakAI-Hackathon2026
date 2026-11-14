import * as React from "react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = "default",
  className = "",
}: MetricCardProps) {
  const variantBorder = {
    default: "border-zinc-200/80 dark:border-zinc-800/80",
    success: "border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-900/50",
    danger: "border-rose-500/30 bg-rose-500/5 dark:border-rose-900/50",
    warning: "border-amber-500/30 bg-amber-500/5 dark:border-amber-900/50",
    info: "border-sky-500/30 bg-sky-500/5 dark:border-sky-900/50",
  };

  const badgeColor = {
    default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    danger: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    info: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition-all dark:bg-zinc-900/80 ${variantBorder[variant]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {icon && (
          <div className="text-zinc-500 dark:text-zinc-400">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </span>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor[variant]}`}>
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
