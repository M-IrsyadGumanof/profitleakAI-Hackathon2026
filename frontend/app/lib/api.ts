/**
 * ========================================================================
 * ProfitLeak AI - API Client & Integration Utilities (v6 Multi-Detector)
 * Owner: Suhafdal (Frontend Integration Engineer)
 * Branch: suhafdal
 * Rujukan: Kontrak API Bagian 5 (pembagian_tim_5_orang.txt) &
 *          Fitur Saran AI Gemini (pembagian_tugas_gemini.txt)
 * ========================================================================
 */

import {
  MODEL_CONFIG,
  PredictionRequest,
  PredictPayload,
  PredictResponse,
  LeakDetectionRequest,
  DetectLeakResponse,
  HealthResponse,
  ModelInfoResponse,
  UploadCsvResponse,
  ValidationResult,
  LeakReason,
  AdviceRequest,
  AdviceResponse,
  AdvicePriority,
  AdviceRowNote,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const DEFAULT_USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface RequestOptions {
  /** Memaksa penggunaan mock response (berguna jika backend belum dinyalakan) */
  useMock?: boolean;
}

// ------------------------------------------------------------------------
// 1. VALIDASI INPUT (Sesuai valid_ranges dari model v6)
// ------------------------------------------------------------------------
export function validatePayload(
  payload: Partial<LeakDetectionRequest>
): ValidationResult {
  const errors: Partial<Record<keyof PredictionRequest | "actual_rate", string>> = {};
  const ranges = MODEL_CONFIG.RANGES;

  if (payload.weight_kg === undefined || payload.weight_kg === null || isNaN(payload.weight_kg)) {
    errors.weight_kg = "Berat paket (weight_kg) wajib diisi.";
  } else if (payload.weight_kg < ranges.weight_kg.min || payload.weight_kg > ranges.weight_kg.max) {
    errors.weight_kg = `Berat paket harus antara ${ranges.weight_kg.min} - ${ranges.weight_kg.max} kg.`;
  }

  if (payload.distance_km === undefined || payload.distance_km === null || isNaN(payload.distance_km)) {
    errors.distance_km = "Jarak pengiriman (distance_km) wajib diisi.";
  } else if (payload.distance_km < ranges.distance_km.min || payload.distance_km > ranges.distance_km.max) {
    errors.distance_km = `Jarak harus antara ${ranges.distance_km.min.toFixed(1)} - ${ranges.distance_km.max.toFixed(1)} km.`;
  }

  if (payload.volume_cm3 === undefined || payload.volume_cm3 === null || isNaN(payload.volume_cm3)) {
    errors.volume_cm3 = "Volume paket (volume_cm3) wajib diisi.";
  } else if (payload.volume_cm3 < ranges.volume_cm3.min || payload.volume_cm3 > ranges.volume_cm3.max) {
    errors.volume_cm3 = `Volume harus antara ${ranges.volume_cm3.min} - ${ranges.volume_cm3.max} cm³.`;
  }

  if (payload.price === undefined || payload.price === null || isNaN(payload.price)) {
    errors.price = "Harga barang (price) wajib diisi.";
  } else if (payload.price < ranges.price.min || payload.price > ranges.price.max) {
    errors.price = `Harga barang harus antara ${ranges.price.min} - ${ranges.price.max} BRL.`;
  }

  if (payload.actual_rate !== undefined && payload.actual_rate !== null) {
    if (isNaN(payload.actual_rate) || payload.actual_rate <= 0) {
      errors.actual_rate = "Tarif aktual (actual_rate) harus berupa angka lebih besar dari 0.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ------------------------------------------------------------------------
// 2. GENERATOR MOCK DATA (Untuk pengujian UI mandiri sebelum backend jalan)
// ------------------------------------------------------------------------
function generateMockPrediction(payload: PredictionRequest): number {
  const weightFactor = payload.weight_kg * 1.75;
  const distanceFactor = payload.distance_km * 0.014;
  const volumeFactor = (payload.volume_cm3 / 10000) * 0.85;
  const priceLogFactor = Math.log1p(payload.price) * 1.5;

  const rawRate = 12.5 + weightFactor + distanceFactor + volumeFactor + priceLogFactor;
  return Math.round(rawRate * 100) / 100;
}

export function generateMockDetectLeak(payload: LeakDetectionRequest): DetectLeakResponse {
  const predictedRate = generateMockPrediction(payload);
  const actualRate = payload.actual_rate ?? payload.price;
  const ratio = Math.round((actualRate / predictedRate) * 10000) / 10000;
  const freightRatio = Math.round((actualRate / Math.max(payload.price, 0.01)) * 10000) / 10000;
  const threshold = MODEL_CONFIG.DEFAULT_THRESHOLD;

  const isRateLeak = ratio > threshold;
  const marginRiskProb = Math.min(1.0, Math.max(0.0, freightRatio * 0.55));
  const isMarginRisk = marginRiskProb >= MODEL_CONFIG.MARGIN_PROBA_THRESHOLD;
  const isLeak = isRateLeak || isMarginRisk;

  const reasons: LeakReason[] = [];
  if (isRateLeak) {
    reasons.push({
      code: "rate_exceeds_fair",
      severity: "high",
      detail: `Tarif aktual ${ratio.toFixed(2)}x lipat tarif wajar (ambang ${threshold.toFixed(2)}x).`,
      remedy: "Nego ulang tarif pengiriman dengan ekspedisi atau pilih rute alternatif.",
    });
  }
  if (isMarginRisk) {
    reasons.push({
      code: "freight_eats_margin",
      severity: "medium",
      detail: `Ongkir menyerap ${(freightRatio * 100).toFixed(1)}% dari harga barang.`,
      remedy: "Terapkan batas minimal belanja gratis ongkir atau naikkan harga jual.",
    });
  }

  const message = isLeak
    ? `⚠️ Terindikasi kebocoran profit (${reasons.map((r) => r.code).join(", ")}).`
    : "✅ Transaksi ekonomis. Tidak terdeteksi kebocoran profit.";

  const riskScore = Math.min(1.0, (isRateLeak ? 0.6 : 0) + (isMarginRisk ? 0.4 : 0));

  return {
    predicted_rate: predictedRate,
    actual_rate: actualRate,
    ratio,
    freight_ratio: freightRatio,
    margin_risk_probability: marginRiskProb,
    is_leak: isLeak,
    threshold,
    currency: MODEL_CONFIG.CURRENCY,
    message,
    risk_score: Math.round(riskScore * 100) / 100,
    detectors: {
      rate: isRateLeak,
      margin: isMarginRisk,
    },
    reasons,
  };
}

export function generateMockAdvice(payload: AdviceRequest): AdviceResponse {
  const summary = payload.summary || {};
  const leaks = Number(summary.leaks || 0);
  const analysed = Number(summary.analysed || 0);
  const estimatedLoss = Number(summary.estimated_loss || 0);

  if (leaks === 0) {
    return {
      source: "mock_safe",
      generated_at: new Date().toISOString(),
      headline: "Semua transaksi aman dan efisien",
      ringkasan: `Dari total ${analysed} transaksi yang dianalisis, tidak ditemukan anomali tarif maupun risiko margin kotor.`,
      prioritas: [],
      per_baris: [],
      catatan: "Saran simulasi: kondisi operasional logistik sehat.",
    };
  }

  const leakRows = (payload.rows || []).filter((r) => r.is_leak);
  const topRows = (leakRows.length > 0 ? leakRows : payload.rows || []).slice(0, 3);

  const prioritas: AdvicePriority[] = [
    {
      judul: "Negosiasi tarif ekspedisi & kurir mitra",
      dampak: `Potensi penghematan biaya logistik R$ ${estimatedLoss.toFixed(2)}`,
      aksi: [
        "Minta evaluasi kontrak daftar tarif khusus rute jarak jauh",
        "Bandingkan layanan minimal 2 ekspedisi alternatif",
      ],
      terdampak: topRows.map((r) => r.line),
    },
    {
      judul: "Penyesuaian batas harga & strategi bundling",
      dampak: "Mencegah ongkir memakan lebih dari 30% harga produk",
      aksi: [
        "Terapkan batas minimal belanja untuk subsidi ongkir",
        "Jual produk bernilai rendah dalam bentuk paket multipack",
      ],
      terdampak: topRows.map((r) => r.line),
    },
  ];

  const perBaris: AdviceRowNote[] = topRows.map((r) => {
    const act = r.actual_rate || 0;
    const targetPrice = Math.round((act / 0.3) * 100) / 100;
    return {
      line: r.line,
      masalah: `Ongkir aktual (R$ ${act.toFixed(2)}) terlalu besar dibanding tarif wajar.`,
      saran_harga: `Naikkan harga jual minimal ke R$ ${targetPrice.toFixed(2)} agar porsi ongkir kembali di bawah 30%.`,
    };
  });

  return {
    source: "rule_based",
    generated_at: new Date().toISOString(),
    headline: `${leaks} transaksi terindikasi membocorkan margin pengiriman`,
    ringkasan: `${leaks} dari ${analysed} transaksi yang dianalisis membayar ongkir jauh di atas estimasi wajar atau menggerus margin penjualan.`,
    prioritas,
    per_baris: perBaris,
    catatan: "Saran AI, bukan nasihat keuangan final. Model tidak mencakup HPP & diskon.",
  };
}

// ------------------------------------------------------------------------
// 3. FUNGSI PANGGILAN API UTAMA
// ------------------------------------------------------------------------

/**
 * Cek status koneksi backend
 * GET /api/health
 */
export async function checkHealth(options?: RequestOptions): Promise<HealthResponse> {
  if (options?.useMock || DEFAULT_USE_MOCK) {
    return {
      status: "ok (mock)",
      service: "profitleak-api-mock",
      version: MODEL_CONFIG.VERSION,
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Server status ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal terhubung ke backend server.";
    throw new Error(
      `[Health Check Gagal] Tidak dapat menghubungi server pada ${BASE_URL}. Pastikan backend FastAPI Irsyad berjalan di port 8000. (${errorMsg})`
    );
  }
}

/**
 * Ambil metadata model v6 & batasan validasi
 * GET /api/model-info
 */
export async function getModelInfo(options?: RequestOptions): Promise<ModelInfoResponse> {
  if (options?.useMock || DEFAULT_USE_MOCK) {
    return {
      info: { version: "v6", description: "Mock Model Info" },
      threshold: MODEL_CONFIG.DEFAULT_THRESHOLD,
      margin_threshold: MODEL_CONFIG.MARGIN_THRESHOLD,
      margin_proba_threshold: MODEL_CONFIG.MARGIN_PROBA_THRESHOLD,
      detectors: ["rate", "margin"],
      scope: {
        covered: [
          "tarif ongkir aktual jauh di atas tarif wajar",
          "ongkir menyerap porsi besar dari harga jual",
        ],
        not_covered: [
          "harga modal / COGS / HPP",
          "diskon",
          "margin keuntungan bersih",
        ],
        reason: "Dataset Olist tidak memuat kolom harga modal maupun diskon.",
      },
      valid_ranges: {
        weight_kg: [0.05, 30.0],
        distance_km: [1.4896, 3135.7885],
        volume_cm3: [352.0, 244608.0],
        price: [4.99, 2110.0],
      },
      rate_features: ["weight_kg", "distance_km", "volume_cm3", "price_log", "density_g_cm3"],
      required_inputs: ["weight_kg", "distance_km", "volume_cm3", "price"],
      optional_inputs: ["product_weight_g", "length_cm", "height_cm", "width_cm"],
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/api/model-info`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil model-info (${res.status}): ${res.statusText}`);
    }

    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal memanggil /api/model-info: ${msg}`);
  }
}

/**
 * Prediksi tarif ongkir wajar (POST /api/predict)
 */
export async function predictRate(
  payload: PredictionRequest,
  options?: RequestOptions
): Promise<PredictResponse> {
  const validation = validatePayload(payload);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Validasi Input Gagal: ${firstError}`);
  }

  if (options?.useMock || DEFAULT_USE_MOCK) {
    return {
      predicted_rate: generateMockPrediction(payload),
      currency: MODEL_CONFIG.CURRENCY,
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const detail =
        errorBody && typeof errorBody.detail === "string"
          ? errorBody.detail
          : `HTTP error ${res.status}: ${res.statusText}`;
      throw new Error(detail);
    }

    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal memanggil endpoint /api/predict: ${msg}`);
  }
}

// Alias untuk kemudahan
export const predict = predictRate;

/**
 * Deteksi kebocoran profit multi-faktor (POST /api/detect-leak)
 */
export async function detectLeak(
  payload: LeakDetectionRequest,
  options?: RequestOptions
): Promise<DetectLeakResponse> {
  const validation = validatePayload(payload);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Validasi Input Gagal: ${firstError}`);
  }

  if (options?.useMock || DEFAULT_USE_MOCK) {
    return generateMockDetectLeak(payload);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/detect-leak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const detail =
        errorBody && typeof errorBody.detail === "string"
          ? errorBody.detail
          : `HTTP error ${res.status}: ${res.statusText}`;
      throw new Error(detail);
    }

    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal memanggil endpoint /api/detect-leak: ${msg}`);
  }
}

/**
 * Unggah & Analisis batch CSV (POST /api/upload-csv)
 * PENTING: Menggunakan FormData. Jangan meng-set header 'Content-Type' manual
 * agar boundary multipart diatur otomatis oleh browser.
 */
export async function uploadCsv(
  file: File,
  options?: RequestOptions
): Promise<UploadCsvResponse> {
  if (!file) {
    throw new Error("File CSV wajib dipilih sebelum mengunggah.");
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error("Format file harus berupa .csv");
  }

  if (options?.useMock || DEFAULT_USE_MOCK) {
    return {
      filename: file.name,
      currency: MODEL_CONFIG.CURRENCY,
      threshold: MODEL_CONFIG.DEFAULT_THRESHOLD,
      margin_threshold: MODEL_CONFIG.MARGIN_THRESHOLD,
      summary: {
        total_rows: 5,
        analysed: 5,
        skipped: 0,
        leaks: 2,
        rate_leaks: 1,
        margin_risks: 1,
        estimated_loss: 425.5,
        leak_rate: 40.0,
      },
      reason_breakdown: {
        rate_exceeds_fair: 1,
        freight_eats_margin: 1,
      },
      recommendations: [
        {
          code: "rate_exceeds_fair",
          count: 1,
          recommendation: "Negosiasikan ulang tarif atau alihkan ke rute ekspedisi mitra.",
        },
        {
          code: "freight_eats_margin",
          count: 1,
          recommendation: "Terapkan minimal nilai belanja untuk subsidi ongkir.",
        },
      ],
      rows: [
        {
          line: 2,
          predicted_rate: 28.5,
          actual_rate: 95.0,
          ratio: 3.33,
          freight_ratio: 0.95,
          margin_risk_probability: 0.88,
          is_leak: true,
          risk_score: 0.92,
          detectors: { rate: true, margin: true },
          reasons: [
            {
              code: "rate_exceeds_fair",
              severity: "high",
              detail: "Tarif aktual 3.33x di atas tarif wajar.",
              remedy: "Gunakan ekspedisi mitra alternatif.",
            },
          ],
        },
      ],
      skipped: [],
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${BASE_URL}/api/upload-csv`, {
      method: "POST",
      // CATATAN: Sengaja TIDAK menambahkan headers "Content-Type": "multipart/form-data"
      // agar browser secara otomatis menyertakan boundary unik.
      body: formData,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const detail =
        errorBody && typeof errorBody.detail === "string"
          ? errorBody.detail
          : `HTTP error ${res.status}: ${res.statusText}`;
      throw new Error(detail);
    }

    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal mengunggah file CSV: ${msg}`);
  }
}

/**
 * Minta Saran AI (LLM Google Gemini / Fallback Rule-Based)
 * POST /api/advice
 * Rujukan: pembagian_tugas_gemini.txt
 */
export async function getAdvice(
  payload: AdviceRequest,
  options?: RequestOptions
): Promise<AdviceResponse> {
  if (options?.useMock || DEFAULT_USE_MOCK) {
    return generateMockAdvice(payload);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${BASE_URL}/api/advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const detail =
        errorBody && typeof errorBody.detail === "string"
          ? errorBody.detail
          : `HTTP error ${res.status}: ${res.statusText}`;
      throw new Error(detail);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Permintaan saran AI timeout (melebihi batas 30 detik). Silakan coba kembali.");
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal memanggil endpoint /api/advice: ${msg}`);
  }
}

/**
 * AI Logistics Copilot Chat
 * POST /api/copilot-chat
 */
export async function copilotChat(payload: {
  message: string;
  history?: { role: string; content: string }[];
  summary?: unknown;
  rows?: unknown[];
  filename?: string;
}): Promise<{ reply: string; source: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${BASE_URL}/api/copilot-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const detail =
        errorBody && typeof errorBody.detail === "string"
          ? errorBody.detail
          : `HTTP error ${res.status}`;
      throw new Error(detail);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Respon AI melebihi batas waktu 30 detik. Silakan coba lagi.");
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal menghubungi AI Copilot: ${msg}`);
  }
}

