"use client";

import { usePathname } from "next/navigation";

/**
 * Membungkus konten halaman dan me-remount-nya setiap kali URL berubah.
 *
 * Next.js menyimpan state client component selama halaman masih hidup
 * (cache router di memori). Akibatnya, membuka kembali /upload setelah melihat
 * dashboard bisa membawa file yang sudah dipilih dan status loading lama,
 * sehingga tombol "Menganalisis Transaksi..." tampak berputar terus.
 *
 * Dengan `key={pathname}`, setiap kunjungan halaman dimulai dari state bersih:
 * form kosong, tombol normal, dashboard membaca hasil analisis dari
 * sessionStorage seperti biasa.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main key={pathname} className="flex-1 w-full">
      {children}
    </main>
  );
}
