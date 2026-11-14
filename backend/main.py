"""ProfitLeak AI - Backend API.

Melayani prediksi tarif wajar (ongkir) dan deteksi kebocoran profit
menggunakan model final v5 (HistGradientBoostingRegressor).

Artefak model ``profitleak_final_model_v5.pkl`` berisi ``dict`` (bundle),
bukan estimator langsung. Strukturnya:

    {
        "version": "v5",
        "rate_model": HistGradientBoostingRegressor,
        "threshold": 1.1023086187410245,
        "rate_features": ["weight_kg", "distance_km", "volume_cm3", "price_log"],
        "threshold_quantile": 0.998,
        "baseline_median_residual": -0.011976750015409099,
        "valid_ranges": {"weight_kg": (0.05, 30.0), ...},
        "currency": "BRL",
    }

Model dan metadata dimuat SATU KALI saat startup (lifespan), tidak pernah
dibaca ulang per request.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import os
import time
import warnings
from collections import OrderedDict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import joblib
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

# ---------------------------------------------------------------------------
# Konfigurasi & path dinamis (relatif terhadap lokasi file ini)
# ---------------------------------------------------------------------------

SERVICE_NAME = "profitleak-api"
SERVICE_VERSION = "0.1.0"

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "profitleak_final_model_v5.pkl"
INFO_PATH = MODEL_DIR / "profitleak_final_model_info_v5.json"

# --- Konfigurasi LLM (Gemini) untuk endpoint /api/advice ----------------
# Key HANYA dibaca dari backend/.env (tidak pernah dikirim ke browser).
# Bila kosong, fitur saran tetap berjalan dengan mode "rule_based".
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)
GEMINI_TIMEOUT_SECONDS = 20.0

# Batas biaya/token: hanya ringkasan + N baris terburuk yang dikirim.
ADVICE_MAX_ROWS = 5
ADVICE_MAX_OUTPUT_TOKENS = 800
ADVICE_TEMPERATURE = 0.3

# Ongkir dianggap sehat bila menyerap <= 30% harga jual.
# Dipakai menghitung "harga jual minimal" DI PYTHON, bukan oleh LLM.
ADVICE_TARGET_FREIGHT_SHARE = 0.3

# Rate limit sederhana per IP (kuota aman saat demo).
ADVICE_RATE_LIMIT = 5
ADVICE_RATE_WINDOW_SECONDS = 60.0

# Cache hasil agar klik ulang tidak memanggil Gemini lagi.
ADVICE_CACHE_MAX_ENTRIES = 32

# Urutan fitur WAJIB sama dengan model (rate_model.feature_names_in_).
# Sejak v6 ada fitur turunan tambahan: density_g_cm3.
RATE_FEATURES = [
    "weight_kg",
    "distance_km",
    "volume_cm3",
    "price_log",
    "density_g_cm3",
]

# Fitur yang WAJIB dikirim klien.
REQUIRED_INPUTS = ["weight_kg", "distance_km", "volume_cm3", "price"]

# Fitur turunan yang dihitung backend bila klien tidak mengirimnya.
DERIVED_FEATURES = ["price_log", "density_g_cm3"]

# Fallback bila bundle/metadata tidak menyediakan threshold.
DEFAULT_THRESHOLD = 1.102309
DEFAULT_MARGIN_RATIO_THRESHOLD = 0.8808
CURRENCY = "BRL"

ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Cakupan deteksi yang jujur - disampaikan eksplisit ke klien/frontend.
SCOPE: dict[str, Any] = {
    "covered": [
        "tarif ongkir aktual jauh di atas tarif wajar",
        "ongkir menyerap porsi besar dari harga jual",
    ],
    "not_covered": [
        "harga modal / COGS / HPP",
        "diskon",
        "margin keuntungan bersih",
    ],
    "reason": (
        "Dataset Olist tidak memuat kolom harga modal maupun diskon, sehingga "
        "aspek tersebut tidak dapat dilatih."
    ),
}

# Fallback rentang valid bila metadata belum/tidak memuat valid_ranges.
DEFAULT_VALID_RANGES: dict[str, tuple[float, float]] = {
    "weight_kg": (0.05, 30.0),
    "distance_km": (1.4896, 3135.7885),
    "volume_cm3": (352.0, 244608.0),
    "price": (4.99, 2110.0),
}

# Label ramah untuk pesan validasi.
FIELD_LABELS = {
    "weight_kg": "Berat paket (weight_kg)",
    "distance_km": "Jarak pengiriman (distance_km)",
    "volume_cm3": "Volume paket (volume_cm3)",
    "price": "Harga barang (price)",
    "product_weight_g": "Berat produk dalam gram (product_weight_g)",
}

# State global - diisi sekali pada lifespan startup.
_MODEL: Any = None
_INFO: dict[str, Any] = {}
_BUNDLE: dict[str, Any] = {}
_THRESHOLD: float = DEFAULT_THRESHOLD
_MARGIN_THRESHOLD: float = DEFAULT_MARGIN_RATIO_THRESHOLD
_VALID_RANGES: dict[str, tuple[float, float]] = dict(DEFAULT_VALID_RANGES)
_FEATURE_DEFAULTS: dict[str, float] = {"density_g_cm3": 0.1118925831202046}
_RISK_MODEL: Any = None
_RISK_FEATURES: list[str] = []
_RISK_PROBA_THRESHOLD: float = 0.46


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _as_estimator(artifact: Any) -> Any:
    """Ambil estimator dari artefak hasil ``joblib.load``.

    Artefak v5 berupa dict bundle; bersikap toleran jika suatu saat
    disimpan sebagai estimator murni.
    """
    if hasattr(artifact, "predict"):
        return artifact
    if isinstance(artifact, dict):
        for key in ("rate_model", "model", "estimator"):
            estimator = artifact.get(key)
            if estimator is not None and hasattr(estimator, "predict"):
                return estimator
    raise RuntimeError(
        "Artefak model tidak valid: tidak ditemukan estimator dengan .predict()."
    )


def _resolve_threshold(artifact: Any, info: dict[str, Any]) -> float:
    """Ambil threshold dari bundle -> metadata -> konstanta fallback."""
    candidates = []
    if isinstance(artifact, dict):
        candidates.append(artifact.get("threshold"))
    candidates.append(info.get("threshold"))
    for value in candidates:
        try:
            threshold = float(value)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            continue
        if math.isfinite(threshold) and threshold > 0:
            return threshold
    return DEFAULT_THRESHOLD


def _resolve_valid_ranges(
    artifact: Any, info: dict[str, Any]
) -> dict[str, tuple[float, float]]:
    """Ambil valid_ranges dari metadata/bundle, fallback ke konstanta."""
    source: Any = None
    if isinstance(info.get("valid_ranges"), dict):
        source = info["valid_ranges"]
    elif isinstance(artifact, dict) and isinstance(artifact.get("valid_ranges"), dict):
        source = artifact["valid_ranges"]

    resolved = dict(DEFAULT_VALID_RANGES)
    if isinstance(source, dict):
        for field_name, bounds in source.items():
            if field_name not in DEFAULT_VALID_RANGES:
                continue
            try:
                low, high = (float(bounds[0]), float(bounds[1]))
            except (TypeError, ValueError, IndexError):
                continue
            if math.isfinite(low) and math.isfinite(high) and low < high:
                resolved[field_name] = (low, high)
    return resolved


def _density_from(product_weight_g: float | None, weight_kg: float,
                  length_cm: float | None, height_cm: float | None,
                  width_cm: float | None) -> float:
    """Hitung kepadatan (g/cm3). Fallback ke default model bila tak lengkap."""
    try:
        grams = float(product_weight_g) if product_weight_g is not None else None
        if grams is None:
            grams = float(weight_kg) * 1000.0
        if length_cm and height_cm and width_cm:
            vol = float(length_cm) * float(height_cm) * float(width_cm)
        else:
            vol = None
        if vol and vol > 0 and grams > 0:
            return grams / max(vol, 100.0)
    except (TypeError, ValueError):
        pass
    return float(_FEATURE_DEFAULTS.get("density_g_cm3", 1.0))


def _build_feature_row(values: dict[str, float]) -> np.ndarray:
    """Susun vektor fitur sesuai RATE_FEATURES; isi fitur turunan bila kosong."""
    row = []
    for name in RATE_FEATURES:
        if name in values and values[name] is not None:
            row.append(float(values[name]))
        elif name == "price_log":
            row.append(float(np.log1p(values["price"])))
        elif name == "density_g_cm3":
            row.append(_density_from(
                values.get("product_weight_g"), values["weight_kg"],
                values.get("length_cm"), values.get("height_cm"),
                values.get("width_cm"),
            ))
        else:
            row.append(float(_FEATURE_DEFAULTS.get(name, 0.0)))
    return np.asarray([row], dtype=float)


def _predict_rate(values: dict[str, float]) -> float:
    """Hitung tarif wajar (BRL) dari fitur mentah."""
    if _MODEL is None:  # pragma: no cover - dijaga oleh lifespan
        raise HTTPException(
            status_code=503,
            detail="Model belum siap. Silakan coba beberapa saat lagi.",
        )
    X = _build_feature_row(values)
    pred_log = float(_MODEL.predict(X)[0])
    return float(np.expm1(pred_log))


# ---------------------------------------------------------------------------
# Lifespan: muat model & metadata satu kali
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _MODEL, _INFO, _BUNDLE, _THRESHOLD, _VALID_RANGES, _MARGIN_THRESHOLD
    global _FEATURE_DEFAULTS, _RISK_MODEL, _RISK_FEATURES, _RISK_PROBA_THRESHOLD

    missing = [str(p) for p in (MODEL_PATH, INFO_PATH) if not p.exists()]
    if missing:
        raise RuntimeError(
            "File model/metadata tidak ditemukan: " + ", ".join(missing)
        )

    with warnings.catch_warnings():
        # Abaikan InconsistentVersionWarning bila versi scikit-learn pemuat
        # sedikit berbeda dari saat model disimpan.
        warnings.filterwarnings("ignore", message=".*InconsistentVersionWarning.*")
        artifact = joblib.load(MODEL_PATH)

    try:
        with INFO_PATH.open("r", encoding="utf-8") as handle:
            info = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Gagal membaca metadata model: {exc}") from exc

    _MODEL = _as_estimator(artifact)
    _INFO = info if isinstance(info, dict) else {}
    _BUNDLE = artifact if isinstance(artifact, dict) else {}
    _THRESHOLD = _resolve_threshold(artifact, _INFO)
    _VALID_RANGES = _resolve_valid_ranges(artifact, _INFO)

    # --- Guard kompatibilitas fitur ---
    # Cegah crash misterius bila model dan backend berbeda versi fitur.
    expected = getattr(_MODEL, "n_features_in_", None)
    if expected is not None and expected != len(RATE_FEATURES):
        raise RuntimeError(
            "Backend tidak cocok dengan model: model mengharapkan "
            f"{expected} fitur, backend menyiapkan {len(RATE_FEATURES)} "
            f"({RATE_FEATURES}). Periksa versi artefak di folder model/."
        )

    # --- Detektor tambahan v6 (opsional; v5 tetap jalan) ---
    _MARGIN_THRESHOLD = float(
        _BUNDLE.get("margin_ratio_threshold", DEFAULT_MARGIN_RATIO_THRESHOLD)
    )
    defaults = _BUNDLE.get("feature_defaults")
    if isinstance(defaults, dict):
        _FEATURE_DEFAULTS = {
            k: float(v) for k, v in defaults.items()
            if isinstance(v, (int, float))
        }

    # Detektor margin: model klasifikasi risiko (tanpa freight_value sebagai input)
    _RISK_MODEL = _BUNDLE.get("margin_risk_model")
    _RISK_FEATURES = list(_BUNDLE.get("margin_risk_features") or [])
    try:
        _RISK_PROBA_THRESHOLD = float(
            _BUNDLE.get("margin_proba_threshold", _RISK_PROBA_THRESHOLD)
        )
    except (TypeError, ValueError):
        pass

    try:
        yield
    finally:
        # Lepaskan referensi saat shutdown.
        _MODEL = None
        _INFO = {}
        _BUNDLE = {}
        _THRESHOLD = DEFAULT_THRESHOLD
        _MARGIN_THRESHOLD = DEFAULT_MARGIN_RATIO_THRESHOLD
        _VALID_RANGES = dict(DEFAULT_VALID_RANGES)
        _RISK_MODEL = None
        _RISK_FEATURES = []


# ---------------------------------------------------------------------------
# Aplikasi
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ProfitLeak AI API",
    version=SERVICE_VERSION,
    description=(
        "API deteksi transaksi tidak ekonomis berbasis harga jual & ongkir. "
        "Mencakup: tarif ongkir di atas tarif wajar, dan ongkir yang menyerap "
        "porsi besar harga jual. Tidak mencakup harga modal maupun diskon."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def _validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Ubah error validasi Pydantic (422) menjadi 400 + `detail` berupa STRING.

    Kontrak API (docs/API_CONTRACT.md bagian F) mewajibkan seluruh kesalahan
    input dikembalikan sebagai HTTP 400 dengan ``{"detail": "<pesan ramah>"}``
    agar frontend cukup menampilkan ``detail`` apa adanya.
    """
    first = (exc.errors() or [{}])[0]
    location = ".".join(
        str(part) for part in first.get("loc", ()) if part not in ("body", "query")
    )
    message = first.get("msg", "Input tidak valid.")
    detail = (
        f"Kolom '{location}' tidak valid: {message}."
        if location
        else f"Input tidak valid: {message}."
    )
    return JSONResponse(status_code=400, content={"detail": detail})


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------


