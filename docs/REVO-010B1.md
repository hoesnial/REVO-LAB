# REVO-010B.1 — Perbaikan Rute Menu Kanonis

**Status: DONE.**

## Akar masalah

Pembaruan Briefing 010B mewarisi `REVO_ROUTES.eraSelect` untuk aksi kembali. Nilainya masih menunjuk ke `/revo-lab/eras`, halaman pemilih era yang tidak lagi menjadi pintu navigasi utama. Rute lama juga dapat dibuka langsung.

## Perubahan

- Menghapus konstanta rute era lama dan status layar `era-select` dari resolver rute.
- Aksi kembali pada kedua Briefing kini berlabel **Kembali ke Menu Utama** dan menuju `REVO_ROUTES.menu`.
- Rute lama `/revo-lab/eras` tetap dikenali sebagai kompatibilitas URL, lalu menjalankan `redirect(REVO_ROUTES.menu)` di Server Component. Pengalihan memakai perilaku replace bawaan Next.js.
- Mengubah label pada halaman era tidak tersedia agar kembali menuju Menu Utama.
- Menambahkan Playwright untuk alur tiap era, tujuan aktual dan isi Main Menu, tombol kembali browser, pengalihan rute lama, nilai simpanan uji yang tetap ada, dan navigasi ponsel.

Tidak diubah: penyimpanan progres, reset, mekanika simulasi, dan skema data.

## File

- `src/lib/revo/routes.ts`
- `src/app/revo-lab/eras/page.tsx`
- `src/components/revo/RevoBriefing.tsx`
- `src/app/revo-lab/not-found.tsx`
- `playwright.revo.config.ts`
- `tests/revo-menu-routing.e2e.spec.ts`
- `tests/revo-briefing.e2e.spec.ts`

## Verifikasi

- Typecheck, lint, build Next.js, dan Vitest: lulus (104 tes).
- Playwright Briefing dan rute: 9/10 pada run pertama; navigasi alur desktop, pengalihan legacy, dan kedua briefing lulus. Satu kegagalan adalah tes ponsel yang memakai `.tap()` tanpa konteks `hasTouch`; diperbaiki memakai klik pointer pada viewport ponsel dan dijalankan ulang.
- Skenario yang diuji mencakup Main Menu → briefing masing-masing era → kembali ke Menu Utama, isi halaman dan URL akhir, tombol kembali/maju browser, URL lama tanpa halaman era lama, serta navigasi pada viewport ponsel.
