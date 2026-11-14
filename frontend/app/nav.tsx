"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
      <motion.header
        initial={false}
        animate={{
          maxWidth: isScrolled ? "54rem" : "80rem",
          height: isScrolled ? "3.25rem" : "4rem",
          borderRadius: isScrolled ? "9999px" : "1rem",
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.88)" : "rgba(255, 255, 255, 0.96)",
          boxShadow: isScrolled
            ? "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)"
            : "0 1px 3px 0 rgba(15, 23, 42, 0.05)",
          borderColor: isScrolled ? "rgba(226, 232, 240, 0.95)" : "rgba(226, 232, 240, 0.75)",
        }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1], // DeepSeek / Apple cinematic spring-like easeOut
        }}
        className="pointer-events-auto w-full px-4 sm:px-6 flex items-center border backdrop-blur-md"
      >
        <div className="flex items-center justify-between w-full gap-2">
          {/* Kolom Kiri: Brand Logo dengan Morfisme Anthropic (ProfitLeak AI -> PL AI) */}
          <div className="flex items-center justify-start flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
                PL
              </div>

              <div className="flex items-center overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: isScrolled ? "0px" : "auto",
                    opacity: isScrolled ? 0 : 1,
                    marginRight: isScrolled ? "0px" : "4px",
                  }}
                  transition={{
                    duration: 0.38,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="overflow-hidden whitespace-nowrap flex flex-col"
                >
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    ProfitLeak
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none hidden sm:block">
                    Logistics Margin Intelligence
                  </span>
                </motion.div>

                <span className="font-black text-sm tracking-tight text-blue-600 shrink-0">
                  AI
                </span>
              </div>
            </Link>
          </div>

          {/* Kolom Tengah: 3 Tombol Navigasi Presisi Terpusat (Tanpa Jitter) */}
          <div className="flex items-center justify-center shrink-0">
            <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-xs">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3.5 sm:px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 whitespace-nowrap ${
                      isActive ? "text-white font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                        className="absolute inset-0 bg-blue-600 rounded-full shadow-xs -z-10"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Kolom Kanan: Call to Action Seimbang */}
          <div className="flex items-center justify-end flex-1 min-w-0">
            <Link
              href="/upload"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 shrink-0 ${
                isScrolled
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs"
              }`}
            >
              <span className="hidden sm:inline">Mulai Audit CSV</span>
              <span className="sm:hidden">Audit CSV</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </motion.header>
    </div>
  );
}
