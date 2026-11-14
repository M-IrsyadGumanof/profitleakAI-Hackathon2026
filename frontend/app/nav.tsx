"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pt-2 sm:pt-3 transition-all duration-300">
      <motion.header
        layout
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
        className={`pointer-events-auto flex items-center justify-between transition-colors duration-200 ${
          isScrolled
            ? "w-full max-w-4xl h-12 sm:h-13 px-4 sm:px-6 rounded-full bg-white/85 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-900/5"
            : "w-full max-w-7xl h-16 px-4 sm:px-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-xs"
        }`}
      >
        {/* Brand Logo with Anthropic-Style Morphing (Full -> AI) */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs group-hover:bg-blue-700 transition-colors">
            PL
          </div>

          <div className="flex items-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {!isScrolled ? (
                <motion.div
                  key="full-brand"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col"
                >
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-1 group-hover:text-blue-600 transition-colors leading-tight">
                    ProfitLeak <span className="text-blue-600 font-extrabold">AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none hidden sm:block">
                    Logistics Margin Intelligence
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="compact-brand"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center"
                >
                  <span className="font-black text-sm tracking-tight text-blue-600">
                    AI
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>

        {/* Dynamic Navigation Pill Bar with Animated Sliding Pill */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 sm:px-3.5 py-1 text-xs font-semibold rounded-full transition-colors duration-150 z-10 ${
                  isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-blue-600 rounded-full shadow-xs -z-10"
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          <Link
            href="/upload"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              isScrolled
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs"
            }`}
          >
            <span>Mulai Audit CSV</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
        </div>
      </motion.header>
    </div>
  );
}
