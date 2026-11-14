import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Gauge, 
  Info, 
  ShieldAlert, 
  Sparkles,
  Sliders
} from "lucide-react";
import { Hero3D } from "./hero-3d";
import { QuickSimulator } from "./quick-simulator";
import { InteractiveDetectorTabs } from "./components/interactive-detector-tabs";
import { InteractiveWorkflow } from "./components/interactive-workflow";
import { InteractiveFAQ } from "./components/interactive-faq";
import { RealWorldContext } from "./components/real-world-context";
import { ScrollReveal } from "./components/scroll-reveal";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      
      {/* 3D Model Sticky Background: Membesar saat discroll, berpindah ke sisi kiri layar, perisai membeku dan kubus tetap beranimasi */}
      <Hero3D />

      {/* Konten Halaman yang Melayang Mulus di Atas Background 3D */}
      <div className="relative z-10 flex flex-col gap-24 sm:gap-32 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* 1. Hero Section (Konten Kiri + Area Pandang 3D Kanan) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-2 sm:pt-6 min-h-[75vh]">
          
          {/* Kolom Kiri: Headline, Subtitle, CTA & Telemetri Ringkas (Col 7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Eyebrow Pill Badge (Neutral Semi-transparent) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-xs mb-6 select-none">
              <Sparkles className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span>Audit Finansial Logistik E-Commerce</span>
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
              Sistem audit otomatis untuk memprediksi tarif wajar ekspedisi dan mendeteksi transaksi tidak ekonomis yang diam-diam mengikis laba usaha penjual online.
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white/80 hover:bg-white active:bg-slate-100 border border-slate-300/80 rounded-xl shadow-xs backdrop-blur-md transition-colors"
              >
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <span>Buka Dashboard Demo</span>
              </Link>
            </div>

            {/* Micro Telemetry Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 w-full flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1E40AF]" />
                <span>Akurasi Tarif: <strong className="text-slate-900 font-bold">R² 73.49%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1E40AF]" />
                <span>F1-Score Margin: <strong className="text-slate-900 font-bold">85.94%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1E40AF]" />
                <span>Basis: <strong className="text-slate-900 font-bold">78.181 Pesanan Riil</strong></span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Area Pandang Model 3D Transparan (Col 5) */}
          <div className="lg:col-span-5 min-h-[380px] sm:min-h-[440px] pointer-events-none relative flex items-center justify-center">
            {/* Area ini sengaja dibiarkan terbuka agar perisai 3D dari background sticky terlihat utuh dan bersih di awal */}
          </div>

        </section>

        {/* 2. Sesi Konteks Masalah Nyata di Lapangan & Sebelum vs Sesudah (Mudah Dipahami Publik) */}
        <section>
          <RealWorldContext />
        </section>

        {/* 3. Simulator Cepat Kebocoran Ongkir (Dengan Pengantar yang Membimbing) */}
        <ScrollReveal>
          <section className="flex flex-col gap-6">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulasi Interaktif Langsung</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Uji Coba: Kapan Ongkos Kirim Mulai Menjadi Berbahaya?
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Geser nilai jarak, berat, harga barang, dan tarif kurir di bawah ini untuk melihat langsung bagaimana AI menandai apakah transaksi tersebut aman atau bocor.
              </p>
            </div>

            <QuickSimulator />
          </section>
        </ScrollReveal>

        {/* 4. Arsitektur Dual-Detector (Penjelasan Dua Peran yang Jelas) */}
        <ScrollReveal>
          <section className="flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Perlindungan Berlapis</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Dua Detektor Terpadu: Menutup Dua Celah Sekaligus
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Memadukan audit kewajaran tagihan ekspedisi dan proteksi laba harga jual produk secara bersamaan.
              </p>
            </div>

            <InteractiveDetectorTabs />
          </section>
        </ScrollReveal>

        {/* 5. Alur Kerja 3 Langkah (Interactive Stepper) */}
        <ScrollReveal>
          <section className="flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Alur Kerja Praktis</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mulai Audit Finansial dalam 3 Langkah Sederhana
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Dari file spreadsheet pengiriman hingga laporan kebocoran margin yang siap ditindaklanjuti.
              </p>
            </div>

            <InteractiveWorkflow />
          </section>
        </ScrollReveal>

        {/* 6. Batasan Cakupan Sistem (Transparan, Jujur & Anti-Blackbox) */}
        <ScrollReveal>
          <section className="p-7 sm:p-9 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex flex-col gap-2.5 w-full">
                <h3 className="text-lg font-bold text-slate-900">
                  Batasan & Parameter Transparansi Model AI
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                  Sistem ini dirancang dengan parameter yang jelas berdasarkan data faktual pengiriman tanpa klaim berlebihan:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-white/80 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1E40AF]" />
                      CAKUPAN DETEKSI SISTEM:
                    </span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-2 space-y-1.5">
                      <li>Tarif ongkir aktual yang melebihi ambang batas wajar benchmark rute.</li>
                      <li>Transaksi tidak ekonomis di mana beban ongkir &gt; 50% harga barang.</li>
                      <li>Kepadatan paket (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">density_g_cm3</code>) dan dimensi volumetrik.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white/80 rounded-xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-slate-500" />
                      DI LUAR CAKUPAN SISTEM:
                    </span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-2 space-y-1.5">
                      <li>Harga Pokok Penjualan (HPP / COGS / Modal internal produk).</li>
                      <li>Voucher promosi diskon sepihak toko atau potongan koin platform.</li>
                      <li>Biaya asuransi kargo eksternal di luar tarif pengiriman.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 7. Tanya Jawab Teknis & FAQ Interaktif */}
        <ScrollReveal>
          <section className="flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Tanya Jawab</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Jawaban seputar keamanan data, cara kerja model, dan implementasi bisnis ProfitLeak AI.
              </p>
            </div>

            <InteractiveFAQ />
          </section>
        </ScrollReveal>

        {/* 8. Footer Call to Action Banner (Corporate Navy & Titanium) */}
        <ScrollReveal>
          <section className="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#0F172A] text-white border border-[#1E40AF]/40 shadow-xl shadow-blue-950/10 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#38BDF8]/15 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10">
              Siap Mengaudit Data Transaksi Logistik Anda?
            </h2>
            <p className="text-sm sm:text-base text-slate-200 mt-3 max-w-xl relative z-10 leading-relaxed">
              Unggah file CSV pengiriman Anda atau gunakan dataset sampel 12 baris Olist untuk melihat mitigasi kebocoran profit secara langsung dalam beberapa detik.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 relative z-10">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-[#1E40AF] bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl shadow-md transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1E40AF]" />
                <span>Mulai Unggah CSV</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/25 rounded-xl shadow-xs transition-colors backdrop-blur-xs"
              >
                <Gauge className="w-4 h-4 text-sky-200" />
                <span>Buka Dashboard Demo</span>
              </Link>
            </div>
          </section>
        </ScrollReveal>

      </div>
    </div>
  );
}
