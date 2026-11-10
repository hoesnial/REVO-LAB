# REVO-009B.3 — Eksperimen Industri 2.0

Siswa membandingkan empat kondisi penggerak konveyor. Eksperimen dibuka setelah tujuh komponen dieksplorasi, lima sambungan sah terpasang, dan tiga cek konsep dijawab benar. Industri 2.0 berhenti di akhir tahap Eksperimen. Refleksi dan Ringkasan Pembelajaran belum tersedia.

Implementasi mengikuti [rancangan REVO-009A](REVO-009A.md), [gerbang perakitan REVO-009B.2](REVO-009B2.md), dan [kontrak lintas era REVO-009B.2.1](REVO-009B2-1.md). Model mesin uap, materi, penilaian, dan kunci simpan Industri 1.0 tidak diubah. Tidak ada commit, push, atau deployment.

## Tujuan belajar

1. Menjelaskan bahwa motor mengubah energi listrik menjadi putaran dan berhenti ketika pasokan diputus.
2. Membedakan jalur listrik dan transmisi mekanis: motor yang berputar tidak menggerakkan konveyor bila kopling/transmisi terputus.
3. Menjelaskan mengapa hambatan di jalur material menghentikan aliran produksi meski pasokan listrik dan sambungan tersedia.
4. Menggunakan empat catatan pengamatan sebagai bukti pembanding. Penyelesaian tahap menunjukkan siswa telah mencatat empat keadaan model, belum menunjukkan kemampuan menjelaskan atau menerapkan konsep pada kasus baru. Penilaian tersebut menjadi lingkup Refleksi berikutnya.

## Aturan sebab-akibat

| Kondisi saat perintah Mulai aktif | Ubah satu hal dari operasi normal | Listrik | Motor | Transmisi | Konveyor | Produksi | Mengapa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A — Operasi normal | Pasokan ON, sambungan terpasang, jalur bebas | Tersedia | Berputar | Tersambung | Bergerak | Mengalir | Poros dan sabuk menyalurkan putaran ke rol sehingga benda kerja bergerak antarestasiun. |
| B — Listrik terputus | Matikan listrik | Terputus | Berhenti | Tersambung | Berhenti | Terputus | Transmisi tidak dapat menyalurkan putaran jika motor tidak mendapat pasokan. |
| C — Transmisi terputus | Putuskan transmisi | Tersedia | Berputar | Terputus | Berhenti | Terputus | Motor dapat berputar tanpa menggerakkan rol. Pasokan listrik sendiri tidak memindahkan benda kerja. |
| D — Konveyor terhalang | Pasang penghalang | Tersedia | Tertahan | Tersambung | Terhalang | Terputus | Model menganggap transmisi kaku dan tanpa selip; hambatan menahan putaran melalui sambungan. |

**Mulai** memberi perintah jalan. Sakelar Listrik mengatur ketersediaan pasokan. Selama perintah jalan aktif, mengembalikan pasokan atau memperbaiki kondisi membuat hasil model berubah seketika. **Henti**, membuka dialog, menyembunyikan tab, meninggalkan layar, dan reload menghentikan proses; kembali ke layar atau menutup dialog tidak menjalankan mesin secara otomatis. Listrik bisa tetap tersedia saat model berhenti, sama seperti transmisi bisa tetap tersambung. Indikator produksi pada mesin berhenti menunjukkan **Siaga**.

Model bersifat kualitatif. Gerak benda kerja menunjukkan aliran, tanpa laju atau target unit produksi, waktu wajib, lonjakan arus, inersia, panas, selip sabuk, proteksi, atau kerusakan motor. Kontrol langsung adalah instrumen perbandingan dalam simulasi; tidak menggambarkan prosedur mengubah sambungan pada mesin nyata. Diorama awal abad ke-20 tetap ilustratif, bukan rekonstruksi pabrik atau sumber data historis.

## Interaksi, tampilan dan akses

