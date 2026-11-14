# 📂 Dataset Uji & Fixtures CSV - ProfitLeak AI
**Pemilik**: Galang (ML / Data Engineer)  
**Tujuan**: Digunakan untuk pengujian fitur *Upload CSV* di frontend (`/upload` & `/dashboard`) dan verifikasi otomatis oleh tim QA.

---

## 📋 Daftar Berkas Fixture CSV

| Nama File | Deskripsi Skenario | Karakteristik Data | Hasil Deteksi yang Diharapkan |
| :--- | :--- | :--- | :--- |
| **`contoh_normal.csv`** | Transaksi Sehat & Wajar (7 baris) | Harga memadai (Rp 80.000 - Rp 450.000), ongkir proporsional ($< 3.09\times$ wajar). | **0 Kebocoran** (`is_leak: False`). Status: Hijau / Sehat. |
| **`contoh_ongkir_mahal.csv`** | Overcharging Kurir (7 baris) | Ongkir aktual dimarkup liar $3.5\times - 8\times$ di atas tarif wajar ekspedisi. | **7 Kebocoran**. Terdeteksi oleh **Detektor Tarif (`rate`)**. Rekomendasi: Negosiasi ulang ekspedisi. |
| **`contoh_margin_tipis.csv`** | Transaksi Tidak Ekonomis (7 baris) | Barang bernilai murah (Rp 12.000 - Rp 25.000), ongkir Rp 16.000 - Rp 34.000 ($>50\%$ harga produk). | **7 Kebocoran**. Terdeteksi oleh **Detektor Margin (`margin`)**. Rekomendasi: Naikkan harga / bundle minimum order. |
| **`contoh_campuran.csv`** | Gabungan Komprehensif (8 baris) | Campuran normal, ongkir mahal, margin tipis, + **1 baris sengaja invalid** (`weight_kg=55 kg`). | **6 Terindikasi Bocor, 1 Normal, 1 Di-skip** (baris 8 dilewati dengan aman). |

---

## 🔍 Format Kolom CSV
1. **Kolom Wajib (Required)**:
   - `weight_kg`: Berat paket dalam kilogram (rentang: 0.05 s/d 30.0 kg).
   - `distance_km`: Jarak pengiriman dalam kilometer (rentang: 1.4896 s/d 3135.79 km).
   - `volume_cm3`: Volume dimensi paket ($P \times L \times T$ dalam cm, rentang: 352.0 s/d 244608.0 cm³).
   - `price`: Harga jual barang dalam mata uang BRL (rentang: 4.99 s/d 2110.0 BRL).
2. **Kolom Opsional (Optional)**:
   - `actual_rate`: Tarif ongkir riil yang ditagih kurir (bila kosong, sistem menganggap `price` sebagai tarif).
   - `product_weight_g`, `length_cm`, `height_cm`, `width_cm`: Dimensi fisik opsional untuk menghitung kepadatan paket (`density_g_cm3`).