class _PackageBase(BaseModel):
    """Base untuk input paket; menyediakan validator bersama (400, bukan 422)."""

    @field_validator(
        "weight_kg", "distance_km", "volume_cm3", "price", "actual_rate",
        check_fields=False,
    )
    @classmethod
    def _check_finite(cls, value: float | None, info) -> float | None:
        if value is None:
            return value
        if not math.isfinite(value):
            label = FIELD_LABELS.get(info.field_name, info.field_name)
            raise HTTPException(
                status_code=400,
                detail=f"{label} harus berupa angka yang valid (bukan NaN/inf).",
            )
        return value

    @field_validator(
        "weight_kg", "distance_km", "volume_cm3", "price", "actual_rate",
        check_fields=False,
    )
    @classmethod
    def _check_valid_range(cls, value: float | None, info) -> float | None:
        if value is None:
            return value
        _validate_range(info.field_name, value)
        return value


class PredictionRequest(_PackageBase):
    """Input prediksi tarif wajar (validasi sesuai ``valid_ranges`` model).

    Empat field pertama WAJIB (kompatibel dengan klien v5). Field tambahan
    bersifat OPSIONAL dan dipakai untuk menghitung fitur turunan v6
    (``density_g_cm3``). Bila tidak diisi, backend memakai nilai default model.
    """

    weight_kg: float
    distance_km: float
    volume_cm3: float
    price: float

    # --- Opsional: dipakai menghitung kepadatan untuk fitur v6 ---
    product_weight_g: float | None = None
    length_cm: float | None = None
    height_cm: float | None = None
    width_cm: float | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "weight_kg": 5.0,
                    "distance_km": 1000.0,
                    "volume_cm3": 20000.0,
                    "price": 300.0,
                }
            ]
        }
    }


