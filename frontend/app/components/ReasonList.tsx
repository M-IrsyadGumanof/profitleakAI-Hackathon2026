import * as React from "react";
import { AlertCircle, Scale, DollarSign, Lightbulb } from "lucide-react";

export interface ReasonItem {
  code: string;
  severity?: "high" | "medium" | string;
  detail: string;
  remedy?: string;
}

export interface ReasonListProps {
  reasons: ReasonItem[];
  showRemedy?: boolean;
  className?: string;
}

export function ReasonList({
  reasons,
  showRemedy = true,
  className = "",
}: ReasonListProps) {
  if (!reasons || reasons.length === 0) {
    return (
      <div className={`text-xs text-zinc-500 italic ${className}`}>
        Tidak ada faktor risiko atau anomali terdeteksi.
      </div>
    );
  }

  const getIcon = (code: string) => {
    if (code === "rate_exceeds_fair") {
      return <Scale size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />;
    }
    if (code === "freight_eats_margin") {
      return <DollarSign size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />;
    }
    return <AlertCircle size={16} className="text-zinc-600 dark:text-zinc-400 shrink-0" />;
  };

  const getCodeTitle = (code: string) => {
    if (code === "rate_exceeds_fair") return "Tarif Ongkir Melebihi Batas Wajar";
    if (code === "freight_eats_margin") return "Ongkir Menggerus Margin Harga";
    return code;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {reasons.map((reason, index) => {
        const isHigh = reason.severity === "high";

        return (
          <div
            key={index}
            className={`rounded-xl border p-4 transition-all ${
              isHigh
                ? "border-rose-200/90 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                : "border-amber-200/90 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(reason.code)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {getCodeTitle(reason.code)}
                  </h5>
                  {reason.severity && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isHigh
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                      }`}
                    >
                      {reason.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {reason.detail}
                </p>

                {showRemedy && reason.remedy && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-white/80 p-2.5 text-xs text-zinc-700 shadow-2xs dark:bg-zinc-900/80 dark:text-zinc-300">
                    <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">Saran Tindakan: </span>
                      <span>{reason.remedy}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
