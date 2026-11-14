"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/upload", label: "Unggah Data" },
    { href: "/dashboard", label: "Dashboard Analisis" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:bg-blue-700 transition-colors">
            PL
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              ProfitLeak AI
            </span>
            <span className="text-[11px] text-slate-500 leading-none">
              Logistics Margin Intelligence
            </span>
          </div>
        </Link>

        {/* Dynamic Navigation Pill Bar */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/upload"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-xs transition-colors"
          >
            Mulai Audit CSV
          </Link>
        </div>
      </div>
    </header>
  );
}

