# REVO-010C.2 — Responsive Layout & Regression Triage

## Perbaikan

- Kontrol kamera pada kedua era bergeser ke sisi kiri flying card saat kartu terbuka. Aturan kembali ke posisi normal pada layar mobile, sehingga tombol jalur Industry 2.0 tetap dapat digunakan.
- Pada 320×568, sheet yang diperluas masuk ke mode baca: area 3D dan kontrol kamera disembunyikan sementara, daftar komponen tetap dapat dipilih, penjelasan memakai scroll internal, dan affordance **Kembali ke model** menutup sheet serta memulihkan scene.
- Completion dock tetap menjadi baris layout tersendiri.
- Status progres 2.0 duplikat yang tersembunyi dari panel inspector dihapus; badge atas adalah satu-satunya angka progres eksplorasi.
- Petunjuk geser daftar Industry 2.0 kembali terlihat di mobile.
- Setelah reload, komponen Industry 2.0 yang tersimpan sebagai pilihan akan membuka kembali kartu informasinya.

## Matriks 18 kegagalan dari run regresi C.1

Status didasarkan pada snapshot Playwright lama dan verifikasi ulang setelah C.2. “Test drift” berarti tes masih mengharapkan pola navigasi atau label sebelum perubahan produk yang memang diminta pada pekerjaan sebelumnya.

| # | Tes | Akar masalah terverifikasi | Status | Tindak lanjut |
|---|---|---|---|---|
| 1 | Industry 2.0: buka briefing dari menu | Tes mencari link `Buka Briefing 2.0`; Main Menu saat ini memakai kartu `Jelajahi Industri 2.0` yang langsung membuka briefing. Snapshot DOM membuktikan link yang tersedia. | Test drift | Selaraskan helper menu pada perubahan menu REVO-010A. |
| 2 | Industry 2.0: JSON rusak | Teks `0/7 dibuka` ada di badge dan status inspector tersembunyi; Playwright mendapat dua kecocokan. | Regresi produk C.1, diperbaiki | Hapus status jumlah duplikat; tes kini memakai badge tunggal. |
| 3 | Industry 2.0: versi tidak didukung | Duplikasi status `0/7 dibuka` yang sama. | Regresi produk C.1, diperbaiki | Sama seperti #2. |
| 4 | Industry 2.0: tahap palsu | Duplikasi status `0/7 dibuka` yang sama. | Regresi produk C.1, diperbaiki | Sama seperti #2. |
| 5 | Industry 2.0: reload dan simpan lintas era | Assertion kartu `Konveyor` setelah reload kini lulus; tes berikutnya gagal mencari link `Pilih Era`, yang sudah tidak ada pada header gameplay kanonis. | Test drift | Ubah navigasi tes untuk memakai Menu Utama dan kartu era aktif. |
| 6 | Industry 2.0: readiness palsu/ID asing | Setelah normalisasi menolak pilihan `panel` yang tidak termasuk komponen valid, C.1 tidak lagi merender kartu pengantar lama “Ikuti tiga jalur”. Snapshot menunjukkan daftar serta badge tetap benar, tetapi konten pengantar tidak ada. | Regresi produk terverifikasi, belum diperbaiki pada C.2 | Putuskan bersama PM apakah kartu pengantar perlu dipulihkan; tidak mengubah materi dalam scope layout ini. |
| 7 | Industry 2.0: touch dan sorotan jalur | Tes memproyeksikan hotspot menggunakan kamera lama `(7.2, 7.52, 14)`; scene kini memakai kamera yang ditranslasikan terhadap target dan zoom responsif. Tes touch terbaru di `revo-exploration.e2e.spec.ts` memilih hotspot dengan proyeksi yang sesuai dan lulus. | Test drift | Perbarui kalkulasi raycast tes ke kamera aktual bila tes ini dipertahankan. |
| 8 | Learning: tujuan briefing dan dialog | Tes mencari heading uppercase `TUJUAN PEMBELAJARAN`; DOM briefing aktual memakai `Tujuan Pembelajaran`. | Test drift | Perbarui selector setelah perubahan briefing REVO-010B. |
| 9 | Learning: enam viewport briefing | Selector uppercase yang sama tidak ditemukan sehingga `scrollIntoViewIfNeeded` menunggu sampai timeout. Snapshot menunjukkan heading title case hadir. | Test drift | Sama seperti #8. |
| 10 | Learning: reset mesin dan retry eksperimen | Tes mengharapkan label completion eksplorasi saat tab Eksperimen aktif. Status completion dock memang hanya bagian layar Eksplorasi; di Eksperimen progres tampil pada panel tahap tersebut. | Ekspektasi tes keliru | Assertevidence progres yang sesuai pada tahap Eksperimen, bukan label dock. |
| 11 | Menu: perjalanan dan progres | Tes mengharapkan klik “Pilih Era” membawa ke `/revo-lab/eras`; route kanonis setelah REVO-010B.1 adalah `/revo-lab`. | Test drift | Perbarui flow tes ke route Main Menu kanonis. |
| 12 | REVO: hotspot transmisi | Helper gagal sebelum tes dimulai karena mencari heading `THE AGE OF STEAM.`; tahap Eksplorasi kini memiliki heading `Kenali Mesin Uap`. | Test drift | Ganti heading helper sesuai UI eksplorasi. |
| 13 | REVO: hitungan eksplorasi dan gating | Gagal pada selector heading lama yang sama di helper `openLab`. | Test drift | Sama seperti #12. |
| 14 | REVO: pause, bantuan, dan stage | Gagal pada selector heading lama yang sama di helper `openLab`. | Test drift | Sama seperti #12. |
| 15 | REVO: demo desktop lengkap | Gagal pada selector heading lama yang sama di helper `openLab`. | Test drift | Sama seperti #12. |
| 16 | REVO: sumber daya dan tekanan | Gagal pada selector heading lama yang sama di helper `openLab`. | Test drift | Sama seperti #12. |
| 17 | REVO: demo mobile 390px | Gagal pada selector heading lama yang sama di helper `openLab`. | Test drift | Sama seperti #12. |
| 18 | REVO: HUD fullscreen | Tes mengharapkan indikator produksi tampil saat Eksplorasi aktif. Produk sengaja menyembunyikan kontrol operasi pada tahap tersebut; indikator kembali relevan di Eksperimen. | Ekspektasi tes bertentangan dengan spesifikasi | Pindahkan assertion indikator produksi ke Eksperimen. |

