"use client";

import { useState } from "react";
import { FileSpreadsheet, Cpu, BarChart3, Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export function InteractiveWorkflow() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleCsvRow = `weight_kg,distance_km,volume_cm3,price,freight_value\n2.5,450.2,12000,129.90,24.50\n0.8,120.5,3500,45.00,14.20\n14.2,1850.0,68000,189.00,165.80`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCsvRow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Stepper Header Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto w-full">
        <button
          onClick={() => setActiveStep(1)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-300 ${
            activeStep === 1
              ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-md scale-[1.02]"
              : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              activeStep === 1 ? "bg-white text-[#1E40AF]" : "bg-slate-100 text-slate-800"
            }`}
          >
            1
          </div>
          <div>
            <h4 className="font-bold text-sm">Siapkan Data CSV</h4>
            <span className={`text-xs ${activeStep === 1 ? "text-sky-200" : "text-slate-500"}`}>
              Format standar 5 kolom
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveStep(2)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-300 ${
            activeStep === 2
              ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-md scale-[1.02]"
              : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              activeStep === 2 ? "bg-white text-[#1E40AF]" : "bg-slate-100 text-slate-800"
            }`}
          >
            2
          </div>
          <div>
            <h4 className="font-bold text-sm">Analisis Dual-Engine</h4>
            <span className={`text-xs ${activeStep === 2 ? "text-sky-200" : "text-slate-500"}`}>
              Inferensi instan 78K data
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveStep(3)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-300 ${
            activeStep === 3
              ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-md scale-[1.02]"
              : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              activeStep === 3 ? "bg-white text-[#1E40AF]" : "bg-slate-100 text-slate-800"
            }`}
          >
            3
          </div>
          <div>
            <h4 className="font-bold text-sm">Audit & Eksekusi Solusi</h4>
            <span className={`text-xs ${activeStep === 3 ? "text-sky-200" : "text-slate-500"}`}>
              Dashboard & rekomendasi
            </span>
          </div>
        </button>
      </div>

      {/* Step Detail Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md">
        {activeStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF]">Langkah 1: Format File CSV</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Struktur 5 Kolom Transaksi Logistik</h3>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Berhasil Disalin!" : "Salin Contoh CSV"}</span>
              </button>
            </div>

            {/* Interactive Table Preview */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-3">weight_kg</th>
                    <th className="px-4 py-3">distance_km</th>
                    <th className="px-4 py-3">volume_cm3</th>
                    <th className="px-4 py-3">price (R$)</th>
                    <th className="px-4 py-3">freight_value (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">2.5</td>
                    <td className="px-4 py-2.5">450.2</td>
                    <td className="px-4 py-2.5">12,000</td>
                    <td className="px-4 py-2.5">129.90</td>
                    <td className="px-4 py-2.5 text-[#1E40AF] font-bold">24.50</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">0.8</td>
                    <td className="px-4 py-2.5">120.5</td>
                    <td className="px-4 py-2.5">3,500</td>
                    <td className="px-4 py-2.5">45.00</td>
                    <td className="px-4 py-2.5 text-[#1E40AF] font-bold">14.20</td>
                  </tr>
                  <tr className="bg-rose-50/40">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">14.2</td>
                    <td className="px-4 py-2.5">1,850.0</td>
                    <td className="px-4 py-2.5">68,000</td>
                    <td className="px-4 py-2.5">189.00</td>
                    <td className="px-4 py-2.5 text-rose-600 font-bold">165.80 (Bocor)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500">
              * Mendukung format file CSV hingga 50.000 baris. Pemrosesan dilakukan 100% di browser tanpa upload data sensitif ke server publik.
            </p>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF]">Langkah 2: Pemrosesan AI</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Dual-Engine Machine Learning Evaluator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider block">Mesin 1: Regresi Tarif Wajar</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menghitung kurva non-linier antara jarak, kepadatan volumetrik, dan berat menggunakan algoritma <strong>HistGradientBoosting</strong> untuk mematok harga wajar kurir.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700">
                  Ambang Deteksi: Rasio Tarif &gt; 3.0978x
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Mesin 2: Klasifikasi Risiko Margin</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menganalisis probabilitas apakah beban ongkir memakan lebih dari separuh nilai barang, mengancam profitabilitas bersih transaksi.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700">
                  Ambang Deteksi: Probabilitas &ge; 46% (Beban &gt; 50%)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF]">Langkah 3: Laporan & Eksekusi</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Dashboard Audit & Tindakan Koreksi Spesifik</h3>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#1E40AF] text-white hover:bg-[#1E3A8A] transition-colors shrink-0"
              >
                <span>Buka Dashboard Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#E0F2FE]/50 border border-[#BAE6FD] space-y-1">
                <span className="text-xs font-bold text-[#1E40AF] block">1. Rekomendasi Bundling</span>
                <p className="text-xs text-slate-600">Gabungkan produk ringan dengan item populer untuk membagi beban ongkos kirim.</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="text-xs font-bold text-rose-700 block">2. Ganti Kurir / Rute</span>
                <p className="text-xs text-slate-600">Alihkan rute dengan rasio markup tinggi (&gt;3x) ke mitra ekspedisi regional alternatif.</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-800 block">3. Minimum Order Kuantiti</span>
                <p className="text-xs text-slate-600">Terapkan batasan minimum pembelian pada katalog produk yang rentan gerus margin.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

