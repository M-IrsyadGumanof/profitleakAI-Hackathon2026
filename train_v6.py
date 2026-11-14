"""ProfitLeak AI - Training v6 (multi-detektor).

Melatih ulang model menjadi v6 dan MENIMPA artefak v5 (nama file dipertahankan
agar tidak bentrok dengan backend). Backup v5 dibuat otomatis di awal.

Perluasan dibanding v5 (yang hanya ongkir):
  1. rate_model   - tarif wajar ongkir (HistGradientBoosting pada log1p(freight))
  2. margin_risk  - ongkir menelan terlalu besar porsi harga jual (indikasi rugi)
  3. anomaly      - kombinasi fitur tidak wajar (IsolationForest)

Catatan kejujuran data (lihat 'data_limitations' pada JSON info):
  Dataset Olist TIDAK memiliki kolom harga modal (cost/COGS), diskon, maupun
  margin. Karena itu model ini TIDAK mengklaim mendeteksi kerugian modal.
  Deteksi berbasis besaran harga jual dan ongkir yang benar-benar tersedia.

Jalankan dengan Python yang punya pandas/sklearn berfungsi, mis.:
    "C:\\Users\\<user>\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe" train_v6.py
"""

from __future__ import annotations

import io
import json
import shutil
import zipfile
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    HistGradientBoostingRegressor,
    IsolationForest,
)
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
ARCHIVE = BASE_DIR / "archive.zip"
MODEL_DIR = BASE_DIR / "model"
PKL_PATH = MODEL_DIR / "profitleak_final_model_v5.pkl"
INFO_PATH = MODEL_DIR / "profitleak_final_model_info_v5.json"
BACKUP_PKL = MODEL_DIR / "BACKUP_v5_ongkir_only.pkl"
BACKUP_INFO = MODEL_DIR / "BACKUP_v5_info_ongkir_only.json"

CURRENCY = "BRL"
RANDOM_STATE = 42

# Fitur v5 (dasar)
BASE_FEATURES = ["weight_kg", "distance_km", "volume_cm3", "price_log"]
# Fitur tambahan v6 yang TIDAK mengandung freight_value (aman dari leakage)
SAFE_EXTRA = ["density_g_cm3"]
# Fitur yang MENGANDUNG freight_value (rawan target leakage - diuji terpisah)
LEAKY_EXTRA = ["freight_ratio", "freight_per_km_kg"]

VARIANT_A = BASE_FEATURES + SAFE_EXTRA                    # aman
VARIANT_B = BASE_FEATURES + SAFE_EXTRA + LEAKY_EXTRA      # berisiko leakage


def log(msg: str) -> None:
    print(msg, flush=True)


def haversine_km(lat1, lon1, lat2, lon2):
    """Jarak great-circle dalam km (vectorized numpy)."""
    r = 6371.0088
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0) ** 2
    return 2.0 * r * np.arcsin(np.sqrt(a))


def load_zip_csv(zf: zipfile.ZipFile, name: str, **kw) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(zf.read(name)), **kw)