## Verifikasi C.2

- Typecheck: lulus.
- Lint: lulus.
- Production build: lulus.
- Vitest: 104 lulus.
- Playwright eksplorasi terarah: 15/15 lulus, termasuk kedua era, empat viewport, status CTA dan gating, hotspot, keyboard, touch, zoom/reset, sheet mobile, dan fallback WebGL.
- Playwright regresi terpilih: 3/6 lulus. Tiga tes penolakan data rusak kini lulus setelah duplikasi badge dihapus. Tiga tes tersisa gagal karena test drift/fitur pengantar yang tercatat pada matriks #5–7; kegagalannya tidak ditutupi dengan selector yang lebih longgar.
- Geometri pada 1280×720: tes membandingkan bounding box card dan kontrol kamera; tidak beririsan di kedua era.
- Pada 320×568: mode baca menyembunyikan canvas saat sheet diperluas; tombol “Kembali ke model” memulihkan canvas dengan tinggi lebih dari 100px. CTA tetap terlihat pada status 5/5 dan 7/7.
- Screenshot kedua era pada 1440×900, 1280×720, 390×844, dan 320×568 tersedia di `docs/revo-010c2-media/after/`. Desktop mencakup kartu terbuka/tertutup; mobile mencakup sheet ringkas, sheet diperluas, dan kartu tertutup.

## File terkait C.2

- `src/app/revo-lab/exploration.css`
- `src/components/revo/ExplorationSheetToggle.tsx`
- `src/components/revo/industry-2/ElectricExplore.tsx`
- `tests/revo-exploration.e2e.spec.ts`
- `docs/revo-010c2-media/after/`

Tidak ada commit, push, atau deployment.
