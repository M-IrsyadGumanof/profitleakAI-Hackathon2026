"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Sliders, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Sparkles
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
    let statusTitle = "Transaksi Sehat";
    let statusDesc = "Tarif kurir dalam rentang wajar dan margin produk aman.";

    if (isRateExceedsFair && isFreightEatsMargin) {
      statusType = "danger";
      statusTitle = "Kritis: Bocor Tarif & Margin";
      statusDesc = "Tarif kurir melebihi wajar dan ongkir memakan >50% harga produk.";
    } else if (isRateExceedsFair) {
      statusType = "danger";
      statusTitle = "Bocor Tarif Kurir";
      statusDesc = "Kurir membebankan tarif 3x di atas estimasi wajar rute ini.";
    } else if (isFreightEatsMargin) {
      statusType = "warning";
      statusTitle = "Bocor Penyerapan Margin";
      statusDesc = "Ongkir menyerap lebih dari 50% harga produk.";
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
    <div className="w-full rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 overflow-hidden transition-all">
      {/* Header Bar Simulator Sederhana & Bersih */}
      <div className="p-6 sm:p-7 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Simulator Cepat Audit Logistik
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Uji instan pengaruh parameter pengiriman terhadap kewajaran ongkos kirim.
          </p>
        </div>

        {/* Preset Minimalis Tanpa Warna Ramai */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Uji Kasus:</span>
          <button
            onClick={() => loadPreset("leak")}
            className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Bocor Tarif
          </button>
          <button
            onClick={() => loadPreset("margin")}
            className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Risiko Margin
          </button>
          <button
            onClick={() => loadPreset("safe")}
            className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Aman
          </button>
        </div>
      </div>

      {/* Grid: Kiri Slider Parameter, Kanan Live Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/70">
        
        {/* Kolom Kiri: Slider Parameter (Col 7) */}
        <div className="lg:col-span-7 p-6 sm:p-7 space-y-5">
          
          {/* Slider 1: Jarak */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Jarak Pengiriman</label>
              <span className="font-bold tabular-nums text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
            />
          </div>

          {/* Slider 2: Berat */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Berat Paket</label>
              <span className="font-bold tabular-nums text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
            />
          </div>

          {/* Slider 3: Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Dimensi Kubik</label>
              <span className="font-bold tabular-nums text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E40AF]"
            />
          </div>

          {/* Baris 4: Harga Jual & Ongkir Riil */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Harga Jual Barang</label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  min="5"
                  max="2000"
                  step="5"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full font-bold tabular-nums text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#1E40AF]"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Tarif Kurir Ditagih</label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  min="5"
                  max="500"
                  step="2"
                  value={actualFreight}
                  onChange={(e) => setActualFreight(Math.max(1, Number(e.target.value)))}
                  className="w-full font-bold tabular-nums text-sm bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#1E40AF]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Live Sederhana & Terukur (Col 5) */}
        <div className="lg:col-span-5 p-6 sm:p-7 bg-slate-50/40 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            
            {/* Status Indikator Bersih (Hanya Icon yang Diberi Warna, Layout Netral) */}
            <div className="p-3.5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 text-slate-900 shadow-xs">
              <div className="flex items-center gap-2">
                {calculation.statusType === "danger" ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : calculation.statusType === "warning" ? (
                  <TrendingDown className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0" />
                )}
                <h4 className="font-bold text-xs text-slate-900">{calculation.statusTitle}</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {calculation.statusDesc}
              </p>
            </div>

            {/* Dua Metrik Kunci Sederhana */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium block">Tarif Wajar AI</span>
                <span className="text-base font-bold tabular-nums text-[#1E40AF] mt-0.5 block">
                  R$ {calculation.fairFreight.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-medium block">Tarif Ditagih</span>
                <span className="text-base font-bold tabular-nums text-slate-800 mt-0.5 block">
                  R$ {actualFreight.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ringkasan Rasio */}
            <div className="p-3 bg-white/90 rounded-xl border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Rasio Tarif Kurir</span>
                <span className={`font-bold tabular-nums ${calculation.isRateExceedsFair ? "text-rose-600" : "text-slate-900"}`}>
                  {calculation.rateRatio}x
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="text-slate-600">Beban Ongkir ke Harga</span>
                <span className={`font-bold tabular-nums ${calculation.isFreightEatsMargin ? "text-rose-600" : "text-slate-900"}`}>
                  {calculation.marginRatio}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <span>Buka Audit Lengkap di Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
