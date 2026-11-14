"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LiquidCanvas } from "./liquid-canvas";
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  UploadCloud, 
  X 
} from "lucide-react";

// Mock dataset fixture Olist siap pakai untuk pengujian
const DEMO_CSV_CONTENT = `weight_kg,distance_km,volume_cm3,price,freight_value
2.5,450.2,12000,129.90,24.50
0.8,120.5,3500,45.00,14.20
14.2,1850.0,68000,189.00,165.80
0.4,85.0,1800,19.90,26.50
5.2,820.4,24000,240.00,42.10
8.0,1450.0,42000,89.00,98.50
1.2,310.0,6400,75.00,18.00
3.8,920.0,18500,35.00,52.40
0.3,55.0,1200,89.90,13.20
6.5,1100.0,31000,69.00,74.00
18.5,2400.0,92000,320.00,285.00
0.6,210.0,2800,15.50,22.00`;

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ rows: number; previewLines: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // State loading diikat ke id upload yang sedang berjalan, bukan sekadar
  // boolean, sehingga tombol tidak bisa "tersangkut" berputar terus.
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload hanya dianggap berjalan selama id-nya sama dengan id terakhir.
  const isAnalyzing = isLoading && activeUploadId !== null;

  // Next.js mempertahankan state client component selama halaman masih hidup,
  // jadi form ini di-remount setiap kali halaman dibuka lewat `<main key>` di
  // app/app-shell.tsx. Hasilnya form selalu kosong saat dibuka kembali.

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessFile = (selectedFile: File) => {
    setErrorMessage(null);
    setActiveUploadId(null);
    setIsLoading(false);
    if (!selectedFile.name.endsWith(".csv") && selectedFile.type !== "text/csv") {
      setErrorMessage("Format file harus berupa CSV (.csv).");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage("Ukuran file maksimal adalah 25 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMessage("File CSV harus memiliki baris header dan minimal 1 baris data.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredCols = ["weight_kg", "distance_km", "volume_cm3", "price"];
      const missing = requiredCols.filter((col) => !headers.includes(col));

      if (missing.length > 0) {
        setErrorMessage(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
        return;
      }

      setFile(selectedFile);
      setCsvPreview({
        rows: lines.length - 1,
        previewLines: lines.slice(0, 4),
      });
    };

    reader.onerror = () => {
      setErrorMessage("Gagal membaca file CSV. Pastikan encoding UTF-8 valid.");
    };

    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemoDataset = () => {
    const blob = new Blob([DEMO_CSV_CONTENT], { type: "text/csv" });
    const demoFile = new File([blob], "transaksi_sample_olist.csv", { type: "text/csv" });
    handleProcessFile(demoFile);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `weight_kg,distance_km,volume_cm3,price,freight_value,product_weight_g,length_cm,height_cm,width_cm
1.5,500.0,8000,120.00,25.50,1500,20,20,20
0.5,150.0,2400,35.00,12.00,500,15,10,16
5.0,1200.0,24000,75.00,85.00,5000,40,20,30`;

    const blob = new Blob([templateContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_transaksi_profitleak.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitAnalysis = async () => {
    if (!file || isAnalyzing) return;

    const uploadId = `${file.name}-${file.size}-${Date.now()}`;
    setActiveUploadId(uploadId);
    setIsLoading(true);
    setErrorMessage(null);

    // Batas waktu: backend bisa menggantung (mis. reload uvicorn) sehingga
    // tombol loading tidak boleh berputar tanpa henti.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/upload-csv`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Server error (${response.status})`);
      }

      const result = await response.json();
      sessionStorage.setItem("profitleak_analysis_result", JSON.stringify(result));
      // Hapus cache saran AI lama agar dashboard me-refresh tombol saran untuk file baru
      sessionStorage.removeItem("profitleak_advice");
      sessionStorage.removeItem("profitleak_advice_filename");
      router.push("/dashboard");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Jangan diam-diam menampilkan data palsu: selalu beri tahu pengguna
      // bahwa backend tidak terjangkau, lalu biarkan ia mencoba lagi.
      setErrorMessage(
        errMsg.includes("aborted")
          ? "Analisis melebihi batas waktu 90 detik. Pastikan backend aktif, lalu coba lagi."
          : errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")
          ? "Tidak dapat terhubung ke backend (http://localhost:8000). Pastikan server API sudah berjalan, lalu coba lagi."
          : errMsg
      );
      setActiveUploadId(null);
      setIsLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className="pt-2 sm:pt-4 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header Halaman (Jarak proporsional di bawah floating navbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Unggah Dataset Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Unggah file CSV transaksi pengiriman untuk dianalisis oleh sistem audit ProfitLeak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Unduh Template CSV
          </button>
        </div>
      </div>

      {/* Box Notifikasi Error (Layout Netral, Hanya Ikon yang Berwarna) */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 text-slate-800 shadow-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-bold text-slate-900 block">Pemberitahuan Validasi:</span>
            <span className="text-slate-600">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Area Drag & Drop dengan Efek Interaktif Netlify Aurora & Fluid Liquid */}
      <div
        data-dropzone="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl min-h-[340px] sm:min-h-[380px] p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center transition-all select-none ${
          isDragging
            ? "border-sky-400 shadow-xl shadow-sky-500/20 scale-[1.005]"
            : file
            ? "border-sky-400/80 shadow-lg shadow-sky-500/10"
            : "border-slate-700/80 hover:border-sky-400/80 shadow-lg shadow-slate-900/10"
        }`}
      >
        {/* Interactive Netlify Aurora + Liquid Shader */}
        <LiquidCanvas isDragging={isDragging} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleProcessFile(e.target.files[0]);
            }
            // Kosongkan value agar memilih file yang sama dua kali tetap memicu onChange.
            e.target.value = "";
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3.5 max-w-lg select-none">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              file
                ? "bg-sky-500/20 text-sky-400 border border-sky-400/30"
                : "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-inner"
            }`}
          >
            {file ? <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" /> : <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />}
          </div>

          <div>
            <h3 className="text-base sm:text-xl font-bold text-white tracking-wide drop-shadow-sm">
              {file ? file.name : "Tarik & lepaskan file CSV Anda ke sini"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 drop-shadow-sm">
              {file
                ? `Ukuran file: ${(file.size / 1024).toFixed(1)} KB • Siap diproses`
                : "atau klik untuk memilih file dari komputer Anda (Maksimal 50.000 baris)"}
            </p>
          </div>

          {!file && (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl border border-white/20 backdrop-blur-md transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-300" />
              <span>Pilih Dokumen CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Demo Helper */}
      {!file && (
        <div className="p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#1E40AF] shrink-0" />
            <span className="text-xs text-slate-700 font-medium">
              Ingin uji coba cepat tanpa menyiapkan file CSV sendiri?
            </span>
          </div>
          <button
            onClick={handleLoadDemoDataset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#1E40AF] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors shrink-0"
          >
            Gunakan Data Sampel (12 Baris)
          </button>
        </div>
      )}

      {/* Preview Ringkasan File */}
      {file && csvPreview && (
        <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-[#1E40AF]" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{file.name}</h4>
                <span className="text-xs text-slate-500 tabular-nums">
                  {csvPreview.rows} baris transaksi terdeteksi
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setCsvPreview(null);
                setActiveUploadId(null);
                setIsLoading(false);
                resetFileInput();
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Ganti File
            </button>
          </div>

          {/* Cuplikan Header CSV */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 overflow-x-auto text-[11px] tabular-nums text-slate-600">
            <div className="font-bold text-slate-800 mb-1">Cuplikan Baris Pertama:</div>
            {csvPreview.previewLines.map((line, idx) => (
              <div key={idx} className="whitespace-nowrap py-0.5">
                {line}
              </div>
            ))}
          </div>

          {/* Tombol Eksekusi Analisis */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={handleSubmitAnalysis}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#172554] rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menganalisis Transaksi...
                </>
              ) : (
                <>
                  Mulai Analisis Transaksi
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Petunjuk Format Kolom */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#1E40AF]" />
          Spesifikasi Format Kolom CSV
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-1">
            <span className="font-bold text-slate-900 block mb-1">
              Kolom Wajib (Required):
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">weight_kg</code>: Berat paket dalam kilogram (0.05 - 30.0 kg).
              </li>
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">distance_km</code>: Jarak kirim Haversine penjual-pembeli (km).
              </li>
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">volume_cm3</code>: Volume fisik paket ($P \times L \times T$).
              </li>
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">price</code>: Harga barang dalam mata uang BRL (R$).
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-1">
            <span className="font-bold text-slate-900 block mb-1">
              Kolom Opsional:
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">freight_value</code>: Ongkir aktual yang dibayarkan ke ekspedisi.
              </li>
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">product_weight_g</code>: Berat dalam gram (untuk kalkulasi kepadatan).
              </li>
              <li>
                <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">length_cm, height_cm, width_cm</code>: Dimensi paket individual.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
