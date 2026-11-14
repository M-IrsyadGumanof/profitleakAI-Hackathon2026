/**
 * ========================================================================
 * ProfitLeak AI - TypeScript Type Definitions & API Contracts
 * Owner: Suhafdal (Frontend Integration Engineer)
 * Branch: feat/suhafdal-integration / suhafdal
 * Rujukan: Kontrak API Bagian 4 & Rancangan Database ERD
 * ========================================================================
 */

// ------------------------------------------------------------------------
// 1. BATASAN VALIDASI INPUT MODEL v5 (VALID RANGES)
// ------------------------------------------------------------------------
export const MODEL_CONFIG = {
  VERSION: "v5",
  CURRENCY: "BRL",
  THRESHOLD: 1.102309,
  BASELINE_MEDIAN_RESIDUAL: -0.011977,
  RANGES: {
    weight_kg: {
      min: 0.05,
      max: 30.0,
      unit: "kg",
      label: "Berat Produk",
      step: 0.01,
    },
    distance_km: {
      min: 1.4896,
      max: 3135.7885,
      unit: "km",
      label: "Jarak Pengiriman",
      step: 0.1,
    },
    volume_cm3: {
      min: 352.0,
      max: 244608.0,
      unit: "cm³",
      label: "Volume Produk",
      step: 1,
    },
    price: {
      min: 4.99,
      max: 2110.0,
      unit: "BRL",
      label: "Harga Barang / Tarif Dasar",
      step: 0.01,
    },
  },
} as const;

// ------------------------------------------------------------------------
// 2. KONTRAK REQUEST PAYLOAD
// Dipakai oleh: POST /api/predict dan POST /api/detect-leak
// ------------------------------------------------------------------------
export interface PredictPayload {
  weight_kg: number;   // 0.05 .. 30.0 kg
  distance_km: number; // 1.4896 .. 3135.7885 km
  volume_cm3: number;  // 352.0 .. 244608.0 cm3
  price: number;       // 4.99 .. 2110.0 BRL
}

// ------------------------------------------------------------------------
// 3. KONTRAK RESPONSE DARI BACKEND
// ------------------------------------------------------------------------

/** Response dari GET /api/health */
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

/** Response dari POST /api/predict */
export interface PredictResponse {
  predicted_rate: number;
  currency: string; // "BRL"
}

/** Response dari POST /api/detect-leak */
export interface DetectLeakResponse {
  predicted_rate: number; // Tarif ongkir prediksi dari model
  actual_rate: number;    // Tarif aktual / masukan price
  ratio: number;          // actual_rate / predicted_rate
  is_leak: boolean;       // true jika ratio > threshold (1.102309)
  threshold: number;      // 1.102309
  currency: string;       // "BRL"
  message: string;        // Penjelasan status (misal: "Aman" / "Terindikasi Bocor")
}

/** Format Standar Error Response dari FastAPI (400 / 422 / 500) */
export interface ApiErrorResponse {
  detail: string | { loc: string[]; msg: string; type: string }[];
}

// ------------------------------------------------------------------------
// 4. TIPE BANTU STATE UI (Untuk mempermudah Ihqfal di page.tsx)
// ------------------------------------------------------------------------
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof PredictPayload, string>>;
}

// ------------------------------------------------------------------------
// 5. TIPE ENTITAS DATABASE (Sesuai ERD & DDL PostgreSQL)
// Berguna untuk representasi data riwayat, tabel transaksi, atau integrasi DB
// ------------------------------------------------------------------------
export interface CustomerEntity {
  customer_id: string; // CHAR(32)
  zip_code_prefix?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

export interface SellerEntity {
  seller_id: string; // CHAR(32)
  zip_code_prefix?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

export interface ProductEntity {
  product_id: string; // CHAR(32)
  category?: string;
  weight_g?: number;
  length_cm?: number;
  height_cm?: number;
  width_cm?: number;
}

export interface OrderItemEntity {
  order_item_id: number; // BIGSERIAL
  order_id: string;
  product_id: string;
  seller_id: string;
  price: number;
  freight_value: number;
  weight_kg: number;
  volume_cm3: number;
  distance_km: number;
}

export interface PredictionEntity {
  prediction_id: number;
  order_item_id: number;
  predicted_rate: number;
  price_log: number;
  model_version: string;
  created_at: string;
}

export interface LeakFlagEntity {
  flag_id: number;
  prediction_id: number;
  actual_rate: number;
  ratio: number;
  threshold: number;
  is_leak: boolean;
  created_at: string;
}
