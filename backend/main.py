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

import json
import math
import warnings
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Urutan fitur WAJIB sama dengan model (rate_model.feature_names_in_).
RATE_FEATURES = ["weight_kg", "distance_km", "volume_cm3", "price_log"]

# Fallback bila bundle/metadata tidak menyediakan threshold.
DEFAULT_THRESHOLD = 1.102309
CURRENCY = "BRL"

ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

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
}

# State global - diisi sekali pada lifespan startup.
_MODEL: Any = None
_INFO: dict[str, Any] = {}
_THRESHOLD: float = DEFAULT_THRESHOLD
_VALID_RANGES: dict[str, tuple[float, float]] = dict(DEFAULT_VALID_RANGES)


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


def _predict_rate(
    weight_kg: float, distance_km: float, volume_cm3: float, price: float
) -> float:
    """Hitung tarif wajar (BRL) dari fitur mentah."""
    if _MODEL is None:  # pragma: no cover - dijaga oleh lifespan
        raise HTTPException(
            status_code=503,
            detail="Model belum siap. Silakan coba beberapa saat lagi.",
        )

    price_log = float(np.log1p(price))
    features = {
        "weight_kg": float(weight_kg),
        "distance_km": float(distance_km),
        "volume_cm3": float(volume_cm3),
        "price_log": price_log,
    }
    # np.ndarray dengan urutan kolom persis RATE_FEATURES (model memakai
    # feature_names_in_ yang sama, sehingga tidak ada warning urutan).
    X = np.asarray([[features[name] for name in RATE_FEATURES]], dtype=float)

    pred_log = float(_MODEL.predict(X)[0])
    return float(np.expm1(pred_log))


# ---------------------------------------------------------------------------
# Lifespan: muat model & metadata satu kali
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _MODEL, _INFO, _THRESHOLD, _VALID_RANGES

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
    _THRESHOLD = _resolve_threshold(artifact, _INFO)
    _VALID_RANGES = _resolve_valid_ranges(artifact, _INFO)

    try:
        yield
    finally:
        # Lepaskan referensi saat shutdown.
        _MODEL = None
        _INFO = {}
        _THRESHOLD = DEFAULT_THRESHOLD
        _VALID_RANGES = dict(DEFAULT_VALID_RANGES)


# ---------------------------------------------------------------------------
# Aplikasi
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ProfitLeak AI API",
    version=SERVICE_VERSION,
    description=(
        "API prediksi tarif wajar dan deteksi kebocoran profit "
        "berbasis model final v5."
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
    """Input prediksi tarif wajar (validasi sesuai ``valid_ranges`` v5)."""

    weight_kg: float
    distance_km: float
    volume_cm3: float
    price: float

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
    """Metadata model v5 yang sedang dimuat (dibaca sekali saat startup)."""
    return {
        "info": _INFO,
        "threshold": _THRESHOLD,
        "valid_ranges": {
            name: [low, high] for name, (low, high) in _VALID_RANGES.items()
        },
        "rate_features": RATE_FEATURES,
    }


@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictionRequest) -> PredictResponse:
    """Prediksi tarif wajar (ongkir) untuk satu paket."""
    predicted_rate = _predict_rate(
        payload.weight_kg,
        payload.distance_km,
        payload.volume_cm3,
        payload.price,
    )
    return PredictResponse(
        predicted_rate=round(predicted_rate, 2),
        currency=CURRENCY,
    )


@app.post("/api/detect-leak", response_model=DetectLeakResponse)
def detect_leak(payload: LeakDetectionRequest) -> DetectLeakResponse:
    """Deteksi kebocoran profit: bandingkan tarif aktual vs tarif wajar."""
    predicted_rate = _predict_rate(
        payload.weight_kg,
        payload.distance_km,
        payload.volume_cm3,
        payload.price,
    )

    if predicted_rate <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Tarif wajar hasil model tidak valid (<= 0) untuk input ini, "
                "sehingga rasio tarif tidak dapat dihitung."
            ),
        )

    actual_rate = payload.actual_rate if payload.actual_rate is not None else payload.price
    ratio = actual_rate / predicted_rate
    is_leak = bool(ratio > _THRESHOLD)

    if is_leak:
        message = (
            "Terindikasi kebocoran profit: tarif aktual melebihi batas wajar"
        )
    else:
        message = "Tarif dalam batas wajar"

    return DetectLeakResponse(
        predicted_rate=round(predicted_rate, 2),
        actual_rate=round(actual_rate, 2),
        ratio=round(ratio, 4),
        is_leak=is_leak,
        threshold=round(_THRESHOLD, 6),
        currency=CURRENCY,
        message=message,
    )
