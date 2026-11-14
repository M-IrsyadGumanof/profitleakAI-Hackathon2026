"use client";

import { 
  AlertTriangle, 
  TrendingDown, 
  XCircle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  PackageCheck
} from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function RealWorldContext() {
  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      
      {/* 1. Pengantar Masalah Nyata di Lapangan */}
      <ScrollReveal>
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-xs">
            <Lightbulb className="w-3.5 h-3.5 text-[#1E40AF]" />
            <span>Memahami Masalah Finansial Logistik</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Omzet Terlihat Besar, Mengapa Laba Nyata Malah Terkikis?
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Dalam operasional e-commerce skala ribuan transaksi, biaya pengiriman sering menjadi titik buta terbesar. Ada dua jenis kebocoran tersembunyi yang kerap tidak disadari hingga laporan keuangan akhir bulan:
          </p>
        </div>
      </ScrollReveal>

      {/* 2. Dua Skenario Masalah Nyata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Skenario 1: Overcharging Kurir */}
        <ScrollReveal delay={100}>
          <div className="h-full p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 flex flex-col justify-between space-y-4 hover:border-[#1E40AF]/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Celah Finansial 1</span>
                  <h3 className="text-lg font-bold text-slate-900">Tagihan Kurir Melebihi Batas Wajar</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Pihak ekspedisi menagih ongkos kirim yang jauh lebih mahal dari standar wajar rute dan dimensi paket. Karena jumlah pesanan mencapai ratusan per hari, staf keuangan kesulitan memeriksa satu per satu.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Contoh Kasus Nyata:</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Paket seberat 0.8 kg dengan rute 150 km seharusnya berbiaya wajar <strong className="text-slate-900">R$ 14.20</strong>, tetapi ditagih kurir sebesar <strong className="text-rose-600">R$ 48.50</strong> (overcharge lebih dari 3.4x lipat).
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Ditangani oleh:</span>
              <span className="font-bold text-[#1E40AF]">Detektor 1 (Rate Ratio Evaluator)</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Skenario 2: Margin Cannibalization */}
        <ScrollReveal delay={200}>
          <div className="h-full p-6 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 flex flex-col justify-between space-y-4 hover:border-[#1E40AF]/40 transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-amber-500 shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Celah Finansial 2</span>
                  <h3 className="text-lg font-bold text-slate-900">Ongkos Kirim Menggerus Harga Jual</h3>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Menjual barang murah ke alamat pembeli yang sangat jauh tanpa aturan batas minimum belanja atau bundling. Ongkir yang harus disubsidi menyerap lebih dari 50% bahkan 100% dari harga barang.
              </p>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Contoh Kasus Nyata:</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Aksesoris murah seharga <strong className="text-slate-900">R$ 22.00</strong> dikirim sejauh 980 km dengan tarif ongkir <strong className="text-amber-600">R$ 31.50</strong> (ongkir menyerap 143% dari nilai produk!).
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Ditangani oleh:</span>
              <span className="font-bold text-[#1E40AF]">Detektor 2 (Margin Loss Classifier)</span>
            </div>
          </div>
        </ScrollReveal>

      </div>

      {/* 3. Komparasi Visual: Sebelum vs Sesudah Menggunakan ProfitLeak AI */}
      <ScrollReveal>
        <div className="p-6 sm:p-9 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <span className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">Transformasi Operasional</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sebelum vs Sesudah Menggunakan ProfitLeak AI
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Bagaimana otomasi audit cerdas mengubah efisiensi pengelolaan logistik e-commerce Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            
            {/* Kolom Kiri: Cara Lama (Manual & Pasrah) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">Cara Lama: Manual & Rentan Bocor</h4>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>Staf memeriksa ribuan baris spreadsheet pengiriman satu per satu memakan waktu berhari-hari.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>Tidak punya benchmark tarif wajar objektif untuk mengetahui apakah ekspedisi sedang overcharging.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>Kerugian akibat gratis ongkir atau rute jauh baru ketahuan saat tutup buku bulanan.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>Tidak ada data pendukung yang kuat untuk bernegosiasi ulang kontrak tarif dengan kurir.</span>
                </li>
              </ul>
            </div>

            {/* Kolom Kanan: Cara Baru bersama ProfitLeak AI */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#1E40AF]/30 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-[#1E40AF] shrink-0" />
                <h4 className="font-bold text-sm sm:text-base text-slate-900">Bersama ProfitLeak: Otomatis & Terproteksi</h4>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] mt-2 shrink-0" />
                  <span>Audit instan hingga 50.000 transaksi selesai dalam hitungan detik langsung di browser tanpa instalasi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] mt-2 shrink-0" />
                  <span>Estimasi tarif wajar akurat berbasis machine learning teruji pada 78.181 pengiriman riil.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] mt-2 shrink-0" />
                  <span>Deteksi langsung transaksi berisiko yang menyerap &gt;50% harga produk sebelum rugi berlarut-larut.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] mt-2 shrink-0" />
                  <span>Rekomendasi taktis siap aksi: daftar pesanan untuk bundling, rute untuk dinegosiasi, dan ekspor CSV rapi.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </ScrollReveal>

    </div>
  );
}