- Dari Perakitan pilih **Uji Penggerak**, atau gunakan tahap **Eksperimen** pada HUD. Menu dan briefing melanjutkan checkpoint 2.0 tertinggi. Meninjau Eksplorasi atau Perakitan tidak menggeser progres Eksperimen.
- Gunakan **Mulai/Henti** dan tiga sakelar bernama **Listrik**, **Transmisi**, dan **Penghalang**. Sakelar bisa digunakan dengan Tab, Space/Enter, mouse, dan sentuh. Penjelasan menunjukkan tindakan yang dicoba, hasil mesin dan produksi, serta sebabnya. Status disajikan dengan teks dan ikon, bukan warna saja.
- Diorama yang sama menunjukkan indikator pasokan, celah kopling, motor, puli/sabuk, benda kerja dan penghalang sesuai keadaan. Dalam kondisi C, hanya poros motor yang berputar; benda kerja tetap diam. Saat WebGL tidak tersedia, SVG yang sama memperlihatkan jalur aktif, celah kopling, panah gerak dan penghalang. Reduced motion meniadakan gerak, dengan status dan bukti yang tetap sama.
- Jika lebih dari satu gangguan aktif, mesin tetap menampilkan akibat sesuai model, tetapi pencatatan dinonaktifkan agar perbandingan mengisolasi penyebab. Panel dapat digulir secara internal; tombol utama tetap tersedia pada bagian bawah.
- **Catat observasi** menyimpan keadaan yang sedang dijalankan. Memulai mesin atau membuka tahap tidak mencatat apa pun. Kondisi yang sudah dicatat tidak menambah progres. Daftar catatan menampilkan status motor, konveyor dan produksi dari observasi yang benar-benar disimpan. Setelah empat catatan sah, HUD menampilkan **Eksperimen selesai**; tidak ada skor Refleksi atau hasil level yang dibuat.

## Simpanan dan reset

Kunci `revo:industry-2:progress` tetap sama. V3 menambah tahap `experiment` dan catatan per kondisi berisi input/perintah jalan serta keluaran motor, transmisi yang bergerak, konveyor dan produksi. Validator menghitung kembali keluaran dan menolak bukti dengan ID, prasyarat, kombinasi input, atau keluaran yang tidak cocok. Status selesai dihitung dari empat catatan sah. Pengaturan dan perintah mesin aktif hanya hidup di sesi layar dan tidak dipulihkan dari penyimpanan.

- V1 memulihkan eksplorasi. V2 mempertahankan eksplorasi, sambungan, dan cek konsep yang sah; tidak mungkin mengimpor catatan eksperimen dari format lama.
- **Reset Eksperimen** meminta konfirmasi, menghapus empat catatan yang mungkin ada, dan mengembalikan pengaturan awal dengan mesin berhenti. Eksplorasi 7/7, lima sambungan, dan tiga jawaban benar tetap tersimpan.
- **Ulangi Perakitan** tetap mempertahankan Eksplorasi, tetapi mencabut akses dan membuang catatan Eksperimen karena prasyarat berubah; dialog menjelaskan akibatnya. Reset era 2.0 hanya menghapus simpanan era 2.0.
- Simpanan rusak atau versi tak dikenal tidak dihapus hanya karena dibuka. Simpanan lokal bukan bukti penilaian formal: pengguna bisa menyunting browser dan tidak ada sinkronisasi atau otentikasi. Jika penyimpanan diblokir, bukti hanya bertahan di sesi REVO yang terbuka.

## File utama

- Model dan validasi: `src/lib/revo/industry-2/experiment.ts`, `progress.ts`.
- Tampilan: route `/revo-lab/industry-2/experiment`, `ElectricExperiment.tsx`, penyesuaian `ElectricScene.tsx`, `ElectricDiagram.tsx`, dan `electric.css`.
- Integrasi: `routes.ts`, `ElectricHud.tsx`, `ElectricAssembly.tsx`, `ElectricBriefing.tsx`, `RevoMainMenu.tsx`.
- QA: `tests/revo-electric-experiment.test.ts`, `tests/revo-electric-experiment.e2e.spec.ts`, registrasi Playwright dan pembaruan ekspektasi tes lama untuk V3 serta gerbang Eksperimen.

