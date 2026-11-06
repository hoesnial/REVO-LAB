# REVO-008R.1 — Audit dan verifikasi revisi dosen

Audit awal: 1 November 2026. Verifikasi akhir: 2 November 2026. Repository: REVO-LAB mandiri.

## Temuan audit sebelum perubahan

| Bagian | Bukti implementasi awal | Keputusan revisi |
|---|---|---|
| Briefing / menu | `MISIMU DI ERA INI`, instruksi 100 unit, empat tujuan generik | Tujuan yang diusulkan dosen menjadi kartu bersama; instruksi berfokus pada pengamatan |
| HUD | `MissionPanel`, progressbar target 100, label misi, dialog keberhasilan otomatis | `LearningProgressPanel`, panduan dan bukti pengamatan; tombol Refleksi eksplisit |
| Mesin | `missionComplete` menghentikan dan membatasi produksi pada 100 | Lepas target dan penghentian otomatis; persamaan, sumber daya, pengaman, dan produksi dipertahankan |
| Guard | Eksperimen selesai dipakai untuk akses Refleksi dan rangkuman | Bukti operasi, gerak/produksi, T, dan keselamatan; dependensi eksplorasi/perakitan tetap |
| Save V1 | Flag eksperimen tanpa rekaman nilai pengamatan | V2 menyimpan bukti; migrasi dengan penanda selesai versi lama tanpa angka buatan |
| Perakitan | Lima representasi komponen yang sudah terisolasi, tiga cek, input drag dan inventaris | Digunakan kembali; soal piston diperjelas menjadi empat opsi |
| Refleksi | Tiga pertanyaan sejarah; skor dari indeks jawaban; boleh mengulang | Tidak diubah; hasil tetap berasal dari jawaban siswa |
| Tipografi | Banyak keterangan 7–12px, warna olive pucat pada cream; sidebar sempit | Lapisan CSS keterbacaan, 16–18px konten utama, internal scroll |
| Warna | Cream, hijau industri, olive, kuning sinyal | Identitas tetap; pasangan teks gelap/terang diperkuat |
| Aksesibilitas | Dialog native, keyboard, touch, reduced motion, transkrip, audio opt-in | Digunakan kembali untuk dialog tujuan dan alur revisi |

## Batas implementasi

Hanya Industry 1.0 dapat dimainkan. Tidak ada model baru, backend, akun, deployment produksi, atau hasil validasi kelas yang diklaim. Rumusan tujuan dan soal tetap memerlukan persetujuan guru. Dokumen `revo-delivery/` dan medianya merupakan snapshot REVO-008 sebelum revisi ini, bukan bukti tampilan versi terbaru.

## Bukti visual

Screenshot sebelum perubahan: `test-results/revo/revo-008r1/before/` (briefing dan lab, enam viewport).
Screenshot sesudah perubahan: `test-results/revo/revo-008r1/after/` (briefing, lab, dialog tujuan, enam viewport).
Ukuran: 1920×1080, 1440×900, 1366×768, 1280×720, 390×844, 320×568. Screenshot berada dalam direktori hasil pengujian lokal yang diabaikan Git.

Pilihan screenshot yang disertakan dalam repository: [indeks sebelum/sesudah](revo-008r1-media/README.md).

## Pengujian

Basis repository mandiri sebelum revisi berisi 69 tes unit dan 38 skenario browser REVO. Angka 98 unit + 2 Studio pada brief bukan isi checkout mandiri ini; tes Studio tidak dipindahkan ke produk REVO.

## Keterbacaan dan kontras

Pemeriksaan browser pada menu, pilihan era, briefing, Eksperimen, Perakitan, Refleksi, dan rangkuman membandingkan warna teks yang dihitung browser dengan latar solid leluhurnya. Setelah perbaikan, temuan rasio rendah yang tersisa pada pemindaian tersebut adalah tanda logo/dekorasi: titik judul dan indeks besar pada ilustrasi briefing. Indeks ilustrasi diberi `aria-hidden`; dekorasi tersebut tidak menyampaikan instruksi atau status. Ini merupakan pemeriksaan terbatas, bukan sertifikasi WCAG penuh: alpha blending, gambar di belakang teks, semua kombinasi hover/fokus, pembaca layar, dan setiap browser belum diaudit menyeluruh.

| Pasangan warna / fungsi | Rasio terhitung |
|---|---:|
| `#fffdf2` / `#203e32` — teks tujuan | 11,46:1 |
| `#ffe234` / `#203e32` — kata kerja tujuan | 9,01:1 |
| `#4b5945` / `#f6f6f0` — teks penjelasan terang | 6,88:1 |
| `#eef1e5` / `#232722` — label panel mesin | 13,25:1 |
| `#354d2f` / `#f5f6ed` — indikator tahap aktif | 8,56:1 |
| `#71301e` / `#fff2da` — peringatan keselamatan | 8,85:1 |