class LeakDetectionRequest(PredictionRequest):
    """Input deteksi kebocoran: prediksi + tarif aktual opsional.

    Bila ``actual_rate`` tidak diisi, nilai ``price`` dipakai sebagai tarif
    aktual.
    """

    actual_rate: float | None = None

    @field_validator("actual_rate")
    @classmethod
    def _check_actual_rate_positive(cls, value: float | None) -> float | None:
        if value is not None and value <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tarif aktual (actual_rate) harus lebih besar dari 0. "
                    f"Nilai Anda: {value}."
                ),
            )
        return value

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "weight_kg": 5.0,
                    "distance_km": 1000.0,
                    "volume_cm3": 20000.0,
                    "price": 300.0,
                    "actual_rate": 900.0,
                }
            ]
        }
    }


def _validate_range(field_name: str, value: float) -> None:
    """Pastikan ``value`` berada di dalam rentang valid (HTTP 400 bila tidak).

    Field yang tidak punya rentang terdefinisi (mis. ``actual_rate``)
    dilewatkan tanpa pengecekan.
    """
    bounds = _VALID_RANGES.get(field_name) or DEFAULT_VALID_RANGES.get(field_name)
    if bounds is None:
        return
    low, high = bounds
    if not (low <= value <= high):
        label = FIELD_LABELS.get(field_name, field_name)
        raise HTTPException(
            status_code=400,
            detail=(
                f"{label} di luar rentang yang didukung model. "
                f"Nilai harus di antara {low:g} dan {high:g}. "
                f"Nilai Anda: {value:g}."
            ),
        )


class PredictResponse(BaseModel):
    predicted_rate: float
    currency: str


class DetectLeakResponse(BaseModel):
    predicted_rate: float
    actual_rate: float
    ratio: float
    is_leak: bool
    threshold: float
    currency: str
    message: str
    # --- tambahan v6: penjelasan multi-faktor ---
    risk_score: float = 0.0
    freight_ratio: float = 0.0
    margin_risk_probability: float = 0.0
    detectors: dict[str, bool] = {}
    reasons: list[dict[str, str]] = []


# --- Schema endpoint /api/advice (saran AI bahasa awam) --------------------


class AdviceRowIn(BaseModel):
    """Satu baris hasil analisis yang dikirim frontend (bukan CSV mentah)."""

    line: int
    predicted_rate: float = 0.0
    actual_rate: float = 0.0
    ratio: float = 0.0
    freight_ratio: float = 0.0
    is_leak: bool = False
    risk_score: float = 0.0
    detectors: dict[str, bool] = {}

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "line": 2,
                    "predicted_rate": 11.55,
                    "actual_rate": 55.0,
                    "ratio": 4.76,
                    "freight_ratio": 0.3438,
                    "is_leak": True,
                    "risk_score": 0.55,
                    "detectors": {"rate": True, "margin": False},
                }
            ]
        }
    }


class AdviceRequest(BaseModel):
    """Input saran AI: agregat + baris hasil analisis dari /api/upload-csv."""

    filename: str = ""
    threshold: float | None = None
    summary: dict[str, Any]
    rows: list[AdviceRowIn] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health")
def health() -> dict[str, str]:
    """Cek koneksi dasar frontend <-> backend."""
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
    }


@app.get("/api/model-info")
def model_info() -> dict[str, Any]:
    """Metadata model yang sedang dimuat (dibaca sekali saat startup)."""
    return {
        "info": _INFO,
        "threshold": _THRESHOLD,
        "margin_threshold": _MARGIN_THRESHOLD,
        "margin_proba_threshold": _RISK_PROBA_THRESHOLD,
        "detectors": _BUNDLE.get("detectors", ["rate"]),
        "scope": SCOPE,
        "valid_ranges": {
            name: [low, high] for name, (low, high) in _VALID_RANGES.items()
        },
        "rate_features": RATE_FEATURES,
        "required_inputs": REQUIRED_INPUTS,
        "optional_inputs": ["product_weight_g", "length_cm", "height_cm", "width_cm"],
    }


def _payload_values(payload: PredictionRequest) -> dict[str, float]:
    """Ubah payload menjadi dict fitur untuk model."""
    return {
        "weight_kg": payload.weight_kg,
        "distance_km": payload.distance_km,
        "volume_cm3": payload.volume_cm3,
        "price": payload.price,
        "product_weight_g": payload.product_weight_g,
        "length_cm": payload.length_cm,
        "height_cm": payload.height_cm,
        "width_cm": payload.width_cm,
    }


