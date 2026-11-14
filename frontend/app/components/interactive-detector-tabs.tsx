"use client";

import { useState } from "react";
import { Truck, TrendingDown, Layers, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Cpu } from "lucide-react";

export function InteractiveDetectorTabs() {
  const [activeTab, setActiveTab] = useState<"rate" | "margin" | "synergy">("rate");

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tab Switcher Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 max-w-xl mx-auto shadow-xs">
        <button
          onClick={() => setActiveTab("rate")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "rate"
              ? "bg-[#1E40AF] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Detektor 1: Tarif Wajar</span>
        </button>

        <button
          onClick={() => setActiveTab("margin")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "margin"
              ? "bg-[#1E40AF] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Detektor 2: Risiko Margin</span>
        </button>

        <button
          onClick={() => setActiveTab("synergy")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "synergy"
              ? "bg-[#1E40AF] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sinergi Dual-Engine</span>
        </button>
      </div>

      {/* Tab Content Cards */}
      <div className="w-full">
        {activeTab === "rate" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#1E40AF] text-xs font-bold border border-[#BAE6FD]">
                <Cpu className="w-3.5 h-3.5" />
                <span>HistGradientBoostingRegressor • Akurasi R² 73.49%</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Deteksi Pembebanan Tarif Kurir di Atas Ambang Wajar
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Memprediksi ongkir wajar berdasarkan profil fisik logistik dan jarak tempuh. Jika tarif kurir riil melebihi <strong className="text-rose-600 font-bold">3.0978x</strong> dari estimasi wajar model, sistem menandai anomali biaya ekspedisi yang memerlukan re-negosiasi kontrak kurir.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fitur 1</span>
                  <span className="text-xs font-bold text-slate-800">Jarak Tempuh (km)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fitur 2</span>
                  <span className="text-xs font-bold text-slate-800">Berat Paket (kg)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fitur 3</span>
                  <span className="text-xs font-bold text-slate-800">Volume Kubik (cm³)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fitur 4</span>
                  <span className="text-xs font-bold text-slate-800">Densitas (g/cm³)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 text-white space-y-3.5 border border-slate-800 shadow-inner">
              <span className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-wider block">
                Contoh Deteksi Anomali Tarif
              </span>
              <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Jarak 150 km • Berat 0.8 kg</span>
                  <span className="text-slate-400">Dimensi 3.200 cm³</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-400">Prediksi Tarif Wajar:</span>
                  <span className="text-sm font-bold text-sky-400">R$ 14.20</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Tarif Kurir Ditagihkan:</span>
                  <span className="text-base font-bold text-rose-400">R$ 48.50</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Rasio Tarif:</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    3.42x (BOCOR TARIF)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                💡 <strong>Solusi AI:</strong> Terapkan integrasi multi-ekspedisi untuk rute ini atau audit ulang tagihan kurir.
              </p>
            </div>
          </div>
        )}

        {activeTab === "margin" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>HistGradientBoostingClassifier • F1-Score 85.94%</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Deteksi Pesanan Tidak Ekonomis yang Menggerus Margin
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mendeteksi transaksi di mana ongkos kirim menyerap porsi berlebih (<strong className="text-amber-600 font-bold">&gt;50%</strong>) dari harga jual produk. Menghindarkan penjual dari ilusi omzet tinggi namun laba operasional riil tergerus beban logistik.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Metrik 1</span>
                  <span className="text-xs font-bold text-slate-800">Harga Barang (R$)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Metrik 2</span>
                  <span className="text-xs font-bold text-slate-800">Total Ongkir (R$)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Ambang Batas</span>
                  <span className="text-xs font-bold text-amber-700">Penyerapan &gt; 50%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Probabilitas</span>
                  <span className="text-xs font-bold text-slate-800">Threshold &ge; 46%</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 text-white space-y-3.5 border border-slate-800 shadow-inner">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                Contoh Deteksi Erosi Margin
              </span>
              <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Produk: Aksesoris Handphone</span>
                  <span className="text-slate-400">Jarak 980 km</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-400">Harga Jual Barang:</span>
                  <span className="text-sm font-bold text-slate-200">R$ 22.00</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Ongkir Ditagihkan:</span>
                  <span className="text-base font-bold text-amber-400">R$ 31.50</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Penyerapan Margin:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    143.2% (TIDAK EKONOMIS)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                💡 <strong>Solusi AI:</strong> Pasang aturan minimum belanja 2 item atau bundling produk sejenis untuk rute ini.
              </p>
            </div>
          </div>
        )}

        {activeTab === "synergy" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E40AF] text-white text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dual-Detector Integrated Protection</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Proteksi Komprehensif: Sinergi Dua Sudut Pandang
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kebocoran logistik sering kali tidak terlihat jika hanya memeriksa salah satu faktor. Sistem Dual-Detector menggabungkan keduanya: mendeteksi markup kurir yang berlebihan sekaligus mencegah pesanan barang murah dikirim ke rute jauh tanpa subsidi yang layak.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1E40AF]" />
                    Hanya Cek Tarif Kurir?
                  </span>
                  <p className="text-xs text-slate-500">
                    Bisa melewatkan pesanan bernilai rendah di mana tarif kurirnya wajar, tetapi tetap memakan 80% margin penjualan.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1E40AF]" />
                    Hanya Cek Persentase Margin?
                  </span>
                  <p className="text-xs text-slate-500">
                    Bisa melewatkan paket bernilai tinggi yang diam-diam diovercharge 3x lipat oleh pihak kurir tanpa disadari.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0F172A] text-white space-y-4 border border-slate-800 shadow-inner">
              <span className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-wider block">
                Klasifikasi Status 4 Kuadran
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                  <strong>Kuadran 1:</strong><br />Aman & Ekonomis (Lolos Kedua Detektor)
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  <strong>Kuadran 2:</strong><br />Margin Tergerus (Perlu Bundling)
                </div>
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300">
                  <strong>Kuadran 3:</strong><br />Tarif Mahal (Perlu Ganti Ekspedisi)
                </div>
                <div className="p-2.5 rounded-lg bg-red-900/60 border border-red-500/50 text-red-200">
                  <strong>Kuadran 4:</strong><br />Kritis Ganda (Bocor Ekstrim)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

