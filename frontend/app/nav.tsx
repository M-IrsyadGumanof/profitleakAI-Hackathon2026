"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, UploadCloud, LayoutDashboard, ArrowUpRight, Download, Lock, AlertCircle } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  // Cek apakah ada data audit aktif di sessionStorage
  useEffect(() => {
    const checkData = () => {
      try {
        const stored = sessionStorage.getItem("profitleak_analysis_result");
        setHasData(Boolean(stored));
      } catch {
        setHasData(false);
      }
    };

    checkData();
    window.addEventListener("storage", checkData);
    window.addEventListener("profitleak-session-update", checkData);
    return () => {
      window.removeEventListener("storage", checkData);
      window.removeEventListener("profitleak-session-update", checkData);
    };
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/upload", label: "Unggah Data", icon: UploadCloud },
    { 
      href: "/dashboard", 
      label: "Dashboard Analisis", 
      icon: hasData ? LayoutDashboard : Lock,
      locked: !hasData 
    },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // 1. Jika mencoba akses Dashboard tapi belum ada data
    if (href === "/dashboard") {
      let activeData = false;
      try {
        activeData = Boolean(sessionStorage.getItem("profitleak_analysis_result"));
      } catch {}

      if (!activeData) {
        e.preventDefault();
        setNotice("Silakan unggah file CSV terlebih dahulu untuk membuka Dashboard Analisis.");
        setTimeout(() => setNotice(null), 4500);
        router.push("/upload");
        return;
      }
    }

    // 2. Jika sedang di Dashboard dan ingin keluar ke halaman lain (minta konfirmasi)
    if (pathname === "/dashboard" && href !== "/dashboard") {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("request-exit-dashboard", { detail: { href } })
      );
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4 pt-2.5 sm:pt-3">
      {/* Toast Peringatan Akses Dashboard Terkunci */}
      {notice && (
        <div className="pointer-events-auto mb-2 max-w-md w-full bg-amber-500/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center justify-between gap-2.5 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-100" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-amber-100 hover:text-white text-xs font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

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
            <Link
              href="/"
              onClick={(e) => {
                if (pathname === "/dashboard") {
                  e.preventDefault();
                  window.dispatchEvent(
                    new CustomEvent("request-exit-dashboard", { detail: { href: "/" } })
                  );
                }
              }}
              className="flex items-center gap-2 group shrink-0 select-none"
            >
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

          {/* Kolom Tengah: 3 Tombol Navigasi (Murni Fade Out Teks & Fade In Ikon SVG, Tanpa Gerakan) */}
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
                    onClick={(e) => handleNavClick(e, item.href)}
                    title={item.locked ? `${item.label} (Unggah CSV dulu)` : item.label}
                    aria-label={item.label}
                    className={`relative flex items-center justify-center h-8 rounded-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#1E40AF] text-white font-bold shadow-xs"
                        : item.locked
                        ? "text-slate-400 hover:text-slate-600 hover:bg-slate-200/40 font-medium"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                    } ${
                      isScrolled
                        ? "w-8 p-0"
                        : "px-3.5 sm:px-4 text-xs"
                    }`}
                  >
                    {/* Teks Label */}
                    <span
                      className={`whitespace-nowrap transition-opacity duration-200 ease-in-out flex items-center gap-1.5 ${
                        isScrolled
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100"
                      }`}
                    >
                      {item.locked && <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{item.label}</span>
                    </span>

                    {/* Ikon Konteks SVG: Murni Fade In saat mengerucut */}
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-250 ease-in-out ${
                        isScrolled
                          ? "opacity-100 delay-75"
                          : "opacity-0 pointer-events-none"
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
            {pathname === "/dashboard" ? (
              /* Tombol Download PDF saat berada di Dashboard */
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("trigger-download-pdf"));
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 select-none bg-[#1E40AF] hover:bg-[#1E3A8A] text-white shadow-xs cursor-pointer active:scale-95`}
                title="Unduh Laporan Audit dalam format PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            ) : (
              /* Tombol Mulai Audit CSV saat di halaman Beranda / Upload */
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
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