def _risk_proba(values: dict[str, float], price: float) -> float:
    """Probabilitas transaksi tidak ekonomis (ongkir menyerap porsi besar harga).

    Model dilatih TANPA freight_value sebagai input, sehingga ini prediksi
    sungguhan dari ciri paket + harga. Mengembalikan 0.0 bila model tidak ada.
    """
    if _RISK_MODEL is None or not _RISK_FEATURES:
        return 0.0
    try:
        density = values.get("density_g_cm3")
        if density is None:
            density = _density_from(
                values.get("product_weight_g"), values["weight_kg"],
                values.get("length_cm"), values.get("height_cm"),
                values.get("width_cm"),
            )
        feat = {
            "weight_kg": float(values["weight_kg"]),
            "distance_km": float(values["distance_km"]),
            "volume_cm3": float(values["volume_cm3"]),
            "density_g_cm3": float(density),
            "price_log": float(np.log1p(price)),
            "freight_ratio": 0.0,
        }
        X = np.asarray([[float(feat.get(n, 0.0)) for n in _RISK_FEATURES]], dtype=float)
        return float(_RISK_MODEL.predict_proba(X)[0][1])
    except Exception:
        return 0.0


def _analyse(values: dict[str, float], actual_rate: float) -> dict[str, Any]:
    """Jalankan semua detektor dan susun alasan + skor risiko.

    Dua detektor:
      rate    -> tarif aktual jauh di atas tarif wajar
      margin  -> model memprediksi transaksi tidak ekonomis
                 (ongkir menyerap porsi besar dari harga jual)
    """
    predicted_rate = _predict_rate(values)
    if predicted_rate <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Tarif wajar hasil model tidak valid (<= 0) untuk input ini, "
                "sehingga rasio tarif tidak dapat dihitung."
            ),
        )

    price = float(values["price"])
    ratio = actual_rate / predicted_rate
    freight_ratio = actual_rate / max(price, 1e-9)

    is_rate_leak = bool(ratio > _THRESHOLD)
    risk_score_model = _risk_proba(values, price)
    is_margin_risk = bool(risk_score_model >= _RISK_PROBA_THRESHOLD)

    reasons: list[dict[str, str]] = []
    if is_rate_leak:
        reasons.append({
            "code": "rate_exceeds_fair",
            "severity": "high",
            "detail": (
                f"Tarif aktual {ratio:.2f}x lipat tarif wajar "
                f"(ambang {_THRESHOLD:.4f}x)."
            ),
            "remedy": (
                "Negosiasi ulang tarif dengan ekspedisi atau gunakan layanan "
                "pengiriman yang lebih ekonomis untuk rute ini."
            ),
        })
    if is_margin_risk:
        reasons.append({
            "code": "freight_eats_margin",
            "severity": "high" if freight_ratio > 1.0 else "medium",
            "detail": (
                f"Model memprediksi risiko margin {risk_score_model * 100:.1f}% "
                f"(ambang {_RISK_PROBA_THRESHOLD * 100:.0f}%). "
                f"Ongkir aktual menyerap {freight_ratio * 100:.1f}% dari harga jual."
            ),
            "remedy": (
                "Naikkan harga jual, gabungkan pengiriman, atau terapkan "
                "minimum order agar ongkir tidak menghabiskan margin."
            ),
        })
    is_leak = bool(is_rate_leak or is_margin_risk)

    # Skor risiko 0..1: gabungan rasio tarif dan probabilitas risiko margin.
    rate_component = min(max((ratio - 1.0) / max(_THRESHOLD - 1.0, 1e-6), 0.0), 1.0)
    risk_component = min(max(risk_score_model, 0.0), 1.0)
    risk_score = round(
        0.55 * rate_component + 0.45 * risk_component, 4
    )

    return {
        "predicted_rate": predicted_rate,
        "actual_rate": actual_rate,
        "ratio": ratio,
        "freight_ratio": freight_ratio,
        "margin_risk_probability": risk_score_model,
        "is_leak": is_leak,
        "reasons": reasons,
        "risk_score": risk_score,
        "detectors": {
            "rate": is_rate_leak,
            "margin": is_margin_risk,
        },
    }


@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictionRequest) -> PredictResponse:
    """Prediksi tarif wajar (ongkir) untuk satu paket."""
    predicted_rate = _predict_rate(_payload_values(payload))
    return PredictResponse(
        predicted_rate=round(predicted_rate, 2),
        currency=CURRENCY,
    )


@app.post("/api/detect-leak", response_model=DetectLeakResponse)
def detect_leak(payload: LeakDetectionRequest) -> DetectLeakResponse:
    """Deteksi kebocoran profit dari beberapa faktor, bukan hanya ongkir."""
    actual_rate = (
        payload.actual_rate if payload.actual_rate is not None else payload.price
    )
    result = _analyse(_payload_values(payload), float(actual_rate))

    if result["is_leak"]:
        codes = {r["code"] for r in result["reasons"]}
        if "freight_eats_margin" in codes and "rate_exceeds_fair" not in codes:
            message = (
                "Terindikasi kebocoran profit: ongkir menyerap porsi harga jual "
                "terlalu besar sehingga margin tergerus"
            )
        elif "rate_exceeds_fair" in codes:
            message = (
                "Terindikasi kebocoran profit: tarif aktual melebihi batas wajar"
            )
        else:
            message = (
                "Terindikasi kebocoran profit: pola transaksi tidak wajar "
                "dan perlu ditinjau"
            )
    else:
        message = "Tarif dalam batas wajar"

    return DetectLeakResponse(
        predicted_rate=round(result["predicted_rate"], 2),
        actual_rate=round(result["actual_rate"], 2),
        ratio=round(result["ratio"], 4),
        is_leak=result["is_leak"],
        threshold=round(_THRESHOLD, 6),
        currency=CURRENCY,
        message=message,
        risk_score=result["risk_score"],
        freight_ratio=round(result["freight_ratio"], 4),
        margin_risk_probability=round(result["margin_risk_probability"], 4),
        detectors=result["detectors"],
        reasons=result["reasons"],
    )


# ---------------------------------------------------------------------------
# Analisis batch via upload CSV
# ---------------------------------------------------------------------------

# Kolom minimal yang harus ada di CSV.
CSV_REQUIRED = ["weight_kg", "distance_km", "volume_cm3", "price"]
# Kolom opsional yang dikenali.
CSV_OPTIONAL = ["freight_value", "actual_rate", "product_weight_g",
                "length_cm", "height_cm", "width_cm"]
MAX_CSV_ROWS = 50_000


