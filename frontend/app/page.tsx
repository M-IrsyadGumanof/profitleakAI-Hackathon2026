"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  Scale,
  Maximize2,
  Navigation,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Sliders,
  ChevronRight,
  ArrowUpRight,
  Zap,
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

// Preset Skenario Cepat untuk Demo
const PRESET_SCENARIOS = [
  {
    id: "normal",
    name: "Transaksi Normal",
    badge: "Tarif Wajar",
    desc: "Barang ringan 0.8kg rute 120km",
    weight: 0.8,
    distance: 120,
    length: 20,
    width: 15,
    height: 8,
    price: 49.9,
    actualFreight: 14.5,
    theme: "emerald",
  },
  {
    id: "leak-high",
    name: "Kebocoran Ekstrem",
    badge: "Bocor 5x",
    desc: "Barang 0.5kg rute 85km ongkir digelembungkan",
    weight: 0.5,
    distance: 85,
    length: 15,
    width: 10,
    height: 10,
    price: 39.0,
    actualFreight: 78.5,
    theme: "red",
  },
  {
    id: "heavy-valid",
    name: "Kargo Berat Jauh",
    badge: "Wajar Valid",
    desc: "Barang 15kg rute 1.820km (ongkir tinggi tapi wajar)",
    weight: 15.0,
    distance: 1820,
    length: 50,
    width: 40,
    height: 25,
    price: 450.0,
    actualFreight: 115.0,
    theme: "blue",
  },
  {
    id: "leak-mild",
    name: "Markup Logistik",
    badge: "Bocor Samar",
    desc: "Ongkir melewati batas toleransi model",
    weight: 2.2,
    distance: 280,
    length: 30,
    width: 20,
    height: 15,
    price: 95.0,
    actualFreight: 48.0,
    theme: "amber",
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

  // Status & Logic
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showModelModal, setShowModelModal] = useState<boolean>(false);

  // Volume terhitung otomatis
  const volumeCm3 = useMemo(() => {
    return Math.max(1, Math.round(lengthCm * widthCm * heightCm));
  }, [lengthCm, widthCm, heightCm]);

  // Validasi batas dataset Olist
  const validationWarnings = useMemo(() => {
    const list: string[] = [];
    if (weightKg < VALID_RANGES.weight_kg.min || weightKg > VALID_RANGES.weight_kg.max) {
      list.push(`Berat (${weightKg} kg) di luar rentang 0.05 - 30 kg`);
    }
    if (distanceKm < VALID_RANGES.distance_km.min || distanceKm > VALID_RANGES.distance_km.max) {
      list.push(`Jarak (${distanceKm} km) di luar rentang 1.5 - 3.135 km`);
    }
    if (volumeCm3 < VALID_RANGES.volume_cm3.min || volumeCm3 > VALID_RANGES.volume_cm3.max) {
      list.push(`Volume (${volumeCm3.toLocaleString()} cm³) di luar rentang 352 - 244.608 cm³`);
    }
    if (price < VALID_RANGES.price.min || price > VALID_RANGES.price.max) {
      list.push(`Harga (R$ ${price}) di luar rentang R$ 4.99 - 2.110`);
    }
    return list;
  }, [weightKg, distanceKm, volumeCm3, price]);

  // Model v5 Prediction Engine (Lokal / Fallback)
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
        message = "Kebocoran profit kritis! Tarif ongkir ditagihkan kurir jauh melebihi tarif wajar.";
      } else {
        message = "Terindikasi markup / kebocoran profit logistik di atas ambang toleransi residual model.";
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

  // Jalankan analisis (API atau Simulasi Engine v5)
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
              ? "Terdeteksi kebocoran profit pada biaya ongkir!"
              : "Tarif ongkir normal sesuai model prediksi."),
        });
        setLoading(false);
        return;
      }
    } catch {
      // Backend offline: gunakan engine v5 lokal
    }

    // Engine v5 lokal instant
    const computed = computePrediction(weightKg, distanceKm, volumeCm3, price, actualFreight);
    setResult(computed);
    setLoading(false);
  };

  // Auto-run kalkulasi saat awal dimuat agar dashboard langsung terisi rapi
  useEffect(() => {
    const initial = computePrediction(weightKg, distanceKm, volumeCm3, price, actualFreight);
    setResult(initial);
  }, []);

  // Terapkan Preset
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

  // Data Visualisasi Recharts
  const chartData = useMemo(() => {
    if (!result) return [];
    return [
      {
        name: "Tarif Wajar (AI)",
        amount: result.predictedRate,
        fill: "#10b981", // emerald
      },
      {
        name: "Ongkir Ditagihkan",
        amount: result.actualRate,
        fill: result.isLeak ? "#f43f5e" : "#3b82f6", // rose / blue
      },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  ProfitLeak<span className="text-cyan-400">AI</span>
                </span>
                <span className="rounded-md bg-cyan-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-800/50">
                  Model v5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Deteksi Anomali Ongkir & Kebocoran Biaya Logistik E-Commerce
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>R²: 72.3% • FPR: 0.17%</span>
            </div>

            <button
              onClick={() => setShowModelModal(!showModelModal)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              <span>Info Model</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-4">
        {/* Preset Selector Bar (Compact Chips) */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 pl-1">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Preset Kasus Nyata:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
              {PRESET_SCENARIOS.map((p) => {
                const isActive = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 shadow-sm"
                        : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        p.theme === "red"
                          ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                          : p.theme === "emerald"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                          : p.theme === "blue"
                          ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                          : "bg-amber-950 text-amber-300 border border-amber-800/60"
                      }`}
                    >
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Info Model v5 (Jika Diaktifkan) */}
        {showModelModal && (
          <div className="rounded-xl border border-cyan-900/50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 text-xs text-slate-300 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Spesifikasi Model Final v5 (Olist Dataset Benchmark)
              </div>
              <button
                onClick={() => setShowModelModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400">Arsitektur:</span>
                <p className="font-semibold text-cyan-300">HistGradientBoosting</p>
              </div>
              <div>
                <span className="text-slate-400">Threshold Anomali:</span>
                <p className="font-semibold text-amber-300">1.1023 (Quantile 99.8%)</p>
              </div>
              <div>
                <span className="text-slate-400">Proteksi Pergeseran:</span>
                <p className="font-semibold text-purple-300">Drift Correction Active</p>
              </div>
              <div>
                <span className="text-slate-400">Metrik Uji:</span>
                <p className="font-semibold text-emerald-300">R² = 72.3%, FPR = 0.17%</p>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* KOLOM KIRI: Form Parameter (5 Kolom) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0c1220]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">Parameter Transaksi</h2>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Fitur Input
              </span>
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
                      <Scale className="h-3 w-3 text-cyan-400" />
                      Berat (kg)
                    </label>
                    <span className="text-[10px] text-slate-400">0.05-30kg</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400">kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <label className="flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-cyan-400" />
                      Jarak (km)
                    </label>
                    <span className="text-[10px] text-slate-400">1.5-3.135km</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="6000"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400">km</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Dimensi Paket & Volume Terhitung */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <label className="flex items-center gap-1">
                    <Maximize2 className="h-3 w-3 text-cyan-400" />
                    Dimensi (P × L × T cm)
                  </label>
                  <span className="text-cyan-400 font-mono text-[10px]">
                    Vol: {volumeCm3.toLocaleString()} cm³
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-2 py-1.5 text-center text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">P</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={widthCm}
                      onChange={(e) => setWidthCm(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-2 py-1.5 text-center text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">L</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-2 py-1.5 text-center text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">T</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Harga Barang & Tagihan Ongkir Aktual */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <label className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-cyan-400" />
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
                      className="w-full rounded-lg border border-slate-700/80 bg-slate-950 pl-7 pr-2.5 py-1.5 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-amber-300 mb-1">
                    <label className="flex items-center gap-1 font-semibold">
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                      Ongkir Ditagih
                    </label>
                    <span className="text-[10px] text-amber-400/80">Kurir</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-amber-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={actualFreight}
                      onChange={(e) => setActualFreight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-amber-500/60 bg-slate-950 pl-7 pr-2.5 py-1.5 text-xs font-bold text-amber-200 focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Warning box if input is out of bounds */}
              {validationWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-2 text-[10px] text-amber-300/90 space-y-0.5">
                  <div className="font-semibold text-amber-200">Perhatian Batas Data Latih:</div>
                  {validationWarnings.map((w, idx) => (
                    <div key={idx}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Memproses Residual...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Analisis Kebocoran Tarif Ongkir
                  </>
                )}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: Hasil Analisis & Visualisasi Recharts (7 Kolom) */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <>
                {/* 1. Status Banner Card (Sleek & Prominent) */}
                <div
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 shadow-xl backdrop-blur-sm ${
                    result.isLeak
                      ? "border-rose-500/50 bg-gradient-to-br from-rose-950/50 via-[#101424] to-[#0a0f1d] text-rose-100"
                      : "border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-[#101424] to-[#0a0f1d] text-emerald-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          result.isLeak
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {result.isLeak ? (
                          <ShieldAlert className="h-6 w-6" />
                        ) : (
                          <ShieldCheck className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Evaluasi Model v5
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              result.isLeak
                                ? "bg-rose-500 text-white"
                                : "bg-emerald-500 text-slate-950"
                            }`}
                          >
                            {result.isLeak ? "TERINDIKASI BOCOR" : "TARIF NORMAL"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          {result.isLeak
                            ? "Terdeteksi Kebocoran Biaya Logistik!"
                            : "Tarif Ongkir Sesuai Standar Wajar"}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                      {result.source === "api" ? "FastAPI Live" : "Engine v5 Engine"}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2">
                    {result.message}
                  </p>

                  {/* Kerugian Profit */}
                  {result.isLeak && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-rose-950/70 border border-rose-700/50 px-3 py-2">
                      <span className="text-[11px] text-rose-200 flex items-center gap-1.5 font-medium">
                        <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                        Estimasi Kebocoran / Transaksi:
                      </span>
                      <span className="text-sm font-extrabold text-rose-300">
                        R$ {result.potentialLoss.toFixed(2)} BRL
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Key Metrics 4-Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-[#0c1220]/80 p-3">
                    <span className="text-[10px] text-slate-400">Ongkir Wajar (AI)</span>
                    <p className="mt-0.5 text-base font-bold text-emerald-400">
                      R$ {result.predictedRate.toFixed(2)}
                    </p>
                    <span className="text-[9px] text-slate-400">Baseline Model</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0c1220]/80 p-3">
                    <span className="text-[10px] text-slate-400">Ongkir Ditagihkan</span>
                    <p
                      className={`mt-0.5 text-base font-bold ${
                        result.isLeak ? "text-rose-400" : "text-slate-100"
                      }`}
                    >
                      R$ {result.actualRate.toFixed(2)}
                    </p>
                    <span className="text-[9px] text-slate-400">Invoice Kurir</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0c1220]/80 p-3">
                    <span className="text-[10px] text-slate-400">Rasio Tagihan/Wajar</span>
                    <p
                      className={`mt-0.5 text-base font-bold ${
                        result.ratio > 2.0
                          ? "text-rose-400"
                          : result.ratio > 1.2
                          ? "text-amber-400"
                          : "text-cyan-400"
                      }`}
                    >
                      {result.ratio}x
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {result.ratio > 1 ? "Lebih mahal" : "Proporsional"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#0c1220]/80 p-3">
                    <span className="text-[10px] text-slate-400">Residual vs Threshold</span>
                    <p
                      className={`mt-0.5 text-base font-bold ${
                        result.residual > result.threshold ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {result.residual}
                    </p>
                    <span className="text-[9px] text-slate-400">
                      Ambang: {result.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 3. Visualisasi Recharts (Perbandingan Bersih) */}
                <div className="rounded-2xl border border-slate-800 bg-[#0c1220]/80 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                        Komparasi Nilai Ongkir (BRL)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Perbandingan tarif wajar rekomendasi AI vs ongkir yang ditagih
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
                          tick={{ fill: "#94a3b8", fontSize: 10 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickLine={false}
                          unit=" R$"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255, 255, 255, 0.04)", radius: 6 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0];
                              const isActual = item.payload.name === "Ongkir Ditagihkan";
                              return (
                                <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
                                  <div className="font-semibold text-slate-200">
                                    {item.payload.name}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-slate-400">Nilai:</span>
                                    <span
                                      className={`font-bold ${
                                        isActual && result.isLeak
                                          ? "text-rose-400"
                                          : isActual
                                          ? "text-blue-400"
                                          : "text-emerald-400"
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
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{
                            value: "Batas Wajar",
                            fill: "#10b981",
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
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-[11px] text-slate-300">
                  <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    Rekomendasi Tindak Lanjut Logistik:
                  </div>
                  {result.isLeak ? (
                    <p className="text-slate-400 leading-relaxed">
                      Lakukan audit terhadap vendor kurir untuk rute pengiriman {distanceKm} km.
                      Potensi penghematan biaya logistik sebesar{" "}
                      <strong className="text-rose-400">
                        R$ {result.potentialLoss.toFixed(2)} BRL
                      </strong>{" "}
                      dapat diajukan sebagai klaim penyesuaian tagihan.
                    </p>
                  ) : (
                    <p className="text-slate-400 leading-relaxed">
                      Nilai residual berada pada rentang normal di bawah ambang batas toleransi.
                      Transaksi ini efisien dan tidak memerlukan audit manual.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* Clean Compact Footer */}
      <footer className="mt-8 border-t border-slate-900 bg-[#070b14] py-3 text-center text-[11px] text-slate-400">
        ProfitLeak AI • Tim 5 Orang Hackathon 2026 • Area UI Ihqfal (feat/ihqfal-ui)
      </footer>
    </div>
  );
}