Keterangan utama umumnya 16–18px desktop dan 15–16px ponsel. Metadata dan navigasi kompak lebih kecil; teks materi tidak diperkecil untuk memaksa muat. Panel samping dan dialog memakai scroll internal. Panduan Eksperimen dapat dilipat. Tombol panel **Pelajari transmisi tenaga (T)** membuka materi yang sama dengan penanda 3D, termasuk saat WebGL gagal.

## Berkas revisi utama

- `src/components/revo/RevoLearningObjectives.tsx`: kartu tujuan bersama.
- `src/components/revo/LearningProgressPanel.tsx`: progres, produksi teramati, panduan, akses transmisi, lanjut Refleksi, ulangi eksperimen; menggantikan `MissionPanel.tsx`.
- `src/components/revo/RevoLab.tsx`: observasi dan transisi belajar, pause, dialog tujuan/transmisi, penyimpanan.
- `src/components/revo/RevoLevelBriefing.tsx`, `RevoMainMenu.tsx`, `RevoLevelCompleted.tsx`: alur dan bahasa berorientasi pembelajaran.
- `src/components/revo/MachineControlPanel.tsx`, `AssemblyPanel.tsx`, `QuizPanel.tsx`: label dan pemakaian kembali kendali/cek/skor.
- `src/lib/revo/experiment.ts`, `progress.ts`, `assembly.ts`, `eras.ts`: aturan observasi, migrasi, soal piston, tujuan.
- `src/lib/simulation/steamEngine.ts`, `simulationConstants.ts`, `src/lib/revo/resourceFilling.ts`, `src/hooks/useSteamSimulation.ts`: menghapus syarat produksi 100 dan pemulihan angka buatan, menjaga mesin berhenti setelah pemulihan.
- `src/app/revo-lab/readability.css`, `layout.tsx`, `industry-1/assembly.css`: keterbacaan dan panel fullscreen.
- `tests/revo-observations.test.ts`, `revo-learning.e2e.spec.ts`, serta tes lama yang bergantung target misi: aturan baru, migrasi, keselamatan, skor, WebGL, responsivitas.

Model 3D, transformasi geometris, animasi transmisi, konten sejarah refleksi, dan implementasi audio tidak dibangun ulang.

Screenshot briefing sebelum/sesudah menunjukkan halaman yang sama. Screenshot lab sebelum perubahan memakai tahap Eksplorasi; screenshot lab sesudah memakai fixture QA dengan eksplorasi dan perakitan lengkap agar panel Eksperimen dapat ditinjau. Fixture bukan hasil belajar siswa. Skenario browser terpisah menjalankan mesin dan kuis sungguhan untuk memverifikasi aturan pengamatan serta skor. Tidak ada validasi kelas atau umpan balik siswa yang diklaim.

## Pemetaan cakupan revisi

| Permintaan pengujian | Bukti otomatis |
|---|---|
| 1–4: tujuan, hijau/teks, dialog, tanpa panel misi | `revo-learning.e2e.spec.ts` — kartu, kontras, keyboard, pause, ketiadaan panel |
| 5–7: tanpa target 100, produksi, keselamatan | `revo-simulation.test.ts`, `revo-observations.test.ts`, `revo.e2e.spec.ts` — output berlanjut, emergency, vent, unsafe history |
| 8–9: eksplorasi dan perakitan | `revo-journey.e2e.spec.ts`, `revo-assembly.*` — lima komponen, drag, penolakan, reset, touch, cek |
| 10–11: bukti nyata dan guard Refleksi | `revo-observations.test.ts`, `revo-learning.e2e.spec.ts` — operasi/gerak, output pecahan, T, aman, tombol eksplisit |
| 12: ketepatan soal piston | `revo-observations.test.ts` — empat opsi, B, engkol vs roda gila; tes perakitan browser memilih opsi revisi |
| 13–14: skor dan rangkuman aktual | `revo-learning.e2e.spec.ts`, `revo-progress.*` — skor 1/3 dan 3/3, output terukur, reload hasil |
| 15–17: migrasi, restore, Continue | `revo-progress.*` — V1/V2, dependensi, data rusak, draft, hasil, reset, menu |
| 18–19: fullscreen dan scroll | `revo-learning.e2e.spec.ts` — enam ukuran dosen; suite lama menambah tablet dan landscape |
| 20: simulasi mekanis/3D | `revo.e2e.spec.ts`, `revo-filling.e2e.spec.ts`, `revo-transmission.test.ts` — perubahan geometri, gerak, pause, transmisi |
| Fallback transmisi | `revo-learning.e2e.spec.ts` — kehilangan konteks WebGL, alternatif panel, keyboard, Refleksi tetap dapat dibuka |