def _parse_float(raw: str | None) -> float | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    try:
        value = float(text)
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)) -> dict[str, Any]:
    """Analisis banyak transaksi sekaligus dari file CSV.

    Kolom wajib: weight_kg, distance_km, volume_cm3, price.
    Kolom opsional: freight_value / actual_rate (tarif aktual), plus
    product_weight_g, length_cm, height_cm, width_cm.

    Bila ``freight_value``/``actual_rate`` tidak ada, ``price`` dipakai sebagai
    tarif aktual (perilaku sama dengan /api/detect-leak).
    """
    if _MODEL is None:
        raise HTTPException(503, "Model belum siap. Coba lagi sebentar.")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "File CSV kosong.")

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = raw.decode("latin-1")
        except Exception:
            raise HTTPException(400, "File tidak dapat dibaca sebagai teks CSV.")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(400, "CSV tidak memiliki baris header.")

    headers = [h.strip() for h in reader.fieldnames if h]
    missing = [c for c in CSV_REQUIRED if c not in headers]
    if missing:
        raise HTTPException(
            400,
            "Kolom wajib tidak ditemukan di CSV: "
            + ", ".join(missing)
            + ". Kolom wajib: "
            + ", ".join(CSV_REQUIRED)
            + ".",
        )

    results: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    totals = {
        "total_rows": 0,
        "analysed": 0,
        "skipped": 0,
        "leaks": 0,
        "rate_leaks": 0,
        "margin_risks": 0,
        "estimated_loss": 0.0,
    }
    reason_counts: dict[str, int] = {}

    for idx, row in enumerate(reader, start=2):
        row = {(k or "").strip(): v for k, v in row.items()}
        values = {c: _parse_float(row.get(c)) for c in CSV_REQUIRED}
        optional = {c: _parse_float(row.get(c)) for c in CSV_OPTIONAL}

        if any(values[c] is None for c in CSV_REQUIRED):
            skipped.append({"line": idx, "reason": "nilai wajib kosong/tidak valid"})
            continue

        # Validasi rentang -> baris dilewati, bukan menggagalkan seluruh file.
        out_of_range = None
        for name in CSV_REQUIRED:
            bounds = _VALID_RANGES.get(name)
            if bounds and not (bounds[0] <= values[name] <= bounds[1]):
                out_of_range = (
                    f"{name}={values[name]:g} di luar rentang "
                    f"{bounds[0]:g}..{bounds[1]:g}"
                )
                break
        if out_of_range:
            skipped.append({"line": idx, "reason": out_of_range})
            continue

        price = float(values["price"])
        actual = optional.get("freight_value")
        if actual is None:
            actual = optional.get("actual_rate")
        if actual is None:
            actual = price
        if actual <= 0:
            skipped.append({"line": idx, "reason": "tarif aktual <= 0"})
            continue

        payload_values = {
            "weight_kg": float(values["weight_kg"]),
            "distance_km": float(values["distance_km"]),
            "volume_cm3": float(values["volume_cm3"]),
            "price": price,
            "product_weight_g": optional.get("product_weight_g"),
            "length_cm": optional.get("length_cm"),
            "height_cm": optional.get("height_cm"),
            "width_cm": optional.get("width_cm"),
        }

        try:
            res = _analyse(payload_values, float(actual))
        except HTTPException as exc:
            skipped.append({"line": idx, "reason": str(exc.detail)})
            continue

        totals["total_rows"] += 1
        totals["analysed"] += 1
        if res["is_leak"]:
            totals["leaks"] += 1
        if res["detectors"]["rate"]:
            totals["rate_leaks"] += 1
        if res["detectors"]["margin"]:
            totals["margin_risks"] += 1

        # Estimasi kerugian: kelebihan tarif aktual atas tarif wajar.
        excess = max(float(actual) - res["predicted_rate"], 0.0)
        totals["estimated_loss"] += excess

        for r in res["reasons"]:
            reason_counts[r["code"]] = reason_counts.get(r["code"], 0) + 1

        results.append({
            "line": idx,
            "predicted_rate": round(res["predicted_rate"], 2),
            "actual_rate": round(res["actual_rate"], 2),
            "ratio": round(res["ratio"], 4),
            "freight_ratio": round(res["freight_ratio"], 4),
            "is_leak": res["is_leak"],
            "risk_score": res["risk_score"],
            "detectors": res["detectors"],
            "reasons": res["reasons"],
        })

        if len(results) >= MAX_CSV_ROWS:
            skipped.append(
                {"line": idx, "reason": f"melebihi batas {MAX_CSV_ROWS} baris"}
            )
            break

    totals["skipped"] = len(skipped)
    totals["estimated_loss"] = round(totals["estimated_loss"], 2)
    totals["leak_rate"] = (
        round(totals["leaks"] / totals["analysed"] * 100, 2)
        if totals["analysed"] else 0.0
    )

    # Rekomendasi agregat, diurutkan dari faktor paling sering.
    remedies = {
        "rate_exceeds_fair": (
            "Negosiasi tarif ekspedisi / pilih layanan lebih murah pada rute padat."
        ),
        "freight_eats_margin": (
            "Naikkan harga jual atau terapkan minimum order agar ongkir tidak "
            "menghabiskan margin."
        ),
    }
    top_recommendations = [
        {"code": code, "count": count, "recommendation": remedies.get(code, "")}
        for code, count in sorted(reason_counts.items(), key=lambda kv: -kv[1])
    ]

    return {
        "filename": file.filename,
        "currency": CURRENCY,
        "threshold": round(_THRESHOLD, 6),
        "margin_threshold": round(_MARGIN_THRESHOLD, 6),
        "summary": totals,
        "reason_breakdown": reason_counts,
        "recommendations": top_recommendations,
        "rows": results,
        "skipped": skipped[:200],
    }

# ---------------------------------------------------------------------------
# Saran AI (LLM) via Gemini - POST /api/advice
#
# Prinsip:
#   1. Ringkas dulu di Python (0 token), baru kirim ke LLM.
#   2. Cakupan saran SEMPIT: hanya ongkir vs tarif wajar dan ongkir vs
#      harga jual. HPP/modal/diskon tidak pernah dibahas.
#   3. Angka "harga jual minimal" dihitung Python (ADVICE_TARGET_FREIGHT_SHARE),
#      LLM hanya menarasikan agar tidak berhalusinasi.
#   4. Tanpa API key / timeout / JSON rusak -> fallback rule_based, HTTP 200.
# ---------------------------------------------------------------------------

ADVICE_CACHE: "OrderedDict[str, dict[str, Any]]" = OrderedDict()
ADVICE_RATE_BUCKETS: dict[str, list[float]] = {}

ADVICE_SCOPE_NOTE = (
    "Saran AI, bukan nasihat keuangan. Model tidak mencakup HPP "
    "(modal), diskon, maupun laba bersih."
)

ADVICE_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "headline": {"type": "STRING"},
        "ringkasan": {"type": "STRING"},
        "prioritas": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "judul": {"type": "STRING"},
                    "dampak": {"type": "STRING"},
                    "aksi": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "terdampak": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                },
                "required": ["judul", "dampak", "aksi"],
            },
        },
        "per_baris": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "line": {"type": "INTEGER"},
                    "masalah": {"type": "STRING"},
                    "saran_harga": {"type": "STRING"},
                },
                "required": ["line", "masalah"],
            },
        },
    },
    "required": ["headline", "ringkasan", "prioritas"],
}

