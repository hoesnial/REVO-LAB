# REVO-010D — Fullscreen Game HUD

**Status: DONE.** Perakitan, Eksperimen, dan layar Level Completed kedua era kini muat dalam satu viewport, tanpa gulir dokumen, dengan gulir internal pada panel yang memang panjang. Tidak ada perubahan mekanik, penilaian, progres, skema simpan, konten, atau gating.

## Temuan awal

- Workspace 1.0 masih ikut meninggikan dokumen pada desktop dan ponsel; panel kanan dapat mendorong halaman alih-alih menggulir di dalam dirinya.
- Tombol **Pasang komponen** berada di tengah panel sehingga tidak selalu terjangkau setelah daftar komponen memanjang.
- Aksi reset muncul dua kali (stage bar dan header), sedangkan aksi utama Eksperimen dan panel pembelajaran saling berebut ruang.
- Di desktop, panel pembelajaran memakai `max-height: 52%` pada track grid `auto`. Persentase itu tidak menyusutkan track, sehingga menyisakan area gelap kosong di bawah panel.
- Pada 320×568, panel pembelajaran sempat menyusut sampai beberapa piksel dan teks tidak terbaca.

## Perubahan UI

- `.revo-hud` dan `.electric-shell` memakai `height: 100dvh` dengan `overflow: hidden`. Workspace menjadi grid baris tetap: stage bar, area kerja `minmax(0,1fr)`, dan catatan bawah.
- Sidebar 1.0 menjadi grid dua baris: kontrol mesin lebih dulu, panel pembelajaran kedua. Batas tinggi panel pembelajaran memakai panjang pasti `min(46dvh, 380px)` sehingga track auto ikut menyusut dan celah gelap di desktop hilang. Area kontrol menggulir sendiri.
- **AssemblyPanel**: indikator langkah `01 Inventaris · 02 Sambungan · 03 Cek pemahaman`, tombol langkah dapat menggulir ke bagian terkait, dan footer aksi selalu ada. Sebelum semua terpasang, footer berisi **Pasang komponen**; setelah semua terpasang, **Cek pemahaman · x/3**; setelah selesai, **UJI MESIN**. Daftar inventaris dan sambungan disembunyikan setelah semua komponen terpasang agar cek pemahaman langsung terlihat.
- **LearningProgressPanel**: isi dipisah menjadi `.revo-learning-body` (dapat menggulir) dan `.revo-learning-actions` (footer tetap). Tombol **Lanjut ke Refleksi**, **Lanjut ke perakitan**, dan **Tinjau perakitan** berada di footer; tombol transmisi dan ulangi eksperimen tetap di badan panel.
- Header 1.0 mempertahankan satu tombol **Reset** berlabel; ikon reset duplikat pada stage bar dihapus. Hint tahap dipersingkat.
- Pada ≤720 px, sidebar memakai pembagian 50/50. Pada layar pendek ≤360×650, muncul sakelar **Fokus model / Baca tugas**:
  - Fokus model memberi 50–52% tinggi ke diorama.
  - Baca tugas memberi 58% tinggi ke panel pembelajaran; status mesin dan judul panel disembunyikan agar tombol utama dan teks tidak terpotong.
- Industri 2.0 mengikuti pola yang sama: badan panel menggulir internal, footer aksi tetap, dan sakelar tampilan pada layar pendek.

## Bukti visual

Diambil dari build produksi dengan Playwright pada 25 kombinasi viewport × tahap. Semua pengukuran `scrollWidth`/`scrollHeight` sama dengan viewport.

