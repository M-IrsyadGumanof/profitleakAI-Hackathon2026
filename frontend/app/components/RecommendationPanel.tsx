import * as React from "react";
import { CheckSquare, ArrowRight, ShieldAlert } from "lucide-react";

export interface RecommendationItem {
  code: string;
  count?: number;
  recommendation: string;
}

export interface RecommendationPanelProps {
  recommendations: RecommendationItem[];
  title?: string;
  description?: string;
  className?: string;
}

export function RecommendationPanel({
  recommendations,
  title = "Rekomendasi Tindakan Operasional",
  description = "Tindakan mitigasi berdasarkan analisis kebocoran profit yang teridentifikasi",
  className = "",
}: RecommendationPanelProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getCodeBadge = (code: string) => {
    if (code === "freight_eats_margin") return "Risiko Margin";
    if (code === "rate_exceeds_fair") return "Anomali Tarif";
    return code;
  };

  return (
    <div className={`rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/90 ${className}`}>
      <div className="flex items-start gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/70">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckSquare size={18} />
        </div>
        <div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h4>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 transition-colors dark:border-zinc-800/60 dark:bg-zinc-800/40"
          >
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {getCodeBadge(rec.code)}
                </span>
                {typeof rec.count === "number" && (
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Mempengaruhi {rec.count} transaksi
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {rec.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