ADVICE_SYSTEM_PROMPT = (
    "Anda konsultan logistik untuk pedagang e-commerce kecil. "
    "CAKUPAN HANYA: (1) ongkir aktual di atas tarif wajar, "
    "(2) ongkir menyerap porsi besar dari harga jual. "
    "DILARANG membahas: HPP/modal, diskon, iklan, pajak, retur, atau strategi "
    "marketing. Gunakan HANYA angka yang ada pada data; jangan membuat angka "
    "baru. Pakai bahasa sehari-hari tanpa jargon. "
    "Batas keras: headline maks 12 kata, ringkasan maks 2 kalimat, "
    "prioritas maks 3 item, tiap aksi maks 4 poin dan tiap poin maks 10 kata. "
    "Balas HANYA JSON sesuai skema, tanpa penjelasan tambahan."
)


def _advice_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _advice_target_price(actual_rate: float) -> float:
    """Harga jual minimal agar ongkir <= 30% harga (dihitung di Python)."""
    if actual_rate <= 0 or ADVICE_TARGET_FREIGHT_SHARE <= 0:
        return 0.0
    return round(actual_rate / ADVICE_TARGET_FREIGHT_SHARE, 2)


def _advice_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if math.isfinite(number) else default


def _advice_context(payload: AdviceRequest) -> dict[str, Any]:
    """Ringkas payload menjadi konteks kecil untuk LLM (hemat token)."""
    summary = payload.summary or {}
    leaks = int(_advice_float(summary.get("leaks")))
    analysed = int(_advice_float(summary.get("analysed")))
    leak_rate = _advice_float(summary.get("leak_rate"))
    threshold = payload.threshold if payload.threshold else _THRESHOLD

    leak_rows = [row for row in payload.rows if row.is_leak]
    leak_rows.sort(
        key=lambda row: (_advice_float(row.risk_score), _advice_float(row.ratio)),
        reverse=True,
    )
    top_rows = leak_rows[:ADVICE_MAX_ROWS]

    rows_context = []
    for row in top_rows:
        actual_rate = _advice_float(row.actual_rate)
        rows_context.append(
            {
                "line": row.line,
                "tarif_aktual_brl": round(actual_rate, 2),
                "tarif_wajar_brl": round(_advice_float(row.predicted_rate), 2),
                "rasio_vs_wajar": round(_advice_float(row.ratio), 2),
                "ongkir_persen_dari_harga": round(
                    _advice_float(row.freight_ratio) * 100.0, 1
                ),
                "harga_jual_minimal_brl": _advice_target_price(actual_rate),
                "detektor": [
                    name
                    for name, active in (row.detectors or {}).items()
                    if active
                ],
            }
        )

    return {
        "berkas": payload.filename,
        "mata_uang": CURRENCY,
        "ambang_rasio_tarif": threshold,
        "total_transaksi": analysed,
        "jumlah_terindikasi": leaks,
        "persen_terindikasi": round(leak_rate, 1),
        "jumlah_ongkir_terlalu_mahal": int(
            _advice_float(summary.get("rate_leaks"))
        ),
        "jumlah_ongkir_menggerus_harga": int(
            _advice_float(summary.get("margin_risks"))
        ),
        "estimasi_kelebihan_ongkir_brl": round(
            _advice_float(summary.get("estimated_loss")), 2
        ),
        "baris_terburuk": rows_context,
    }


def _advice_static_safe(payload: AdviceRequest) -> dict[str, Any]:
    """Jawaban tanpa LLM saat tidak ada kebocoran (0 token)."""
    analysed = int(_advice_float((payload.summary or {}).get("analysed")))
    return {
        "source": "rule_based",
        "generated_at": _advice_now_iso(),
        "headline": "Tidak ada kebocoran ongkir yang terdeteksi",
        "ringkasan": (
            f"Dari {analysed} transaksi, ongkir semuanya masih dalam batas wajar "
            f"dan tidak menggerus harga jual."
        ),
        "prioritas": [],
        "per_baris": [],
        "catatan": ADVICE_SCOPE_NOTE,
    }


def _advice_rule_based(
    payload: AdviceRequest, context: dict[str, Any]
) -> dict[str, Any]:
    """Fallback deterministik bila Gemini tidak tersedia."""
    leaks = int(context["jumlah_terindikasi"])
    analysed = int(context["total_transaksi"])
    loss = context["estimasi_kelebihan_ongkir_brl"]
    rate_leaks = int(context["jumlah_ongkir_terlalu_mahal"])
    margin_risks = int(context["jumlah_ongkir_menggerus_harga"])
    threshold = context["ambang_rasio_tarif"]

    prioritas: list[dict[str, Any]] = []
    affected = [row["line"] for row in context["baris_terburuk"]]

    if rate_leaks > 0:
        prioritas.append(
            {
                "judul": "Negosiasi ulang tarif ekspedisi",
                "dampak": f"Potensi hemat hingga R$ {loss:.2f}",
                "aksi": [
                    "Minta daftar tarif resmi dari ekspedisi",
                    "Bandingkan minimal dua ekspedisi",
                    "Terapkan tarif wajar sebagai batas negosiasi",
                ],
                "terdampak": affected,
            }
        )
    if margin_risks > 0:
        prioritas.append(
            {
                "judul": "Naikkan harga jual atau gabung pengiriman",
                "dampak": "Ongkir turun di bawah 30% harga jual",
                "aksi": [
                    "Naikkan harga ke minimal yang tertera di tabel",
                    "Gabungkan beberapa item dalam satu paket",
                    "Terapkan minimum order untuk gratis ongkir",
                ],
                "terdampak": affected,
            }
        )

    per_baris = [
        {
            "line": row["line"],
            "masalah": (
                f"Ongkir {row['rasio_vs_wajar']:.2f}x tarif wajar "
                f"(ambang {float(threshold):.2f}x)"
            ),
            "saran_harga": (
                f"Naikkan harga jual minimal ke R$ "
                f"{row['harga_jual_minimal_brl']:.2f}"
            ),
        }
        for row in context["baris_terburuk"]
    ]

    return {
        "source": "rule_based",
        "generated_at": _advice_now_iso(),
        "headline": f"{leaks} dari {analysed} transaksi terindikasi bocor",
        "ringkasan": (
            f"Ongkir terlalu mahal pada {rate_leaks} transaksi dan menggerus "
            f"harga jual pada {margin_risks} transaksi."
        ),
        "prioritas": prioritas,
        "per_baris": per_baris,
        "catatan": ADVICE_SCOPE_NOTE,
    }


