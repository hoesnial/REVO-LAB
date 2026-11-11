# REVO-010C.1 — Exploration Completion UX Polish

## Perubahan

- Heading dan subtitle eksplorasi diseragamkan untuk Industri 1.0 dan 2.0.
- Badge jumlah komponen hanya tampil sebelum eksplorasi lengkap.
- Status lengkap dan CTA Perakitan kini berada pada completion dock di baris layout khusus. Dock tetap terlihat saat bottom sheet mobile dibuka.
- Industri 1.0 memakai transisi stage Perakitan yang sudah ada. Industri 2.0 memakai route Assembly dan aksi reducer yang sudah ada.
- Materi, state progres, penyimpanan, gating, dan simulasi tidak diubah.

## Verifikasi

- Typecheck: lulus.
- Lint: lulus.
- Production build: lulus.
- Vitest: 104 tes lulus.
- Playwright eksplorasi terarah: 15 tes lulus. Termasuk penyelesaian 5/5 dan 7/7, CTA ke Assembly, dock saat sheet terbuka, empat ukuran layar, touch, keyboard, orbit/zoom, resize, serta fallback WebGL.
- Playwright regresi gabungan: 45 lulus, 18 gagal. Kegagalan yang diperiksa terutama menyentuh perubahan workspace lokal lain yang sudah ada sebelum tugas ini: akses tombol menu Era, selector judul lama `THE AGE OF STEAM`, subtitle/count eksplorasi 2.0, dan ekspektasi briefing lama. Tes perakitan Industry 1.0, tes eksplorasi completion yang baru, fallback WebGL, serta layout briefing Industry 2.0 lulus. Kegagalan regresi tidak berasal dari navigasi completion dock.
- Screenshot before/after tersimpan di `docs/revo-010c1-media/` untuk 1440×900, 1280×720, 390×844, dan 320×568 pada kedua era. Screenshot after diambil dengan semua komponen selesai dan sheet mobile diperluas.

## Catatan visual

Dock terpisah secara geometris dari daftar komponen, kontrol scene, dan sheet pada seluruh viewport yang diuji; dokumen tidak overflow. Pada 320×568, ruang scene menjadi sangat pendek saat sheet dibuka, khususnya Industry 2.0. Model tetap tampil dan CTA tetap dapat digunakan, tetapi komposisi lebih padat daripada target pada perangkat kecil.

## File terkait tugas

- `src/components/revo/RevoExplorationComplete.tsx`
- `src/components/revo/RevoLab.tsx`
- `src/components/revo/industry-2/ElectricExplore.tsx`
- `src/app/revo-lab/exploration.css`
- Tes eksplorasi dan selector completion terkait di `tests/`
- Screenshot di `docs/revo-010c1-media/`
