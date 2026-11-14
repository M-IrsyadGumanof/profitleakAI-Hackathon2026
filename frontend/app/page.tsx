"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Maximize2,
  Navigation,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Sliders,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";

// Rentang validasi model v5 dari dataset Olist
const VALID_RANGES = {
  weight_kg: { min: 0.05, max: 30.0, label: "Berat" },
  distance_km: { min: 1.5, max: 3135.8, label: "Jarak" },
  volume_cm3: { min: 352.0, max: 244608.0, label: "Volume" },
  price: { min: 4.99, max: 2110.0, label: "Harga" },
  actual_freight: { min: 1.0, max: 1500.0, label: "Ongkir" },
};

const THRESHOLD = 1.102309;
const BASELINE_MEDIAN_RESIDUAL = -0.011977;

// Preset Skenario Demo
const PRESET_SCENARIOS = [
  {
    id: "normal",
    name: "Transaksi Normal",
    badge: "Wajar",
    weight: 0.8,
    distance: 120,
    length: 20,
    width: 15,
    height: 8,
    price: 49.9,
    actualFreight: 14.5,
  },
  {
    id: "leak-high",
    name: "Kebocoran Ekstrem",
    badge: "Bocor 5x",
    weight: 0.5,
    distance: 85,
    length: 15,
    width: 10,
    height: 10,
    price: 39.0,
    actualFreight: 78.5,
  },
  {
    id: "heavy-valid",
    name: "Kargo Berat Jauh",
    badge: "Wajar",
    weight: 15.0,
    distance: 1820,
    length: 50,
    width: 40,
    height: 25,
    price: 450.0,
    actualFreight: 115.0,
  },
  {
    id: "leak-mild",
    name: "Markup Logistik",
    badge: "Bocor Samar",
    weight: 2.2,
    distance: 280,
    length: 30,
    width: 20,
    height: 15,
    price: 95.0,
    actualFreight: 48.0,
  },
];

interface AnalysisResult {
  predictedRate: number;
  actualRate: number;
  residual: number;
  ratio: number;
  isLeak: boolean;
  threshold: number;
  currency: string;
  source: "api" | "simulation";
  potentialLoss: number;
  message: string;
}

