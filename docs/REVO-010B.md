# REVO-010B — Briefing lintas era dan pratinjau kamera 3D

**Briefing: DONE. Sinkronisasi Blender: PARTIAL.** Kedua era memakai ulang diorama prosedural yang sudah menjadi sumber visual simulasi. Repositori belum memiliki sumber Blender, aset GLB/GLTF, atau alur ekspor aktif. Perubahan ini menunggu PM Visual Review.

## Audit sumber 3D

| Era | Sumber kanonis | Perilaku yang tetap milik simulator |
| --- | --- | --- |
| Industri 1.0 | [FactoryScene](../src/components/revo/FactoryScene.tsx) menyusun lingkungan, ketel, mesin uap, mesin tekstil, dan transmisi. Mesh, material, dan detailnya dibangun di React Three Fiber dari geometri Three.js; tidak memakai Blender/GLB. | Hotspot dan fokus komponen, transformasi perakitan, pengisian air/bahan bakar, animasi piston/roda/belt/tenun dan efek operasi. ID dan posisi snap tetap di [scene types](../src/components/revo/scene-types.ts) dan [aturan perakitan](../src/lib/revo/assembly.ts). |
| Industri 2.0 | [ElectricScene](../src/components/revo/industry-2/ElectricScene.tsx) menyusun bengkel, panel, motor, transmisi, konveyor dan stasiun dari geometri dan material prosedural yang sama seperti di simulator. | Pemilihan komponen, pandangan kamera per komponen, diagram jalur, koneksi perakitan, dan animasi eksperimen. ID komponen dan aturan perakitan tetap di [konten](../src/lib/revo/industry-2/content.ts) dan [aturan perakitan](../src/lib/revo/industry-2/assembly.ts). |

`SteamPreviewModel` dan `ElectricPreviewModel` memakai komposisi `Diorama` masing-masing dalam mode pratinjau. Briefing dan generator WebP merujuk kedua ekspor ini. Briefing memasang satu renderer terpisah sesuai era dan tidak memasang komponen aplikasi simulasi. Kamera eksplorasi tidak berbagi posisi atau perintah dengan kamera Briefing. Tidak ada model mesin baru atau perubahan pada pivot, anchor, materi lengkap, kuis, penilaian, skema simpan, maupun Main Menu.

## Briefing dan kamera

- `RevoBriefing` menyediakan satu tautan kembali ke Pilih Era, pengantar, ringkasan bernomor, pratinjau, indikator penyimpanan, dan CTA terpisah. Pada desktop, ringkasan di kiri dan diorama di kanan. Pada ponsel urutannya pengantar → pratinjau → ringkasan; area konten boleh bergulir di dalam layar dan CTA tetap tersedia.
- `Lihat tujuan lengkap` membuka dialog yang dapat dioperasikan dengan keyboard. Daftar asli tetap utuh: empat tujuan uap dan enam tujuan listrik, termasuk dampak historis. Konteks/misi lama tersedia di dialog. CTA sesi baru adalah **Mulai Eksplorasi**. Tujuan masuk untuk progres yang sudah ada mengikuti aturan era sebelumnya.
- WebP asli tampil dahulu. **Aktifkan pratinjau 3D** memuat kanvas secara dinamis. Seret untuk orbit, gulir atau cubit untuk zoom, atau gunakan tombol putar, zoom dan reset. Pusat orbit dan batas zoom mengikuti kotak pembatas diorama; sudut vertikal dibatasi, dan pan dinonaktifkan. Pemrosesan pointer mesh R3F dimatikan. Menyalakan pratinjau atau mengubah kamera tidak memberi bukti progres.
- Renderer menggambar ketika dibutuhkan, berhenti saat tab tersembunyi, dan tidak memakai rotasi otomatis atau peredaman orbit. Transisi halaman menghormati reduced motion. Bila WebGL2 tidak tersedia atau konteks hilang, gambar statis tetap tampil dan pemain bisa lanjut. Listener dilepas saat unmount, R3F menangani pembersihan objek deklaratif, dan pembersihan tekstur manual milik adegan tetap digunakan. Tidak ada pengukuran FPS.

## Alur Blender yang diusulkan

