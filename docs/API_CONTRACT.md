# 📄 Kontrak Data & Spesifikasi API v6 — ProfitLeak AI

> **Disusun oleh:** Irsyad (Backend Engineer) & Galang (ML Engineer)  
> **Didokumentasikan & Diverifikasi oleh:** Febri (QA & Docs Engineer)  
> **Versi Backend/Model:** `v6` (Multi-Detector: Rate + Margin)  
> **Base URL Lokal:** `http://localhost:8000`

---

## 1. Ringkasan Eksekutif & Cakupan Model (*Scope*)

ProfitLeak AI mendeteksi **transaksi tidak ekonomis** dengan menggabungkan dua detektor:
1. **Detektor Tarif (`rate`):** Menandai jika rasio tarif aktual terhadap tarif wajar $> \mathbf{3.09779}$.
2. **Detektor Margin (`margin`):** Memprediksi apakah ongkir menyerap porsi besar dari harga jual ($\text{freight} / \text{price} > 0.5$, threshold probabilitas $\ge \mathbf{0.46}$).

> ⚠️ **Batasan Cakupan Model (Scope Honesty):**
> * **Tercakup:** Anomali tarif ongkir aktual & rasio ongkir terhadap harga jual.
> * **TIDAK Tercakup:** Harga modal / COGS / HPP, diskon / voucher / promo, margin laba bersih murni (karena dataset Olist tidak memuat kolom tersebut).

---

## 2. Batas Validasi Input (`valid_ranges`)

Input numerik diverifikasi terhadap rentang berikut. Pelanggaran batas ditolak dengan status **HTTP 400 Bad Request** dengan format `{"detail": "<pesan ramah>"}`:

| Parameter | Tipe | Min | Max | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `weight_kg` | `float` | `0.05` | `30.0` | Berat paket (kg) |
| `distance_km` | `float` | `1.4896` | `3135.7885` | Jarak rute pengiriman (km) |
| `volume_cm3` | `float` | `352.0` | `244608.0` | Volume kubikasi paket (cm³) |
| `price` | `float` | `4.99` | `2110.0` | Harga barang (BRL) |

*Field Opsional:* `product_weight_g` (gram), `length_cm`, `height_cm`, `width_cm`, dan `actual_rate` (ongkir aktual).

---

## 3. Spesifikasi Endpoint

### A. Health Check
* **Method:** `GET` | **Path:** `/api/health`
* **Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "service": "profitleak-api",
  "version": "0.2.0"
}
```

---

### B. Metadata Model & Scope
* **Method:** `GET` | **Path:** `/api/model-info`
* **Response (HTTP 200 OK):**
```json
{
  "threshold": 3.09779,
  "margin_threshold": 0.5,
  "margin_proba_threshold": 0.46,
  "detectors": ["rate", "margin"],
  "scope": {
    "covered": ["tarif ongkir aktual jauh di atas tarif wajar", "ongkir menyerap porsi besar dari harga jual"],
    "not_covered": ["harga modal / COGS / HPP", "diskon", "margin keuntungan bersih"]
  }
}
```

---

### C. Prediksi Tarif Wajar
* **Method:** `POST` | **Path:** `/api/predict`
* **Request:**
```json
{
  "weight_kg": 1.5,
  "distance_km": 150.0,
  "volume_cm3": 5000.0,
  "price": 100.0
}
```
* **Response (HTTP 200 OK):**
```json
{
  "predicted_rate": 20.45,
  "currency": "BRL"
}
```

---

### D. Deteksi Kebocoran Transaksi (Single)
* **Method:** `POST` | **Path:** `/api/detect-leak`
* **Request:**
```json
{
  "weight_kg": 5.0,
  "distance_km": 1000.0,
  "volume_cm3": 20000.0,
  "price": 30.0,
  "actual_rate": 35.0
}
```
* **Response (HTTP 200 OK):**
```json
{
  "predicted_rate": 32.75,
  "actual_rate": 35.0,
  "ratio": 1.0687,
  "freight_ratio": 1.1667,
  "margin_risk_probability": 0.94,
  "is_leak": true,
  "threshold": 3.09779,
  "currency": "BRL",
  "message": "Terindikasi kebocoran profit: ongkir menyerap porsi harga jual terlalu besar",
  "risk_score": 0.82,
  "detectors": {
    "rate": false,
    "margin": true
  },
  "reasons": [
    {
      "code": "freight_eats_margin",
      "severity": "high",
      "detail": "Model memprediksi risiko margin 94.0%. Ongkir aktual menyerap 116.7% dari harga jual.",
      "remedy": "Naikkan harga jual, gabungkan pengiriman, atau terapkan minimum order."
    }
  ]
}
```

---

### E. Analisis Transaksi Batch via CSV
* **Method:** `POST` | **Path:** `/api/upload-csv`
* **Content-Type:** `multipart/form-data` (Field name: `file`)
* **Format:** File `.csv` UTF-8 (maksimal 50.000 baris).
* **Kolom Wajib:** `weight_kg`, `distance_km`, `volume_cm3`, `price`.
* **Kolom Opsional:** `freight_value` atau `actual_rate`.
* **Response (HTTP 200 OK):**
```json
{
  "filename": "transaksi.csv",
  "currency": "BRL",
  "threshold": 3.09779,
  "margin_threshold": 0.5,
  "summary": {
    "total_rows": 500,
    "analysed": 498,
    "skipped": 2,
    "leaks": 64,
    "rate_leaks": 12,
    "margin_risks": 58,
    "estimated_loss": 3450.80,
    "leak_rate": 12.85
  },
  "reason_breakdown": {
    "freight_eats_margin": 58,
    "rate_exceeds_fair": 12
  },
  "recommendations": [
    {
      "code": "freight_eats_margin",
      "count": 58,
      "recommendation": "Terapkan batas minimum order atau bundel paket pada produk bernilai kecil."
    }
  ],
  "rows": [ /* daftar hasil per baris */ ],
  "skipped": [
    { "line": 42, "reason": "weight_kg=99.0 di luar rentang valid (0.05 - 30.0 kg)" }
  ]
}
```
