# REVO-010A.1 — Penyelarasan visual Menu Utama

Status: DONE — siap untuk PM Visual Review.

| Viewport | Sebelum (REVO-010A) | Sesudah |
| --- | --- | --- |
| 1440 × 900 | [Sebelum](revo-010a-media/menu-1440x900.webp) | [Menu](revo-010a1-media/after-1440x900.webp) · [Dengan progres Industri 2.0](revo-010a1-media/after-1440x900-progres.webp) |
| 390 × 844 | [Sebelum](revo-010a-media/menu-390x844.webp) | [Era 1–2](revo-010a1-media/after-390x844.webp) · [Era 3–4](revo-010a1-media/after-390x844-konsep.webp) |
| 320 × 568 | [Sebelum](revo-010a-media/menu-320x568.webp) | [Era 1–2](revo-010a1-media/after-320x568.webp) · [Era 3–4](revo-010a1-media/after-320x568-konsep.webp) · [Dengan dua simpanan](revo-010a1-media/after-320x568-progres.webp) |

Diperiksa secara visual pada Chrome desktop dan emulasi ponsel. Tangkapan dengan progres menggunakan data uji lokal yang divalidasi oleh provider yang sama dengan permainan.

- **Latar:** gading hangat dengan gradasi tipis; skyline SVG pabrik, cerobong, dan asap menyatu di sisi kanan bawah. Dekorasi tidak menerima input dan disembunyikan dari pembaca layar.
- **Kartu:** ilustrasi WebP asli 1.0/2.0 mendapat bidang yang lebih lebar dan pembesaran seragam tanpa mengubah atau memotong aset. Label status sejajar, CTA kuning dipusatkan, dan ilustrasi 3.0/4.0 tetap konsep terkunci.
- **Navigasi:** Progres Saya membaca tahap dan jumlah komponen masing-masing era dan menyediakan tautan Pilih Era. Cara Bermain memakai panduan lama. Pengaturan dapat mengurangi animasi antarmuka untuk sesi aktif. Atribusi dipindah ke Tentang REVO. Lanjutkan Belajar hanya muncul untuk progres yang dikenali provider.
- **Ponsel:** dua halaman kartu dengan tombol Sebelumnya/Berikutnya yang dapat ditekan lewat keyboard dan sentuhan. Pager dan footer mendapat ruang sendiri; tidak ada footer tetap di atas kartu. Pada tinggi yang lebih pendek, daftar bisa digulir internal.

Palet, Manrope/DM Sans, spasi, fokus, tombol, status, dan radius diturunkan dari Sistem Desain REVO. Tambahan token `--revo-menu-ivory` hanya dipakai pada kanvas editorial Menu Utama. Tampilan mengikuti hierarki TARGET dengan perbedaan yang disengaja: WebP memakai bentuk pabrik REVO yang sebenarnya; konsep memakai SVG REVO yang sudah ada; warna tombol dan label menggunakan token kanonis; mobile memakai dua kartu per halaman dan ikon berlabel aksesibel. Footer dapat menampilkan dua simpanan independen.

Berkas utama: `RevoMainMenu.tsx`, `RevoExperience.tsx`, `design-system.css`, dan `public/revo/menu-industrial-skyline.svg`. Dokumentasi sistem desain dan pengujian rute menu juga diperbarui. Geometri, WebP, briefing, dan aturan belajar tetap sama dengan REVO-010A.

## Verifikasi

- `npm run typecheck`, `npm run lint`, dan `npm run build`: lulus.
- `npm test`: 104/104 lulus.
- Playwright: 32/32 skenario terdampak lulus pada build produksi, termasuk navigasi, pager, dialog, progres lintas era, percobaan kedua simulator, dan antarmuka lengkap di enam ukuran layar.
- Pemeriksaan respons JavaScript build produksi tidak menemukan renderer WebGL Three.js pada Menu Utama atau kedua Briefing; jumlah kanvas di tiga halaman itu adalah nol.
- Di 320 × 568 dengan dua simpanan, kedua tombol lanjut belajar tetap di dalam viewport saat berpindah halaman kartu. Data lama diuji melalui alur lanjut, reset per era, dan reload. Belum ada pengujian perangkat fisik.
