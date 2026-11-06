// src/database/db.ts
// Helper basis data relasional SQLite untuk mengelola riwayat inspeksi
import type { LogInspeksi, RingkasanLog } from "@/types/logbook";
import * as SQLite from "expo-sqlite";

const DB_NAME = "logbook.db";

// 1. Inisialisasi Database & Migrasi Kolom (Soal 5)
export async function initDatabase() {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS log_inspeksi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        peralatan TEXT NOT NULL,
        suhu REAL NOT NULL,
        status TEXT NOT NULL,
        tanggal TEXT NOT NULL
      );
    `);

    // Soal 5 : Cek apakah kolom 'teknisi' sudah ada di tabel lama
    const tableInfo = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(log_inspeksi);",
    );
    const hasTeknisi = tableInfo.some((col) => col.name == "teknisi");
    if (!hasTeknisi) {
      await db.execAsync(
        'ALTER TABLE log_inspeksi ADD COLUMN teknisi TEXT DEFAULT "_";',
      );
    }
  } catch (e) {
    console.error("Gagal inisialisasi database :", e);
  }
}

// 2. Tambah Catatan Inspeksi dengan Kolom Teknisi (Soal 5)
export async function tambahLog(
  peralatan: string,
  suhu: number,
  status: "NORMAL" | "WASPADA",
  tanggal: string,
  teknisi: string = "_",
): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.runAsync(
      "INSERT INTO log_inspeksi (peralatan, suhu, status, tanggal, teknisi) VALUES (?, ?, ?, ?, ?);",
      [peralatan, suhu, status, tanggal, teknisi],
    );
    return true;
  } catch (e) {
    console.error("Gagal menambah log :", e);
    return false;
  }
}

// 3. Ambil semua Log & Pencarian Peralatan (Bonus)
export async function ambilSemuaLog(
  kataKunci?: string,
): Promise<LogInspeksi[]> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    if (kataKunci && kataKunci.trim() !== "") {
      return await db.getAllAsync<LogInspeksi>(
        "SELECT * FROM log_inspeksi WHERE peralatan LIKE ? ORDER BY id DESC;",
        [`%${kataKunci.trim()}%`],
      );
    }
    return await db.getAllAsync<LogInspeksi>(
      "SELECT * FROM log_inspeksi ORDER BY id DESC;",
    );
  } catch (e) {
    console.error("Gagal mengambil log :", e);
    return [];
  }
}

// 4. Menghapus data inspeksi berdasarkan ID (DELETE)
export async function hapusLog(id: number): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.runAsync("DELETE FROM log_inspeksi WHERE id = ?;", [id]);
    return true;
  } catch (e) {
    console.error("Gagal menghapus log :", e);
    return false;
  }
}

// 5. Update / Koreksi Suhu & Status (Soal 4)
export async function updateLog(
  id: number,
  suhu: number,
  status: "NORMAL" | "WASPADA",
): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.runAsync(
      "UPDATE log_inspeksi SET suhu = ?, status = ? WHERE id = ?;",
      [suhu, status, id],
    );
    return true;
  } catch (e) {
    console.error("Gagal mengupdate log :", e);
    return false;
  }
}

// 6. Ringkasan Data Agregat SQL (Soal 3)
export async function ambilRingkasanLog(): Promise<RingkasanLog> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    const result = await db.getFirstAsync<{
      total: number;
      waspada: number | null;
    }>(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'WASPADA' THEN 1 ELSE 0 END) AS waspada FROM log_inspeksi;",
    );
    return {
      total: result?.total || 0,
      waspada: result?.waspada || 0,
    };
  } catch (e) {
    console.error("Gagal mengambil ringkasan log :", e);
    return { total: 0, waspada: 0 };
  }
}