def _advice_clip_words(text: Any, max_words: int) -> str:
    words = str(text or "").split()
    if len(words) > max_words:
        return " ".join(words[:max_words]) + "..."
    return " ".join(words)


def _advice_clip_sentences(text: Any, max_sentences: int) -> str:
    raw = str(text or "").strip()
    if not raw:
        return ""
    parts: list[str] = []
    current = ""
    for char in raw:
        current += char
        if char in ".!?":
            parts.append(current.strip())
            current = ""
            if len(parts) >= max_sentences:
                break
    if current.strip() and len(parts) < max_sentences:
        parts.append(current.strip())
    return " ".join(parts)


def _advice_parse_response(
    raw: Any, context: dict[str, Any]
) -> dict[str, Any] | None:
    """Validasi & pangkas keluaran LLM. None bila tidak layak dipakai."""
    if not isinstance(raw, dict):
        return None

    headline = _advice_clip_words(raw.get("headline"), 12)
    ringkasan = _advice_clip_sentences(raw.get("ringkasan"), 2)
    if not headline or not ringkasan:
        return None

    valid_lines = {row["line"] for row in context["baris_terburuk"]}
    target_by_line = {
        row["line"]: row["harga_jual_minimal_brl"]
        for row in context["baris_terburuk"]
    }

    prioritas: list[dict[str, Any]] = []
    for item in (raw.get("prioritas") or [])[:3]:
        if not isinstance(item, dict):
            continue
        judul = _advice_clip_words(item.get("judul"), 8)
        if not judul:
            continue
        aksi = [
            _advice_clip_words(step, 10)
            for step in (item.get("aksi") or [])
            if str(step).strip()
        ][:4]
        terdampak = [
            int(line)
            for line in (item.get("terdampak") or [])
            if isinstance(line, (int, float)) and int(line) in valid_lines
        ][:ADVICE_MAX_ROWS]
        prioritas.append(
            {
                "judul": judul,
                "dampak": _advice_clip_words(item.get("dampak"), 12),
                "aksi": aksi,
                "terdampak": terdampak or sorted(valid_lines),
            }
        )

    per_baris: list[dict[str, Any]] = []
    seen: set[int] = set()
    for item in raw.get("per_baris") or []:
        if not isinstance(item, dict):
            continue
        try:
            line = int(item.get("line"))
        except (TypeError, ValueError):
            continue
        if line not in valid_lines or line in seen:
            continue
        seen.add(line)
        saran = _advice_clip_words(item.get("saran_harga"), 14)
        if not saran:
            saran = (
                f"Naikkan harga jual minimal ke R$ {target_by_line[line]:.2f}"
            )
        per_baris.append(
            {
                "line": line,
                "masalah": _advice_clip_words(item.get("masalah"), 14),
                "saran_harga": saran,
            }
        )

    return {
        "headline": headline,
        "ringkasan": ringkasan,
        "prioritas": prioritas,
        "per_baris": per_baris,
    }


def _advice_prompt(context: dict[str, Any]) -> str:
    return (
        "Data hasil audit ongkir dalam format JSON. Buat saran perbaikan "
        "yang singkat dan bisa langsung dijalankan pedagang.\n"
        + json.dumps(context, ensure_ascii=False, separators=(",", ":"))
    )


