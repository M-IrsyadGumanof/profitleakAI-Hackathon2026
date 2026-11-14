# 🧪 QA Test Plan & Validation Matrix — ProfitLeak AI

> **Lead QA:** Febri (QA + Docs + FE Support)  
> **Status:** Siap Eksekusi untuk Fase 4 (Integrasi & Verifikasi Develop)

---

## 1. Tujuan Pengujian
1. Memastikan seluruh endpoint backend mematuhi **Kontrak Data & API** tanpa deviasi.
2. Memvalidasi bahwa model machine learning memprediksi secara akurat serta mengidentifikasi tarif overcharge (*leak*) secara presisi.
3. Memastikan input di luar batas rentang model (*boundary ranges*) ditolak dengan pesan error yang ramah pengguna.
4. Memverifikasi alur End-to-End (E2E) dari form input UI hingga hasil visualisasi dashboard.

---

## 2. Matriks Pengujian Otomatis

| ID Test | Kategori | Deskripsi Pengujian | Input Uji | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | *Health* | Pengecekan server hidup & model ter-load | `GET /api/health` | Status `200 OK`, `status: "healthy"` |
| **TC-02** | *Functional* | Prediksi tarif wajar normal | `weight: 1.5, dist: 150, vol: 5000, price: 20` | Status `200 OK`, `predicted_rate > 0`, `currency: BRL` |
| **TC-03** | *Detection* | Deteksi tarif normal (rasio $\le 1.1023$) | `price: 20.0` (tarif wajar) | Status `200 OK`, `is_leak: false`, rasio wajar |
| **TC-04** | *Detection* | Deteksi kebocoran profit markup 2x | `price: 55.0` (markup 2x) | Status `200 OK`, `is_leak: true`, rasio $> 1.1023$ |
| **TC-05** | *Boundary* | Pengujian batas minimum yang valid | `weight: 0.05, dist: 1.5, vol: 352, price: 5.0` | Status `200 OK` (Diterima tanpa error) |
| **TC-06** | *Boundary* | Pengujian batas maksimum yang valid | `weight: 30.0, dist: 3135, vol: 244600, price: 2110` | Status `200 OK` (Diterima tanpa error) |
| **TC-07** | *Validation* | Input berat di bawah batas ($< 0.05$ kg) | `weight: 0.01` | Status `400 Bad Request` + pesan informatif |
| **TC-08** | *Validation* | Input berat di atas batas ($> 30.0$ kg) | `weight: 35.0` | Status `400 Bad Request` + pesan informatif |
| **TC-09** | *Validation* | Input jarak melebihi batas ($> 3135.79$ km) | `dist: 4000.0` | Status `400 Bad Request` + pesan informatif |
| **TC-10** | *Validation* | Input harga di bawah batas ($< 4.99$ BRL) | `price: 2.0` | Status `400 Bad Request` + pesan informatif |

---

## 3. Prosedur Eksekusi Uji Otomatis

### Menggunakan Node.js:
```bash
# Uji coba live ke server backend:
node frontend/scripts/test-api.mjs

# Uji coba simulasi logika (Mock Mode):
node frontend/scripts/test-api.mjs --mock
```

### Menggunakan Python:
```bash
# Uji coba live:
python frontend/scripts/test_api.py

# Uji coba simulasi logika (Mock Mode):
python frontend/scripts/test_api.py --mock
```

---

## 4. Checklist Penerimaan QA (Acceptance Criteria)
- [x] Komponen UI reusable (`Card`, `StatusBadge`, `MetricCard`, `GaugeChart`, `ResultPanel`) tersedia di `frontend/app/components/`.
- [x] Skrip otomasi uji (`frontend/scripts/test-api.mjs` & `test_api.py`) lolos 100% pada pengujian logika kontrak.
- [x] Fixture data uji (`fixtures.json`) mencakup semua batas valid & invalid.
- [ ] Backend endpoint `/api/health` merespons status `healthy` saat server aktif.
- [ ] Integrasi frontend & backend di branch `develop` berjalan tanpa error console.
