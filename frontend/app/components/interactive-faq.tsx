"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function InteractiveFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Bagaimana AI menentukan bahwa sebuah ongkos kirim dikatakan tidak wajar?",
      answer:
        "Sistem menggunakan model regresi HistGradientBoosting yang dilatih pada 78.181 transaksi nyata Olist E-Commerce. Model mempelajari hubungan non-linier antara jarak kirim, berat paket, dimensi volume, dan densitas paket untuk menghasilkan tarif wajar acuan. Jika tarif kurir riil melebihi 3.0978 kali tarif wajar tersebut, sistem menandainya sebagai anomali pembebanan ekspedisi.",
    },
    {
      question: "Apakah data transaksi CSV yang saya unggah aman?",
      answer:
        "Sangat aman. Seluruh proses audit, perhitungan regresi, dan kalkulasi margin dijalankan langsung di lingkungan peramban (client-side browser) Anda. Data sensitif perusahaan Anda tidak diunggah maupun disimpan pada server pihak ketiga mana pun.",
    },
    {
      question: "Apa perbedaan antara 'Bocor Tarif Kurir' dan 'Bocor Penyerapan Margin'?",
      answer:
        "Bocor Tarif Kurir terjadi saat pihak ekspedisi membebankan biaya jauh di atas benchmark wajar (overcharging logistik). Sedangkan Bocor Penyerapan Margin terjadi ketika ongkir menyerap lebih dari 50% dari harga jual barang, yang biasanya menimpa produk berharga murah yang dikirim ke rute jauh tanpa subsidi kuantiti.",
    },
    {
      question: "Mengapa ambang batas rasio tarif ditetapkan secara spesifik pada angka 3.0978x?",
      answer:
        "Angka 3.0978x diturunkan dari analisis distribusi empiris persentil statistik anomali logistik nasional pada dataset Olist. Ambang ini dirancang secara presisi untuk meminimalkan false positive (peringatan palsu) akibat variasi musiman rute terpencil.",
    },
    {
      question: "Apakah hasil audit bisa diekspor ke format Excel atau CSV?",
      answer:
        "Ya. Pada halaman Dashboard Analisis, Anda dapat mengekspor seluruh transaksi yang terdeteksi anomali beserta kode deteksi dan rekomendasi perbaikannya langsung ke file CSV untuk bahan rapat atau negosiasi dengan mitra logistik.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={idx}
            className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#1E40AF] transition-colors"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-[#1E40AF] shrink-0" />
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-[#1E40AF]" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
