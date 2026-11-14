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
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  BarChart3
} from "lucide-react";
import { Hero3D } from "./hero-3d";
import { QuickSimulator } from "./quick-simulator";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 sm:gap-28 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* 1. Hero Section 3D Interaktif (Dual-Column: Content + 3D Mesh) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-2 sm:pt-6">
        
        {/* Kolom Kiri: Headline, Subtitle, CTA & Telemetri Ringkas (Col 7) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          
          {/* Eyebrow Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE]/90 border border-[#BAE6FD] text-[#1E40AF] text-xs font-semibold shadow-xs mb-6 select-none">
            <Sparkles className="w-3.5 h-3.5 text-[#1E40AF]" />
            <span>Dual-Detector Logistics Margin Intelligence</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Hentikan Kebocoran Margin Logistik E-Commerce dengan{" "}
            <span className="bg-gradient-to-r from-[#1E40AF] via-[#1E3A8A] to-[#38BDF8] bg-clip-text text-transparent">
              Dual-Detector AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            Sistem audit machine learning untuk memprediksi tarif wajar pengiriman kurir dan mendeteksi transaksi tidak ekonomis yang menggerus laba usaha dari 78.181 pesanan nyata.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <Link
              href="/upload"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#172554] rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-sky-200" />
              <span>Unggah Dataset Transaksi (CSV)</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors"
            >
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
              <span>Buka Dashboard Demo</span>
            </Link>
          </div>

          {/* Micro Telemetry Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200/90 w-full flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Akurasi Tarif: <strong className="text-slate-900 font-bold">R² 73.49%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1E40AF]" />
              <span>F1-Score Margin: <strong className="text-slate-900 font-bold">85.94%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Basis: <strong className="text-slate-900 font-bold">78.181 Pesanan Olist</strong></span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Interactive 3D Logistics Defense Shield & Cube (Col 5) */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center">
          {/* Subtle Ambient Glow Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1E40AF]/10 via-[#38BDF8]/15 to-transparent rounded-3xl blur-2xl pointer-events-none" />
          
          <div className="relative w-full rounded-3xl bg-slate-900/5 p-2 sm:p-4 border border-slate-200/80 shadow-xs backdrop-blur-xs">
            <Hero3D />
          </div>
        </div>

      </section>

      {/* 2. Interactive Live Quick Simulator (Eksperimen Langsung Parameter) */}
      <section className="flex flex-col gap-4">
        <QuickSimulator />
      </section>

      {/* 3. Verified Model Metrics Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Basis Data Teruji</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 block">78.181</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Transaksi Riil E-Commerce</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Akurasi Tarif Kurir</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] mt-1.5 block">R² 73.49%</span>
          <span className="text-xs text-slate-500 mt-0.5 block">HistGradientBoosting Regresi</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Deteksi Risiko Margin</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] mt-1.5 block">F1 85.94%</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Precision 88.9% • Recall 83.1%</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mata Uang Acuan</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 block">BRL (R$)</span>
          <span className="text-xs text-slate-500 mt-0.5 block">Real Brasil (Olist Dataset)</span>
        </div>
      </section>

      {/* 4. Bento Grid: Arsitektur Dual-Detector */}
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
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#1E40AF]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#E0F2FE]/70 text-[#1E40AF] flex items-center justify-center border border-[#BAE6FD]">
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
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-rose-400/40 transition-all flex flex-col justify-between">
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

      {/* 5. Cara Pakai dalam 3 Langkah */}
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

      {/* 6. Batasan Cakupan Sistem (Transparan & Anti-Blackbox) */}
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

      {/* 7. Footer Call to Action Banner */}
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
