// src/app/index.tsx
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ambilRingkasanLog,
  ambilSemuaLog,
  hapusLog,
  initDatabase,
  tambahLog,
  updateLog,
} from "@/database/db";
import { ambilProfil, hapusProfil, simpanProfil } from "@/storage/settings";
import type { LogInspeksi, RingkasanLog, Shift } from "@/types/logbook";

export default function MainScreen() {
  // State Profil (AsyncStorage)
  const [namaTeknisi, setNamaTeknisi] = useState("");
  const [shiftTeknisi, setShiftTeknisi] = useState<Shift>("Pagi");
  const [inputNama, setInputNama] = useState("");
  const [selectedShift, setSelectedShift] = useState<Shift>("Pagi");

  // State Form & List Log (SQLite)
  const [logs, setLogs] = useState<LogInspeksi[]>([]);
  const [peralatan, setPeralatan] = useState("");
  const [suhu, setSuhu] = useState("");
  const [status, setStatus] = useState<"NORMAL" | "WASPADA">("NORMAL");

  // Soal 3: State Ringkasan Agregat
  const [ringkasan, setRingkasan] = useState<RingkasanLog>({
    total: 0,
    waspada: 0,
  });

  // Soal 4: State Edit Mode (ID Catatan yang sedang dikoreksi)
  const [idEdit, setIdEdit] = useState<number | null>(null);

  // Bonus: State Search Filter
  const [kataKunci, setKataKunci] = useState("");

  useEffect(() => {
    const setup = async () => {
      await initDatabase();
      await muatData();
    };
    setup();
  }, []);

  // Memuat Ulang Seluruh Data
  const muatData = async (querySearch: string = kataKunci) => {
    // 1. Memuat Profil dari AsyncStorage
    const profilData = await ambilProfil();
    if (profilData) {
      setNamaTeknisi(profilData.nama);
      setShiftTeknisi(profilData.shift || "Pagi");
      setInputNama(profilData.nama);
      setSelectedShift(profilData.shift || "Pagi");
    } else {
      setNamaTeknisi("");
      setInputNama("");
    }

    // 2. Memuat Daftar Log dari SQLite
    const logData = await ambilSemuaLog(querySearch);
    setLogs(logData);

    // 3. Memuat Ringkasan Agregat dari SQLite
    const dataRingkasan = await ambilRingkasanLog();
    setRingkasan(dataRingkasan);
  };

  // Soal 1: Simpan Profil & Shift
  const handleSimpanProfil = async () => {
    if (!inputNama.trim()) {
      Alert.alert("Peringatan", "Nama teknisi tidak boleh kosong!");
      return;
    }
    const sukses = await simpanProfil({
      nama: inputNama,
      shift: selectedShift,
    });
    if (sukses) {
      setNamaTeknisi(inputNama);
      setShiftTeknisi(selectedShift);
      Alert.alert("Sukses", "Profil & Shift teknisi tersimpan!");
    }
  };

  // Soal 2: Reset Profil
  const handleResetProfil = () => {
    Alert.alert("Konfirmasi Reset", "Yakin ingin menghapus profil teknisi?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          const sukses = await hapusProfil();
          if (sukses) {
            setNamaTeknisi("");
            setInputNama("");
            setShiftTeknisi("Pagi");
            setSelectedShift("Pagi");
            Alert.alert("Reset", "Profil telah dihapus.");
          }
        },
      },
    ]);
  };

  // Soal 4 & Soal 5: Simpan (Tambah / Edit) Catatan Inspeksi
  const handleSimpanLog = async () => {
    if (!peralatan.trim() || !suhu.trim()) {
      Alert.alert("Peringatan", "Mohon isi nama peralatan dan suhu!");
      return;
    }

    const suhuNumber = parseFloat(suhu);
    if (isNaN(suhuNumber)) {
      Alert.alert("Peringatan", "Suhu harus berupa angka!");
      return;
    }

    // Rekalkulasi status otomatis (Suhu > 80 -> WASPADA)
    const statusTerhitung: "NORMAL" | "WASPADA" =
      suhuNumber > 80 ? "WASPADA" : status;

    if (idEdit !== null) {
      // SOAL 4: Mode Edit (UPDATE)
      const sukses = await updateLog(idEdit, suhuNumber, statusTerhitung);
      if (sukses) {
        Alert.alert("Sukses", "Perubahan suhu & status tersimpan!");
        batalEdit();
        await muatData();
      }
    } else {
      // SOAL 5: Mode Tambah Baru (INSERT) + Nama Teknisi
      const tanggalSekarang = new Date().toISOString().split("T")[0];
      const teknisiAktif = namaTeknisi.trim() ? namaTeknisi : "-";

      const sukses = await tambahLog(
        peralatan,
        suhuNumber,
        statusTerhitung,
        tanggalSekarang,
        teknisiAktif,
      );
      if (sukses) {
        setPeralatan("");
        setSuhu("");
        setStatus("NORMAL");
        await muatData();
        Alert.alert("Sukses", "Catatan inspeksi tersimpan!");
      }
    }
  };

  // Soal 4: Memilih Catatan untuk Di-edit Suhunya
  const handlePilihEdit = (item: LogInspeksi) => {
    setIdEdit(item.id);
    setPeralatan(item.peralatan);
    setSuhu(item.suhu.toString());
    setStatus(item.status);
  };

  const batalEdit = () => {
    setIdEdit(null);
    setPeralatan("");
    setSuhu("");
    setStatus("NORMAL");
  };

  const handleHapusLog = (id: number) => {
    Alert.alert("Konfirmasi Hapus", "Yakin ingin menghapus catatan ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          const sukses = await hapusLog(id);
          if (sukses) {
            if (idEdit === id) batalEdit();
            await muatData();
          }
        },
      },
    ]);
  };

  // Bonus: Search Filter Handler
  const handleSearchChange = (text: string) => {
    setKataKunci(text);
    muatData(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.mainTitle}>Logbook Inspeksi Kapal</Text>

          {/* SOAL 1 & 2: PROFIL TEKNISI & SHIFT */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Pengaturan Profil Teknisi</Text>
            <Text style={styles.welcomeText}>
              Teknisi:{" "}
              <Text style={styles.boldText}>
                {namaTeknisi
                  ? `${namaTeknisi} (Shift ${shiftTeknisi})`
                  : "(belum diatur)"}
              </Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Masukkan Nama Teknisi..."
              value={inputNama}
              onChangeText={setInputNama}
            />

            {/* Pilihan Shift (Soal 1) */}
            <Text style={styles.label}>Pilihan Shift:</Text>
            <View style={styles.shiftContainer}>
              {(["Pagi", "Siang", "Malam"] as Shift[]).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.shiftChip,
                    selectedShift === item && styles.shiftActive,
                  ]}
                  onPress={() => setSelectedShift(item)}
                >
                  <Text
                    style={[
                      styles.shiftText,
                      selectedShift === item && styles.shiftTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rowBtn}>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 1, marginRight: 8 }]}
                onPress={handleSimpanProfil}
              >
                <Text style={styles.btnText}>Simpan Profil</Text>
              </TouchableOpacity>

              {/* Tombol Reset Profil (Soal 2) */}
              <TouchableOpacity
                style={styles.btnReset}
                onPress={handleResetProfil}
              >
                <Text style={styles.btnText}>Reset Profil</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SOAL 4 & 5: FORM INSPEKSI */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {idEdit !== null
                ? "✏️ Edit / Koreksi Suhu"
                : "📝 Form Inspeksi Baru"}
            </Text>

            <Text style={styles.label}>Nama Peralatan</Text>
            <TextInput
              style={[styles.input, idEdit !== null && styles.inputDisabled]}
              placeholder="Contoh: Pompa Ballast 1"
              value={peralatan}
              onChangeText={setPeralatan}
              editable={idEdit === null}
            />

            <Text style={styles.label}>Suhu Peralatan (°C)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 75.5"
              keyboardType="numeric"
              value={suhu}
              onChangeText={setSuhu}
            />

            <Text style={styles.label}>Status Peralatan</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  status === "NORMAL" && styles.statusActiveNormal,
                ]}
                onPress={() => setStatus("NORMAL")}
              >
                <Text style={styles.statusText}>NORMAL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusChip,
                  status === "WASPADA" && styles.statusActiveWaspada,
                ]}
                onPress={() => setStatus("WASPADA")}
              >
                <Text style={styles.statusText}>WASPADA</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={idEdit !== null ? styles.btnWarning : styles.btnSuccess}
              onPress={handleSimpanLog}
            >
              <Text style={styles.btnText}>
                {idEdit !== null
                  ? "💾 Simpan Perubahan"
                  : "+ Tambah Catatan Inspeksi"}
              </Text>
            </TouchableOpacity>

            {idEdit !== null && (
              <TouchableOpacity style={styles.btnCancel} onPress={batalEdit}>
                <Text style={styles.btnCancelText}>Batal Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SOAL 3 & BONUS: RIWAYAT, RINGKASAN, & PENCARIAN */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Riwayat Inspeksi</Text>

            {/* SOAL 3: Ringkasan SQL Aggregate */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                Total: <Text style={styles.boldText}>{ringkasan.total}</Text> |
                WASPADA:{" "}
                <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                  {ringkasan.waspada}
                </Text>
              </Text>
            </View>

            {/* BONUS: Pencarian */}
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="🔍 Cari nama peralatan..."
              value={kataKunci}
              onChangeText={handleSearchChange}
            />

            {logs.length === 0 ? (
              <Text style={styles.emptyText}>
                Tidak ada data riwayat inspeksi.
              </Text>
            ) : (
              logs.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.logCard,
                    idEdit === item.id && styles.logCardActive,
                  ]}
                  onPress={() => handlePilihEdit(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logTitle}>{item.peralatan}</Text>
                    <Text style={styles.logDetail}>
                      Suhu: {item.suhu}°C | Tanggal: {item.tanggal}
                    </Text>

                    {/* SOAL 5: Tampilkan Nama Teknisi */}
                    <Text style={styles.logTeknisi}>
                      Teknisi: {item.teknisi || "-"}
                    </Text>

                    <View
                      style={[
                        styles.badge,
                        item.status === "NORMAL"
                          ? styles.badgeNormal
                          : styles.badgeWaspada,
                      ]}
                    >
                      <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={() => handleHapusLog(item.id)}
                  >
                    <Text style={styles.btnDeleteText}>Hapus</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 16 },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
    color: "#1F2937",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
  },
  welcomeText: { fontSize: 14, color: "#374151", marginBottom: 8 },
  boldText: { fontWeight: "bold", color: "#2563EB" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#FAFAFA",
  },
  inputDisabled: { backgroundColor: "#E5E7EB", color: "#6B7280" },
  shiftContainer: { flexDirection: "row", gap: 8, marginVertical: 6 },
  shiftChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  shiftActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  shiftText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  shiftTextActive: { color: "#FFFFFF" },
  rowBtn: { flexDirection: "row", marginTop: 12 },
  btnPrimary: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnReset: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
  },
  btnSuccess: {
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  btnWarning: {
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  btnCancel: { alignItems: "center", marginTop: 8 },
  btnCancelText: { color: "#EF4444", fontWeight: "600", fontSize: 13 },
  btnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  statusActiveNormal: { backgroundColor: "#D1FAE5", borderColor: "#10B981" },
  statusActiveWaspada: { backgroundColor: "#FEE2E2", borderColor: "#EF4444" },
  statusText: { fontWeight: "bold", fontSize: 13, color: "#111827" },
  summaryBox: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  summaryText: { fontSize: 14, color: "#1E40AF" },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontStyle: "italic",
    marginVertical: 12,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 12,
  },
  logCardActive: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  logTitle: { fontSize: 15, fontWeight: "bold", color: "#1F2937" },
  logDetail: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  logTeknisi: {
    fontSize: 11,
    color: "#2563EB",
    marginTop: 2,
    fontStyle: "italic",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  badgeNormal: { backgroundColor: "#D1FAE5" },
  badgeWaspada: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 11, fontWeight: "bold", color: "#111827" },
  btnDelete: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDeleteText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
});
