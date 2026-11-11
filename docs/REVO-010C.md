# REVO-010C — Redesign Eksplorasi

Status: **DONE** — implementasi dan verifikasi teknis selesai; menunggu **PM Visual Review**.

## Audit dan keputusan

Kedua era memakai mesh dan material prosedural React Three Fiber. Industri 1.0 tersusun di FactoryScene dan disimpan sebagai satu sesi RevoLab; state simulasi, eksplorasi dan checkpoint disimpan melalui provider yang sudah ada. ElectricExplore memakai reducer/progres era 2.0 tersendiri. Tidak ada aset mesin baru. Briefing dan Main Menu tidak diubah.

Kamera uap sebelumnya melakukan fokus dan zoom otomatis saat memilih komponen. Era listrik memiliki inspector permanen dan kamera detail yang mengubah overview ketika ukuran kanvas berubah. CSS inspector mobile dari iterasi sebelumnya juga memuat aturan posisi, overflow dan grid yang berbeda dari desktop. Sebelum implementasi, instruksi repository, panduan CSS Next.js lokal, Design System, sumber scene, handler hotspot, gating, dan penyimpanan ditinjau.

## Perubahan UI

- Eksplorasi uap menyembunyikan Kendali Mesin, pembacaan operasi dan sidebar, dengan tetap mempertahankan komponen dan state eksperimen. Progres aktual tampil dekat judul; gating menuju perakitan menggunakan aturan sebelumnya.
- Kedua era memakai kartu bebas di kanan desktop; tidak ada sidebar informasi permanen. Kanvas menyisakan ruang bagi kartu sehingga geometri tidak berada di belakang teks. Daftar komponen tetap berada pada baris tersendiri di bawah kontrol kamera.
- Pada ≤720 px kartu menjadi bottom sheet dengan tombol perluas/ringkas, close, next dan gulir internal. Area kanvas, kontrol kamera dan daftar berada di luar sheet. Tinggi sheet dan ruang cadangan memakai variabel yang sama, termasuk pada keadaan diperluas; aturan padding lama yang menekan model pada 320 px telah dikoreksi. Sheet tidak mengunci fokus; Memilih komponen memulai teks dari atas, termasuk setelah membaca penjelasan panjang. Escape menutup kartu dan mengembalikan fokus ke komponen yang terakhir diperiksa. Pada 320×568 sheet sengaja lebih pendek untuk mempertahankan ruang model.
- Lima komponen uap dan tujuh komponen listrik memakai konten, ID, dan aksi inspect semula. Menutup kartu listrik hanya mengubah state tampilan lokal, bukan menghapus pilihan/progres tersimpan. Pemilihan tetap klik/tap/keyboard, bukan hover. Skip link kedua era menuju daftar yang dapat menerima fokus.
- Jalur Listrik/Mekanis/Material tetap tersedia, termasuk penjelasan aliran ketika jalur dipilih pada ponsel. Tombol jalur dan kamera berbagi satu baris pada layar kecil agar area model lebih besar. Teks peran komponen memakai warna tinta kanonis pada permukaan terang. Bantuan kamera/panel ditambahkan pada HUD eksplorasi listrik. URL menu memakai definisi kanonis /revo-lab.

## Kamera

ExplorationCamera hanya dipasang pada Eksplorasi. Kamera Assembly/Experiment, pivot, snap, kecepatan, rumus, kuis dan skor tetap memakai implementasi semula. Orbit tidak otomatis berganti ketika kartu dibuka, ditutup, atau viewport berubah. Zoom relatif dipertahankan dan dihitung terhadap ruang kanvas saat ini.

Framing ortografis memakai batas konservatif yang mencakup lantai, bangunan, cerobong, mesin dan marker kedua era, serta memproyeksikan batas itu terhadap orientasi kamera. Zoom dibatasi agar overview tetap utuh; zoom bebas ke detail tetap milik simulator tahap lain. Mouse wheel/pinch, orbit dan tombol +/-/reset tersedia. Pan dan damping dinonaktifkan pada kamera eksplorasi agar framing stabil dan tidak membuat pergerakan otomatis pada reduced motion. Marker uap dipisahkan bila proyeksinya berdekatan pada layar pendek.

## Bukti visual

Empat viewport final diuji pada kedua era, kartu tertutup/terbuka; ponsel juga memiliki screenshot sheet diperluas.

| Viewport | Uap | Listrik |
| --- | --- | --- |
| 1440×900 | [Tutup](revo-010c-media/after/1-1440x900-closed.webp) · [Buka](revo-010c-media/after/1-1440x900-open.webp) | [Tutup](revo-010c-media/after/2-1440x900-closed.webp) · [Buka](revo-010c-media/after/2-1440x900-open.webp) |
| 1280×720 | [Tutup](revo-010c-media/after/1-1280x720-closed.webp) · [Buka](revo-010c-media/after/1-1280x720-open.webp) | [Tutup](revo-010c-media/after/2-1280x720-closed.webp) · [Buka](revo-010c-media/after/2-1280x720-open.webp) |
| 390×844 | [Tutup](revo-010c-media/after/1-390x844-closed.webp) · [Buka](revo-010c-media/after/1-390x844-open.webp) · [Perluas](revo-010c-media/after/1-390x844-expanded.webp) | [Tutup](revo-010c-media/after/2-390x844-closed.webp) · [Buka](revo-010c-media/after/2-390x844-open.webp) · [Perluas](revo-010c-media/after/2-390x844-expanded.webp) |
| 320×568 | [Tutup](revo-010c-media/after/1-320x568-closed.webp) · [Buka](revo-010c-media/after/1-320x568-open.webp) · [Perluas](revo-010c-media/after/1-320x568-expanded.webp) | [Tutup](revo-010c-media/after/2-320x568-closed.webp) · [Buka](revo-010c-media/after/2-320x568-open.webp) · [Perluas](revo-010c-media/after/2-320x568-expanded.webp) |

