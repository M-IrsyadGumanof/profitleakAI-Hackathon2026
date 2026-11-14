import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ProfitLeak AI — Deteksi Kebocoran Ongkir & Profit E-Commerce",
  description:
    "Platform Machine Learning untuk memprediksi tarif wajar logistik dan mendeteksi anomali kebocoran biaya ongkir e-commerce secara akurat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