1. Catat ID komponen, anchor perakitan, pivot/linkage, target kamera, dan referensi animasi dari adegan sebelum membuat aset pengganti. Pertahankan hierarki node yang berputar (piston, roda, pulley, konveyor), satuan meter, dan orientasi dunia yang sama; validasi hasil konversi sumbu Blender ke glTF pada loader.
2. Simpan satu sumber `.blend` per era dan ekspor satu GLB kanonis per era. Pertahankan nama node dan material yang stabil; mulai dari mesh visual pasif. Biarkan state mesin, rumus, hit target, dan perintah simulasi di kode. Petakan node ke ID/pivot/anchor dengan metadata yang sama bagi kedua mode; jangan mengubah objek cache bersama ketika menggerakkan instance simulator.
3. Muat GLB melalui satu komponen visual bersama. Bandingkan skala, material, bounding box, posisi snap, hit target, dan animasi dengan baseline prosedural sebelum mengganti geometri interaktif. Uji re-ekspor sementara yang mudah dibalik: refresh, periksa perubahan di Briefing **dan** simulator, lalu pulihkan aset. Ini belum dilakukan karena belum ada pipeline Blender.
4. Setelah sumber kanonis berubah, jalankan `node scripts/revo-preview/generate.mjs` untuk menyegarkan WebP Main Menu dan gambar awal Briefing. Lihat [cara menghasilkan pratinjau](REVO-010A-PREVIEWS.md) untuk prasyarat dan pengaturan kamera.

## Bukti visual

| Viewport | Industri 1.0 | Industri 2.0 |
| --- | --- | --- |
| 1440 × 900 | [Briefing](revo-010b-media/industry-1-1440x900.webp) · [Kamera 3D](revo-010b-media/industry-1-1440x900-3d.webp) | [Briefing](revo-010b-media/industry-2-1440x900.webp) · [Kamera 3D](revo-010b-media/industry-2-1440x900-3d.webp) |
| 1280 × 720 | [Briefing](revo-010b-media/industry-1-1280x720.webp) | [Briefing](revo-010b-media/industry-2-1280x720.webp) |
| 390 × 844 | [Briefing](revo-010b-media/industry-1-390x844.webp) · [Kamera 3D](revo-010b-media/industry-1-390x844-3d.webp) | [Briefing](revo-010b-media/industry-2-390x844.webp) · [Kamera 3D](revo-010b-media/industry-2-390x844-3d.webp) |
| 320 × 568 | [Briefing](revo-010b-media/industry-1-320x568.webp) · [Dialog](revo-010b-media/industry-1-320x568-tujuan.webp) | [Briefing](revo-010b-media/industry-2-320x568.webp) · [Dialog](revo-010b-media/industry-2-320x568-tujuan.webp) |

## File perubahan

- UI: `RevoBriefing.tsx`, `RevoBriefingPreview.tsx`, `RevoBriefingCanvas.tsx`, `RevoLevelBriefing.tsx`, `industry-2/ElectricBriefing.tsx`, `briefing.css`, `design-system.css`, dan `layout.tsx`.
- Sumber 3D: `FactoryScene.tsx` dan `industry-2/ElectricScene.tsx` hanya mendapat penjelasan pemakaian ekspor pratinjau.
- Verifikasi: `tests/revo-briefing.e2e.spec.ts`, `tests/revo-journey.e2e.spec.ts`, `tests/revo-industry-2.e2e.spec.ts`, dan `playwright.revo.config.ts`. Pengujian alur lama menyesuaikan nama tombol dan memeriksa tujuan lengkap di dialog baru.
- Dokumentasi: laporan ini, `REVO-DESIGN-SYSTEM.md` dan `revo-010b-media/`.

## Verifikasi

- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`: lulus; Vitest 104/104.
- Chrome/Playwright, regresi terdampak: 42/44 lulus pada pengujian paralel. Dua skenario uap terkait waktu gagal: penyelesaian pengisian setelah Panduan ditutup, serta produksi sebelum navigasi. Keduanya lulus saat dijalankan ulang dengan satu worker tanpa perubahan pada simulasi. Pemisahan simpanan/reset antar era, jalur masuk/keluar, eksplorasi dan perakitan, serta eksperimen listrik juga teruji.
- Enam skenario baru mencakup tampilan responsif dan teks tujuan yang persis sama, fokus dialog dan reduced motion, perubahan piksel nyata saat orbit/zoom/reset, klik diorama tanpa pengubahan objek/progres, akses simulator setelah keluar, input sentuh, WebGL diblokir, dan fallback saat kehilangan konteks. Pemeriksaan ponsel memakai emulasi Chrome; perangkat sekolah belum diuji.
- Build final: 8/8 Playwright lulus (enam skenario Briefing baru, perjalanan lintas layar dan pemeriksaan Briefing/Eksplorasi 2.0 pada 320 px). Tangkapan layar final mencakup empat ukuran per era, tanpa gulir dokumen atau overflow horizontal. Desktop juga tidak menggulir panel; ponsel menggulir konten dan dialog secara internal.