## Hasil uji

- `npm run typecheck`, `npm run lint`, `npm run build`: lulus. Build produksi memakai Next.js yang dipasang di repositori dan memuat route Eksperimen.
- `npm test -- --reporter=dot`: 104 lulus dari 8 file, termasuk 9 tes baru untuk model, observasi, migrasi dan reset.
- Regresi Playwright awal pada build produksi (3 worker): 82 lulus, 1 gagal karena indikator pengisian mesin uap belum hilang dalam batas waktu tes lama. Tes yang sama lulus saat dijalankan ulang sendiri. Lima skenario Eksperimen baru lulus pada regresi awal.
- Regresi Playwright pada build akhir: **83 lulus, 0 gagal, tanpa retry** (14,5 menit; dua worker, dengan maksimal satu retry diizinkan). Tes pengisian yang sebelumnya gagal lulus pada percobaan pertama. Kelima skenario Eksperimen lulus, termasuk tangkapan semua kondisi dan penyelesaian pada enam viewport.

Playwright memeriksa gerbang dari Perakitan, empat kondisi dan statusnya, pencatatan eksplisit dan pencegahan duplikat, migrasi dan reload, reset serta isolasi era, gerak 3D, berhenti saat dialog dibuka atau tab disembunyikan, keyboard, sentuh, reduced motion, fallback SVG, dan Refleksi yang masih terkunci. Tes tangkapan layar juga memeriksa tidak ada gulir di tingkat dokumen.

## Bukti visual

Setiap lembar memuat empat kondisi yang dihasilkan lewat kontrol UI dan keadaan setelah 4/4 observasi tercatat. Urutan: normal, listrik terputus, transmisi terputus, konveyor terhalang, dan selesai.

| Viewport | Tangkapan |
| --- | --- |
| 1920 × 1080 | [Lima keadaan](revo-009b3-media/1920x1080.webp) |
| 1440 × 900 | [Lima keadaan](revo-009b3-media/1440x900.webp) |
| 1366 × 768 | [Lima keadaan](revo-009b3-media/1366x768.webp) |
| 1280 × 720 | [Lima keadaan](revo-009b3-media/1280x720.webp) |
| 390 × 844 | [Lima keadaan di layar ponsel](revo-009b3-media/390x844.webp) |
| 320 × 568 | [Lima keadaan di layar sempit](revo-009b3-media/320x568.webp) · [Fallback SVG](revo-009b3-media/320-fallback.webp) |

Keenam lembar dan contoh SVG diperiksa secara manual. Pada iterasi awal, kartu status terlalu rapat di 320 px dan label Refleksi terpotong setelah 4/4. Tangkapan akhir menunjukkan status dan label Refleksi terbaca. Pengujian memastikan keenam viewport tidak menggulir pada tingkat dokumen dan kendali utama saat percobaan memiliki area klik minimal 44 × 44 px. Penjelasan dan catatan dapat digulir di dalam panel saat ruang terbatas.

## Batasan dan langkah berikutnya

Verifikasi menggunakan Chrome lokal, emulasi sentuh, dan WebGL perangkat lunak. Uji fisik di lab, browser sekolah, pembaca layar, serta review guru terhadap materi dan penyederhanaan masih diperlukan. Tidak ada hasil kelas atau klaim siap uji siswa.

Setelah tinjauan PM, **REVO-009B.4 — Refleksi dan Ringkasan Pembelajaran** dapat memakai keempat catatan sebagai bukti yang benar-benar tersimpan. Refleksi dapat menilai transfer konsep listrik, transmisi, dan hambatan produksi serta membedakan model dari konteks historis. REVO-009B.4 belum dimulai.
