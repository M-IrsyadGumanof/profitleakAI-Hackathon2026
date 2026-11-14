"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, UploadCloud, LayoutDashboard, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 25);
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
    { href: "/", label: "Beranda", icon: Home },
    { href: "/upload", label: "Unggah Data", icon: UploadCloud },
    { href: "/dashboard", label: "Dashboard Analisis", icon: LayoutDashboard },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pt-2.5 sm:pt-3">
      {/* Floating Island Header dengan Corner Radius rounded-full konsisten di kedua state */}
      <header
        className={`pointer-events-auto w-full flex items-center justify-between border backdrop-blur-md rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "max-w-4xl h-12 sm:h-13 px-4 sm:px-6 bg-white/90 border-slate-200/90 shadow-lg shadow-slate-900/5"
            : "max-w-7xl h-16 px-5 sm:px-8 bg-white/95 border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between w-full gap-2">
          {/* Kolom Kiri: Brand Shield Logo + Morfisme 'ProfitLeak' ke 'PL' (tanpa AI) */}
          <div className="flex items-center justify-start flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0 select-none">
              {/* Ikon Mark Perisai Resmi */}
              <div className="w-8 h-8 relative shrink-0">
                <Image
                  src="/logo-mark.svg"
                  alt="ProfitLeak Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>

              {/* Teks Merek: 'ProfitLeak' saat terbuka -> 'PL' saat mengerucut */}
              <div className="flex items-center text-sm sm:text-base font-extrabold tracking-tight select-none">
                {/* Huruf P */}
                <span className="text-slate-900 group-hover:text-[#1E40AF] transition-colors shrink-0">
                  P
                </span>

                {/* Suku kata 'rofit' yang melipat masuk saat scroll */}
                <span
                  className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isScrolled
                      ? "max-w-0 opacity-0 -translate-x-1 pointer-events-none"
                      : "max-w-[70px] opacity-100 translate-x-0"
                  }`}
                >
                  <span className="text-slate-900 group-hover:text-[#1E40AF] transition-colors">
                    rofit
                  </span>
                </span>

                {/* Huruf L */}
                <span className="text-[#1E40AF] group-hover:text-[#1E3A8A] transition-colors shrink-0">
                  L
                </span>

                {/* Suku kata 'eak' yang melipat masuk saat scroll */}
                <span
                  className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isScrolled
                      ? "max-w-0 opacity-0 -translate-x-1 pointer-events-none"
                      : "max-w-[60px] opacity-100 translate-x-0"
                  }`}
                >
                  <span className="text-slate-600 font-semibold group-hover:text-[#1E40AF] transition-colors">
                    eak
                  </span>
                </span>
              </div>
            </Link>
          </div>

          {/* Kolom Tengah: 3 Tombol Navigasi (Teks saat terbuka -> Ikon SVG saat mengerucut) */}
          <div className="flex items-center justify-center shrink-0">
            <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-xs">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={`relative flex items-center justify-center h-8 rounded-full overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] select-none shrink-0 ${
                      isActive
                        ? "bg-[#1E40AF] text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                    } ${
                      isScrolled
                        ? "w-8 p-0"
                        : "px-3.5 sm:px-4 text-xs"
                    }`}
                  >
                    {/* Teks Label (Terbuka: Tampil | Mengerucut: Melipat ke lebar 0) */}
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isScrolled
                          ? "max-w-0 opacity-0 pointer-events-none scale-90"
                          : "max-w-[130px] opacity-100 scale-100"
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Ikon Konteks SVG (Terbuka: Tersembunyi | Mengerucut: Muncul anggun) */}
                    <span
                      className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isScrolled
                          ? "max-w-[20px] opacity-100 scale-100"
                          : "max-w-0 opacity-0 pointer-events-none scale-75"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Kolom Kanan: Call to Action Simetris */}
          <div className="flex items-center justify-end flex-1 min-w-0">
            <Link
              href="/upload"
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 select-none ${
                isScrolled
                  ? "bg-[#1E40AF] hover:bg-[#1E3A8A] text-white shadow-xs"
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
