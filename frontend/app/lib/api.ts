/**
 * ========================================================================
 * ProfitLeak AI - API Client & Integration Utilities
 * Owner: Suhafdal (Frontend Integration Engineer)
 * Branch: feat/suhafdal-integration / suhafdal
 * Rujukan: Kontrak API Bagian 4 & pembagian_tim_5_orang.txt
 * ========================================================================
 */

import {
  MODEL_CONFIG,
  PredictPayload,
  PredictResponse,
  DetectLeakResponse,
  HealthResponse,
  ValidationResult,
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
// 1. VALIDASI INPUT (Sesuai valid_ranges dari model v5)
// ------------------------------------------------------------------------
export function validatePayload(payload: Partial<PredictPayload>): ValidationResult {
  const errors: Partial<Record<keyof PredictPayload, string>> = {};
  const ranges = MODEL_CONFIG.RANGES;

  if (payload.weight_kg === undefined || payload.weight_kg === null || isNaN(payload.weight_kg)) {
    errors.weight_kg = "Berat produk wajib diisi.";
  } else if (payload.weight_kg < ranges.weight_kg.min || payload.weight_kg > ranges.weight_kg.max) {
    errors.weight_kg = `Berat harus antara ${ranges.weight_kg.min} - ${ranges.weight_kg.max} kg.`;
  }

  if (payload.distance_km === undefined || payload.distance_km === null || isNaN(payload.distance_km)) {
    errors.distance_km = "Jarak pengiriman wajib diisi.";
  } else if (payload.distance_km < ranges.distance_km.min || payload.distance_km > ranges.distance_km.max) {
    errors.distance_km = `Jarak harus antara ${ranges.distance_km.min.toFixed(1)} - ${ranges.distance_km.max.toFixed(1)} km.`;
  }

  if (payload.volume_cm3 === undefined || payload.volume_cm3 === null || isNaN(payload.volume_cm3)) {
    errors.volume_cm3 = "Volume produk wajib diisi.";
  } else if (payload.volume_cm3 < ranges.volume_cm3.min || payload.volume_cm3 > ranges.volume_cm3.max) {
    errors.volume_cm3 = `Volume harus antara ${ranges.volume_cm3.min} - ${ranges.volume_cm3.max} cm³.`;
  }

  if (payload.price === undefined || payload.price === null || isNaN(payload.price)) {
    errors.price = "Harga barang / tarif aktual wajib diisi.";
  } else if (payload.price < ranges.price.min || payload.price > ranges.price.max) {
    errors.price = `Harga harus antara ${ranges.price.min} - ${ranges.price.max} BRL.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ------------------------------------------------------------------------
// 2. GENERATOR MOCK DATA (Untuk pengujian UI sebelum backend online)
// ------------------------------------------------------------------------
function generateMockPrediction(payload: PredictPayload): number {
  // Formula pendekatan estimasi tarif ongkir BRL yang realistis
  const weightFactor = payload.weight_kg * 1.75;
  const distanceFactor = payload.distance_km * 0.014;
  const volumeFactor = (payload.volume_cm3 / 10000) * 0.85;
  const priceLogFactor = Math.log1p(payload.price) * 1.5;

  const rawRate = 12.5 + weightFactor + distanceFactor + volumeFactor + priceLogFactor;
  return Math.round(rawRate * 100) / 100;
}

export function generateMockDetectLeak(payload: PredictPayload): DetectLeakResponse {
  const predictedRate = generateMockPrediction(payload);
  const actualRate = payload.price;
  const ratio = Math.round((actualRate / predictedRate) * 10000) / 10000;
  const threshold = MODEL_CONFIG.THRESHOLD;
  const isLeak = ratio > threshold;

  const message = isLeak
    ? `⚠️ Terindikasi Kebocoran Profit! Rasio tarif (${ratio.toFixed(2)}) melampaui batas ambang ${threshold}. Tarif aktual lebih tinggi dari estimasi model.`
    : `✅ Tarif Wajar / Optimal. Rasio tarif (${ratio.toFixed(2)}) berada di bawah batas ambang ${threshold}. Tidak terdeteksi kebocoran profit.`;

  return {
    predicted_rate: predictedRate,
    actual_rate: actualRate,
    ratio,
    is_leak: isLeak,
    threshold,
    currency: MODEL_CONFIG.CURRENCY,
    message,
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
 * Prediksi tarif ongkir model v5
 * POST /api/predict
 */
export async function predictRate(
  payload: PredictPayload,
  options?: RequestOptions
): Promise<PredictResponse> {
  // Validasi lokal sebelum kirim request
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
    // Jika koneksi gagal, berikan opsi fallback otomatis jika diizinkan
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Gagal memanggil endpoint /api/predict: ${msg}. Periksa apakah backend FastAPI berjalan di ${BASE_URL}.`
    );
  }
}

/**
 * Deteksi kebocoran profit (Prediksi + Rasio + Flag Leak)
 * POST /api/detect-leak
 */
export async function detectLeak(
  payload: PredictPayload,
  options?: RequestOptions
): Promise<DetectLeakResponse> {
  // Validasi lokal sebelum kirim request
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
    throw new Error(
      `Gagal memanggil endpoint /api/detect-leak: ${msg}. Periksa apakah backend FastAPI berjalan di ${BASE_URL}.`
    );
  }
}
