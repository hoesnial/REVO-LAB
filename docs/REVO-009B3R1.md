# REVO-009B.3R.1 — Konsistensi UI dan inspector responsif

Status verifikasi: berlangsung. Lingkup berhenti pada tinjauan PM.

Pada build REVO-009B.3R, kartu informasi mesin uap berada di atas kanvas pada semua ukuran. Di 390 × 844 dan 320 × 568, kartu menutup mesin dan hanya memperlihatkan sebagian penjelasan. Industri 2.0 sudah membaca informasi di panel terpisah, tetapi posisi fokus keyboard dapat tertinggal di daftar saat panel bergulir ke penjelasan.

| Area | Perubahan |
| --- | --- |
| Informasi Industri 1.0 | Kartu desktop tetap mengambang dengan ukuran, posisi, dan aksi yang sama. Pada lebar hingga 720 px, kartu yang sama tampil di dock setelah diorama, kamera, dan daftar komponen. |
| Ruang baca | Dock bergulir sendiri dan tetap memberi akses ke progres serta kendali mesin. Isi kartu memakai teks 15 px di ponsel. Tutup dan Berikutnya tetap tersedia; ketika kartu ditutup, fokus kembali ke tombol pembuka di daftar. |
| Informasi Industri 2.0 | Inspector memfokuskan penjelasan di ponsel. Tombol Kembali ke Daftar atau Escape memulihkan fokus pada komponen terpilih tanpa menghapus progres inspeksi. |
| Navigasi | `RevoScreenHeader` dan rel tahap memakai tampilan yang sama. Tab Industri 1.0 dan tautan Industri 2.0 tetap punya perilaku masing-masing. Kontrol header utama minimal 44 × 44 px, termasuk saat tampil sebagai ikon. |
| Kamera | Pada ponsel, kamera uap mendapat baris sendiri ketika kartu dibuka; kamera dan daftar tetap terpisah dari panel baca. Kamera listrik tetap berada di sisi kanan area adegan. |

Kedua era memakai `RevoComponentInfo` dengan materi dari sumber yang sudah ada. Perubahan tidak menyentuh model 3D, simulasi, gerbang, soal, skor, maupun skema simpan. [Sistem desain](REVO-DESIGN-SYSTEM.md) memuat aturan panel, gulir, dan fokus untuk layar lebar dan ponsel.

## File

- `src/components/revo/RevoLab.tsx`, `RevoComponentInfo.tsx`, `RevoScreenHeader.tsx`, serta `industry-2/ElectricHud.tsx` dan `ElectricExplore.tsx`.
- `src/app/revo-lab/design-system.css`, `cross-era.css`, `ui-refinements.css`, `readability.css`, `industry-1/hud.css`, dan `industry-2/electric.css`.
- `tests/revo-design.e2e.spec.ts`: posisi kartu desktop/ponsel, akses ke isi dan kontrol, navigasi fokus, serta progres yang tetap benar.
- Dokumen ini, sistem desain, indeks REVO, dan tangkapan browser.

## Bukti visual

Di Chrome dengan WebGL, komponen Ketel uap dan Motor listrik dibuka dari daftar pada build sebelum dan sesudah, dengan ukuran layar yang sama. Keenam perbandingan ditinjau manual. Tangkapan ponsel memakai emulasi sentuh. Tangkapan tambahan pada 320 px memperlihatkan peran komponen setelah menggulir di dalam panel.

| Viewport | Industri 1.0 · Ketel uap | Industri 2.0 · Motor listrik |
| --- | --- | --- |
| 1440 × 900 | [Sebelum / sesudah](revo-009b3r1-media/1440-era-1.webp) | [Sebelum / sesudah](revo-009b3r1-media/1440-era-2.webp) |
| 390 × 844 | [Sebelum / sesudah](revo-009b3r1-media/390-era-1.webp) | [Sebelum / sesudah](revo-009b3r1-media/390-era-2.webp) |
| 320 × 568 | [Sebelum / sesudah](revo-009b3r1-media/320-era-1.webp) | [Sebelum / sesudah](revo-009b3r1-media/320-era-2.webp) |

[Lanjutan penjelasan Ketel uap pada 320 px](revo-009b3r1-media/320-era-1-reading.webp) · [Lanjutan penjelasan Motor listrik pada 320 px](revo-009b3r1-media/320-era-2-reading.webp)

## Verifikasi

- `npm run typecheck`, `npm run lint`, `npm run build`: lulus.
- `npm test`: **104/104** lulus.
- Pemeriksaan browser tambahan: pada 320 × 568 tanpa WebGL, Nyalakan Mesin dan Jeda mesin uap tetap dapat dijangkau melalui dock ketika informasi terbuka; tidak ada gulir dokumen.
- Regresi Playwright penuh: sedang berjalan.

Panel sempit menampilkan bagian awal penjelasan; sisa isi, progres dan kendali dapat digulir di panel. Pengujian menggunakan Chrome dan emulasi ponsel; perangkat fisik sekolah belum diuji. Checkpoint ini tidak mencakup Refleksi Industri 2.0 atau era baru.
