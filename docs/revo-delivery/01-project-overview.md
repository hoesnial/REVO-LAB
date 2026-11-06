# REVO-008 — Ikhtisar proyek dan batas klaim

> Snapshot REVO-008 sebelum revisi dosen REVO-008R.1. Aturan pengamatan, UI tujuan, dan bukti pengujian terbaru tersedia di [audit revisi](../REVO-008R1.md) dan [panduan REVO](../REVO-LAB.md). Media paket ini merekam versi sebelum revisi.

Tanggal peninjauan: **1 November 2026**. Acuan kode: `a4c135d1d300cae5ee737ea7afcd48ba1137a8c6` pada repository mandiri [REVO-LAB](https://github.com/hoesnial/REVO-LAB). Status paket: **draf untuk review PM, validasi guru, dan presentasi universitas**. Belum merupakan pernyataan kelayakan akademik atau hasil penelitian.

## Cara menggunakan paket ini

| Dokumen | Kegunaan |
| --- | --- |
| [02 — Pemetaan hasil belajar](02-learning-outcomes.md) | Menelusuri tujuan, aktivitas, asesmen, dan batas bukti |
| [03 — Audit isi](03-content-audit.md) | Meninjau ketepatan sejarah, penyederhanaan, dan usulan yang memerlukan persetujuan |
| [04 — Instrumen validasi](04-validation-instruments.md) | Form guru, dua angket siswa, pretest/posttest, serta observasi kelas |
| [05 — Skenario demo](05-demo-script.md) | Langkah demonstrasi, aset visual, dan asal-usul rekaman |
| [06 — Kerangka presentasi](06-presentation-outline.md) | Materi presentasi dosen berdasarkan fitur nyata |
| [07 — Checklist rilis](07-release-checklist.md) | Kesiapan teknis, perangkat kelas, konfigurasi, dan serah terima |

Petunjuk instalasi dan operasi tetap berada di [README](../../README.md) dan [panduan teknis REVO](../REVO-LAB.md). Paket ini menambahkan kesiapan akademik, bukan menggandakan manual permainan.

## Konsep dan pengguna

REVO — Jelajah Revolusi Industri adalah permainan pembelajaran berbahasa Indonesia dengan diorama pabrik tekstil bertenaga uap. Siswa menelusuri hubungan komponen, merakit sistem secara konseptual, mengendalikan simulasi, lalu menjawab refleksi sejarah. Model ditandai sebagai **Inggris, model ±1800**, dengan rentang era pada antarmuka **1760–1840**.

Konteks pengguna yang tampak pada menu adalah Informatika Terapan, SMAN 16 Bandung. Sasaran operasional paket ini adalah siswa SMA dengan pendampingan guru; kelas, fase kurikulum, CP/TP resmi, prasyarat, serta alokasi waktu harus dikonfirmasi guru. Nama sekolah pada UI tidak membuktikan bahwa sekolah telah menguji atau menyetujui produk.

Masalah pembelajaran yang hendak ditangani: hubungan antara sumber tenaga, mekanisme mesin, produksi, dan kehidupan masyarakat sulit dipahami jika hanya dihafalkan sebagai nama serta tanggal. Ini adalah **rasional desain**, bukan temuan observasi kelas yang sudah dibuktikan. Hipotesis manfaat multimedia dan interaksi perlu diuji menggunakan instrumen paket ini.

## Alur yang benar-benar tersedia

```text
Menu Utama → Pilih Era → Briefing → Eksplorasi → Perakitan 3D
→ Eksperimen → Refleksi → Level Completed
```

| Layar/tahap | Perilaku yang ditemukan pada kode | Status |
| --- | --- | --- |
| Menu utama | Mulai Jelajah, Cara Bermain; Lanjutkan/Lihat Hasil mengikuti progres perangkat | Diimplementasikan |
| Pilih Era | Empat kartu; hanya Industry 1.0 mempunyai tujuan briefing; Industry 2.0–4.0 berstatus Dalam Pengembangan | Industry 1.0 saja yang dapat dimainkan |
| Briefing | Empat tujuan belajar, misi 100 unit, batas tekanan, tombol masuk | Diimplementasikan |
| Eksplorasi | Membuka informasi lima komponen unik; membuka komponen yang sama tidak menambah hitungan | Diimplementasikan; kunjungan bukan bukti siswa membaca/memahami |
| Perakitan | Terbuka setelah eksplorasi 5/5; lima pemasangan benar dan tiga cek konsep benar diperlukan | Diimplementasikan |
| Eksperimen | Terbuka setelah perakitan; mesin dinyalakan secara eksplisit; target 100 unit dengan tekanan tidak pernah melampaui 75 pada percobaan tersebut | Diimplementasikan |
| Refleksi | Terbuka setelah misi; tiga pilihan ganda dengan penjelasan jawaban, skor, dan pengulangan | Diimplementasikan; tidak ada ambang skor minimal untuk hasil level |
| Hasil level | Tersedia setelah eksplorasi, perakitan, misi, dan pengiriman seluruh jawaban refleksi; ringkasan dan empat simpulan | Diimplementasikan; skor refleksi boleh kurang dari 3/3 |

Sumber: [rute](../../src/lib/revo/routes.ts), [era dan tujuan](../../src/lib/revo/eras.ts), [pengendali pengalaman](../../src/components/revo/RevoExperience.tsx), [RevoLab](../../src/components/revo/RevoLab.tsx), [aturan perakitan](../../src/lib/revo/assembly.ts), [simulasi](../../src/lib/simulation/steamEngine.ts), [refleksi](../../src/components/revo/QuizPanel.tsx), dan [hasil](../../src/components/revo/RevoLevelCompleted.tsx).

Menu, era, dan briefing adalah urutan navigasi yang ditawarkan. URL simulator dapat dibuka langsung; tidak ada kewajiban membaca briefing. Gerbang yang dijaga oleh state adalah **eksplorasi → perakitan → eksperimen → refleksi → hasil**.

## Inventaris fitur

| Kelompok | Implementasi saat audit | Batas |
| --- | --- | --- |
| Multimedia | Teks Indonesia, ilustrasi menu, geometri 3D prosedural, animasi piston/roda/sabuk/alat tenun, efek suara, sintesis narasi dan transkrip | Narasi bergantung suara Indonesia pada browser; efek bukan rekaman mesin historis |
| Interaksi | Orbit/zoom/fokus kamera, hotspot, drag ke socket, ghost/penanda, umpan balik salah/benar, inventaris–sambungan–konfirmasi | Socket dan toleransi tetap; bukan perakitan teknik lengkap |
| Penggerak | Ketel, pipa, piston, engkol, roda gila, puli/sabuk, poros dan roda gigi siku menuju mesin tekstil | Gabungan tata letak untuk mengajar hubungan, bukan replika satu pabrik |
| Simulasi | Air, bahan bakar, panas, tekanan, kecepatan, produksi, pengisian sumber daya, peringatan dan penghentian darurat | Deterministik dan tanpa satuan fisik; angka 75/90 adalah aturan game |
| Kesinambungan | Pause/resume, jeda saat menu/dialog, jam simulasi berhenti saat tab tersembunyi, penyimpanan lokal tervalidasi | Tidak ada akun/sinkronisasi; rincian percobaan belum selesai tidak dipulihkan setelah reload |
| Akses | Keyboard, alternatif panel untuk drag, fokus, reduced motion, panel ringkas, fallback tanpa WebGL, transkrip | Bukan sertifikasi aksesibilitas atau jaminan semua perangkat |

## Yang belum tersedia atau belum dibuktikan

- **Belum diimplementasikan:** permainan Industry 2.0–4.0, akun, dashboard guru, ekspor nilai, penyimpanan server/LMS, multiplayer, dan mode offline/PWA khusus.
- **Belum dibuktikan secara akademik:** validitas materi oleh guru, validitas/reliabilitas instrumen, peningkatan hasil belajar, penerimaan siswa, kesesuaian CP/TP, dan dampak pembelajaran jangka panjang.
- **Belum ditetapkan dalam paket ini:** jadwal pengembangan era berikutnya, sertifikasi aksesibilitas, SLA hosting, dan keputusan deployment produksi.

Rencana bukan janji rilis. Progres lokal dan hasil level sudah tersedia; keduanya tidak lagi ditandai sebagai fitur masa depan.

## Penilaian dan keputusan review

Keberhasilan teknis berarti siswa memenuhi aturan state. Pemahaman sejarah berarti siswa mampu menjelaskan hubungan sebab-akibat, membatasi generalisasi, serta mempertimbangkan pekerja dan lingkungan. Keduanya dilaporkan terpisah dalam [matriks hasil belajar](02-learning-outcomes.md).

REVO-008 tidak mengubah mekanik, kunci jawaban, atau isi pembelajaran dalam aplikasi. Semua temuan isi dicatat sebagai usulan di audit; perubahan memerlukan keputusan guru/PM. Tidak ada deployment produksi atau pengumpulan data siswa pada checkpoint ini.

Persetujuan yang masih kosong: guru materi ______; penanggung jawab pembelajaran ______; PM ______; tanggal review ______; keputusan/revisi ______.