| Viewport | 1.0 Perakitan | 1.0 Eksperimen | 1.0 Completed | 2.0 Perakitan | 2.0 Eksperimen |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | [Buka](revo-010d-media/industry-1-assembly--desktop-1440x900.png) | [Buka](revo-010d-media/industry-1-experiment--desktop-1440x900.png) | [Buka](revo-010d-media/industry-1-completed--desktop-1440x900.png) | [Buka](revo-010d-media/industry-2-assembly--desktop-1440x900.png) | [Buka](revo-010d-media/industry-2-experiment--desktop-1440x900.png) |
| 1280×720 | [Buka](revo-010d-media/industry-1-assembly--desktop-1280x720.png) | [Buka](revo-010d-media/industry-1-experiment--desktop-1280x720.png) | [Buka](revo-010d-media/industry-1-completed--desktop-1280x720.png) | [Buka](revo-010d-media/industry-2-assembly--desktop-1280x720.png) | [Buka](revo-010d-media/industry-2-experiment--desktop-1280x720.png) |
| 1024×768 | [Buka](revo-010d-media/industry-1-assembly--desktop-1024x768.png) | [Buka](revo-010d-media/industry-1-experiment--desktop-1024x768.png) | [Buka](revo-010d-media/industry-1-completed--desktop-1024x768.png) | [Buka](revo-010d-media/industry-2-assembly--desktop-1024x768.png) | [Buka](revo-010d-media/industry-2-experiment--desktop-1024x768.png) |
| 390×844 | [Buka](revo-010d-media/industry-1-assembly--mobile-390x844.png) | [Buka](revo-010d-media/industry-1-experiment--mobile-390x844.png) | [Buka](revo-010d-media/industry-1-completed--mobile-390x844.png) | [Buka](revo-010d-media/industry-2-assembly--mobile-390x844.png) | [Buka](revo-010d-media/industry-2-experiment--mobile-390x844.png) |
| 320×568 | [Model](revo-010d-media/industry-1-assembly--mobile-320x568--model.png) · [Tugas](revo-010d-media/industry-1-assembly--mobile-320x568--task.png) | [Model](revo-010d-media/industry-1-experiment--mobile-320x568--model.png) · [Tugas](revo-010d-media/industry-1-experiment--mobile-320x568--task.png) | [Buka](revo-010d-media/industry-1-completed--mobile-320x568.png) | [Model](revo-010d-media/industry-2-assembly--mobile-320x568--model.png) · [Tugas](revo-010d-media/industry-2-assembly--mobile-320x568--task.png) | [Model](revo-010d-media/industry-2-experiment--mobile-320x568--model.png) · [Tugas](revo-010d-media/industry-2-experiment--mobile-320x568--task.png) |

## File

- Baru: `src/app/revo-lab/gameplay-hud.css`, `src/app/revo-lab/industry-2/gameplay.css`, `tests/revo-010d-screenshots.spec.ts`, `playwright.010d.config.ts`, laporan dan media 010D.
- Diubah: `AssemblyPanel.tsx`, `LearningProgressPanel.tsx`, `RevoLab.tsx`, `readability.css`, `industry-1/assembly.css`, `industry-2/ElectricAssembly.tsx`, `industry-2/ElectricExperiment.tsx`, `industry-2/ElectricHud.tsx`, serta penyesuaian tes/helper yang sudah ada.
- Tidak ada perubahan pada `steamEngine`, reducer progres, aturan perakitan, kuis, kamera eksplorasi, atau geometri/material.

## Pengujian

Server produksi lokal `http://127.0.0.1:3001`, Chrome dengan SwiftShader, satu worker. Tidak ada deploy.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run typecheck` | Lulus |
| `npm run lint` | Lulus |
| `npm run build` | Lulus |
| `npm test` | 104/104 (8 file Vitest) |
| `npx playwright test --config playwright.010d.config.ts` | 25/25; seluruh tangkapan layar dan pemeriksaan overflow lulus |
| Regresi terarah (assembly, eksperimen listrik, learning, cross-era) | 20/21; satu perbandingan piksel kanvas diam gagal sekali lalu lulus pada pengujian ulang (flaky, bukan regresi CSS) |
| `git diff --check` | Lulus |

Catatan: dua kegagalan `tests/revo-polish.e2e.spec.ts` yang tercatat pada baseline tugas ini berasal dari tes lama — tombol audio eksplorasi yang memang disembunyikan dan heading dari komponen `RevoEraSelection.tsx` yang tidak dipakai — bukan akibat perubahan 010D.
