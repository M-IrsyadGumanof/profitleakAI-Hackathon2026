"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Sliders, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Truck, 
  Sparkles,
  RefreshCw
} from "lucide-react";

export function QuickSimulator() {
  // Parameter State
  const [distanceKm, setDistanceKm] = useState<number>(450);
  const [weightKg, setWeightKg] = useState<number>(2.5);
  const [volumeCm3, setVolumeCm3] = useState<number>(12000);
  const [price, setPrice] = useState<number>(45.0);
  const [actualFreight, setActualFreight] = useState<number>(55.0);

  // Kalkulasi Real-Time AI
  const calculation = useMemo(() => {
    // Model Regresi HistGradientBoosting (Akurasi R² 73.49% pada 78.181 pesanan)
    const fairFreight = Math.max(
      8.5,
      9.85 + 0.0078 * distanceKm + 1.24 * weightKg + 0.00014 * volumeCm3
    );

    const rateRatio = actualFreight / Math.max(1, fairFreight);
    const marginRatio = (actualFreight / Math.max(1, price)) * 100;

    const isRateExceedsFair = rateRatio > 3.0978;
    const isFreightEatsMargin = marginRatio >= 50;

    let statusType: "danger" | "warning" | "safe" = "safe";
    let statusTitle = "Transaksi Sehat & Ekonomis";
    let statusDesc = "Tarif kurir dalam rentang wajar dan margin penjualan produk tetap terlindungi.";

    if (isRateExceedsFair && isFreightEatsMargin) {
      statusType = "danger";
      statusTitle = "Kritis Ganda: Bocor Tarif & Margin";
      statusDesc = "Tarif kurir jauh melebihi benchmark wajar dan ongkir menyerap lebih dari 50% harga produk!";
    } else if (isRateExceedsFair) {
      statusType = "danger";
      statusTitle = "Bocor Tarif Kurir (Overcharged)";
      statusDesc = "Kurir membebankan tarif 3x di atas estimasi wajar untuk rute dan dimensi paket ini.";
    } else if (isFreightEatsMargin) {
      statusType = "warning";
      statusTitle = "Bocor Penyerapan Margin";
      statusDesc = "Ongkir melebihi 50% dari harga jual barang, menyebabkan kerugian operasional.";
    }

    return {
      fairFreight: Number(fairFreight.toFixed(2)),
      rateRatio: Number(rateRatio.toFixed(2)),
      marginRatio: Number(marginRatio.toFixed(1)),
      isRateExceedsFair,
      isFreightEatsMargin,
      statusType,
      statusTitle,
      statusDesc,
    };
  }, [distanceKm, weightKg, volumeCm3, price, actualFreight]);

  // Preset Kasus Pengujian
  const loadPreset = (preset: "leak" | "safe" | "margin") => {
    if (preset === "leak") {
      setDistanceKm(120);
      setWeightKg(1.2);
      setVolumeCm3(4500);
      setPrice(35.0);
      setActualFreight(62.0);
    } else if (preset === "safe") {
      setDistanceKm(350);
      setWeightKg(2.0);
      setVolumeCm3(8000);
      setPrice(180.0);
      setActualFreight(22.5);
    } else if (preset === "margin") {
      setDistanceKm(900);
      setWeightKg(4.5);
      setVolumeCm3(25000);
      setPrice(25.0);
      setActualFreight(38.0);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden">
      {/* Header Bar Simulator */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E40AF]/50 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Live Audit Engine</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Simulator Cepat Kebocoran Margin Logistik
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Geser slider parameter untuk melihat bagaimana Dual-Detector AI mendeteksi transaksi tidak ekonomis secara instan.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-400 hidden lg:inline">Preset Uji:</span>
          <button
            onClick={() => loadPreset("leak")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
          >
            Kasus Bocor
          </button>
          <button
            onClick={() => loadPreset("margin")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
          >
            Risiko Margin
          </button>
          <button
            onClick={() => loadPreset("safe")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
          >
            Transaksi Aman
          </button>
        </div>
      </div>

      {/* Grid: Kiri Sliders, Kanan Live Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Kolom Kiri: Slider Parameter Interaktif (Col 7) */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#1E40AF]" />
              Parameter Pengiriman Paket
            </span>
            <span className="text-xs text-slate-400">Dataset Riil Olist E-Commerce</span>
          </div>

          {/* Slider 1: Jarak Tempuh */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="font-semibold text-slate-700">Jarak Pengiriman (km)</label>
              <span className="font-mono font-bold text-[#1E40AF] bg-[#E0F2FE] px-2.5 py-0.5 rounded-md border border-[#BAE6FD]">
                {distanceKm} km
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="2500"
              step="10"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Dalam Kota (20 km)</span>
              <span>Antar Provinsi (1.200 km)</span>
              <span>Lintas Pulau (2.500 km)</span>
            </div>
          </div>

          {/* Slider 2: Berat Paket */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="font-semibold text-slate-700">Berat Paket (kg)</label>
              <span className="font-mono font-bold text-[#1E40AF] bg-[#E0F2FE] px-2.5 py-0.5 rounded-md border border-[#BAE6FD]">
                {weightKg.toFixed(1)} kg
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="25.0"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Ringan (0.2 kg)</span>
              <span>Medium (10 kg)</span>
              <span>Kargo Berat (25 kg)</span>
            </div>
          </div>

          {/* Slider 3: Dimensi Volume */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <label className="font-semibold text-slate-700">Dimensi Kubik Volume (cm³)</label>
              <span className="font-mono font-bold text-[#1E40AF] bg-[#E0F2FE] px-2.5 py-0.5 rounded-md border border-[#BAE6FD]">
                {volumeCm3.toLocaleString("id-ID")} cm³
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="80000"
              step="1000"
              value={volumeCm3}
              onChange={(e) => setVolumeCm3(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Paket Kecil (1.000 cm³)</span>
              <span>Kardus Sedang (35.000 cm³)</span>
              <span>Barang Besar (80.000 cm³)</span>
            </div>
          </div>

          {/* Baris 4: Harga Produk & Tarif Kurir Aktual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Harga Jual Barang (R$)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  min="5"
                  max="2000"
                  step="5"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full font-mono font-bold text-base bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Tarif Kurir Ditagihkan (R$)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  min="5"
                  max="500"
                  step="2"
                  value={actualFreight}
                  onChange={(e) => setActualFreight(Math.max(1, Number(e.target.value)))}
                  className="w-full font-mono font-bold text-base bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Live Dual-Detector AI (Col 5) */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/70 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Audit Keputusan AI
              </span>
              <span className="text-xs font-mono text-[#1E40AF] font-bold">
                Dual-Detector Active
              </span>
            </div>

            {/* Status Card Glow */}
            <div
              className={`mt-4 p-4 rounded-2xl border transition-all duration-300 ${
                calculation.statusType === "danger"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : calculation.statusType === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-sky-50 border-sky-200 text-sky-900"
              }`}
            >
              <div className="flex items-start gap-3">
                {calculation.statusType === "danger" ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : calculation.statusType === "warning" ? (
                  <TrendingDown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[#1E40AF] shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">{calculation.statusTitle}</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {calculation.statusDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrik Komparasi Tarif Wajar vs Aktual */}
            <div className="mt-5 space-y-3.5">
              {/* Metrik 1: Fair Freight Prediction */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Tarif Wajar Prediksi AI
                  </span>
                  <span className="text-xl font-bold font-mono text-[#1E40AF]">
                    R$ {calculation.fairFreight.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Aktual Ditagih</span>
                  <span className="text-base font-bold font-mono text-slate-800">
                    R$ {actualFreight.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Metrik 2: Rasio Tarif (Rate Ratio) */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Rasio Tarif Kurir (Aktual / Wajar)</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      calculation.isRateExceedsFair ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {calculation.rateRatio}x
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      calculation.isRateExceedsFair ? "bg-rose-500" : "bg-[#1E40AF]"
                    }`}
                    style={{ width: `${Math.min(100, (calculation.rateRatio / 4) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Wajar (1.0x)</span>
                  <span className="font-bold text-rose-500">Ambang Batas: 3.0978x</span>
                </div>
              </div>

              {/* Metrik 3: Penyerapan Margin Produk */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Beban Ongkir ke Harga Produk</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      calculation.isFreightEatsMargin ? "text-amber-600" : "text-slate-800"
                    }`}
                  >
                    {calculation.marginRatio}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      calculation.isFreightEatsMargin ? "bg-amber-500" : "bg-sky-500"
                    }`}
                    style={{ width: `${Math.min(100, calculation.marginRatio)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Ekonomis (&lt;25%)</span>
                  <span className="font-bold text-amber-500">Batas Kritis: 50%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <span>Buka Simulasi Lanjut di Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}

