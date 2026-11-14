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
import io
import json
import math
import warnings
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
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
_ANOMALY_MODEL: Any = None
_ANOMALY_FEATURES: list[str] = []
_ANOMALY_BOUNDS: tuple[float, float] = (0.0, 1.0)
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


def _anomaly_norm(values: dict[str, float], price: float, freight_actual: float) -> float:
    """Skor anomali ternormalisasi 0..1 (0 = normal)."""
    if _ANOMALY_MODEL is None:
        return 0.0
    try:
        feat = dict(values)
        feat["price_log"] = float(np.log1p(price))
        if "density_g_cm3" not in feat or feat.get("density_g_cm3") is None:
            feat["density_g_cm3"] = _density_from(
                values.get("product_weight_g"), values["weight_kg"],
                values.get("length_cm"), values.get("height_cm"),
                values.get("width_cm"),
            )
        feat["freight_ratio"] = float(freight_actual) / max(float(price), 1e-9)
        X = np.asarray([[float(feat.get(n, 0.0)) for n in _ANOMALY_FEATURES]], dtype=float)
        raw = float(-_ANOMALY_MODEL.score_samples(X)[0])
        lo, hi = _ANOMALY_BOUNDS
        span = max(hi - lo, 1e-9)
        return float(min(max((raw - lo) / span, 0.0), 1.0))
    except Exception:
        return 0.0


# ---------------------------------------------------------------------------
# Lifespan: muat model & metadata satu kali
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _MODEL, _INFO, _BUNDLE, _THRESHOLD, _VALID_RANGES, _MARGIN_THRESHOLD
    global _ANOMALY_MODEL, _ANOMALY_FEATURES, _ANOMALY_BOUNDS, _FEATURE_DEFAULTS
    global _RISK_MODEL, _RISK_FEATURES, _RISK_PROBA_THRESHOLD

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
    _ANOMALY_MODEL = _BUNDLE.get("anomaly_model")
    _ANOMALY_FEATURES = list(_BUNDLE.get("anomaly_features") or [])
    bounds = _BUNDLE.get("anomaly_norm_bounds") or [0.0, 1.0]
    try:
        _ANOMALY_BOUNDS = (float(bounds[0]), float(bounds[1]))
    except (TypeError, ValueError, IndexError):
        _ANOMALY_BOUNDS = (0.0, 1.0)
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
        _ANOMALY_MODEL = None
        _ANOMALY_FEATURES = []
        _ANOMALY_BOUNDS = (0.0, 1.0)
        _RISK_MODEL = None
        _RISK_FEATURES = []


# ---------------------------------------------------------------------------
# Aplikasi
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ProfitLeak AI API",
    version=SERVICE_VERSION,
    description=(
        "API prediksi tarif wajar dan deteksi kebocoran profit multi-faktor "
        "(tarif ongkir, margin ongkir/harga, anomali)."
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
        "detectors": _BUNDLE.get("detectors", ["rate"]),
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

    Tiga detektor:
      rate    -> tarif aktual jauh di atas tarif wajar
      margin  -> ongkir menelan porsi terlalu besar dari harga jual
      anomaly -> kombinasi fitur tidak wajar
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
    anomaly_score = _anomaly_norm(values, price, actual_rate)
    is_anomaly = bool(anomaly_score > 0.85)

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
    if is_anomaly:
        reasons.append({
            "code": "unusual_pattern",
            "severity": "medium",
            "detail": (
                f"Kombinasi berat/jarak/volume/harga tidak biasa "
                f"(skor anomali {anomaly_score:.2f})."
            ),
            "remedy": "Periksa kembali data transaksi; pastikan tidak ada salah input.",
        })

    is_leak = bool(is_rate_leak or is_margin_risk or is_anomaly)

    # Skor risiko 0..1: gabungan rasio tarif, probabilitas risiko, anomali.
    rate_component = min(max((ratio - 1.0) / max(_THRESHOLD - 1.0, 1e-6), 0.0), 1.0)
    risk_component = min(max(risk_score_model, 0.0), 1.0)
    risk_score = round(
        0.45 * rate_component + 0.40 * risk_component + 0.15 * anomaly_score, 4
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
            "anomaly": is_anomaly,
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
        "anomalies": 0,
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
        if res["detectors"]["anomaly"]:
            totals["anomalies"] += 1

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
        "unusual_pattern": "Audit data transaksi untuk kesalahan input.",
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
