# 📄 Kontrak Data & Spesifikasi API — ProfitLeak AI

> **Disusun oleh:** Irsyad (Backend Engineer) & Galang (ML Engineer)  
> **Didokumentasikan & Divalidasi oleh:** Febri (QA & Docs Engineer)  
> **Versi Model:** `profitleak_final_model_v5.pkl` / `v5`

---

## 1. Ringkasan Eksekutif

ProfitLeak AI mendeteksi anomali penetapan harga ongkir (*shipping rate*) yang berpotensi merugikan margin bisnis (*profit leak*).
Model inferensi memprediksi tarif wajar berdasarkan 4 fitur fisik pengiriman, membandingkannya dengan tarif aktual yang ditagihkan (`actual_rate`), dan menandai kebocoran jika rasio melebihi ambang batas (*threshold*).

* **Threshold Kebocoran:** `1.102309` (Quantile 0.998)
* **Baseline Median Residual:** `-0.011977`
* **Mata Uang:** `BRL` (Brazilian Real - R$)
* **Base URL Default:** `http://localhost:8000`

---

## 2. Batas Validasi Input (`valid_ranges`)

Semua endpoint yang menerima payload pengiriman **WAJIB** memvalidasi input terhadap rentang berikut. Input di luar batas harus ditolak dengan status HTTP **400 Bad Request**.

| Parameter | Tipe Data | Nilai Min | Nilai Max | Satuan | Deskripsi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `weight_kg` | `float` | `0.05` | `30.0` | Kilogram (kg) | Berat total barang |
| `distance_km` | `float` | `1.4896` | `3135.7885` | Kilometer (km) | Jarak pengiriman |
| `volume_cm3` | `float` | `352.0` | `244608.0` | cm³ | Volume kubikasi paket |
| `price` | `float` | `4.99` | `2110.0` | BRL (R$) | Tarif ongkir aktual yang ditagihkan |

> *Catatan Teknis:* Fitur `price_log` dihitung secara internal oleh backend (`np.log(price)`), **TIDAK** dikirim oleh klien frontend.

---

## 3. Spesifikasi Endpoint

### A. Health Check
* **Method:** `GET`
* **Path:** `/api/health`
* **Deskripsi:** Memeriksa kesiapan server dan status model machine learning yang telah di-*load*.
* **Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "v5"
}
```

---

### B. Prediksi Tarif Ongkir
* **Method:** `POST`
* **Path:** `/api/predict`
* **Deskripsi:** Mengembalikan estimasi tarif ongkir wajar berdasarkan fitur fisik.
* **Request Body:**
```json
{
  "weight_kg": 1.5,
  "distance_km": 150.0,
  "volume_cm3": 5000.0,
  "price": 20.0
}
```
* **Response (HTTP 200 OK):**
```json
{
  "predicted_rate": 18.45,
  "currency": "BRL"
}
```

---

### C. Deteksi Kebocoran Profit (Profit Leak Detection)
* **Method:** `POST`
* **Path:** `/api/detect-leak`
* **Deskripsi:** Menghitung prediksi, membandingkan dengan tarif aktual, dan mengevaluasi indikasi kebocoran profit.
* **Request Body:**
```json
{
  "weight_kg": 1.5,
  "distance_km": 150.0,
  "volume_cm3": 5000.0,
  "price": 55.0
}
```
* **Response (HTTP 200 OK):**
```json
{
  "predicted_rate": 18.45,
  "actual_rate": 55.0,
  "ratio": 2.981,
  "is_leak": true,
  "threshold": 1.102309,
  "currency": "BRL",
  "message": "Tarif aktual 198.1% di atas tarif wajar model. Terindikasi kebocoran profit signifikan!"
}
```

---

### D. Format Respons Error
* **Status HTTP:** `400 Bad Request` (input di luar rentang valid) atau `500 Internal Server Error`
* **Response Body:**
```json
{
  "detail": "Nilai weight_kg (35.0) melebihi batas maksimum 30.0 kg."
}
```

---

## 4. Logika Keputusan Deteksi

```
ratio = actual_rate / predicted_rate

IF ratio > 1.102309 THEN:
    is_leak = true
    status  = "Terindikasi Kebocoran Profit"
ELSE:
    is_leak = false
    status  = "Tarif Wajar / Normal"
```