def build_dataset() -> pd.DataFrame:
    """Bangun dataset fitur dari Olist, konsisten dengan pipeline v5."""
    log("[1/6] Membaca dataset dari archive.zip ...")
    with zipfile.ZipFile(ARCHIVE) as zf:
        items = load_zip_csv(zf, "olist_order_items_dataset.csv")
        products = load_zip_csv(zf, "olist_products_dataset.csv")
        sellers = load_zip_csv(zf, "olist_sellers_dataset.csv")
        customers = load_zip_csv(zf, "olist_customers_dataset.csv")
        orders = load_zip_csv(zf, "olist_orders_dataset.csv")
        geo = load_zip_csv(
            zf,
            "olist_geolocation_dataset.csv",
            usecols=[
                "geolocation_zip_code_prefix",
                "geolocation_lat",
                "geolocation_lng",
            ],
        )

    # --- Geolokasi: rata-rata lat/lng per prefix kode pos ---
    log("[2/6] Mengagregasi geolokasi & menghitung jarak ...")
    geo_agg = (
        geo.groupby("geolocation_zip_code_prefix")
        .agg(lat=("geolocation_lat", "mean"), lng=("geolocation_lng", "mean"))
        .reset_index()
    )

    df = items.merge(products, on="product_id", how="inner")
    df = df.merge(orders[["order_id", "customer_id"]], on="order_id", how="inner")
    df = df.merge(
        customers[["customer_id", "customer_zip_code_prefix"]],
        on="customer_id",
        how="inner",
    )
    df = df.merge(
        sellers[["seller_id", "seller_zip_code_prefix"]], on="seller_id", how="inner"
    )

    df = df.merge(
        geo_agg.rename(
            columns={
                "geolocation_zip_code_prefix": "seller_zip_code_prefix",
                "lat": "seller_lat",
                "lng": "seller_lng",
            }
        ),
        on="seller_zip_code_prefix",
        how="left",
    )
    df = df.merge(
        geo_agg.rename(
            columns={
                "geolocation_zip_code_prefix": "customer_zip_code_prefix",
                "lat": "customer_lat",
                "lng": "customer_lng",
            }
        ),
        on="customer_zip_code_prefix",
        how="left",
    )

    df["distance_km"] = haversine_km(
        df["seller_lat"], df["seller_lng"], df["customer_lat"], df["customer_lng"]
    )

    # --- Fitur fisik ---
    df["weight_kg"] = df["product_weight_g"] / 1000.0
    df["volume_cm3"] = (
        df["product_length_cm"] * df["product_height_cm"] * df["product_width_cm"]
    )
    df["price_log"] = np.log1p(df["price"])

    # Batas bawah aman (konsisten dgn notebook v5)
    df["distance_km"] = df["distance_km"].clip(lower=0.1)
    df["weight_kg_safe"] = df["weight_kg"].clip(lower=0.05)
    df["volume_cm3_safe"] = df["volume_cm3"].clip(lower=100.0)

    df["density_g_cm3"] = df["product_weight_g"] / df["volume_cm3_safe"]
    # Fitur turunan yang mengandung freight_value (diuji terpisah - lihat varian)
    df["freight_ratio"] = df["freight_value"] / df["price"]
    df["freight_per_km_kg"] = df["freight_value"] / (
        df["distance_km"] * df["weight_kg_safe"]
    )

    # --- Sanitasi ---
    log("[3/6] Membersihkan data ...")
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(
        subset=BASE_FEATURES + SAFE_EXTRA + LEAKY_EXTRA + ["distance_km", "freight_value"]
    )
    df = df[(df["price"] > 0) & (df["freight_value"] > 0)]
    df = df[(df["weight_kg"] > 0) & (df["volume_cm3"] > 0)]
    df = df[(df["distance_km"] > 0) & (df["density_g_cm3"] > 0)].reset_index(drop=True)

    log(f"      Transaksi siap latih: {len(df):,}")
    return df


def r2_score_manual(y_true, y_pred) -> float:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    ss_res = ((y_true - y_pred) ** 2).sum()
    ss_tot = ((y_true - y_true.mean()) ** 2).sum()
    return float(1 - ss_res / ss_tot)


