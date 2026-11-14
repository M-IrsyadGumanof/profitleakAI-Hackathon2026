"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/upload", label: "Unggah Data" },
    { href: "/dashboard", label: "Dashboard Analisis" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pt-2.5 sm:pt-3">
      {/* DeepSeek Smooth Floating Island Header (Hardware-Accelerated CSS Transition) */}
      <header
        className={`pointer-events-auto w-full flex items-center justify-between border backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "max-w-4xl h-12 sm:h-13 px-4 sm:px-6 rounded-full bg-white/90 border-slate-200/90 shadow-lg shadow-slate-900/5"
            : "max-w-7xl h-16 px-4 sm:px-8 rounded-2xl bg-white/95 border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between w-full gap-2">
          {/* Kolom Kiri: Brand Logo Resmi dengan Morfisme Ringan Gaya Anthropic */}
          <div className="flex items-center justify-start flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              {/* Ikon Mark Resmi (Daun + Droplet + Box Logistik) */}
              <div className="w-8 h-8 relative shrink-0">
                <Image
                  src="/logo-mark.svg"
                  alt="ProfitLeak AI Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>

              {/* Teks Merek (Morfisme Otomatis saat Scrolled tanpa Lag) */}
              <div className="flex items-center overflow-hidden">
                <div
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isScrolled
                      ? "max-w-0 opacity-0 -translate-x-2"
                      : "max-w-[200px] opacity-100 translate-x-0 mr-1"
                  }`}
                >
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Profit<span className="text-slate-600 font-semibold">Leak</span>
                  </span>
                </div>

                <span className="font-extrabold text-sm sm:text-base tracking-tight text-emerald-600 shrink-0">
                  AI
                </span>
              </div>
            </Link>
          </div>

          {/* Kolom Tengah: 3 Tombol Navigasi Presisi Terkunci (Kontras Tinggi, Zero-Lag) */}
          <div className="flex items-center justify-center shrink-0">
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80 shadow-xs">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 sm:px-4 py-1.5 text-xs rounded-full transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Kolom Kanan: Call to Action Simetris */}
          <div className="flex items-center justify-end flex-1 min-w-0">
            <Link
              href="/upload"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 shrink-0 ${
                isScrolled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs"
              }`}
            >
              <span className="hidden sm:inline">Mulai Audit CSV</span>
              <span className="sm:hidden">Audit CSV</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