Pengujian ini memverifikasi perilaku perangkat lunak. Penilaian ketercapaian tujuan historis tetap memerlukan guru, respons siswa, dan instrumen akademik; tidak disamakan dengan keberhasilan gameplay.


## Hasil verifikasi akhir — 2 November 2026

Status: **DONE — menunggu review PM**. Perubahan disiapkan pada repository REVO-LAB mandiri, branch `codex/revo-008-academic-delivery`; tidak dipush atau dideploy ke produksi. Checkout Studio asli tetap bersih dan tidak direset.

| Pemeriksaan yang benar-benar dijalankan | Hasil |
|---|---|
| `npm run typecheck` | Lulus, exit 0 |
| `npm run lint` | Lulus, exit 0, tanpa temuan lint |
| `npm run build` | Lulus, exit 0; Next mencatat workspace induk di luar repo diabaikan |
| `npm test -- --reporter=dot` | 6 berkas, **79 tes lulus** |
| Playwright suite lengkap pada build integrasi, 2 worker | **39/42 lulus**, 3 temuan diperbaiki di bawah |
| Playwright pengujian ulang terarah setelah perbaikan, 1 worker | **14/14 lulus** (3,1 menit), mencakup ketiga temuan dan skenario fallback baru |
| Playwright akhir pada build terbaru, pengisian + pembelajaran | **11/11 lulus** (5,1 menit) |
| Cakupan browser unik pada rangkaian pengujian | **43 skenario memperoleh hasil lulus**: 38 lama + 5 baru. Ini gabungan suite lengkap dan tes ulang terarah, bukan klaim satu run 43/43 |
| Visual | Enam ukuran dosen lulus; area 3D tetap berukuran bermakna, tanpa scroll dokumen atau overflow horizontal; panel dapat digulir internal |
| `git diff --check` | Lulus |

Server pengujian: build produksi lokal `http://127.0.0.1:3003`; browser Google Chrome, WebGL melalui SwiftShader, ponsel memakai emulasi viewport/touch. Browser lain dan perangkat ponsel fisik belum disertifikasi.

### Tiga temuan dari suite lengkap

1. **Selector tes briefing usang:** masih mencari `.revo-briefing-mission`. Diganti dengan alur belajar, mempertahankan pemeriksaan semua tujuan, tombol, ukuran viewport, dan menambahkan ukuran teks minimal 16px. Aturan lama yang memaksa semua materi desktop muat tanpa scroll internal disesuaikan dengan revisi dosen yang membolehkan scroll internal demi keterbacaan.
2. **Kartu komponen menutupi kamera di ponsel:** kartu diposisikan di atas baris kamera, dan pemilihan informasi dibersihkan ketika berganti tahap. Progres eksplorasi tetap dipertahankan. Tes tap pengisian dan kendali kamera lulus kembali, termasuk build akhir.
3. **Fixture rekaman demo tertimpa penulis progres mesin yang aktif:** tes kini menuju Menu terlebih dahulu untuk menghentikan clock, lalu memasukkan fixture QA dan membuka hasil melalui Lihat Hasil. Perilaku penyimpanan riil tidak dimatikan. Rekaman demo berhasil dibuat ulang.

Tidak ada tes lama yang dihapus. Ekspektasi target produksi dan panel misi diganti untuk menguji aturan pengamatan yang diminta. Pemeriksaan pengaman, input, geometri, pause, sumber daya, kuis, skor, dan restore tetap dipertahankan.

### Batas dan tindak lanjut

- Tujuan serta rumusan materi masih memerlukan validasi guru; belum ada uji kelas atau klaim peningkatan hasil belajar.
- Rekaman V1 yang selesai tetap sah, tetapi rincian pengamatannya tidak tersedia dan tidak direkayasa.
- Save lokal bergantung browser/perangkat; tidak tersinkronisasi dan bukan sistem antimanipulasi.
- Audit kontras terbatas dan emulasi responsif tidak menggantikan audit WCAG menyeluruh, pengujian browser lain, atau penggunaan perangkat fisik.
- Audit mekanika, aset, dan audiovisual menyeluruh disisakan untuk **REVO-008R.2 — 3D Mechanical, Audiovisual & Asset Audit**. Tidak dikerjakan sebelum review PM.