Baseline uap diambil sebelum perubahan: [1440 tertutup](revo-010c-media/before/1-1440x900-closed.webp), [1440 terbuka](revo-010c-media/before/1-1440x900-open.webp), [1280 terbuka](revo-010c-media/before/1-1280x720-open.webp), [390 terbuka](revo-010c-media/before/1-390x844-open.webp), [320 tertutup](revo-010c-media/before/1-320x568-closed.webp). Pengambilan baseline terhenti ketika marker Ketel dan Piston bertumpuk pada 320 px. Baseline lintas era juga tersedia dari audit inspector sebelumnya: [uap 320](revo-009b3r1-media/320-era-1.webp), [listrik 1440](revo-009b3r1-media/1440-era-2.webp), [listrik 390](revo-009b3r1-media/390-era-2.webp), [listrik 320](revo-009b3r1-media/320-era-2.webp). Gambar arsip ini bukan capture baru 010C.

## File

- Baru: ExplorationCamera.tsx, ExplorationSheetToggle.tsx, exploration.css, tests/revo-exploration.e2e.spec.ts, laporan dan media 010C.
- Diubah: RevoLab.tsx, FactoryScene.tsx, scene-types.ts, industry-2/ElectricExplore.tsx, ElectricHud.tsx, ElectricCameraControls.tsx, ElectricScene.tsx, layout.tsx, playwright.revo.config.ts, docs/REVO-DESIGN-SYSTEM.md.
- Tes regresi disesuaikan di revo-design.e2e.spec.ts, revo-assembly.e2e.spec.ts, revo-filling.e2e.spec.ts, revo-industry-2.e2e.spec.ts dan helpers/revo-assembly.ts. Dua perjalanan kembali dari menu memakai CTA kanonis yang nyata; selector progres dibuat tepat; pengukuran titik drag menunggu penanda proyeksi stabil setelah resize. Tidak ada aksi permainan yang diganti dengan mutasi state agar tes lulus.
- Tidak ada perubahan skema simpanan, rumus simulasi, penilaian, model, geometri atau material.

## Pengujian yang dijalankan

Pengujian browser memakai build produksi lokal pada `http://127.0.0.1:3006`, Chrome dengan SwiftShader, satu worker. Tidak ada deploy.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus |
| `npm run lint` | Lulus |
| `npm run build` | Lulus; build produksi terakhir selesai |
| `npm test` | 104/104, 8 file Vitest |
| Playwright — lima file utama | 30 skenario unik; satu kegagalan koordinat drag pada run gabungan sudah lulus pengujian ulang setelah penanda stabil |
| Playwright — pengujian ulang terarah | 12/12: kamera setelah pergantian tahap, Design System/inspector, dan tujuh skenario eksplorasi |
| Playwright — perakitan listrik | 10/10: pasangan salah/duplikat, reload, gating, migrasi, keyboard, touch, fallback dan lima viewport |
| Playwright — build terakhir | 7/7 pada build terakhir, termasuk reset posisi gulir saat mengganti komponen |
| `git diff --check` | Lulus |

Lima file utama: `revo-exploration`, `revo-assembly`, `revo-filling`, `revo-electric-experiment`, dan `revo-design`. Cakupannya meliputi pemilihan hotspot melalui mouse/touch, hover tanpa inspect, close/next, fokus/Escape/skip link, expand/collapse, gulir internal, resize, orbit/reset/zoom berdasarkan piksel kanvas nyata, progres unik 5/7, gating perakitan/eksperimen, pengisian sumber daya, pause/help/menu, gerak mekanis, reduced motion dan fallback WebGL. Tes memeriksa kesamaan ukuran kanvas dengan host setelah ResizeObserver selesai, pemisahan kartu/kanvas, serta tidak adanya scroll dokumen atau overflow horizontal. Tidak ditemukan error browser kritis pada regresi yang memantau console/pageerror.

Perintah cakupan utama:

```sh
REVO_BASE_URL=http://127.0.0.1:3006 npm run test:revo -- revo-exploration.e2e.spec.ts revo-assembly.e2e.spec.ts revo-filling.e2e.spec.ts revo-electric-experiment.e2e.spec.ts revo-design.e2e.spec.ts --workers=1
```

Hasil perintah gabungan awal adalah 29 lulus/1 gagal pada koordinat drag setelah kembali dari Eksplorasi. Pengujian ulang memverifikasi raycast dan pemasangan asli, tanpa memaksa state perakitan. Tes yang mengasumsikan inspector statis/route lama disesuaikan dengan desain dan navigasi kanonis; target tidak sekadar dilemahkan. Koreksi padding sheet ditemukan lewat screenshot dan diverifikasi kembali dengan pengukuran kanvas yang menunggu resize selesai.

## Batasan dan PM review

Perangkat sentuh menggunakan emulasi Chrome, belum pengujian perangkat sekolah. Framing overview membatasi perbesaran untuk mempertahankan semua bagian penting, sehingga model memang lebih kecil saat panel diperluas pada 320 px. Teks panjang tetap dapat dibaca dengan menggulir sheet; tombol perluas merupakan alternatif keyboard/sentuh tanpa gestur presisi. Tidak ada klaim sertifikasi aksesibilitas atau pengukuran FPS.

40 skenario Playwright unik dalam cakupan di atas telah lulus, termasuk pengujian ulang terarah. Galeri final memuat 20 capture WebP dari build produksi terakhir. Perubahan tetap lokal; tidak ada commit, push, atau deploy. Implementasi berhenti pada REVO-010C untuk PM Visual Review.
