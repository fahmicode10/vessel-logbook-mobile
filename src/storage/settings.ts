// Helper penyimpanan profil teknisi dengan AsyncStorage (key-value)

import type { Profil } from "@/types/logbook";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PROFIL = "@profil_teknisi";

// Menyimpan objek profil --> harus diubah ke string JSON dulu
export async function simpanProfil(profil: Profil): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(profil);
    await AsyncStorage.setItem(KEY_PROFIL, jsonValue);
    return true;
  } catch (e) {
    console.error("Gagal menyimpan profil", e);
    return false;
  }
}

// Membaca profil --> string JSON diubah kembali ke objek
export async function ambilProfil(): Promise<Profil | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(KEY_PROFIL);
    return jsonValue !== null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Gagal membaca profil:", e);
    return null;
  }
}

// [TAMBAHAN SOAL 2] Menghapus/Reset data profil dari AsyncStorage
export async function hapusProfil(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(KEY_PROFIL);
    return true;
  } catch (e) {
    console.error("Gagal menghapus profil:", e);
    return false;
  }
}
