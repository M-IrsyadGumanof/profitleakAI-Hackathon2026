import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ProfitLeak AI — Deteksi Transaksi Tidak Ekonomis & Kebocoran Ongkir (v6)",
  description:
    "Sistem kecerdasan buatan Dual-Detector (Rate & Margin) untuk mendeteksi transaksi tidak ekonomis dan kebocoran margin logistik e-commerce.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {/* Navigation Bar Global */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo & Version */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-blue-700 transition-colors">
                  PL
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-2">
                    ProfitLeak AI
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 px-1.5 py-0.5 rounded">
                      v6 Dual-Engine
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">Logistics Margin Intelligence</span>
                </div>
              </Link>
            </div>

            {/* Nav Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Beranda
              </Link>
              <Link
                href="/upload"
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Unggah Data
              </Link>
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
              >
                Dashboard Analisis
              </Link>
            </nav>

            {/* Right Status Indicator */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-600">Model v6 Siap</span>
              </div>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Tim KOMEM
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full">{children}</main>

        {/* Global Footer */}
        <footer className="w-full border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span className="text-sm font-bold text-slate-800">ProfitLeak AI</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                Karya Inovasi Tim KOMEM — Hackathon 2026
              </span>
            </div>

            <div className="text-xs text-slate-500 text-center md:text-right max-w-xl">
              <p>
                Deteksi transaksi tidak ekonomis berbasis relasi tarif wajar logistik & harga jual (Dataset Olist E-Commerce).
                <span className="block text-slate-400 mt-0.5">
                  Mata uang: Real Brasil (BRL / R$). Model tidak mencakup HPP/COGS maupun diskon.
                </span>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
