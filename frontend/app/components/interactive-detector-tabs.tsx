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
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "rate"
              ? "bg-[#1E40AF] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Detektor 1: Tarif</span>
        </button>

        <button
          onClick={() => setActiveTab("margin")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "margin"
              ? "bg-[#1E40AF] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Detektor 2: Margin</span>
        </button>

        <button
          onClick={() => setActiveTab("synergy")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
            activeTab === "synergy"
              ? "bg-[#1E40AF] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sinergi Sistem</span>
        </button>
      </div>

      {/* Tab Content Cards (Semi-Transparent Acrylic Glass, Layout Netral) */}
      <div className="w-full">
        {activeTab === "rate" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>HistGradientBoostingRegressor • R² 73.49%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Deteksi Pembebanan Tarif Kurir di Atas Ambang Wajar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Memprediksi ongkir wajar berdasarkan profil fisik logistik dan jarak tempuh. Jika tarif kurir riil melebihi <strong className="text-slate-900 font-bold">3.0978x</strong> dari estimasi wajar model, sistem menandai anomali biaya ekspedisi yang memerlukan re-negosiasi kontrak kurir.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Fitur 1</span>
                  <span className="text-xs font-bold text-slate-800">Jarak Tempuh (km)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Fitur 2</span>
                  <span className="text-xs font-bold text-slate-800">Berat Paket (kg)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Fitur 3</span>
                  <span className="text-xs font-bold text-slate-800">Volume Kubik (cm³)</span>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Fitur 4</span>
                  <span className="text-xs font-bold text-slate-800">Densitas (g/cm³)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 text-white space-y-3 border border-slate-800 shadow-inner backdrop-blur-xs">
              <span className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-wider block">
                Simulasi Kasus Riil
              </span>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Jarak 150 km • Berat 0.8 kg</span>
                  <span className="text-slate-400">Dimensi 3.200 cm³</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-400">Prediksi Tarif Wajar:</span>
                  <span className="text-sm font-bold text-slate-100">R$ 14.20</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Tarif Ditagihkan:</span>
                  <span className="text-base font-bold text-slate-100">R$ 48.50</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Rasio Tarif:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 font-bold border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>3.42x (Bocor Tarif)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Rekomendasi: Re-negosiasi kontrak kurir rute terkait atau alihkan ke ekspedisi regional alternatif.
              </p>
            </div>
          </div>
        )}

        {activeTab === "margin" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-800 text-xs font-semibold">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                <span>HistGradientBoostingClassifier • F1 85.94%</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Deteksi Pesanan Tidak Ekonomis yang Menggerus Margin
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mendeteksi transaksi di mana ongkos kirim menyerap porsi berlebih (<strong className="text-slate-900 font-bold">&gt;50%</strong>) dari harga jual produk. Menghindarkan penjual dari ilusi omzet tinggi namun laba operasional riil tergerus beban logistik.
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

            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 text-white space-y-3 border border-slate-800 shadow-inner backdrop-blur-xs">
              <span className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-wider block">
                Simulasi Kasus Riil
              </span>
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Produk: Aksesoris HP</span>
                  <span className="text-slate-400">Jarak 980 km</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-400">Harga Jual:</span>
                  <span className="text-sm font-bold text-slate-100">R$ 22.00</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Ongkir Ditagihkan:</span>
                  <span className="text-base font-bold text-slate-100">R$ 31.50</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Penyerapan:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 font-bold border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>143.2% (Tidak Ekonomis)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
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

            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 text-white space-y-3 border border-slate-800 shadow-inner backdrop-blur-xs">
              <span className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-wider block">
                Matriks 4 Status Transaksi
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                  <div>
                    <strong>Kuadran 1:</strong><br />Aman & Ekonomis
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                  <div>
                    <strong>Kuadran 2:</strong><br />Margin Tergerus
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0" />
                  <div>
                    <strong>Kuadran 3:</strong><br />Tarif Mahal
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/10 border border-white/10 text-slate-200 flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                  <div>
                    <strong>Kuadran 4:</strong><br />Kritis Ganda
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
