"use client";

import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdvicePanel } from "../components/AdvicePanel";
import { CopilotWidget } from "../components/CopilotWidget";
import { getAdvice } from "../lib/api";
import type { AdviceResponse } from "../lib/types";
import { 
  AlertTriangle, 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  Layers, 
  Search, 
  ShieldAlert, 
  Sliders, 
  TrendingDown, 
  Truck,
  Lock,
  UploadCloud,
  X
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

const DEFAULT_ANALYSIS_DATA = {
  filename: "transaksi_sample_olist.csv",
  currency: "BRL",
  threshold: 3.09779,
  margin_threshold: 0.46,
  summary: {
    total_rows: 12,
    analysed: 12,
    skipped: 0,
    leaks: 5,
    rate_leaks: 2,
    margin_risks: 4,
    estimated_loss: 284.45,
    leak_rate: 41.67,
  },
  reason_breakdown: {
    freight_eats_margin: 4,
    rate_exceeds_fair: 2,
  },
  recommendations: [
    {
      code: "freight_eats_margin",
      count: 4,
      recommendation:
        "Naikkan harga jual, terapkan bundling barang, atau terapkan minimum order agar ongkir tidak menghabiskan margin kotor.",
    },
    {
      code: "rate_exceeds_fair",
      count: 2,
      recommendation:
        "Negosiasi tarif ekspedisi atau pilih layanan kurir alternatif pada rute pengiriman yang melebihi tarif wajar.",
    },
  ],
  rows: [
    {
      line: 2,
      predicted_rate: 22.45,
      actual_rate: 24.50,
      ratio: 1.0913,
      freight_ratio: 0.1886,
      is_leak: false,
      risk_score: 0.12,
      detectors: { rate: false, margin: false },
      reasons: [],
    },
    {
      line: 3,
      predicted_rate: 13.80,
      actual_rate: 14.20,
      ratio: 1.0289,
      freight_ratio: 0.3155,
      is_leak: false,
      risk_score: 0.18,
      detectors: { rate: false, margin: false },
      reasons: [],
    },
    {
      line: 4,
      predicted_rate: 48.20,
      actual_rate: 165.80,
      ratio: 3.4398,
      freight_ratio: 0.8772,
      is_leak: true,
      risk_score: 0.89,
      detectors: { rate: true, margin: true },
      reasons: [
        {
          code: "rate_exceeds_fair",
          severity: "high",
          detail: "Tarif kurir aktual 3.44x lipat estimasi wajar (ambang batas 3.10x).",
          remedy: "Negosiasi ulang tarif khusus rute jarak jauh dengan penyedia logistik.",
        },
        {
          code: "freight_eats_margin",
          severity: "high",
          detail: "Ongkir aktual menyerap 87.7% dari total harga jual produk.",
          remedy: "Terapkan sistem pembagian biaya ongkir dengan pembeli.",
        },
      ],
    },
    {
      line: 5,
      predicted_rate: 11.20,
      actual_rate: 26.50,
      ratio: 2.366,
      freight_ratio: 1.3316,
      is_leak: true,
      risk_score: 0.78,
      detectors: { rate: false, margin: true },
      reasons: [
        {
          code: "freight_eats_margin",
          severity: "high",
          detail: "Ongkir aktual (R$ 26.50) melebihi 100% harga barang (R$ 19.90).",
          remedy: "Produk harga murah wajib dijual secara bundle/paket multipack.",
        },
      ],
    },
    {
      line: 6,
      predicted_rate: 38.60,
      actual_rate: 42.10,
      ratio: 1.0907,
      freight_ratio: 0.1754,
      is_leak: false,
      risk_score: 0.15,
      detectors: { rate: false, margin: false },
      reasons: [],
    },
    {
      line: 7,
      predicted_rate: 31.20,
      actual_rate: 98.50,
      ratio: 3.157,
      freight_ratio: 1.1067,
      is_leak: true,
      risk_score: 0.92,
      detectors: { rate: true, margin: true },
      reasons: [
        {
          code: "rate_exceeds_fair",
          severity: "high",
          detail: "Tarif kurir aktual 3.16x wajar untuk dimensi volumetrik tersebut.",
          remedy: "Gunakan kemasan lebih ramping untuk menekan bobot volumetrik.",
        },
        {
          code: "freight_eats_margin",
          severity: "high",
          detail: "Ongkir menyerap 110.7% harga jual produk.",
          remedy: "Naikkan harga jual atau alihkan rute pengiriman.",
        },
      ],
    },
    {
      line: 8,
      predicted_rate: 16.50,
      actual_rate: 18.00,
      ratio: 1.0909,
      freight_ratio: 0.24,
      is_leak: false,
      risk_score: 0.14,
      detectors: { rate: false, margin: false },
      reasons: [],
    },
    {
      line: 9,
      predicted_rate: 18.50,
      actual_rate: 52.40,
      ratio: 2.8324,
      freight_ratio: 1.4971,
      is_leak: true,
      risk_score: 0.81,
      detectors: { rate: false, margin: true },
      reasons: [
        {
          code: "freight_eats_margin",
          severity: "high",
          detail: "Ongkir menyerap 149.7% harga jual (R$ 52.40 vs R$ 35.00).",
          remedy: "Terapkan kuota minimum belanja gratis ongkir.",
        },
      ],
    },
    {
      line: 10,
      predicted_rate: 12.10,
      actual_rate: 13.20,
      ratio: 1.0909,
      freight_ratio: 0.1468,
      is_leak: false,
      risk_score: 0.11,
      detectors: { rate: false, margin: false },
      reasons: [],
    },
    {
      line: 11,
      predicted_rate: 26.40,
      actual_rate: 74.00,
      ratio: 2.803,
      freight_ratio: 1.0725,
      is_leak: true,
      risk_score: 0.84,
      detectors: { rate: false, margin: true },
      reasons: [
        {
          code: "freight_eats_margin",
          severity: "high",
          detail: "Ongkir menyerap 107.3% dari harga produk.",
          remedy: "Evaluasi margin produk rute jarak menengah.",
        },
      ],
    },
    {
      line: 12,
      predicted_rate: 85.00,
      actual_rate: 285.00,
      ratio: 3.3529,
      freight_ratio: 0.8906,
      is_leak: true,
      risk_score: 0.88,
      detectors: { rate: true, margin: true },
      reasons: [
        {
          code: "rate_exceeds_fair",
          severity: "high",
          detail: "Tarif aktual R$ 285 vs tarif wajar R$ 85 (3.35x lipat).",
          remedy: "Lakukan audit kontrak tarif khusus kargo berat di atas 15 kg.",
        },
      ],
    },
    {
      line: 13,
      predicted_rate: 14.80,
      actual_rate: 22.00,
      ratio: 1.4865,
      freight_ratio: 1.4194,
      is_leak: true,
      risk_score: 0.72,
      detectors: { rate: false, margin: true },
      reasons: [
        {
          code: "freight_eats_margin",
          severity: "high",
          detail: "Ongkir menyerap 141.9% dari harga jual barang murah.",
          remedy: "Terapkan minimum order atau gabung paket pesanan.",
        },
      ],
    },
  ],
  skipped: [],
};

const SIMULATOR_PRESETS = [
  {
    name: "Standar Wajar (Normal)",
    weight_kg: 2.5,
    distance_km: 450.0,
    volume_cm3: 12000,
    price: 150.0,
    actual_rate: 24.5,
    note: "Tarif wajar dan ongkir hanya menyerap 16% harga produk.",
  },
  {
    name: "Overcharge Ekspedisi (Rate Leak)",
    weight_kg: 14.0,
    distance_km: 1800.0,
    volume_cm3: 65000,
    price: 320.0,
    actual_rate: 185.0,
    note: "Tarif aktual kurir 3.4x di atas batas wajar model.",
  },
  {
    name: "Barang Murah Ongkir Mahal (Margin Leak)",
    weight_kg: 0.8,
    distance_km: 900.0,
    volume_cm3: 3500,
    price: 25.0,
    actual_rate: 38.0,
    note: "Ongkir 152% harga produk, menggerus habis margin pedagang.",
  },
];

type AnalysisData = typeof DEFAULT_ANALYSIS_DATA;

function readStoredAdvice(filename?: string): AdviceResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const storedAdvice = sessionStorage.getItem("profitleak_advice");
    const storedFilename = sessionStorage.getItem("profitleak_advice_filename");
    const currentFilename = filename || "transaksi.csv";

    if (storedAdvice && storedFilename === currentFilename) {
      const parsed = JSON.parse(storedAdvice);
      if (parsed && (parsed.headline || parsed.ringkasan)) {
        return parsed as AdviceResponse;
      }
    }
  } catch {
    // Abaikan jika storage kosong atau corrupt
  }
  return null;
}

function subscribeSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("profitleak-session-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("profitleak-session-update", callback);
  };
}

function getSessionSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("profitleak_analysis_result");
}

function getServerSnapshot(): string | null {
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const rawStored = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSnapshot);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const storedAnalysis = useMemo(() => {
    if (!rawStored) {
      return { data: DEFAULT_ANALYSIS_DATA, hasStoredResult: false };
    }
    try {
      const parsed = JSON.parse(rawStored);
      if (parsed && parsed.summary && Array.isArray(parsed.rows)) {
        return { data: parsed as AnalysisData, hasStoredResult: true };
      }
    } catch {}
    return { data: DEFAULT_ANALYSIS_DATA, hasStoredResult: false };
  }, [rawStored]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);

  const data = storedAnalysis.data;
  const hasStoredResult = storedAnalysis.hasStoredResult;

  // Listener untuk download PDF dan request exit dari Navbar
  useEffect(() => {
    const handleDownload = () => {
      window.print();
    };
    const handleExitRequest = (e: Event) => {
      const ce = e as CustomEvent<{ href: string }>;
      setPendingExitUrl(ce.detail?.href || "/upload");
      setShowExitModal(true);
    };

    window.addEventListener("trigger-download-pdf", handleDownload);
    window.addEventListener("request-exit-dashboard", handleExitRequest);
    return () => {
      window.removeEventListener("trigger-download-pdf", handleDownload);
      window.removeEventListener("request-exit-dashboard", handleExitRequest);
    };
  }, []);

  const handleRequestExit = (url: string = "/upload") => {
    setPendingExitUrl(url);
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    try {
      sessionStorage.removeItem("profitleak_analysis_result");
      sessionStorage.removeItem("profitleak_advice");
      sessionStorage.removeItem("profitleak_advice_filename");
      window.dispatchEvent(new Event("profitleak-session-update"));
    } catch {}
    setShowExitModal(false);
    const target = pendingExitUrl || "/upload";
    router.push(target);
  };

  const [activeTab, setActiveTab] = useState<"overview" | "table" | "simulator">("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | "leaks" | "normal">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [simWeight, setSimWeight] = useState(2.5);
  const [simDistance, setSimDistance] = useState(450.0);
  const [simVolume, setSimVolume] = useState(12000);
  const [simPrice, setSimPrice] = useState(150.0);
  const [simActualRate, setSimActualRate] = useState(24.5);

  const auditRows = useMemo(
    () => (Array.isArray(data.rows) ? data.rows : []),
    [data.rows]
  );

  const filteredRows = useMemo(() => {
    return auditRows.filter((row) => {
      if (statusFilter === "leaks" && !row.is_leak) return false;
      if (statusFilter === "normal" && row.is_leak) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const lineMatch = String(row.line).includes(q);
        // reasons bisa tidak ada pada respons yang tidak lengkap -> jangan crash.
        const reasonMatch = (row.reasons ?? []).some((r) =>
          String(r?.detail ?? "").toLowerCase().includes(q)
        );
        return lineMatch || reasonMatch;
      }
      return true;
    });
  }, [auditRows, statusFilter, searchQuery]);

  // Threshold bisa berupa string/NaN dari payload yang tidak tervalidasi.
  const threshold = Number(data.threshold);
  const safeThreshold = Number.isFinite(threshold) && threshold > 0 ? threshold : 3.09779;

  const simulatorResult = useMemo(() => {
    const w = Math.max(0.05, Math.min(30.0, simWeight));
    const d = Math.max(1.5, Math.min(3135.0, simDistance));
    const v = Math.max(352.0, Math.min(244608.0, simVolume));
    const p = Math.max(4.99, Math.min(2110.0, simPrice));
    const act = Math.max(0.1, simActualRate);

    const logPrice = Math.log1p(p);
    const density = (w * 1000) / Math.max(v, 1);
    const predictedLog =
      1.52 +
      0.038 * Math.sqrt(d) +
      0.082 * Math.log1p(w) +
      0.045 * Math.log1p(v / 1000) +
      0.015 * logPrice +
      0.02 * density;
    const predictedRate = Math.max(5.0, Math.round((Math.exp(predictedLog) - 1) * 100) / 100);

    const ratio = Math.round((act / predictedRate) * 10000) / 10000;
    const freightRatio = Math.round((act / p) * 10000) / 10000;

    const isRateLeak = ratio > 3.09779;
    const marginRiskProb = Math.min(
      1.0,
      Math.max(0.0, 0.25 + 0.55 * (freightRatio / 1.2) + 0.1 * (w / 15))
    );
    const isMarginRisk = marginRiskProb >= 0.46;
    const isLeak = isRateLeak || isMarginRisk;

    const rateComponent = Math.min(Math.max((ratio - 1.0) / 2.09779, 0.0), 1.0);
    const riskScore = Math.round((0.55 * rateComponent + 0.45 * marginRiskProb) * 100) / 100;

    return {
      predictedRate,
      actualRate: act,
      ratio,
      freightRatio,
      isRateLeak,
      isMarginRisk,
      isLeak,
      riskScore,
      marginRiskProb: Math.round(marginRiskProb * 100),
    };
  }, [simWeight, simDistance, simVolume, simPrice, simActualRate]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // State Rekomendasi Saran AI (Google Gemini LLM / Rule-Based Fallback)
  const [adviceOverride, setAdviceOverride] = useState<AdviceResponse | null>(null);
  const advice = adviceOverride ?? (hasStoredResult ? readStoredAdvice(data.filename) : null);
  const [adviceLoading, setAdviceLoading] = useState<boolean>(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  // Handler Permintaan Saran AI (dipanggil saat tombol diklik atau retry)
  const handleFetchAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError(null);

    try {
      const payload = {
        filename: data.filename || "transaksi.csv",
        threshold: safeThreshold,
        summary: {
          analysed: data.summary.analysed,
          leaks: data.summary.leaks,
          rate_leaks: data.summary.rate_leaks,
          margin_risks: data.summary.margin_risks,
          estimated_loss: data.summary.estimated_loss,
          leak_rate: data.summary.leak_rate,
        },
        rows: auditRows.map((r) => ({
          line: r.line,
          predicted_rate: r.predicted_rate,
          actual_rate: r.actual_rate,
          ratio: r.ratio,
          freight_ratio: r.freight_ratio,
          is_leak: r.is_leak,
          risk_score: r.risk_score,
          detectors: r.detectors,
        })),
      };

      const result = await getAdvice(payload);
      setAdviceOverride(result);
      try {
        sessionStorage.setItem("profitleak_advice", JSON.stringify(result));
        sessionStorage.setItem("profitleak_advice_filename", data.filename || "transaksi.csv");
      } catch {
        // Abaikan jika kuota storage penuh
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal memproses rekomendasi saran AI.";
      setAdviceError(errMsg);
    } finally {
      setAdviceLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat data analisis...</span>
      </div>
    );
  }

  if (!hasStoredResult) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-8 text-center flex flex-col items-center animate-in fade-in-50 zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center mb-5 shadow-xs">
            <Lock className="w-8 h-8" strokeWidth={2.2} />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full mb-3">
            Dashboard Belum Terbuka
          </span>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Belum Ada Data Transaksi
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Dashboard analisis memerlukan data transaksi pengiriman logistik untuk mendeteksi indikasi kebocoran margin dan menyajikan rekomendasi AI. Silakan unggah berkas CSV Anda terlebih dahulu.
          </p>

          <Link
            href="/upload"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-xs shadow-md shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Berkas CSV Sekarang</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header Khusus Saat Dokumen Dicetak / Disimpan sebagai PDF */}
      <div className="print-only mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-blue-800">
              ProfitLeak • AI Logistics Audit Engine
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              LAPORAN AUDIT KEBOCORAN LABA & ANOMALI ONGKOS KIRIM
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Hasil evaluasi dual-engine detector (Fair Rate Regression & Margin Risk Classifier)
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div><span className="font-semibold text-slate-800">Berkas Data:</span> {data.filename}</div>
            <div><span className="font-semibold text-slate-800">Total Transaksi:</span> {data.summary.analysed} baris</div>
            <div><span className="font-semibold text-slate-800">Kebocoran:</span> {data.summary.leaks} ({data.summary.leak_rate}%)</div>
          </div>
        </div>
      </div>

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleRequestExit("/upload")}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Kembali & Unggah File Baru"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Dashboard Audit Transaksi
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Dual-Engine Detector
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              File: <span className="font-semibold text-slate-700">{data.filename}</span> • {data.summary.analysed} transaksi selesai dianalisis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tombol Unduh Laporan PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cetak atau Unduh Laporan Audit dalam format PDF"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan PDF</span>
          </button>

          {/* Tombol Unggah File Baru dengan Konfirmasi Reset */}
          <button
            type="button"
            onClick={() => handleRequestExit("/upload")}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Keluar dari analisis ini dan unggah file CSV baru"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Unggah File Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkasan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Transaksi Dianalisis
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{data.summary.analysed}</span>
            <span className="text-xs text-slate-500">100% valid</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Ambang Rasio: {safeThreshold.toFixed(2)}x
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Transaksi Terindikasi Bocor
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-rose-600">{data.summary.leaks}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              {data.summary.leak_rate}% Rasio
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            {data.summary.rate_leaks} overcharge • {data.summary.margin_risks} risiko margin
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Estimasi Kerugian Margin
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">
              {formatBRL(data.summary.estimated_loss)}
            </span>
            <span className="text-xs text-slate-500">BRL</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            Kelebihan ongkir aktual atas tarif wajar
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Skor Kesehatan Finansial
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-600">
              {(100 - data.summary.leak_rate).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">Normal</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#1E40AF]" />
            Dual-Detector Proteksi Aktif
          </div>
        </div>
      </div>

      {/* Panel Rekomendasi Saran AI (Google Gemini LLM / Rule-Based) */}
      <AdvicePanel
        data={advice}
        loading={adviceLoading}
        error={adviceError}
        onRetry={handleFetchAdvice}
        onSelectLine={(line) => {
          setActiveTab("table");
          setSearchQuery(String(line));
        }}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 no-print">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "overview"
              ? "text-[#1E40AF] border-b-2 border-[#1E40AF]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Ringkasan & Visualisasi
        </button>
        <button
          onClick={() => setActiveTab("table")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "table"
              ? "text-[#1E40AF] border-b-2 border-[#1E40AF]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Tabel Audit Transaksi ({auditRows.length})
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === "simulator"
              ? "text-[#1E40AF] border-b-2 border-[#1E40AF]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Simulator Transaksi Tunggal
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Rasio Tarif Transaksi vs Ambang Batas Wajar
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nilai rasio tarif aktual terhadap estimasi tarif wajar. Ambang batas anomali: {safeThreshold.toFixed(2)}x.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={auditRows}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <XAxis
                        dataKey="line"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={(v) => `#${v}`}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-md text-xs">
                                <span className="font-bold text-slate-900 block">
                                  Baris #{d.line}
                                </span>
                                <div className="mt-1 space-y-0.5 text-slate-600">
                                  <div>Tarif Aktual: {formatBRL(d.actual_rate)}</div>
                                  <div>Tarif Wajar: {formatBRL(d.predicted_rate)}</div>
                                  <div className="font-bold text-[#1E40AF]">
                                    Rasio: {d.ratio}x
                                  </div>
                                  <div className={d.is_leak ? "text-rose-600 font-bold" : "text-emerald-600"}>
                                    Status: {d.is_leak ? "Terindikasi Kebocoran" : "Wajar"}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        y={safeThreshold}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        label={{
                          value: `Ambang ${safeThreshold.toFixed(2)}x`,
                          position: "top",
                          fill: "#f43f5e",
                          fontSize: 10,
                        }}
                      />
                      <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>
                        {auditRows.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.is_leak ? "#f43f5e" : "#1e40af"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#1E40AF]"></span>
                    <span>Tarif Wajar (&le; {safeThreshold.toFixed(2)}x)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500"></span>
                    <span>Anomali / Bocor (&gt; {safeThreshold.toFixed(2)}x)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pemicu Kebocoran (Dual-Detector)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi penyebab anomali berdasarkan dua detektor sistem.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-bold text-slate-900">Risiko Margin Tergerus</span>
                      </div>
                      <span className="text-xs font-bold text-rose-600">
                        {data.reason_breakdown.freight_eats_margin || 0} kasus
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ongkir aktual menyerap &gt;50% dari harga barang sehingga mengorbankan margin.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#1E40AF]" />
                        <span className="text-xs font-bold text-slate-900">Overcharge Ekspedisi</span>
                      </div>
                      <span className="text-xs font-bold text-[#1E40AF]">
                        {data.reason_breakdown.rate_exceeds_fair || 0} kasus
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tarif aktual ekspedisi melebihi 3.10x dari estimasi tarif wajar model regresi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                Model: Rate Regressor ($R^2$ 73.5%) & Margin Classifier (F1 85.9%)
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Rekomendasi Tindak Lanjut Finansial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Langkah strategis yang dihasilkan otomatis oleh sistem untuk menutup celah kebocoran laba:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {data.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                      Fokus: {rec.code === "freight_eats_margin" ? "Strategi Harga & Bundling" : "Negosiasi Logistik"} ({rec.count} Transaksi Terkait)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rec.recommendation}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    Prioritas Tinggi <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TABLE */}
      {activeTab === "table" && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua ({auditRows.length})
              </button>
              <button
                onClick={() => setStatusFilter("leaks")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === "leaks"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                Hanya Bocor ({data.summary.leaks})
              </button>
              <button
                onClick={() => setStatusFilter("normal")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === "normal"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                Normal ({auditRows.length - data.summary.leaks})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari baris atau alasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Baris</th>
                  <th className="px-4 py-3">Tarif Wajar (BRL)</th>
                  <th className="px-4 py-3">Tarif Aktual (BRL)</th>
                  <th className="px-4 py-3">Rasio Tarif</th>
                  <th className="px-4 py-3">Porsi Ongkir</th>
                  <th className="px-4 py-3">Detektor Aktif</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Faktor Pemicu & Solusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row) => (
                  <tr key={row.line} className={row.is_leak ? "bg-rose-50/20 hover:bg-rose-50/40" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3 font-bold text-slate-900">#{row.line}</td>
                    <td className="px-4 py-3 text-slate-700">{formatBRL(row.predicted_rate)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatBRL(row.actual_rate)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${row.ratio > safeThreshold ? "text-rose-600" : "text-slate-700"}`}>
                        {row.ratio.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {(row.freight_ratio * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {row.detectors?.rate && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            Rate
                          </span>
                        )}
                        {row.detectors?.margin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Margin
                          </span>
                        )}
                        {!row.detectors?.rate && !row.detectors?.margin && (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.is_leak ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Bocor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Wajar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs text-slate-600">
                      {Array.isArray(row.reasons) && row.reasons.length > 0 ? (
                        <div className="space-y-1">
                          {row.reasons.map((r, rIdx) => (
                            <div key={rIdx} className="text-[11px]">
                              <span className="font-semibold text-slate-800">• {r.detail}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Tidak ada anomali</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULATOR TRANSAKSI TUNGGAL */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#1E40AF]" />
                  Parameter Paket Transaksi
                </h3>
                <span className="text-xs text-slate-500">Mata Uang: BRL (R$)</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ketik atau pilih preset skenario di bawah untuk menguji respon sistem audit secara instan.
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Pilih Skenario Cepat:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SIMULATOR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSimWeight(preset.weight_kg);
                      setSimDistance(preset.distance_km);
                      setSimVolume(preset.volume_cm3);
                      setSimPrice(preset.price);
                      setSimActualRate(preset.actual_rate);
                    }}
                    className="p-3 text-left rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all text-xs"
                  >
                    <span className="font-bold text-slate-900 block">{preset.name}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{preset.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Berat Paket (weight_kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.05"
                  max="30"
                  value={simWeight}
                  onChange={(e) => setSimWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Rentang valid: 0.05 - 30.0 kg</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jarak Pengiriman (distance_km)
                </label>
                <input
                  type="number"
                  step="10"
                  min="1.5"
                  max="3135"
                  value={simDistance}
                  onChange={(e) => setSimDistance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Rentang valid: 1.5 - 3135.0 km</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Volume Dimensi (volume_cm3)
                </label>
                <input
                  type="number"
                  step="500"
                  min="352"
                  max="244608"
                  value={simVolume}
                  onChange={(e) => setSimVolume(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Rentang: 352 - 244.608 cm³</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Harga Jual Barang (price)
                </label>
                <input
                  type="number"
                  step="5"
                  min="4.99"
                  max="2110"
                  value={simPrice}
                  onChange={(e) => setSimPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Mata uang: Real Brasil (BRL)</span>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ongkos Kirim Aktual yang Dibayar (actual_rate)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={simActualRate}
                  onChange={(e) => setSimActualRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nilai tarif yang ditagih kurir untuk paket ini
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider block">
                Hasil Evaluasi AI
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {simulatorResult.isLeak ? "Terindikasi Kebocoran Laba" : "Transaksi Wajar & Sehat"}
              </h3>

              <div className="mt-3">
                {simulatorResult.isLeak ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <span className="font-bold block mb-1">Deteksi Aktif:</span>
                    {simulatorResult.isRateLeak && (
                      <div className="font-semibold">• Overcharge Ekspedisi ({simulatorResult.ratio}x wajar)</div>
                    )}
                    {simulatorResult.isMarginRisk && (
                      <div className="font-semibold">
                        • Risiko Margin ({simulatorResult.marginRiskProb}% risiko, ongkir {(simulatorResult.freightRatio * 100).toFixed(0)}% harga)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tarif dalam batas normal logistik. Margin aman.</span>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimasi Tarif Wajar:</span>
                  <span className="font-bold text-[#1E40AF]">{formatBRL(simulatorResult.predictedRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif Aktual:</span>
                  <span className="font-bold text-slate-900">{formatBRL(simulatorResult.actualRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rasio Tarif / Wajar:</span>
                  <span className={`font-bold ${simulatorResult.isRateLeak ? "text-rose-600" : "text-slate-900"}`}>
                    {simulatorResult.ratio}x (Batas: {safeThreshold.toFixed(2)}x)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Porsi Ongkir thd Harga:</span>
                  <span className={`font-bold ${simulatorResult.freightRatio > 0.5 ? "text-rose-600" : "text-slate-900"}`}>
                    {(simulatorResult.freightRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Skor Risiko Gabungan:</span>
                  <span className="font-bold text-slate-900">{simulatorResult.riskScore} / 1.0</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Evaluasi berbasis model regresi tarif & klasifikasi margin
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Keluar dari Dashboard */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Keluar dari Hasil Analisis?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Jika Anda keluar dari menu analisis ini, data sesi audit saat ini akan direset. Anda perlu mengunggah file CSV kembali untuk mengakses dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Tetap di Dashboard
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Ya, Keluar & Reset Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Logistics Copilot Widget */}
      <CopilotWidget
        summary={data.summary}
        rows={auditRows}
        filename={data.filename}
      />
    </div>
  );
}
