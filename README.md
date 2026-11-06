# Logbook Inspeksi Kapal ('vessel-logbook-mobile') - Mobile Computing App

Ship Inspection Logbook adalah aplikasi mobile berbasis **React Native** dan **Expo SDK 58** yang dirancang untuk mengelola dan mencatat riwayat inspeksi peralatan kapal secara offline-first. Aplikasi ini mengitegrasikan dua metode penyimpanan data lokal : **AsyncStorage** (Key-Value) untuk manajemen profil dan shift teknisi **SQLite** (Database Relasional) untuk penanganan data logbook inspeksi yang terstruktur dan dinamis.

---

## Fitur Utama

1. **Pengaturan Profil Teknisi ('AsyncStorage')**
   - Menyimpan dan membaca nama teknisi aktif secara permanen.
   - Menerapkan konversi JSON ('JSON.stringify' saat simpan, 'JSON.parse' saat baca).

2. **Pencatat Log Inspeksi ('SQLite')**
   - **Tambah Log (INSERT):** Menginput nama peralatan, suhu (°C), tanggal dan status (`NORMAL` | `WASPADA`).
   - **Tampil log (SELECT):** Menampilkan daftar riwayat inspeksi terurut dari pencatatan terbaru ('ORDER BY id DESC').
   - **Hapus Log (DELETE):** Menghapus baris catatan inspeksi spesifik berdasarkan 'id'.

3. **Dashboard Ringkasan Agregat SQL**
   - Menampilkan statistik total inspeksi dan jumlah status `WASPADA` secara _real time_ menggunakan query agregat SQL (`COUNT` & `SUM`).

4. **Mode Koreksi & Update Data**
   - Fitur edit suhu langsung di tempat beserta rekalkulasi status otomatis tanpa mengganggu riwayat data lainnya.

5. **Filter Pencarian Real Time**
   - Pencarian nama peralatan secara cepat berbasi query SQL `LIKE`.

6. **Migrasi Skema Database Otomatis**
   - Pengecekan skema tabel SQLite menggunakan `PRAGMA table_info` untuk menambahkan kolom baru (`teknisi`) secara otomatis tanpa menghapus data log lama.

---

## Tech Stack

- **Framework:** React Native (Expo SDK 58 - Expo Router)
- **Bahasa Pemrograman:** TypeScript
- **Penyimpanan Key-Value:** `@react-native-async-storage/async-storage`
- **Database Relasional:** `expo-sqlite`

---

## Struktur Direktori

```text
praktikum-async/
├── src/
│   ├── app/
│   │   ├── _layout.tsx      # Root Layout Expo Router
│   │   └── index.tsx        # Antarmuka Utama (Form Input & List Riwayat)
│   ├── database/
│   │   └── db.ts            # Helper SQLite (Init DB, Insert, Select, Delete)
│   ├── storage/
│   │   └── settings.ts      # Helper AsyncStorage (Simpan & Baca Profil)
│   └── types/
│       └── logbook.ts       # Interface TypeScript (Profil & LogInspeksi)
├── app.json
├── package.json
└── tsconfig.json
```

## Panduan Menjalankan & Pengujian Project

### 1. Prasyarat Sistem

- **Node.js** (versi LTS minimum `v18.x` atau lebih baru)
- **npm** (Bawaan Node.js)
- **Perangkat Pengujian**
  - Aplikasi Expo Go versi SDK 58 yang terinstall di Android/IOS
  - Android Studio Emulator atau Xcode iOS Simulator.

2. Langkah Instalasi & Menjalankan Aolikasi
   - **Jalankan Perintah install dependencies**
     npm install
   - **Jalankan Server Expo**
     npx expo start

3. Membuka Aplikasi
   - Scan QR Code yang tampil di terminal menggunakan aplikasi Expo Go
