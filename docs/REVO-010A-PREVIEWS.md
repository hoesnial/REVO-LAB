# REVO-010A — Pratinjau kartu era

Gambar target dipakai sebagai referensi komposisi Menu Utama. Pratinjau Industri 1.0 dan 2.0 berasal dari geometri serta material diorama REVO yang sudah digunakan dalam simulasi. Keduanya diambil saat mesin diam, tanpa penanda dan kendali interaktif.

| Era | Aset | Ukuran |
| --- | --- | ---: |
| Industri 1.0 | [Diorama pabrik tenaga uap](../public/revo/industry-1-preview.webp) | 896 × 705; 62.526 byte |
| Industri 2.0 | [Diorama pabrik elektrifikasi](../public/revo/industry-2-preview.webp) | 896 × 705; 47.968 byte |
| Industri 3.0 dan 4.0 | SVG konsep dengan label “Pratinjau konsep” dan “Belum tersedia” | — |

Menu Utama dan Pilih Era memakai aset yang sama. Kedua pratinjau mesin adalah WebP transparan dengan kamera ortografis, sudut pandang tiga perempat bergaya isometrik, pencahayaan, skala proyeksi, dan garis dasar yang konsisten. Kartu tersedia membuka briefing, lalu tindakan pengguna membuka simulator. Menu, Pilih Era, dan briefing tidak membuat konteks WebGL. Pada menu, tautan lanjut progres juga tidak memuat rute simulator lebih awal. Industri 3.0 dan 4.0 belum memiliki aksi untuk membuka simulator. Pemeriksaan respons jaringan pada build produksi juga tidak menemukan skrip renderer Three.js di Menu Utama maupun briefing Industri 2.0.

## Membuat ulang aset

Dari root REVO-LAB, gunakan dependensi yang dikunci di repositori:

```sh
npm ci
npx playwright install chromium
node scripts/revo-preview/generate.mjs
```

Generator memakai Chrome lokal di macOS jika tersedia, atau Chromium dari Playwright. Untuk instalasi Chrome lain, tentukan jalur dengan `REVO_PREVIEW_CHROME`. Jalankan generator ketika geometri atau material diorama berubah. Server render lokal hanya digunakan saat membuat aset; build produksi memakai berkas WebP yang sudah dihasilkan.

## Bukti visual

Tangkapan Chrome dari build produksi dengan WebGL dinonaktifkan: [1440 × 900](revo-010a-media/menu-1440x900.webp), [390 × 844](revo-010a-media/menu-390x844.webp), [320 × 568](revo-010a-media/menu-320x568.webp), dan [320 × 568 setelah daftar digulir ke kartu konsep](revo-010a-media/menu-320x568-konsep.webp).

Dua diorama dan tombol Jelajahi terlihat utuh pada tiga ukuran. Di 320 × 568, kartu konsep berada lebih bawah dan dapat dilihat dengan menggulir daftar. Halaman tidak bergulir. Mode ponsel diverifikasi lewat emulasi Chrome.

## Pengujian

Typecheck, lint, dan build produksi lulus. Vitest: **104/104**. Playwright pada build produksi: **12/12** untuk Menu Utama, navigasi, pratinjau dengan WebGL diblokir, keyboard, progres dua era, seret komponen 3D pada Industri 1.0, dan pemilihan komponen serta gerak mesin pada Industri 2.0.
