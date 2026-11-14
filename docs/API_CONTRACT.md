# 📄 Kontrak Data & Spesifikasi API v6 — ProfitLeak AI

> **Disusun oleh:** Irsyad (Backend Engineer) & Galang (ML Engineer)  
> **Didokumentasikan & Diverifikasi oleh:** Febri (QA & Docs Engineer)  
> **Versi Backend/Model:** `v6` (Multi-Detector + Google Gemini LLM Advice)  
> **Base URL Lokal:** `http://localhost:8000`

---

## 1. Ringkasan Eksekutif & Cakupan Model (*Scope*)

ProfitLeak AI mendeteksi **transaksi tidak ekonomis** dengan menggabungkan dua detektor:
1. **Detektor Rasio Tarif (`rate`):** Menandai jika rasio tarif aktual terhadap tarif wajar $> \mathbf{3.09779}$.
2. **Detektor Risiko Margin (`margin`):** Memprediksi apakah ongkir menyerap porsi besar dari harga jual ($\text{freight} / \text{price} > 0.5$, threshold probabilitas $\ge \mathbf{0.46}$).
3. **Fitur Baru (Minta Saran AI - Google Gemini):** Menerjemahkan ringkasan analisis transaksi menjadi rekomendasi bahasa awam yang ringkas, hemat token, dan anti-halusinasi.

> ⚠️ **Batasan Cakupan Model (Scope Honesty):**
> * **Tercakup:** Anomali tarif ongkir aktual & rasio ongkir terhadap harga jual.
> * **TIDAK Tercakup:** Harga modal / COGS / HPP, diskon / voucher / promo, margin laba bersih murni (karena dataset Olist tidak memuat kolom tersebut).
> * **Prinsip AI:** Gemini dilarang membahas HPP/diskon dan dilarang membuat angka sendiri (rekomendasi harga dihitung oleh Python).

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
* **Request Body:**
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

---

### F. Fitur Baru: Saran AI Bahasa Awam (Google Gemini)
* **Method:** `POST` | **Path:** `/api/advice`
* **Deskripsi:** Menerjemahkan ringkasan analisis menjadi rekomendasi aksi operasional bahasa awam.

#### Request Body:
```json
{
  "filename": "demo_ongkir_mahal.csv",
  "threshold": 3.09779,
  "summary": {
    "total_rows": 10,
    "analysed": 10,
    "skipped": 0,
    "leaks": 10,
    "rate_leaks": 10,
    "margin_risks": 0,
    "estimated_loss": 813.44,
    "leak_rate": 100.0
  },
  "rows": [
    {
      "line": 2,
      "predicted_rate": 11.55,
      "actual_rate": 55.0,
      "ratio": 4.76,
      "freight_ratio": 0.3438,
      "is_leak": true,
      "risk_score": 0.55,
      "detectors": { "rate": true, "margin": false }
    }
  ]
}
```

#### Response 200 OK:
```json
{
  "source": "gemini",
  "generated_at": "2026-11-14T10:00:00Z",
  "headline": "Ongkir kamu rata-rata 5x lebih mahal dari wajar",
  "ringkasan": "10 dari 10 transaksi membayar ongkir jauh di atas tarif wajar.",
  "prioritas": [
    {
      "judul": "Negosiasi tarif ekspedisi",
      "dampak": "Potensi hemat R$ 813",
      "aksi": ["Minta daftar tarif resmi", "Bandingkan 2 ekspedisi alternatif"],
      "terdampak": [2, 3, 4]
    }
  ],
  "per_baris": [
    {
      "line": 2,
      "masalah": "Ongkir 4.8x tarif wajar",
      "saran_harga": "Naikkan harga minimal ke R$ 183.33"
    }
  ],
  "catatan": "Saran AI, bukan nasihat keuangan. Model tidak mencakup HPP & diskon."
}
```

*Perilaku Fallback:*
* Bila `leaks === 0`: Menjawab statis seketika tanpa memanggil Gemini (*Zero Token*).
* Bila `GEMINI_API_KEY` tidak diisi atau terjadi kegagalan jaringan: Mengembalikan respons dengan `source: "rule_based"` (HTTP 200, tidak pernah crash 500).
* Bila payload salah: Menolak dengan **HTTP 400 Bad Request** `{"detail": "<pesan ramah>"}`.
