import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "./nav";
import { Global3DScene } from "./global-3d-scene";
import { AppShell } from "./app-shell";
import "./globals.css";

// Konfigurasi Tipografi Wajib: MiSans Latin (Xiaomi Inc.)
const miSans = localFont({
  src: [
    {
      path: "../public/fonts/misans/MiSansLatin-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-Demibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/misans/MiSansLatin-Heavy.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
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
    <html lang="id" className={`${miSans.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {/* Persistent Global 3D Model: Bertransisi mulus antar halaman tanpa render ulang */}
        <Global3DScene />

        {/* Dynamic Global Navbar */}
        <Navbar />

        {/* Main Content Area — di-remount per perubahan URL agar state form bersih, dengan margin proporsional */}
        <AppShell>{children}</AppShell>

        {/* Global Clean Footer */}
        <footer className="w-full border-t border-slate-200 bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span className="text-sm font-bold text-slate-800">ProfitLeak AI</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-xs text-slate-500">Tim KOMEM (HACKATHON)</span>
            </div>

            <div className="text-xs text-slate-500 text-center md:text-right max-w-xl">
              <p>
                Audit transaksi tidak ekonomis berbasis relasi tarif wajar logistik & harga jual (Dataset Olist E-Commerce).
                <span className="block text-slate-400 mt-0.5">
                  Mata uang: Real Brasil (BRL / R$). Model tidak mencakup HPP/COGS maupun diskon promo.
                </span>
              </p>
              {/* Kredit Wajib Font MiSans Latin sesuai kebijakan lisensi Xiaomi */}
              <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
                Tipografi Resmi: <span className="font-semibold text-slate-700">MiSans Latin</span> oleh Xiaomi Inc. (Digunakan secara resmi di seluruh ekosistem ProfitLeak AI).
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
