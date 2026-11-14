"use client";

import { useState } from "react";
import { Truck, TrendingDown, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";

export function InteractiveDetectorTabs() {
  const [activeTab, setActiveTab] = useState<"rate" | "margin" | "synergy">("rate");

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tab Switcher Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/80 max-w-lg mx-auto shadow-xs">
        <button
          onClick={() => setActiveTab("rate")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "rate"
              ? "bg-[#1E40AF] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Detektor 1: Tarif Kurir</span>
        </button>

        <button
          onClick={() => setActiveTab("margin")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "margin"
              ? "bg-[#1E40AF] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Detektor 2: Laba & Margin</span>
        </button>

        <button
          onClick={() => setActiveTab("synergy")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "synergy"
              ? "bg-[#1E40AF] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sinergi Perlindungan</span>
        </button>
      </div>

      {/* Tab Content Cards (Semi-Transparent Acrylic Glass, Layout Netral) */}
      <div className="w-full">
        {activeTab === "rate" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 text-xs font-semibold">
                <Truck className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>Auditor Tarif Ekspedisi • Akurasi R² 73.49%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Mendeteksi Tagihan Kurir yang Jauh di Atas Tarif Wajar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                AI mempelajari pola tarif dari 78.181 pengiriman untuk menghitung estimasi biaya wajar berdasarkan jarak tempuh, berat paket, dan volume kubik. Jika kurir menagih ongkir lebih dari 3x lipat tarif wajar (<strong className="text-slate-900 font-bold">ambang 3.0978x</strong>), sistem langsung menandainya sebagai anomali tagihan yang perlu dinegosiasikan ulang.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Faktor 1</span>
                  <span className="text-xs font-bold text-slate-800">Jarak Tempuh (km)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Faktor 2</span>
                  <span className="text-xs font-bold text-slate-800">Berat Paket (kg)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Faktor 3</span>
                  <span className="text-xs font-bold text-slate-800">Volume Kotak (cm³)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Faktor 4</span>
                  <span className="text-xs font-bold text-slate-800">Kepadatan (g/cm³)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] block">
                Simulasi Kasus Riil
              </span>
              <div className="p-3.5 bg-white/90 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Jarak 150 km • Berat 0.8 kg</span>
                  <span className="text-slate-400">Dimensi 3.200 cm³</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-500">Prediksi Tarif Wajar:</span>
                  <span className="text-sm font-bold text-slate-800">R$ 14.20</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Tarif Ditagihkan:</span>
                  <span className="text-base font-bold text-slate-900">R$ 48.50</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-600">Rasio Tarif:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>3.42x (Bocor Tarif)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Rekomendasi: Re-negosiasi kontrak kurir rute terkait atau alihkan ke ekspedisi regional alternatif.
              </p>
            </div>
          </div>
        )}

        {activeTab === "margin" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 text-xs font-semibold">
                <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                <span>Pelindung Margin Penjual • F1-Score 85.94%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Mencegah Ongkos Kirim Menyerap Laba Penjualan Produk
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mendeteksi transaksi di mana ongkos kirim menyerap porsi berlebih (<strong className="text-slate-900 font-bold">&gt;50%</strong>) dari harga jual barang. Fitur ini melindungi penjual dari ilusi omzet besar yang sebenarnya menghasilkan laba minus akibat beban subsidi pengiriman rute jauh.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Metrik 1</span>
                  <span className="text-xs font-bold text-slate-800">Harga Barang (R$)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Metrik 2</span>
                  <span className="text-xs font-bold text-slate-800">Total Ongkir (R$)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Ambang Batas</span>
                  <span className="text-xs font-bold text-slate-800">Beban &gt; 50%</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Probabilitas</span>
                  <span className="text-xs font-bold text-slate-800">Threshold &ge; 46%</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] block">
                Simulasi Kasus Riil
              </span>
              <div className="p-3.5 bg-white/90 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Produk: Aksesoris HP</span>
                  <span className="text-slate-400">Jarak 980 km</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-500">Harga Jual:</span>
                  <span className="text-sm font-bold text-slate-800">R$ 22.00</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Ongkir Ditagihkan:</span>
                  <span className="text-base font-bold text-slate-900">R$ 31.50</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-600">Penyerapan:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>143.2% (Tidak Ekonomis)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Rekomendasi: Terapkan paket bundling atau aturan minimum belanja untuk membagi beban ongkir.
              </p>
            </div>
          </div>
        )}

        {activeTab === "synergy" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>Dual-Detector Integrated Protection</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Proteksi Komprehensif: Sinergi Dua Sudut Pandang
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kebocoran logistik sering kali tidak terlihat jika hanya memeriksa salah satu faktor. Sistem Dual-Detector menggabungkan keduanya: mendeteksi markup kurir yang berlebihan sekaligus mencegah pesanan barang murah dikirim ke rute jauh tanpa subsidi yang layak.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E40AF]" />
                    Hanya Cek Tarif Kurir?
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bisa melewatkan pesanan bernilai rendah di mana tarif kurirnya wajar, tetapi tetap memakan 80% margin penjualan.
                  </p>
                </div>

                <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E40AF]" />
                    Hanya Cek Persentase Margin?
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bisa melewatkan paket bernilai tinggi yang diam-diam diovercharge 3x lipat oleh pihak kurir tanpa disadari.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] block">
                Matriks 4 Status Transaksi
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-start gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#1E40AF] mt-1 shrink-0" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Kuadran 1:</strong>
                    <span className="text-slate-500 text-[11px]">Aman & Ekonomis</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-start gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Kuadran 2:</strong>
                    <span className="text-slate-500 text-[11px]">Margin Tergerus</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-start gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Kuadran 3:</strong>
                    <span className="text-slate-500 text-[11px]">Tarif Mahal</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-slate-700 flex items-start gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                  <div>
                    <strong className="text-slate-900 font-bold block text-xs">Kuadran 4:</strong>
                    <span className="text-slate-500 text-[11px]">Kritis Ganda</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
