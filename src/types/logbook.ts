// src/types/logbook.ts
// tipe data yang dipakai bersama oleh layar dan helper penyimpanan

// [TAMBAHAN SOAL 1] Tipe data untuk pilihan Shift
export type Shift = "Pagi" | "Siang" | "Malam";

// [KODE AWAL + SOAL 1] Profil Teknisi
export interface Profil {
  nama: string;
  shift?: Shift; // Tambahan Soal 1
}

// [KODE AWAL + SOAL 5] Item Log Inspeksi Equipment
export interface LogInspeksi {
  id: number;
  peralatan: string;
  suhu: number;
  status: "NORMAL" | "WASPADA";
  tanggal: string;
  teknisi?: string; // Tambahan Soal 5
}

// [TAMBAHAN SOAL 3] Tipe data untuk hasil Ringkasan Agregat SQL
export interface RingkasanLog {
  total: number;
  waspada: number;
}