export default function ProfitLeakDashboard() {
  // Input State
  const [selectedPreset, setSelectedPreset] = useState<string>("normal");
  const [weightKg, setWeightKg] = useState<number>(0.8);
  const [distanceKm, setDistanceKm] = useState<number>(120);
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(8);
  const [price, setPrice] = useState<number>(49.9);
  const [actualFreight, setActualFreight] = useState<number>(14.5);

  // Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Volume terhitung
  const volumeCm3 = useMemo(() => {
    return Math.max(1, Math.round(lengthCm * widthCm * heightCm));
  }, [lengthCm, widthCm, heightCm]);

  // Validasi batas input
  const validationWarnings = useMemo(() => {
    const list: string[] = [];
    if (weightKg < VALID_RANGES.weight_kg.min || weightKg > VALID_RANGES.weight_kg.max) {
      list.push(`Berat (${weightKg} kg) di luar rentang 0.05 - 30 kg`);
    }
    if (distanceKm < VALID_RANGES.distance_km.min || distanceKm > VALID_RANGES.distance_km.max) {
      list.push(`Jarak (${distanceKm} km) di luar rentang 1.5 - 3.135 km`);
    }
    if (volumeCm3 < VALID_RANGES.volume_cm3.min || volumeCm3 > VALID_RANGES.volume_cm3.max) {
      list.push(`Volume (${volumeCm3.toLocaleString()} cm³) di luar rentang data`);
    }
    if (price < VALID_RANGES.price.min || price > VALID_RANGES.price.max) {
      list.push(`Harga (R$ ${price}) di luar rentang data`);
    }
    return list;
  }, [weightKg, distanceKm, volumeCm3, price]);

  // Model Engine v5
  const computePrediction = (
    w: number,
    dist: number,
    vol: number,
    p: number,
    actual: number
  ): AnalysisResult => {
    const priceLog = Math.log1p(p);
    const weightLog = Math.log1p(w);
    const distLog = Math.log1p(dist);
    const volLog = Math.log1p(vol / 1000);

    const predLog = 1.35 + 0.32 * weightLog + 0.28 * distLog + 0.12 * volLog + 0.04 * priceLog;
    const predictedRate = Math.max(7.2, Math.expm1(predLog));

    const actualLog = Math.log1p(actual);
    const residual = actualLog - predLog - BASELINE_MEDIAN_RESIDUAL;
    const isLeak = residual > THRESHOLD;
    const ratio = actual / (predictedRate || 1);
    const potentialLoss = isLeak ? Math.max(0, actual - predictedRate) : 0;

    let message = "Biaya pengiriman sesuai dengan estimasi tarif wajar logistik e-commerce.";
    if (isLeak) {
      if (ratio >= 3.5) {
        message = "Kebocoran profit kritis. Tarif ongkir ditagihkan kurir jauh melebihi tarif wajar.";
      } else {
        message = "Terindikasi markup biaya logistik melebihi batas toleransi residual model.";
      }
    }

    return {
      predictedRate: Number(predictedRate.toFixed(2)),
      actualRate: Number(actual.toFixed(2)),
      residual: Number(residual.toFixed(4)),
      ratio: Number(ratio.toFixed(2)),
      isLeak,
      threshold: THRESHOLD,
      currency: "BRL",
      source: "simulation",
      potentialLoss: Number(potentialLoss.toFixed(2)),
      message,
    };
  };

  // Jalankan Analisis
  const runAnalysis = async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${apiUrl}/api/detect-leak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_kg: weightKg,
          distance_km: distanceKm,
          volume_cm3: volumeCm3,
          price: price,
          actual_freight: actualFreight,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const pRate = Number(data.predicted_rate ?? 0);
        const aRate = Number(data.actual_rate ?? actualFreight);
        const resVal = Number(data.residual ?? Math.log1p(aRate) - Math.log1p(pRate));
        const leak = Boolean(data.is_leak);

        setResult({
          predictedRate: pRate,
          actualRate: aRate,
          residual: Number(resVal.toFixed(4)),
          ratio: Number((data.ratio ?? aRate / (pRate || 1)).toFixed(2)),
          isLeak: leak,
          threshold: Number(data.threshold ?? THRESHOLD),
          currency: data.currency || "BRL",
          source: "api",
          potentialLoss: Number((leak ? Math.max(0, aRate - pRate) : 0).toFixed(2)),
          message:
            data.message ||
            (leak
              ? "Terdeteksi kebocoran profit pada biaya ongkir."
              : "Tarif ongkir normal sesuai model prediksi."),
        });
        setLoading(false);
        return;
      }
    } catch {
      // Backend offline: fallback ke engine v5 lokal
    }

    const computed = computePrediction(weightKg, distanceKm, volumeCm3, price, actualFreight);
    setResult(computed);
    setLoading(false);
  };

  // Inisialisasi awal
  useEffect(() => {
    const initial = computePrediction(weightKg, distanceKm, volumeCm3, price, actualFreight);
    setResult(initial);
  }, []);

  // Pilih preset
  const handleSelectPreset = (p: (typeof PRESET_SCENARIOS)[0]) => {
    setSelectedPreset(p.id);
    setWeightKg(p.weight);
    setDistanceKm(p.distance);
    setLengthCm(p.length);
    setWidthCm(p.width);
    setHeightCm(p.height);
    setPrice(p.price);
    setActualFreight(p.actualFreight);

    const vol = p.length * p.width * p.height;
    const computed = computePrediction(p.weight, p.distance, vol, p.price, p.actualFreight);
    setResult(computed);
  };

  // Data Chart: Aksen Biru Elegan & Merah/Netral
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      {
        name: "Tarif Wajar (AI)",
        amount: result.predictedRate,
        fill: "#3b82f6", // Electric Blue yang elegan
      },
      {
        name: "Ongkir Ditagihkan",
        amount: result.actualRate,
        fill: result.isLeak ? "#f43f5e" : "#64748b", // Rose-Red jika bocor, Muted Slate jika normal
      },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 antialiased selection:bg-blue-500/20 selection:text-white">
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      {/* Navbar Modern Beraksen Biru */}
      <header className="border-b border-slate-800/80 bg-[#080c16]/85 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  ProfitLeak <span className="text-blue-400 font-semibold">AI</span>
                </span>
                <span className="rounded border border-blue-500/30 bg-blue-950/60 px-1.5 py-0.2 text-[10px] font-medium text-blue-300">
                  Model v5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Deteksi Anomali Biaya Pengiriman & Kebocoran Logistik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">R²: 72.3% • FPR: 0.17%</span>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-4">
        {/* Preset Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 pl-1">
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            <span>Preset Skenario:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PRESET_SCENARIOS.map((p) => {
              const isActive = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{p.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? "bg-blue-900 text-blue-100"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {p.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Kolom Seimbang */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* KOLOM KIRI: Parameter Form (5 Kolom) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0d1322]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Parameter Transaksi
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Fitur Model</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAnalysis();
              }}
              className="space-y-3.5"
            >
              {/* Row 1: Berat & Jarak */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <label className="flex items-center gap-1">
                      <Scale className="h-3 w-3 text-blue-400" />
                      Berat (kg)
                    </label>
                    <span className="text-[10px] text-slate-400">0.05-30</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      required
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400">kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <label className="flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-blue-400" />
                      Jarak (km)
                    </label>
                    <span className="text-[10px] text-slate-400">1.5-3.135</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="6000"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      required
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400">km</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Dimensi & Volume */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <label className="flex items-center gap-1">
                    <Maximize2 className="h-3 w-3 text-blue-400" />
                    Dimensi (P × L × T cm)
                  </label>
                  <span className="text-white font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                    {volumeCm3.toLocaleString()} cm³
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">P</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={widthCm}
                      onChange={(e) => setWidthCm(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">L</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">T</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Harga Barang & Ongkir Ditagih */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <label className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-blue-400" />
                      Harga Barang
                    </label>
                    <span className="text-[10px] text-slate-400">BRL</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-2.5 py-1.5 text-xs font-medium text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-200 mb-1">
                    <label className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3 text-blue-400" />
                      Ongkir Ditagih
                    </label>
                    <span className="text-[10px] text-slate-400">Kurir</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[10px] font-semibold text-white">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={actualFreight}
                      onChange={(e) => setActualFreight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Peringatan Out-of-Distribution */}
              {validationWarnings.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2 text-[10px] text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">Catatan Batas Data Latih:</div>
                  {validationWarnings.map((w, idx) => (
                    <div key={idx}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Tombol Utama: Electric Blue Elegan */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 text-xs shadow-md shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Memproses Analisis...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                    <span>Analisis Kebocoran Tarif Ongkir</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: Hasil Evaluasi & Grafik (7 Kolom) */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <>
                {/* 1. Status Evaluasi Utama */}
                <div
                  className={`rounded-2xl border p-4.5 transition-all backdrop-blur-sm ${
                    result.isLeak
                      ? "border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-slate-900/60 to-[#0d1322] text-white"
                      : "border-slate-800 bg-[#0d1322]/90 text-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                          result.isLeak
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {result.isLeak ? (
                          <ShieldAlert className="h-5 w-5" />
                        ) : (
                          <ShieldCheck className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                            Status Analisis
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              result.isLeak
                                ? "bg-rose-500 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {result.isLeak ? "TERINDIKASI BOCOR" : "TARIF NORMAL"}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white mt-0.5">
                          {result.isLeak
                            ? "Terdeteksi Kebocoran Biaya Logistik"
                            : "Tarif Logistik Sesuai Estimasi Wajar"}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                      {result.source === "api" ? "FastAPI Live" : "Engine v5"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2">
                    {result.message}
                  </p>

                  {/* Estimasi Selisih Kerugian (Hanya jika bocor) */}
                  {result.isLeak && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-rose-950/60 border border-rose-700/40 px-3 py-2">
                      <span className="text-[11px] text-rose-200 flex items-center gap-1.5 font-medium">
                        <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                        Estimasi Selisih Kebocoran:
                      </span>
                      <span className="text-sm font-bold font-mono text-white">
                        R$ {result.potentialLoss.toFixed(2)} BRL
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Empat Metrik Kunci (Simetris & Jelas) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 p-3">
                    <span className="text-[10px] text-slate-400">Ongkir Wajar (AI)</span>
                    <p className="mt-0.5 text-base font-bold font-mono text-blue-400">
                      R$ {result.predictedRate.toFixed(2)}
                    </p>
                    <span className="text-[9px] text-slate-400">Baseline Model</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 p-3">
                    <span className="text-[10px] text-slate-400">Ongkir Ditagihkan</span>
                    <p
                      className={`mt-0.5 text-base font-bold font-mono ${
                        result.isLeak ? "text-rose-400" : "text-white"
                      }`}
                    >
                      R$ {result.actualRate.toFixed(2)}
                    </p>
                    <span className="text-[9px] text-slate-400">Invoice Kurir</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 p-3">
                    <span className="text-[10px] text-slate-400">Rasio Tagihan/Wajar</span>
                    <p
                      className={`mt-0.5 text-base font-bold font-mono ${
                        result.ratio > 2.0 ? "text-rose-400" : "text-white"
                      }`}
                    >
                      {result.ratio}x
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {result.ratio > 1 ? "Lebih tinggi" : "Normal"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 p-3">
                    <span className="text-[10px] text-slate-400">Residual vs Threshold</span>
                    <p
                      className={`mt-0.5 text-base font-bold font-mono ${
                        result.residual > result.threshold ? "text-rose-400" : "text-white"
                      }`}
                    >
                      {result.residual}
                    </p>
                    <span className="text-[9px] text-slate-400">
                      Ambang: {result.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 3. Komparasi Bar Chart: Aksen Biru & Kontras Putih */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1322]/80 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                        Komparasi Nilai Ongkir (BRL)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Perbandingan tarif wajar rekomendasi AI (Biru) vs ongkir ditagihkan
                      </p>
                    </div>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickLine={false}
                          unit=" R$"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255, 255, 255, 0.03)", radius: 6 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0];
                              const isActual = item.payload.name === "Ongkir Ditagihkan";
                              return (
                                <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs shadow-2xl">
                                  <div className="font-semibold text-white">
                                    {item.payload.name}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-slate-400">Nilai:</span>
                                    <span
                                      className={`font-bold font-mono ${
                                        isActual && result.isLeak
                                          ? "text-rose-400"
                                          : isActual
                                          ? "text-slate-200"
                                          : "text-blue-400"
                                      }`}
                                    >
                                      R$ {Number(item.value).toFixed(2)} BRL
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={result.predictedRate}
                          stroke="#38bdf8"
                          strokeDasharray="3 3"
                          label={{
                            value: "Batas Wajar",
                            fill: "#38bdf8",
                            position: "insideTopRight",
                            fontSize: 10,
                          }}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Rekomendasi Audit */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-300">
                  <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    Rekomendasi Tindak Lanjut:
                  </div>
                  {result.isLeak ? (
                    <p className="text-slate-300 leading-relaxed">
                      Lakukan evaluasi terhadap tagihan vendor kurir untuk rute pengiriman {distanceKm} km.
                      Potensi penghematan biaya sebesar{" "}
                      <strong className="text-white font-mono">
                        R$ {result.potentialLoss.toFixed(2)} BRL
                      </strong>{" "}
                      dapat diajukan sebagai klaim penyesuaian tarif.
                    </p>
                  ) : (
                    <p className="text-slate-300 leading-relaxed">
                      Nilai residual berada pada rentang wajar di bawah ambang batas toleransi.
                      Transaksi logistik ini efisien dan tidak memerlukan tinjauan manual.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* Footer Bersih */}
      <footer className="mt-8 border-t border-slate-800/80 bg-[#080c16] py-4 text-center text-[11px] text-slate-400">
        ProfitLeak AI • Tim 5 Orang Hackathon 2026 • Area UI Ihqfal (branch: ihqfal)
      </footer>
    </div>
  );
}
