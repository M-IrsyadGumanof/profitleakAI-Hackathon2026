import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Gauge, 
  Info, 
  Layers, 
  ShieldAlert, 
  Sparkles,
  TrendingDown, 
  Truck,
  Sliders,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 sm:gap-28 py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. Hero Section (Antigravity Google Style) */}
      <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-4">
        {/* Eyebrow Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE]/80 border border-[#BAE6FD] text-[#1E40AF] text-xs font-semibold shadow-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span>Dual-Detector Logistics Margin Intelligence</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
          Hentikan Kebocoran Margin Logistik E-Commerce dengan{" "}
          <span className="bg-gradient-to-r from-[#1E40AF] via-[#1E3A8A] to-[#38BDF8] bg-clip-text text-transparent">
            Dual-Detector AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Sistem audit machine learning untuk memprediksi tarif wajar pengiriman kurir dan mendeteksi transaksi tidak ekonomis yang menggerus laba usaha dari 78.181 pesanan nyata.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto justify-center">
          <Link
            href="/upload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#172554] rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <FileSpreadsheet className="w-5 h-5 text-sky-200" />
            <span>Unggah Dataset Transaksi (CSV)</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            <Gauge className="w-5 h-5 text-slate-500" />
            <span>Buka Dashboard Demo</span>
          </Link>
        </div>

        {/* Live Interactive Simulation Preview Card (Bento Showcase) */}
        <div className="mt-14 w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-left text-white shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1E40AF]/15 rounded-full blur-3xl pointer-events-none" />
          
          {/* Card Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
                Simulasi Audit Transaksi Riil
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">Dataset Olist E-Commerce</span>
              <span className="bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700">Mata Uang: BRL (R$)</span>
            </div>
          </div>

          {/* Card Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">1. Tarif Kurir (Rate)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400">R$ 52.40</span>
                <span className="text-xs text-slate-400 line-through">R$ 18.50 wajar</span>
              </div>
              <span className="mt-1 inline-block text-[11px] font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                2.83x di atas estimasi wajar
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">2. Penyerapan Margin</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">149.7%</span>
                <span className="text-xs text-slate-400">dari harga barang</span>
              </div>
              <span className="mt-1 inline-block text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Ongkir &gt; Harga Jual (R$ 35.00)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-blue-300 uppercase tracking-wider block">3. Rekomendasi Solusi</span>
                <p className="mt-1.5 text-xs text-slate-200 leading-relaxed font-sans">
                  Terapkan sistem bundling atau minimum order kuantiti untuk membagi beban ongkir.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Uji di Simulator Interaktif</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Verified Model Metrics Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-8 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Basis Data</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">78.181</span>
            <span className="text-xs text-slate-500">Transaksi Riil Olist</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Akurasi Tarif</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] mt-1 block">R² 73.49%</span>
            <span className="text-xs text-slate-500">HistGradientBoosting</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Deteksi Margin</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] mt-1 block">F1 85.94%</span>
            <span className="text-xs text-slate-500">Precision 88.9% • Recall 83.1%</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mata Uang Acuan</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">BRL (R$)</span>
            <span className="text-xs text-slate-500">Real Brasil</span>
          </div>
        </div>
      </section>

      {/* 2. Bento Grid: Arsitektur Dual-Detector */}
      <section className="flex flex-col gap-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Arsitektur Cerdas</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Dua Detektor Terpadu: Menutup Dua Celah Finansial
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Menggabungkan audit kewajaran tarif ekspedisi dan proteksi margin harga jual produk secara simultan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Rate Detector */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#E0F2FE]/60 text-[#1E40AF] flex items-center justify-center border border-[#BAE6FD]">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E0F2FE] text-[#1E40AF] border border-[#BAE6FD]">
                  Regresi Logistik
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mt-5">Detektor 1: Tarif Wajar (Rate)</h3>
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Memprediksi ongkir wajar yang seharusnya dibebankan kurir untuk paket dengan berat, jarak tempuh, volume kubik, dan kepadatan rute tertentu.
              </p>

              <div className="mt-6 space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Algoritma:</span>
                  <span className="font-semibold text-slate-900">HistGradientBoostingRegressor</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ambang Batas (Threshold):</span>
                  <span className="font-bold text-rose-600">Rasio Tarif &gt; 3.0978x</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Kode Deteksi:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-semibold">
                    rate_exceeds_fair
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Tindakan Koreksi:</span>
                  <span className="text-slate-800 text-right font-medium">Negosiasi rute kurir atau ganti ekspedisi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Margin Detector */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Klasifikasi Margin
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mt-5">Detektor 2: Risiko Margin (Margin)</h3>
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                Mendeteksi pesanan tidak ekonomis di mana biaya logistik menyerap porsi berlebih (&gt;50%) dari total harga jual barang e-commerce.
              </p>

              <div className="mt-6 space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Algoritma:</span>
                  <span className="font-semibold text-slate-900">HistGradientBoostingClassifier</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ambang Batas Risiko:</span>
                  <span className="font-bold text-rose-600">Probabilitas Risiko &ge; 46%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Kode Deteksi:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-semibold">
                    freight_eats_margin
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Tindakan Koreksi:</span>
                  <span className="text-slate-800 text-right font-medium">Bundling barang atau minimum belanja</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cara Pakai dalam 3 Langkah */}
      <section className="flex flex-col gap-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Alur Kerja Cepat</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Mulai Audit Finansial dalam 3 Langkah
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Dari file spreadsheet transaksi hingga laporan kebocoran margin siap aksi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1E40AF] text-white font-bold flex items-center justify-center text-base shadow-xs mb-5">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Siapkan File Transaksi</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Format file CSV dengan kolom standar: berat (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">weight_kg</code>), jarak kirim (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">distance_km</code>), dimensi volume (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">volume_cm3</code>), dan harga produk (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">price</code>).
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
              Format: Standard UTF-8 CSV (Maksimal 50.000 baris)
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1E40AF] text-white font-bold flex items-center justify-center text-base shadow-xs mb-5">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Analisis Dual-Engine AI</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Sistem machine learning memproses setiap baris transaksi: memprediksi tarif wajar kurir berdasarkan profil pengiriman, serta menguji apakah ongkir menyerap porsi kritis dari harga barang.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
              Model: Regresi Tarif & Klasifikasi Risiko Margin
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#1E40AF] text-white font-bold flex items-center justify-center text-base shadow-xs mb-5">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Audit & Rekomendasi Solusi</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Dapatkan dashboard interaktif instan: ringkasan total kebocoran dalam BRL, visualisasi rasio tarif, filter keparahan audit, dan rekomendasi perbaikan spesifik per transaksi.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
              Output: Tabel audit, visualisasi chart, dan aksi remedy
            </div>
          </div>
        </div>
      </section>

      {/* 4. Batasan Cakupan Sistem (Transparan & Anti-Blackbox) */}
      <section className="p-7 sm:p-9 rounded-2xl bg-slate-100/80 border border-slate-200/90">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <h3 className="text-lg font-bold text-slate-900">
              Batasan & Batas Transparansi Model AI
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              Sistem ini dirancang dengan parameter yang jelas berdasarkan data faktual transaksi tanpa klaim berlebihan:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1E40AF]" />
                  CAKUPAN DETEKSI TERUJI:
                </span>
                <ul className="text-xs text-slate-600 list-disc list-inside mt-2 space-y-1.5">
                  <li>Tarif ongkir aktual yang melebihi ambang batas wajar benchmark rute.</li>
                  <li>Transaksi tidak ekonomis di mana beban ongkir &gt; 50% harga barang.</li>
                  <li>Kepadatan paket (<code className="bg-slate-100 px-1 py-0.2 rounded">density_g_cm3</code>) dan dimensi volumetrik.</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                  DI LUAR CAKUPAN SISTEM:
                </span>
                <ul className="text-xs text-slate-600 list-disc list-inside mt-2 space-y-1.5">
                  <li>Harga Pokok Penjualan (HPP / COGS / Modal).</li>
                  <li>Voucher promosi internal penjual atau diskon musiman.</li>
                  <li>Biaya asuransi kargo eksternal di luar tarif pengiriman.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer Call to Action Banner */}
      <section className="text-center py-10 border-t border-slate-200 flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Siap Menguji Data Transaksi Anda?</h2>
        <p className="text-base text-slate-600 mt-2.5 max-w-xl">
          Unggah file CSV transaksi Anda atau gunakan dataset sampel 12 baris untuk melihat cara kerja sistem secara langsung.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#172554] rounded-xl shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Mulai Unggah CSV</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            <Gauge className="w-4 h-4 text-slate-500" />
            <span>Buka Dashboard Demo</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
