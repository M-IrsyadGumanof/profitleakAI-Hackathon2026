import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "./nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ProfitLeak AI — Deteksi Transaksi Tidak Ekonomis & Kebocoran Ongkir",
  description:
    "Sistem kecerdasan buatan Dual-Detector untuk mendeteksi transaksi tidak ekonomis dan kebocoran margin logistik e-commerce.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {/* Dynamic Global Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full pt-20 sm:pt-24">{children}</main>

        {/* Global Clean Footer */}
        <footer className="w-full border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span className="text-sm font-bold text-slate-800">ProfitLeak AI</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-xs text-slate-500">Tim KOMEM</span>
            </div>

            <div className="text-xs text-slate-500 text-center md:text-right max-w-xl">
              <p>
                Audit transaksi tidak ekonomis berbasis relasi tarif wajar logistik & harga jual (Dataset Olist E-Commerce).
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
