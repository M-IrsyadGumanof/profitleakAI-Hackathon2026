/**
 * ========================================================================
 * ProfitLeak AI - TypeScript Type Definitions & API Contracts (v6 Multi-Detector)
 * Owner: Suhafdal (Frontend Integration Engineer)
 * Branch: suhafdal
 * Rujukan: Kontrak API Bagian 5 (pembagian_tim_5_orang.txt) & backend/main.py
 * ========================================================================
 */

// ------------------------------------------------------------------------
// 1. KONFIGURASI MODEL & BATASAN VALIDASI (VALID RANGES)
// ------------------------------------------------------------------------
export const MODEL_CONFIG = {
  VERSION: "v6",
  CURRENCY: "BRL",
  DEFAULT_THRESHOLD: 3.09779,
  MARGIN_THRESHOLD: 0.8808,
  MARGIN_PROBA_THRESHOLD: 0.46,
  MAX_CSV_ROWS: 50000,
  RANGES: {
    weight_kg: {
      min: 0.05,
      max: 30.0,
      unit: "kg",
      label: "Berat Paket",
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
      label: "Volume Paket",
      step: 1,
    },
    price: {
      min: 4.99,
      max: 2110.0,
      unit: "BRL",
      label: "Harga Barang",
      step: 0.01,
    },
  },
} as const;

// ------------------------------------------------------------------------
// 2. KONTRAK REQUEST PAYLOAD
// ------------------------------------------------------------------------

/** Payload dasar untuk POST /api/predict (4 wajib, 4 opsional untuk v6 density) */
export interface PredictionRequest {
  weight_kg: number;          // 0.05 .. 30.0 kg
  distance_km: number;        // 1.4896 .. 3135.7885 km
  volume_cm3: number;         // 352.0 .. 244608.0 cm³
  price: number;              // 4.99 .. 2110.0 BRL

  // Opsional (untuk kalkulasi kepadatan density_g_cm3 di backend v6)
  product_weight_g?: number;
  length_cm?: number;
  height_cm?: number;
  width_cm?: number;
}

// Alias untuk kompatibilitas
export type PredictPayload = PredictionRequest;

/** Payload untuk POST /api/detect-leak */
export interface LeakDetectionRequest extends PredictionRequest {
  /** Tarif ongkir aktual (bila kosong, backend memakai nilai price) */
  actual_rate?: number;
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

/** Response dari GET /api/model-info */
export interface ModelInfoResponse {
  info: Record<string, unknown>;
  threshold: number;
  margin_threshold: number;
  margin_proba_threshold: number;
  detectors: string[];
  scope: {
    covered: string[];
    not_covered: string[];
    reason: string;
  };
  valid_ranges: Record<string, [number, number]>;
  rate_features: string[];
  required_inputs: string[];
  optional_inputs: string[];
}

/** Response dari POST /api/predict */
export interface PredictResponse {
  predicted_rate: number;
  currency: string; // "BRL"
}

export interface LeakReason {
  code: "rate_exceeds_fair" | "freight_eats_margin" | string;
  severity: "high" | "medium" | string;
  detail: string;
  remedy: string;
}

/** Response dari POST /api/detect-leak (v6 Multi-Detector) */
export interface DetectLeakResponse {
  predicted_rate: number;
  actual_rate: number;
  ratio: number;
  is_leak: boolean;
  threshold: number;
  currency: string;
  message: string;

  // v6 Multi-faktor & Analisis Risiko
  risk_score: number;
  freight_ratio: number;
  margin_risk_probability: number;
  detectors: {
    rate: boolean;   // Tarif aktual > ambang wajar
    margin: boolean; // Transaksi tidak ekonomis (ongkir menyerap margin)
  };
  reasons: LeakReason[];
}

// Alias untuk kemudahan
export type LeakDetectionResponse = DetectLeakResponse;

// ------------------------------------------------------------------------
// 4. KONTRAK RESPONSE POST /api/upload-csv
// ------------------------------------------------------------------------

export interface CsvUploadSummary {
  total_rows: number;
  analysed: number;
  skipped: number;
  leaks: number;
  rate_leaks: number;
  margin_risks: number;
  estimated_loss: number;
  leak_rate: number;
}

export interface CsvRecommendation {
  code: string;
  count: number;
  recommendation: string;
}

export interface CsvRowResult {
  line: number;
  predicted_rate: number;
  actual_rate: number;
  ratio: number;
  freight_ratio: number;
  margin_risk_probability: number;
  is_leak: boolean;
  risk_score: number;
  detectors: {
    rate: boolean;
    margin: boolean;
  };
  reasons: LeakReason[];
}

export interface CsvSkippedRow {
  line: number;
  reason: string;
}

export interface UploadCsvResponse {
  filename: string;
  currency: string;
  threshold: number;
  margin_threshold: number;
  summary: CsvUploadSummary;
  reason_breakdown: Record<string, number>;
  recommendations: CsvRecommendation[];
  rows: CsvRowResult[];
  skipped: CsvSkippedRow[];
}

/** Format Standar Error Response dari FastAPI */
export interface ApiErrorResponse {
  detail: string | { loc: string[]; msg: string; type: string }[];
}

// ------------------------------------------------------------------------
// 5. TIPE BANTU STATE UI (Untuk mempermudah Ihqfal di page.tsx & components)
// ------------------------------------------------------------------------
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof PredictionRequest | "actual_rate", string>>;
}

// ------------------------------------------------------------------------
// 6. TIPE ENTITAS DATABASE (Sesuai ERD & DDL PostgreSQL)
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
