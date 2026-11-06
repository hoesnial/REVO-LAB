# Pemetaan tujuan, aktivitas, dan bukti belajar

Acuan: audit kode `a4c135d`, 1 November 2026. Tujuan berikut adalah **operasionalisasi usulan** dari empat tujuan briefing pada [eras.ts](../../src/lib/revo/eras.ts), bukan pemetaan CP/TP kurikulum yang sudah disahkan. Guru menetapkan kedalaman, kelas sasaran, serta kriteria ketuntasan sebelum uji kelas.

## Matriks ketertelusuran

Kode A/B merujuk pada pretest dan posttest dalam [instrumen](04-validation-instruments.md). Bukti tambahan di kolom terakhir perlu dikumpulkan guru; aplikasi belum mempunyai fitur pengumpulan jawaban uraian.

| ID / tujuan belajar yang dapat diamati | Fitur REVO / sumber | Aktivitas siswa | Asesmen tersedia dan usulan | Bukti belajar dan keterbatasannya |
| --- | --- | --- | --- | --- |
| LO1 — Menjelaskan perubahan energi bahan bakar menjadi kerja mekanis dan arti mekanisasi | Eksplorasi ketel/piston, narasi, eksperimen; `content.ts`, `steamEngine.ts` | Prediksi perubahan setelah menambah bahan bakar; nyalakan mesin dan bandingkan prediksi dengan panas/tekanan/produksi | Refleksi Q2; A1/B1, A2/B2 dan A7/B7; pertanyaan lisan sebab-akibat | Jawaban menghubungkan panas, uap, kerja pada piston, dan produksi serta menyebut air/bahan bakar tetap diperlukan. Produksi 100 unit sendiri hanya bukti memenuhi aturan simulasi |
| LO2 — Mengidentifikasi lima komponen dan membedakan fungsi ketel, pipa, piston, roda gila, mesin tekstil | Eksplorasi 5/5, inventaris perakitan, cek `steam` dan `rotation`; `content.ts`, `assembly.ts` | Pilih bagian, jelaskan fungsinya, pasang pada hubungan yang sesuai dan perbaiki kesalahan | Cek perakitan 1–2; A3/B3 dan A7/B7; guru meminta alasan pemasangan tanpa membaca petunjuk | Penjelasan ketel menghasilkan uap, pipa menyalurkan, piston bergerak bolak-balik, engkol mengubah gerak, roda gila meratakan putaran. Lima klik dan lima snap tidak mengukur retensi |
| LO3 — Menelusuri transmisi tenaga dari mesin uap ke mesin tekstil | Hotspot Transmisi Tenaga, hubungan perakitan, animasi sabuk/poros/roda gigi; `PowerTransmission.tsx`, `RevoLab.tsx` | Ikuti jalur tenaga dan bedakan aliran uap dari gerak putar | Cek `rotation`; A4/B4 dan A7/B7; gambar alur pada lembar kerja | Siswa menunjukkan engkol–poros/roda gila–puli/sabuk–poros transmisi–mesin tekstil dan menjelaskan uap tidak masuk langsung ke alat tenun. Garis kuning adalah aliran energi, bukan pipa fisik |
| LO4 — Menghubungkan tenaga mekanis dengan produksi tekstil dan membatasi arti angka produksi | Animasi mesin tekstil, misi, simpulan hasil; `TextileMachine.tsx`, `MissionPanel.tsx` | Amati gerakan alat tenun saat mesin menyala/berhenti; jelaskan peran tenaga dan operator | A5/B5, A7/B7; pertanyaan lisan “Apa yang belum dimodelkan dari produksi kain?” | Menjelaskan penerima tenaga adalah mekanisme penenunan; membedakan menenun dari memintal; angka unit bukan meter kain atau data produktivitas historis. Tidak ada soal in-game khusus membedakan pemintalan–penenunan |
| LO5 — Menjelaskan perubahan lokasi pabrik dan dampak industrialisasi dari beberapa sudut pandang | Cek `factory`, narasi/konteks sejarah, refleksi Q1 dan Q3, simpulan hasil; `content.ts`, `HistoricalInfoPanel.tsx` | Bandingkan ketergantungan tenaga air/uap; diskusikan manfaat bagi pemilik serta beban bagi buruh/lingkungan | Refleksi Q1/Q3; A6/B6 dan A8/B8; diskusi dengan alasan | Argumen menyebut peluang produksi/lokasi serta konsekuensi bagi kelompok berbeda, tidak menyimpulkan semua pekerja langsung sejahtera atau air tidak diperlukan. Pilihan ganda saja belum menilai kualitas argumen historis |

