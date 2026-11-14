import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Gauge, 
  Info, 
  ShieldAlert, 
  Sparkles,
} from "lucide-react";
import { Hero3D } from "./hero-3d";
import { QuickSimulator } from "./quick-simulator";
import { InteractiveDetectorTabs } from "./components/interactive-detector-tabs";
import { InteractiveWorkflow } from "./components/interactive-workflow";
import { InteractiveFAQ } from "./components/interactive-faq";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      
      {/* 3D Model Sticky Background: Bersih tanpa teks, tidak terscroll saat halaman discroll */}
      <Hero3D />

      {/* Konten Halaman yang Melayang Mulus di Atas Background 3D */}
      <div className="relative z-10 flex flex-col gap-20 sm:gap-28 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* 1. Hero Section (Konten Kiri + Area Pandang 3D Kanan) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-2 sm:pt-6">
          
          {/* Kolom Kiri: Headline, Subtitle, CTA & Telemetri Ringkas (Col 7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Eyebrow Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE]/90 border border-[#BAE6FD] text-[#1E40AF] text-xs font-semibold shadow-xs mb-6 select-none backdrop-blur-xs">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white/90 hover:bg-white active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs backdrop-blur-xs transition-colors"
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

          {/* Kolom Kanan: Area Pandang Model 3D Transparan (Col 5) */}
          <div className="lg:col-span-5 min-h-[380px] sm:min-h-[440px] pointer-events-none relative flex items-center justify-center">
            {/* Area ini sengaja dibiarkan terbuka agar perisai 3D dari background sticky terlihat utuh dan bersih */}
          </div>

        </section>

        {/* 2. Interactive Live Quick Simulator (Eksperimen Langsung Parameter) */}
        <section className="flex flex-col gap-4">
          <QuickSimulator />
        </section>

        {/* 3. Verified Model Metrics Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Basis Data Teruji</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 block">78.181</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Transaksi Riil E-Commerce</span>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Akurasi Tarif Kurir</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] mt-1.5 block">R² 73.49%</span>
            <span className="text-xs text-slate-500 mt-0.5 block">HistGradientBoosting Regresi</span>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Deteksi Risiko Margin</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1E40AF] mt-1.5 block">F1 85.94%</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Precision 88.9% • Recall 83.1%</span>
          </div>
          <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-left hover:border-[#1E40AF]/40 transition-colors">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mata Uang Acuan</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 block">BRL (R$)</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Real Brasil (Olist Dataset)</span>
          </div>
        </section>

        {/* 4. Arsitektur Dual-Detector (Tab Interaktif & Komparasi) */}
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

          <InteractiveDetectorTabs />
        </section>

        {/* 5. Alur Kerja 3 Langkah (Interactive Stepper) */}
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

          <InteractiveWorkflow />
        </section>

        {/* 6. Batasan Cakupan Sistem (Transparan & Anti-Blackbox) */}
        <section className="p-7 sm:p-9 rounded-3xl bg-slate-100/90 backdrop-blur-xs border border-slate-200/90">
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
                    <li>Kepadatan paket (<code className="bg-slate-100 px-1 py-0.2 rounded font-mono">density_g_cm3</code>) dan dimensi volumetrik.</li>
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

        {/* 7. Tanya Jawab Teknis & FAQ Interaktif */}
        <section className="flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Tanya Jawab</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-base text-slate-600 mt-2">
              Penjelasan teknis dan bisnis seputar operasional Dual-Detector ProfitLeak AI.
            </p>
          </div>

          <InteractiveFAQ />
        </section>

        {/* 8. Footer Call to Action Banner */}
        <section className="text-center py-12 px-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1E40AF]/20 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10">
            Siap Mengaudit Data Transaksi Logistik Anda?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl relative z-10 leading-relaxed">
            Unggah file CSV transaksi Anda atau gunakan dataset sampel 12 baris Olist untuk melihat mitigasi kebocoran profit secara langsung.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 relative z-10">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#172554] rounded-xl shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Mulai Unggah CSV</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl shadow-xs transition-colors"
            >
              <Gauge className="w-4 h-4 text-slate-400" />
              <span>Buka Dashboard Demo</span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