async def _advice_call_gemini(context: dict[str, Any]) -> dict[str, Any] | None:
    """Panggil Gemini sekali; None bila gagal (pemanggil pakai fallback)."""
    if not GEMINI_API_KEY:
        return None

    body = {
        "system_instruction": {"parts": [{"text": ADVICE_SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": _advice_prompt(context)}]}],
        "generationConfig": {
            "temperature": ADVICE_TEMPERATURE,
            "maxOutputTokens": ADVICE_MAX_OUTPUT_TOKENS,
            "responseMimeType": "application/json",
            "responseSchema": ADVICE_RESPONSE_SCHEMA,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SECONDS) as client:
            response = await client.post(
                GEMINI_URL,
                params={"key": GEMINI_API_KEY},
                json=body,
            )
        if response.status_code != 200:
            return None
        data = response.json()
        candidate = (data.get("candidates") or [{}])[0]
        text = (candidate.get("content") or {}).get("parts", [{}])[0].get("text")
        if not text:
            return None
        return json.loads(text)
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
        # Timeout, koneksi gagal, atau JSON rusak -> fallback rule_based.
        return None


def _advice_cache_get(key: str) -> dict[str, Any] | None:
    cached = ADVICE_CACHE.get(key)
    if cached is None:
        return None
    ADVICE_CACHE.move_to_end(key)
    return dict(cached)


def _advice_cache_put(key: str, value: dict[str, Any]) -> None:
    ADVICE_CACHE[key] = value
    ADVICE_CACHE.move_to_end(key)
    while len(ADVICE_CACHE) > ADVICE_CACHE_MAX_ENTRIES:
        ADVICE_CACHE.popitem(last=False)


def _advice_check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    window_start = now - ADVICE_RATE_WINDOW_SECONDS
    timestamps = [
        stamp
        for stamp in ADVICE_RATE_BUCKETS.get(ip, [])
        if stamp >= window_start
    ]
    if len(timestamps) >= ADVICE_RATE_LIMIT:
        ADVICE_RATE_BUCKETS[ip] = timestamps
        raise HTTPException(
            status_code=429,
            detail=(
                "Terlalu banyak permintaan saran. Tunggu sekitar 1 menit "
                "lalu coba lagi."
            ),
        )
    timestamps.append(now)
    ADVICE_RATE_BUCKETS[ip] = timestamps


@app.post("/api/advice")
async def advice(payload: AdviceRequest, request: Request) -> dict[str, Any]:
    """Saran perbaikan berbahasa awam dari hasil analisis CSV.

    Sumber saran: Gemini bila ``GEMINI_API_KEY`` tersedia, jika tidak
    (atau saat Gemini gagal) memakai aturan deterministik ``rule_based``.
    """
    ip = request.client.host if request.client else "unknown"
    _advice_check_rate_limit(ip)

    context = _advice_context(payload)
    if int(context["jumlah_terindikasi"]) <= 0:
        # Tidak ada kebocoran: tidak perlu memanggil LLM sama sekali.
        return _advice_static_safe(payload)

    cache_key = hashlib.sha256(
        json.dumps(context, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()
    cached = _advice_cache_get(cache_key)
    if cached is not None:
        return cached

    raw = await _advice_call_gemini(context)
    parsed = _advice_parse_response(raw, context)

    if parsed is None:
        result = _advice_rule_based(payload, context)
        result["generated_at"] = _advice_now_iso()
    else:
        result = {
            "source": "gemini",
            "generated_at": _advice_now_iso(),
            **parsed,
            "catatan": ADVICE_SCOPE_NOTE,
        }

    _advice_cache_put(cache_key, result)
    return result


# ---------------------------------------------------------------------------
# Endpoint AI Copilot Chat: POST /api/copilot-chat
# ---------------------------------------------------------------------------

class ChatHistoryItem(BaseModel):
    role: str  # "user" | "model"
    content: str


class CopilotChatRequest(BaseModel):
    message: str
    history: list[ChatHistoryItem] = []
    summary: dict[str, Any] = {}
    rows: list[dict[str, Any]] = []
    filename: str = ""


class CopilotChatResponse(BaseModel):
    reply: str
    source: str


def _copilot_rule_based_reply(
    message: str, summary: dict[str, Any], rows: list[dict[str, Any]]
) -> str:
    msg = message.lower()
    leaks = summary.get("leaks", 0)
    loss = float(summary.get("estimated_loss", 0.0))
    analysed = summary.get("analysed", 0)

    if any(k in msg for k in ("komplain", "email", "surat", "draf", "draft", "klaim")):
        return (
            "Berikut draf pesan resmi untuk negosiasi atau komplain ke pihak ekspedisi:\n\n"
            "**Subjek:** Permohonan Rekonsiliasi & Peninjauan Tarif Pengiriman - Temuan Audit\n\n"
            "Yth. Tim Kemitraan & Operasional Logistik,\n\n"
            "Sehubungan dengan audit berkala pengiriman toko kami, sistem ProfitLeak AI mendeteksi "
            f"adanya selisih ongkir yang signifikan pada beberapa nomor transaksi dengan total kelebihan biaya "
            f"mencapai **R$ {loss:.2f}**.\n\n"
            "Beberapa transaksi tercatat dikenakan tarif hingga di atas 2.5x batas wajar pasar. "
            "Kami memohon agar pihak ekspedisi dapat meninjau kembali skema tarif dan mempertimbangkan "
            "restitusi atau diskon kemitraan untuk pengiriman selanjutnya.\n\n"
            "Terima kasih atas perhatian dan kerja samanya.\n\n"
            "*Hormat kami,*\n*Tim Operasional Toko*"
        )
    elif any(k in msg for k in ("boros", "terburuk", "termahal", "parah", "bocor")):
        leak_rows = [r for r in rows if r.get("is_leak")]
        if leak_rows:
            worst = max(leak_rows, key=lambda x: float(x.get("ratio", 0)))
            return (
                f"Transaksi dengan kebocoran paling tinggi ada pada **Baris #{worst.get('line', '?')}**:\n\n"
                f"- **Tarif Aktual Kurir:** R$ {float(worst.get('actual_rate', 0)):.2f}\n"
                f"- **Estimasi Tarif Wajar:** R$ {float(worst.get('predicted_rate', 0)):.2f}\n"
                f"- **Rasio Selisih:** {float(worst.get('ratio', 0)):.2f}x lebih mahal\n"
                f"- **Beban Ongkir:** Menyerap {float(worst.get('freight_ratio', 0)) * 100:.1f}% dari harga jual produk.\n\n"
                "**Saran Aksi:** Prioritaskan negosiasi rute ini dengan ekspedisi atau tawarkan paket bundling agar margin keuntungan tidak tekor."
            )
    return (
        f"Berdasarkan analisis audit saat ini, terdapat **{leaks} dari {analysed} transaksi** yang terindikasi "
        f"mengalami kebocoran ongkir dengan potensi kerugian sebesar **R$ {loss:.2f}**.\n\n"
        "**3 Rekomendasi Utama:**\n"
        "1. **Audit Rute Jarak Jauh:** Negosiasi ulang kontrak pada transaksi dengan rasio selisih > 1.5x.\n"
        "2. **Strategi Bundling:** Untuk barang murah dengan ongkir tinggi, wajibkan pembelian minimal 2 item.\n"
        "3. **Kemasan Ramping:** Perkecil dimensi kardus untuk menghindari tarif volumetrik ekspedisi."
    )


async def _copilot_call_gemini(
    message: str,
    history: list[ChatHistoryItem],
    context_str: str,
) -> str | None:
    if not GEMINI_API_KEY:
        return None

    system_text = (
        "Anda adalah 'ProfitLeak AI Copilot', konsultan ahli logistik dan audit profit e-commerce.\n"
        "Tugas Anda: membantu pengguna memahami hasil audit kebocoran ongkir, menganalisis baris transaksi, "
        "merumuskan rekomendasi mitigasi bisnis (bundling, harga minimal, optimasi kemasan), "
        "dan menyusun draf surat komplain/negosiasi ke pihak ekspedisi bila diminta.\n\n"
        "DATA KONTEKS AUDIT SAAT INI:\n"
        f"{context_str}\n\n"
        "PANDUAN RESPON:\n"
        "1. Jawab dalam Bahasa Indonesia yang profesional, ramah, dan solutif.\n"
        "2. Gunakan data kontekstual yang diberikan. DILARANG mengarang angka baru yang tidak ada.\n"
        "3. Format teks menggunakan Markdown (gunakan bold, bullet points, atau kutipan) agar rapi dan enak dibaca.\n"
        "4. Berikan jawaban yang padat, terstruktur, dan actionable."
    )

    contents = []
    for h in history[-6:]:
        role = "user" if h.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": h.content}]})

    contents.append({"role": "user", "parts": [{"text": message}]})

    body = {
        "system_instruction": {"parts": [{"text": system_text}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1000,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                GEMINI_URL,
                params={"key": GEMINI_API_KEY},
                json=body,
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        candidate = (data.get("candidates") or [{}])[0]
        text = (candidate.get("content") or {}).get("parts", [{}])[0].get("text")
        return text if text else None
    except Exception:
        return None


@app.post("/api/copilot-chat", response_model=CopilotChatResponse)
async def copilot_chat(payload: CopilotChatRequest) -> CopilotChatResponse:
    """Chatbot Copilot interaktif yang memegang konteks data audit."""
    summary = payload.summary or {}
    leak_rows = [r for r in payload.rows if r.get("is_leak")]
    leak_rows.sort(key=lambda r: float(r.get("ratio", 0)), reverse=True)
    top_rows = leak_rows[:5]

    context_str = json.dumps(
        {
            "file": payload.filename,
            "ringkasan_audit": summary,
            "transaksi_bocor_terburuk": top_rows,
        },
        ensure_ascii=False,
        indent=2,
    )

    gemini_reply = await _copilot_call_gemini(
        payload.message, payload.history, context_str
    )
    if gemini_reply:
        return CopilotChatResponse(reply=gemini_reply, source="gemini")

    fallback_reply = _copilot_rule_based_reply(
        payload.message, summary, payload.rows
    )
    return CopilotChatResponse(reply=fallback_reply, source="rule_based")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

