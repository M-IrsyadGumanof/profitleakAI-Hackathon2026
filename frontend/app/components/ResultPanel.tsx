import * as React from "react";
import { StatusBadge } from "./StatusBadge";
import { GaugeChart } from "./GaugeChart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./Card";
import { TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export interface DetectionResult {
  predicted_rate: number;
  actual_rate?: number;
  ratio?: number;
  is_leak?: boolean;
  threshold?: number;
  currency: string;
  message?: string;
}

export interface ResultPanelProps {
  result: DetectionResult | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function ResultPanel({
  result,
  isLoading = false,
  error = null,
  className = "",
}: ResultPanelProps) {
  if (isLoading) {
    return (
      <Card className={`flex min-h-[360px] items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-100" />
          <p className="text-sm font-medium">Memproses inferensi model & menganalisis kebocoran...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-rose-300 bg-rose-50/40 p-6 dark:border-rose-900/60 dark:bg-rose-950/20 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <h4 className="font-semibold text-rose-900 dark:text-rose-200">Gagal Memproses Data</h4>
            <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className={`flex min-h-[360px] items-center justify-center border-dashed p-8 text-center ${className}`}>
        <div className="max-w-sm space-y-2">
          <Activity className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <h4 className="font-medium text-zinc-700 dark:text-zinc-300">Menunggu Input Data</h4>
          <p className="text-xs text-zinc-400">
            Silakan masukkan parameter berat, jarak, volume, dan harga pengiriman pada form untuk melihat hasil analisis kebocoran profit.
          </p>
        </div>
      </Card>
    );
  }

  const currencySymbol = result.currency === "BRL" ? "R$" : result.currency;
  const actualRate = typeof result.actual_rate === "number" ? result.actual_rate : result.predicted_rate;
  const threshold = typeof result.threshold === "number" ? result.threshold : 1.102309;
  const ratio = typeof result.ratio === "number" ? result.ratio : (actualRate / result.predicted_rate);
  const isLeak = typeof result.is_leak === "boolean" ? result.is_leak : (ratio > threshold);
  const difference = actualRate - result.predicted_rate;
  const percentageDiff = ((ratio - 1) * 100).toFixed(1);
  const message = result.message || (isLeak ? "Terindikasi potensi kebocoran profit pada tagihan ongkir." : "Tarif pengiriman berada dalam batas toleransi wajar.");

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Hasil Analisis Kebocoran Profit</CardTitle>
            <CardDescription>
              Evaluasi tarif ongkir berdasarkan model HistGradientBoosting v5
            </CardDescription>
          </div>
          <StatusBadge
            isLeak={isLeak}
            ratio={ratio}
            threshold={threshold}
            size="lg"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Metric Cards Comparison */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Tarif Prediksi */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <DollarSign size={14} /> Tarif Wajar (Prediksi)
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {currencySymbol} {result.predicted_rate.toFixed(2)}
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Estimasi berbasis fitur logistik
            </p>
          </div>

          {/* Tarif Aktual */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Activity size={14} /> Tarif Pengiriman Aktual
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {currencySymbol} {actualRate.toFixed(2)}
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Biaya/ongkir yang ditagihkan
            </p>
          </div>

          {/* Selisih Potensi Kebocoran */}
          <div className={`rounded-xl border p-4 ${
            isLeak
              ? "border-rose-300 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/30"
              : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          }`}>
            <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
              isLeak ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"
            }`}>
              <TrendingUp size={14} /> {isLeak ? "Potensi Kebocoran" : "Margin Efisiensi"}
            </div>
            <div className={`mt-2 text-2xl font-bold ${
              isLeak ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {difference >= 0 ? `+${currencySymbol} ${difference.toFixed(2)}` : `-${currencySymbol} ${Math.abs(difference).toFixed(2)}`}
            </div>
            <p className={`mt-1 text-[11px] font-medium ${
              isLeak ? "text-rose-600/80 dark:text-rose-400/80" : "text-emerald-600/80 dark:text-emerald-400/80"
            }`}>
              {isLeak ? `${percentageDiff}% di atas batas wajar` : `Dalam batas wajar (${percentageDiff}%)`}
            </p>
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <GaugeChart ratio={ratio} threshold={threshold} />

        {/* Message Banner */}
        <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          isLeak 
            ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
            : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
        }`}>
          {isLeak ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <div>
            <span className="font-semibold">{isLeak ? "Rekomendasi Tindakan: " : "Status Operasional: "}</span>
            <span>{message}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