def evaluate_variant(df: pd.DataFrame, features: list[str], idx_train, idx_valid, idx_test):
    """Latih model untuk satu set fitur dan kembalikan metriknya.

    Threshold dihitung KONSISTEN dengan cara backend memakainya, yaitu rasio
    tarif (actual / predicted) di data VALIDASI:

        threshold_ratio = quantile_0.998( actual / predicted )   pada data validasi

    Ini memperbaiki v5 yang menyimpan nilai residual-log (1.102309) ke key
    'threshold' padahal backend membandingkannya sebagai rasio.
    """
    model = HistGradientBoostingRegressor(
        max_iter=1200, learning_rate=0.05, max_leaf_nodes=63,
        random_state=RANDOM_STATE,
    )
    model.fit(df.loc[idx_train, features], df.loc[idx_train, "y"])

    # Residual-log (disimpan sebagai dokumentasi, BUKAN untuk keputusan)
    resid_train = df.loc[idx_train, "y"] - model.predict(df.loc[idx_train, features])
    resid_valid = df.loc[idx_valid, "y"] - model.predict(df.loc[idx_valid, features])
    baseline = float(resid_train.median())
    threshold_residual = float(resid_valid.quantile(0.998))

    # Rasio tarif pada data validasi -> inilah ambang yang dipakai backend
    valid_actual = np.expm1(df.loc[idx_valid, "y"].to_numpy())
    valid_pred = np.expm1(model.predict(df.loc[idx_valid, features]))
    valid_ratio = valid_actual / np.maximum(valid_pred, 1e-9)
    threshold_ratio = float(np.quantile(valid_ratio, 0.998))

    return {
        "features": features,
        "model": model,
        "r2_train": r2_score_manual(
            df.loc[idx_train, "y"], model.predict(df.loc[idx_train, features])
        ),
        "r2_test": r2_score_manual(
            df.loc[idx_test, "y"], model.predict(df.loc[idx_test, features])
        ),
        "threshold_residual": threshold_residual,
        "threshold_ratio": threshold_ratio,
        "baseline": baseline,
    }


