# 🧪 QA Test Plan & Validation Matrix v6 — ProfitLeak AI

> **Lead QA:** Febri (QA + Docs + FE Support)  
> **Status:** Siap Eksekusi untuk Fase 4 (Verifikasi E2E & Stabilitas)

---

## 1. Tujuan Pengujian v6
1. Memastikan kedua detektor backend (`rate` dan `margin`) bekerja akurat sesuai ambang batas ($3.09779$ dan $0.46$).
2. Memverifikasi kemampuan analisis batch file CSV multipart hingga batas baris wajar.
3. Memastikan input di luar rentang validitas model menghasilkan respons penolakan **HTTP 400 Bad Request** dengan pesan ramah pengguna.
4. Memverifikasi seluruh komponen frontend pendukung (`UploadDropzone`, `SummaryCard`, `RiskBadge`, `ReasonList`, `RecommendationPanel`, `EmptyState`, `ErrorBanner`) siap di-import oleh Ihqfal.

---

## 2. Matriks Pengujian Otomatis

| ID Test | Kategori | Target Endpoint | Input Uji | Kriteria Kelulusan |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | *Health* | `GET /api/health` | - | Status `200 OK`, `status: "ok"` |
| **TC-02** | *Metadata* | `GET /api/model-info` | - | Status `200 OK`, memuat daftar detektor `["rate", "margin"]` |
| **TC-03** | *Prediction* | `POST /api/predict` | `weight: 1.5, dist: 150, vol: 5000, price: 100` | Status `200 OK`, `predicted_rate > 0`, `currency: BRL` |
| **TC-04** | *Detection* | `POST /api/detect-leak` | Transaksi sehat (`price: 150, actual: 20`) | Status `200 OK`, `is_leak: false` |
| **TC-05** | *Rate Leak* | `POST /api/detect-leak` | Tarif mahal (`price: 400, actual: 180`) | Status `200 OK`, `is_leak: true`, rasio $> 3.09779$ |
| **TC-06** | *Margin Risk* | `POST /api/detect-leak` | Ongkir tinggi vs harga (`price: 30, actual: 35`) | Status `200 OK`, `is_leak: true`, reason: `freight_eats_margin` |
| **TC-07** | *CSV Batch* | `POST /api/upload-csv` | File `sample_transactions.csv` (multipart) | Status `200 OK`, `summary.total_rows > 0`, terdapat baris skipped |
| **TC-08** | *Boundary Min*| `POST /api/detect-leak` | Batas bawah valid (`weight: 0.05, dist: 1.5, ...`) | Status `200 OK` (Diterima tanpa error) |
| **TC-09** | *Boundary Max*| `POST /api/detect-leak` | Batas atas valid (`weight: 30.0, dist: 3135, ...`) | Status `200 OK` (Diterima tanpa error) |
| **TC-10** | *Validation* | `POST /api/detect-leak` | Berat invalid (`weight: 0.01 kg`) | Status `400 Bad Request`, `detail` berupa string informatif |

---

## 3. Eksekusi Pengujian

```bash
# 1. Jalankan pengujian otomatis (Node.js):
node frontend/scripts/test-api.mjs

# 2. Jalankan simulasi pengujian cepat (Mock Mode):
node frontend/scripts/test-api.mjs --mock

# 3. Jalankan pengujian Python:
python frontend/scripts/test_api.py --mock
```

---

## 4. Checklist Kesiapan Demo Tim (Fase 5)
- [x] Komponen UI siap di `frontend/app/components/` (termasuk upload CSV & multi-faktor).
- [x] Skrip uji otomatis lolos 100%.
- [x] File CSV dummy sampel tersedia di `frontend/scripts/sample_transactions.csv`.
- [x] Dokumentasi kontrak API selaras dengan implementasi backend.
- [ ] Gladi bersih alur demo: Febri (buka) -> Ihqfal (home) -> Suhafdal (upload CSV) -> Irsyad (dashboard) -> Galang (model) -> Febri (tutup).
