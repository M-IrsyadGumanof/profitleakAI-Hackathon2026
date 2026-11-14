import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet, 
  Gauge, 
  Info, 
  Layers, 
  ShieldAlert, 
  TrendingDown, 
  Truck 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-6 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          Karya Inovasi Tim KOMEM • Hackathon 2026
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
          Hentikan Kebocoran Profit Logistik E-Commerce dengan{" "}
          <span className="text-blue-600 underline decoration-blue-200 decoration-wavy underline-offset-8">
            Dual-Detector AI
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl leading-relaxed">
          Sistem audit machine learning v6 yang memprediksi tarif wajar pengiriman dan mengidentifikasi transaksi tidak ekonomis yang menggerus margin usaha dari 78.181 pesanan nyata.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center">
          <Link
            href="/upload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Unggah Dataset Transaksi (CSV)
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <Gauge className="w-5 h-5 text-slate-500" />
            Buka Dashboard Demo
          </Link>
        </div>

        {/* Key Model Highlights */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-8 border-t border-slate-200">
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Dataset Latih</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">78.181</span>
            <span className="text-xs text-slate-500">Transaksi Riil Olist</span>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Akurasi Tarif</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">R² 73.49%</span>
            <span className="text-xs text-slate-500">HistGradientBoosting</span>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Detektor Margin</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">F1 85.94%</span>
            <span className="text-xs text-slate-500">Precision 88.9% • Recall 83.1%</span>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Mata Uang Acuan</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">BRL (R$)</span>
            <span className="text-xs text-slate-500">Real Brasil (Olist Origin)</span>
          </div>
        </div>
      </section>

      {/* 3 Langkah Cara Pakai */}
      <section className="flex flex-col gap-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Alur Kerja Cepat</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Cara Menggunakan ProfitLeak AI dalam 3 Langkah
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Dari file spreadsheet transaksi hingga rekomendasi audit finansial siap eksekusi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg border border-blue-200/60 mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Siapkan File Transaksi</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Siapkan data transaksi dalam format CSV dengan kolom wajib: berat (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">weight_kg</code>), jarak kirim (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">distance_km</code>), dimensi volume (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">volume_cm3</code>), dan harga produk (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">price</code>).
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Format: Standard UTF-8 CSV (Maks 50.000 baris)
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg border border-blue-200/60 mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Analisis Dual-Engine AI</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Mesin backend FastAPI memproses baris transaksi melalui dua model AI: memprediksi tarif wajar kurir dan mengkalkulasi kemungkinan ongkir memakan harga produk.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Model: Dual HistGradientBoosting (v6)
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg border border-blue-200/60 mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Audit & Solusi Nyata</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Dapatkan dashboard interaktif: total transaksi bocor, estimasi kerugian nominal dalam BRL, faktor pemicu (overcharge vs margin), dan rekomendasi tindak lanjut.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Output: Tabel audit, visualisasi chart, dan aksi remedy
            </div>
          </div>
        </div>
      </section>

      {/* Arsitektur Dua Detektor */}
      <section className="flex flex-col gap-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Arsitektur v6</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Dua Detektor Spesialis: Menutup Dua Celah Berbeda
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Mengapa satu model regresi saja tidak cukup? Model v6 mengombinasikan deteksi tarif overcharge dan proteksi margin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detektor 1 */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Detektor 1: Tarif Wajar (Rate)</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Regresi
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Bertugas memprediksi tarif ongkir yang sewajarnya dibebankan oleh kurir untuk paket dengan berat, jarak, volume, dan kepadatan tertentu.
              </p>

              <div className="mt-5 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Algoritma:</span>
                  <span className="font-semibold text-slate-900">HistGradientBoostingRegressor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ambang Batas (Threshold):</span>
                  <span className="font-semibold text-rose-600">Rasio Tarif &gt; 3.0978x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Deteksi:</span>
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                    rate_exceeds_fair
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aksi Remedy:</span>
                  <span className="text-slate-800 text-right">Negosiasi ulang tarif rute atau ganti mitra logistik</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detektor 2 */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  <h3 className="text-lg font-bold text-slate-900">Detektor 2: Risiko Margin (Margin)</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Klasifikasi
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Mendeteksi pesanan tidak ekonomis di mana biaya ongkir menyerap porsi terlalu besar (&gt;50%) dari harga jual barang, meskipun tarif ekspedisinya sendiri tergolong wajar.
              </p>

              <div className="mt-5 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Algoritma:</span>
                  <span className="font-semibold text-slate-900">HistGradientBoostingClassifier</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ambang Batas Probabilitas:</span>
                  <span className="font-semibold text-rose-600">Probabilitas &ge; 0.46 (46%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Deteksi:</span>
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                    freight_eats_margin
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aksi Remedy:</span>
                  <span className="text-slate-800 text-right">Naikkan harga jual, bundling paket, atau batas minimum order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Batasan Ilmiah Jujur (Scientific Honesty Box) */}
      <section className="p-6 sm:p-8 rounded-xl bg-amber-50/60 border border-amber-200/80">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-amber-900">
              Transparansi Ilmiah: Batas Cakupan Model (Scope & Limitations)
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Sebagai bentuk integritas data dalam Hackathon 2026, kami menegaskan batas cakupan deteksi sistem:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  YANG TERCAKUP OLEH MODEL:
                </span>
                <ul className="text-xs text-slate-700 list-disc list-inside mt-1.5 space-y-1">
                  <li>Tarif ongkir aktual yang jauh melebihi tarif wajar kurir.</li>
                  <li>Transaksi tidak ekonomis di mana ongkir memakan porsi besar dari harga jual.</li>
                  <li>Kepadatan paket (<code className="bg-slate-100 px-1 py-0.2 rounded">density_g_cm3</code>) dan dimensi volumetrik.</li>
                </ul>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  TIDAK TERCAKUP (KLAIM JUJUR):
                </span>
                <ul className="text-xs text-slate-700 list-disc list-inside mt-1.5 space-y-1">
                  <li>Harga Pokok Penjualan (HPP / COGS / Biaya Modal).</li>
                  <li>Kupon diskon / voucher promo pembeli.</li>
                  <li>
                    <em>Alasan:</em> Dataset Olist tidak memiliki data kolom modal maupun diskon.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Call to Action */}
      <section className="text-center py-8 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Siap Menguji Data Transaksi Anda?</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          Unggah file CSV transaksi Anda atau gunakan dataset demo yang sudah kami sediakan untuk melihat cara kerja model v6 secara langsung.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Mulai Unggah CSV
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <Gauge className="w-4 h-4 text-slate-500" />
            Buka Dashboard Langsung
          </Link>
        </div>
      </section>
    </div>
  );
}