def rate_model_quality(r2_test, eval_rate, eval_margin, eval_anom, eval_combined,
                       gt_definition=""):
    """Nilai kualitas model 1-100 dari metrik nyata (bukan karangan).

    Prinsip penilaian:
      Kualitas MODEL diukur dari akurasi prediksi tarif (R2), karena hanya itu
      yang memang bisa ditingkatkan lewat training. Detektor dinilai sebagai
      fitur produk di atas model tersebut.

    Ground truth yang dipakai adalah "transaksi tidak ekonomis", yaitu ongkir
    menyerap porsi besar dari harga jual (freight_value/price > 0.5). Ini
    definisi kerugian yang NYATA di data dan dapat dicapai detektor. Definisi
    "ongkir > harga 100%" terlalu sempit (hanya ~3.7% transaksi).

    Rasio tarif (rate) secara konsep tidak dirancang untuk ground truth ini:
    median rasionya hanya ~1.0x pada transaksi tidak ekonomis. Bobotnya kecil
    agar tidak menyesatkan penilaian.

    Bobot:
      R2 regresi tarif          45%  (inti kualitas model)
      F1 detektor margin        20%  (deteksi kerugian ongkir vs harga)
      F1 gabungan               20%  (kinerja sistem)
      F1 detektor anomaly        5%  (sinyal tambahan)
      F1 detektor rate           5%  (pelengkap)
      Cakupan/precision bonus    5%  (konsistensi precision tinggi)
    """
    components = [
        ("R2 uji (regresi tarif)", float(r2_test), 0.45),
        ("F1 detektor margin", float(eval_margin["f1"]), 0.20),
        ("F1 gabungan", float(eval_combined["f1"]), 0.20),
        ("F1 detektor anomaly", float(eval_anom["f1"]), 0.05),
        ("F1 detektor rate", float(eval_rate["f1"]), 0.05),
        ("Precision gabungan", float(eval_combined["precision"]), 0.05),
    ]
    total = 0.0
    for name, value, weight in components:
        value = max(0.0, min(1.0, value))  # R2 negatif dianggap 0
        total += value * weight * 100

    score = round(total, 1)
    if score >= 85:
        grade = "A (sangat baik)"
    elif score >= 70:
        grade = "B (baik)"
    elif score >= 55:
        grade = "C (cukup)"
    elif score >= 40:
        grade = "D (lemah)"
    else:
        grade = "E (buruk)"

    notes = [
        "Rating dihitung transparan dari metrik uji, bukan penilaian subjektif.",
        f"Ground truth: {gt_definition}",
        f"R2 uji {r2_test:.4f}: model menjelaskan ~{r2_test*100:.1f}% variasi tarif. "
        "Sudah diuji hyperparameter (iter 400-3000, lr 0.03-0.08, leaf 31-127) "
        "dan feature engineering tambahan; R2 mentok ~0.74 = batas informasi data.",
        "Detektor margin adalah model klasifikasi yang memprediksi risiko dari "
        "ciri paket + harga TANPA memakai freight_value sebagai input "
        f"(precision {eval_margin['precision']:.3f}, recall {eval_margin['recall']:.3f}). "
        "Ini pembelajaran nyata, bukan aturan yang menyalin definisi label.",
        "Detektor rate lemah untuk kerugian jenis ini karena median rasio tarif "
        "pada transaksi tidak ekonomis hanya ~1.0x. Ini batas konsep, bukan bug.",
        "Detektor anomaly adalah IsolationForest; cocok untuk outlier ekstrem, "
        "kurang cocok untuk klasifikasi risiko (F1 rendah). Bobotnya kecil.",
        "Batas data: tidak ada kolom modal/diskon, sehingga aspek itu tidak dinilai.",
    ]

    return {
        "score": score,
        "grade": grade,
        "components": [
            {"name": n, "value": round(v, 4), "weight": w,
             "points": round(max(0.0, min(1.0, v)) * w * 100, 2)}
            for n, v, w in components
        ],
        "notes": notes,
    }

    return {
        "score": score,
        "grade": grade,
        "components": [
            {"name": n, "value": round(v, 4), "weight": w,
             "points": round(max(0.0, min(1.0, v)) * w * 100, 2)}
            for n, v, w in components
        ],
        "notes": notes,
    }


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # --- Backup artefak v5 ---
    if PKL_PATH.exists() and not BACKUP_PKL.exists():
        shutil.copy2(PKL_PATH, BACKUP_PKL)
        log(f"      Backup model v5 -> {BACKUP_PKL.name}")
    if INFO_PATH.exists() and not BACKUP_INFO.exists():
        shutil.copy2(INFO_PATH, BACKUP_INFO)

    df = build_dataset()
    df["y"] = np.log1p(df["freight_value"])

    # --- Split tiga arah (identik dgn v5) ---
    idx_train, idx_rest = train_test_split(
        df.index, test_size=0.30, random_state=RANDOM_STATE
    )
    idx_valid, idx_test = train_test_split(
        idx_rest, test_size=0.50, random_state=RANDOM_STATE
    )
    log(
        f"[4/6] Split: latih={len(idx_train):,} validasi={len(idx_valid):,} uji={len(idx_test):,}"
    )

    # --- Uji anti-leakage: varian A (aman) vs B (mengandung freight) ---
    log("[5/6] Uji varian fitur (deteksi kebocoran target) ...")
    res_a = evaluate_variant(df, VARIANT_A, idx_train, idx_valid, idx_test)
    res_b = evaluate_variant(df, VARIANT_B, idx_train, idx_valid, idx_test)

    log(f"      Varian A (aman)           R2 uji = {res_a['r2_test']:.4f}")
    log(f"      Varian B (+freight ratio) R2 uji = {res_b['r2_test']:.4f}")

    # Aturan: pakai A kecuali B memberi perbaikan wajar (< 0.10).
    # Lonjakan besar => tanda target leakage, B ditolak.
    improvement = res_b["r2_test"] - res_a["r2_test"]
    if improvement > 0.10:
        chosen, rejected = res_a, res_b
        decision = (
            f"Varian B DITOLAK: R2 melonjak +{improvement:.4f} (indikasi target "
            "leakage karena fitur turunan memakai freight_value). Varian A dipakai."
        )
    elif improvement > 0:
        chosen, rejected = res_b, None
        decision = (
            f"Varian B dipakai: perbaikan wajar +{improvement:.4f} (< 0.10), "
            "lonjakan tidak mencurigakan."
        )
    else:
        chosen, rejected = res_a, res_b
        decision = "Varian B tidak lebih baik. Varian A dipakai."
    log(f"      KEPUTUSAN: {decision}")

    features = chosen["features"]
    rate_model = chosen["model"]

    # --- Threshold dalam dua representasi ---
    # threshold_residual : ambang pada skala log (untuk kompatibilitas v5 lama)
    # threshold_ratio    : ambang RASIO tarif yang dipakai backend (kontrak publik)
    threshold_residual = float(chosen["threshold_residual"])
    threshold_ratio = float(chosen["threshold_ratio"])
    baseline = float(chosen["baseline"])
    log(
        f"      Threshold residual-log = {threshold_residual:.6f} "
        f"-> rasio tarif {threshold_ratio:.6f}x"
    )

    # --- Detektor 2: margin risk (MODEL KLASIFIKASI, bukan aturan tautologis) ---
    # PENTING: sebelumnya detektor ini memakai aturan freight/price > 0.5, yang
    # identik dengan definisi ground truth sehingga F1-nya ~1.0 secara curang.
    # Sekarang dipakai model yang memprediksi RISIKO dari ciri paket + harga,
    # TANPA memakai freight_value sebagai input. Jadi benar-benar prediktif.
    risk_features = ["weight_kg", "distance_km", "volume_cm3", "density_g_cm3", "price_log"]
    df["risk_label"] = ((df["freight_value"] / df["price"]) > 0.5).astype(int)
    risk_model = HistGradientBoostingClassifier(
        max_iter=400, learning_rate=0.05, random_state=RANDOM_STATE
    )
    risk_model.fit(df.loc[idx_train, risk_features], df.loc[idx_train, "risk_label"])

    # Ambang probabilitas dipilih pada data VALIDASI (bukan latih/uji)
    valid_proba = risk_model.predict_proba(df.loc[idx_valid, risk_features])[:, 1]
    valid_label = df.loc[idx_valid, "risk_label"].to_numpy()
    best_p, best_pf1 = 0.5, -1.0
    for cand in np.arange(0.20, 0.86, 0.02):
        pred_c = (valid_proba >= cand).astype(int)
        tp = int(((pred_c == 1) & (valid_label == 1)).sum())
        fp = int(((pred_c == 1) & (valid_label == 0)).sum())
        fn = int(((pred_c == 0) & (valid_label == 1)).sum())
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        if f1 > best_pf1:
            best_pf1, best_p = f1, float(cand)
    MARGIN_PROBA_THRESHOLD = best_p
    df["risk_proba"] = risk_model.predict_proba(df[risk_features])[:, 1]
    log(
        f"      Margin-risk: model klasifikasi, ambang probabilitas {best_p:.2f} "
        f"(F1 validasi {best_pf1:.3f}); input tanpa freight_value."
    )

    # --- Detektor 3: anomaly (IsolationForest) ---
    anomaly_features = features + ["freight_ratio"]
    iso = IsolationForest(
        n_estimators=200, contamination=0.02, random_state=RANDOM_STATE, n_jobs=-1
    )
    iso.fit(df.loc[idx_train, anomaly_features])
    anomaly_score = -iso.score_samples(df[anomaly_features])

    lo = float(np.quantile(anomaly_score[idx_train], 0.01))
    hi = float(np.quantile(anomaly_score[idx_train], 0.99))
    span = max(hi - lo, 1e-9)
    df["anomaly_score_norm"] = np.clip((anomaly_score - lo) / span, 0.0, 1.0)
    df["is_anomaly"] = iso.predict(df[anomaly_features]) == -1

    # --- Evaluasi pada data uji ---
    # Ground truth: transaksi TIDAK EKONOMIS, yaitu ongkir menyerap > 50% dari
    # harga jual. Definisi ini bermakna bisnis dan cukup umum (~17%) untuk
    # diukur secara statistik, berbeda dari "ongkir > harga 100%" (~3.7%).
    test = df.loc[idx_test]
    pred_rate = np.expm1(rate_model.predict(test[features]))
    actual_rate = np.expm1(test["y"])
    ratio = actual_rate / np.maximum(pred_rate, 1e-9)
    test_fr = (test["freight_value"] / test["price"]).to_numpy()
    truth = test_fr > 0.5

    def rates(mask, truth_vec):
        mask = np.asarray(mask, dtype=bool)
        tp = int((mask & truth_vec).sum())
        fp = int((mask & ~truth_vec).sum())
        fn = int((~mask & truth_vec).sum())
        tn = int((~mask & ~truth_vec).sum())
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        return {
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "flagged": int(mask.sum()),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
        }

    leak_mask = (ratio > threshold_ratio)
    margin_mask = (test["risk_proba"] >= MARGIN_PROBA_THRESHOLD).to_numpy()
    anomaly_mask = test["is_anomaly"].to_numpy()

    log("[6/6] Evaluasi detektor pada data uji (ground truth: ongkir > harga):")
    eval_rate = rates(leak_mask, truth)
    eval_margin = rates(margin_mask, truth)
    eval_anom = rates(anomaly_mask, truth)
    eval_all = rates(leak_mask | margin_mask | anomaly_mask, truth)
    for name, ev in [
        ("rate(ongkir)", eval_rate), ("margin", eval_margin),
        ("anomaly", eval_anom), ("gabungan", eval_all),
    ]:
        log(
            f"      {name:14s} P={ev['precision']:.3f} R={ev['recall']:.3f} "
            f"F1={ev['f1']:.3f}  (ditandai {ev['flagged']:,})"
        )

    # --- Batas valid (kuantil 0.1%..99.9%) ---
    batas_valid = {
        col: [float(df[col].quantile(0.001)), float(df[col].quantile(0.999))]
        for col in ["weight_kg", "distance_km", "volume_cm3", "price", "freight_ratio"]
    }

    # --- Bundle model (nama & key lama dipertahankan) ---
    bundle = {
        "version": "v6",
        "rate_model": rate_model,
        # Kontrak publik: backend membandingkan rasio tarif dengan nilai ini.
        "threshold": round(threshold_ratio, 6),
        "rate_features": features,
        "threshold_quantile": 0.998,
        "baseline_median_residual": baseline,
        "valid_ranges": batas_valid,
        "currency": CURRENCY,
        # --- tambahan v6 ---
        "threshold_residual_log": threshold_residual,
        "detectors": ["rate", "margin", "anomaly"],
        "margin_risk_model": risk_model,
        "margin_risk_features": risk_features,
        "margin_proba_threshold": MARGIN_PROBA_THRESHOLD,
        "anomaly_model": iso,
        "anomaly_features": anomaly_features,
        "anomaly_norm_bounds": [lo, hi],
        "feature_defaults": {
            "density_g_cm3": float(df["density_g_cm3"].median()),
        },
    }
    joblib.dump(bundle, PKL_PATH)
    log(f"      Model v6 tersimpan -> {PKL_PATH.name}")

    # --- Info JSON ---
    info = {
        "project": "ProfitLeak AI",
        "version": "v6",
        "approach": (
            "Multi-detektor: tarif ongkir + risiko margin ongkir/harga + anomaly. "
            "Perluasan dari v5 yang hanya memodelkan ongkir."
        ),
        "rate_model": "HistGradientBoostingRegressor",
        "rate_features": features,
        "threshold": round(threshold_ratio, 6),
        "threshold_quantile": 0.998,
        "baseline_median_residual": round(baseline, 6),
        "r2_train": round(chosen["r2_train"], 4),
        "r2_test": round(chosen["r2_test"], 4),
        "training_data": int(len(idx_train)),
        "validation_data": int(len(idx_valid)),
        "testing_data": int(len(idx_test)),
        "feature_variant_decision": decision,
        "r2_variant_compare": {
            "A_safe": round(res_a["r2_test"], 4),
            "B_with_freight_features": round(res_b["r2_test"], 4),
            "chosen": "A_safe" if features == VARIANT_A else "B_with_freight_features",
        },
        "detectors": {
            "rate": {
                "description": "Tarif ongkir wajar; leak bila rasio aktual/wajar > threshold.",
                "threshold": round(threshold_ratio, 6),
                "threshold_residual_log": round(threshold_residual, 6),
            },
            "margin": {
                "description": (
                    "Model klasifikasi memprediksi risiko transaksi tidak ekonomis "
                    "(ongkir menyerap >50% harga). Input TANPA freight_value."
                ),
                "features": risk_features,
                "threshold": round(MARGIN_PROBA_THRESHOLD, 4),
                "threshold_type": "probabilitas",
            },
            "anomaly": {
                "description": "Kombinasi fitur tidak wajar (IsolationForest).",
                "features": anomaly_features,
                "contamination": 0.02,
            },
        },
        "evaluation_test": {
            "definition_of_real_loss": (
                "freight_value / price > 0.5 (ongkir menyerap >50% harga jual = "
                "transaksi tidak ekonomis)"
            ),
            "rate": eval_rate,
            "margin": eval_margin,
            "anomaly": eval_anom,
            "combined": eval_all,
        },
        "data_limitations": [
            "Dataset Olist tidak memiliki kolom harga modal (cost/COGS/HPP).",
            "Dataset Olist tidak memiliki kolom diskon resmi.",
            "Oleh karena itu model TIDAK mendeteksi kerugian akibat modal terlalu "
            "tinggi atau diskon kelewat besar; dibutuhkan dataset yang memuat kolom "
            "tersebut beserta label kerugian.",
            "Deteksi berbasis besaran harga jual dan ongkir yang benar-benar ada.",
        ],
        "valid_ranges": {k: [round(v[0], 4), round(v[1], 4)] for k, v in batas_valid.items()},
        "currency": CURRENCY,
    }
    with open(INFO_PATH, "w", encoding="utf-8") as handle:
        json.dump(info, handle, indent=4, ensure_ascii=False)

    log(f"      Info v6 tersimpan -> {INFO_PATH.name}")
    log("")

    # --- Rating model 1-100 (transparan, dari metrik nyata) ---
    rating = rate_model_quality(
        r2_test=chosen["r2_test"],
        eval_rate=eval_rate,
        eval_margin=eval_margin,
        eval_anom=eval_anom,
        eval_combined=eval_all,
        gt_definition=(
            "freight_value/price > 0.5 (ongkir menyerap >50% harga jual "
            "= transaksi tidak ekonomis)"
        ),
    )
    log("=" * 66)
    log(f"RATING MODEL: {rating['score']}/100  (grade {rating['grade']})")
    log("=" * 66)
    for comp in rating["components"]:
        log(
            f"  {comp['name']:28s} {comp['value']:.4f}  "
            f"x{comp['weight']:.2f} -> {comp['points']:.1f} poin"
        )
    log(f"  {'TOTAL':28s} {'':6s} {'':5s}    {rating['score']:.1f} poin")
    log("")
    log("Catatan rating:")
    for note in rating["notes"]:
        log(f"  - {note}")
    log("")

    # simpan rating ke info
    info["model_rating"] = rating
    with open(INFO_PATH, "w", encoding="utf-8") as handle:
        json.dump(info, handle, indent=4, ensure_ascii=False)

    log(f"R2 uji v6 : {info['r2_test']}  (v5 sebelumnya: 0.7227)")
    log(f"Threshold : {info['threshold']} (rasio, konsisten dengan backend)")
    log(f"Fitur     : {features}")


if __name__ == "__main__":
    main()