Nama sumber ringkas di atas berada di [lib/revo](../../src/lib/revo/) dan [components/revo](../../src/components/revo/). Dasar sejarah dan isu yang perlu konfirmasi ada di [audit isi](03-content-audit.md).

## Apa yang sebenarnya disimpan aplikasi

| Indikator | Arti teknis | Tidak boleh disimpulkan sebagai |
| --- | --- | --- |
| Eksplorasi 5/5 | Lima ID komponen pernah dibuka | Lima konsep sudah dipahami; durasi membaca atau perhatian siswa |
| Pemasangan 5/5 | Lima ID ditempatkan pada socket yang cocok | Siswa mampu merakit mesin industri sungguhan |
| Cek perakitan 3/3 | Semua cek telah dijawab benar; retry dan penjelasan tersedia | Skor percobaan pertama, jumlah salah, atau pengetahuan tanpa bantuan |
| Misi selesai | 100 unit, tidak ada pelampauan 75 pada percobaan yang dinyatakan berhasil | Kompetensi keselamatan ketel nyata, optimasi energi, atau produktivitas riil |
| Refleksi x/3 | Skor dari jawaban pada percobaan lengkap terbaru | Nilai ujian baku atau peningkatan dibanding sebelum bermain |
| Level Completed | Semua prasyarat dan seluruh pengiriman refleksi selesai, tanpa syarat skor sempurna | Sertifikasi penguasaan sejarah |

[Skema progres](../../src/lib/revo/progress.ts) menyimpan ID, cek yang selesai, status misi, jawaban refleksi/checkpoint, dan preferensi suara. Tidak menyimpan log klik, waktu per konsep, jumlah retry perakitan, seluruh riwayat skor, atau penjelasan lisan siswa. Metrik tekanan tertinggi/durasi terlihat selama sesi misi, tetapi tidak menjadi arsip percobaan lengkap setelah reload.

## Bukti tambahan yang disarankan

1. Pretest tanpa membuka game atau petunjuk; simpan jawaban dengan kode peserta.
2. Selama bermain, observer mencatat bantuan, penjelasan konsep, serta miskonsepsi menggunakan checklist. Catatan perilaku dipisahkan dari interpretasi observer.
3. Posttest tanpa game/petunjuk dan tanpa diskusi kelompok; sertakan dua uraian yang menuntut alasan. Form B masih draf ekuivalensi, bukan bentuk paralel terkalibrasi.
4. Guru memberi rubrik uraian dan membandingkan profil per LO, bukan hanya total. Jika memungkinkan, minta penilai kedua meninjau sebagian jawaban untuk menyamakan penilaian.
5. Diskusi penutup dapat memakai sumber sejarah pendek yang dipilih guru. Pertanyaan “Siapa yang diuntungkan dan siapa yang menanggung biaya?” memperluas refleksi; kegiatan ini berada di luar fitur asesmen otomatis game.

Untuk sesi berpasangan, pencapaian game adalah pencapaian pasangan. Pretest/posttest tetap individual agar bukti tidak salah diatribusikan. Jangan menyalin ringkasan hasil satu perangkat sebagai nilai semua siswa.

## Interpretasi yang layak dilaporkan

Laporkan penyelesaian tahap, skor refleksi, hasil tes luar game, dan angket sebagai variabel berbeda. Angket “saya merasa memahami” mengukur persepsi, bukan penguasaan. Selisih pre–post mendeskripsikan perubahan pada peserta yang diukur; tanpa rancangan pembanding dan pengendalian faktor lain, selisih tersebut belum membuktikan REVO sebagai penyebab perubahan.

Tidak ada skor, ketuntasan, efektivitas, atau persentase peningkatan yang diisi pada paket ini. Guru menentukan standar sesuai tujuan dan mempertimbangkan miskonsepsi kritis, bukan hanya nilai agregat.
