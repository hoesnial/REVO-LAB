# REVO-009B.1 — Fondasi dan Eksplorasi Revolusi Industri 2.0

**Status: DONE untuk lingkup REVO-009B.1.**

REVO sekarang membuka **Industry 2.0 — The Age of Electricity** dari Pilih Era. Siswa dapat membaca enam tujuan pembelajaran, mengamati diorama pabrik, memeriksa tujuh komponen, dan menelusuri tiga jalur yang berbeda. Briefing dan Eksplorasi adalah batas iterasi ini. Industry 1.0 tetap memiliki alur lengkapnya; Industry 3.0 dan 4.0 tetap terkunci.

**Checkpoint awal:** `7f0fcb3` di `codex/revo-008-academic-delivery`. Audit [REVO-009A](REVO-009A.md) dan tautan dokumentasinya sudah ada sebagai perubahan lokal saat pekerjaan dimulai dan dipertahankan. Tidak ada commit, push, atau deployment.

## Arsitektur dan struktur modul

| Lokasi | Tanggung jawab |
| --- | --- |
| `src/app/revo-lab/industry-2/{layout.tsx,page.tsx,briefing/page.tsx,electric.css}` | Dua rute, layout pemilik provider, metadata, dan gaya HUD khusus era 2.0. |
| `src/lib/revo/industry-2/content.ts` | ID dan deskripsi komponen, label dan simbol jalur, serta enam tujuan pembelajaran. |
| `src/lib/revo/industry-2/progress.ts` | Reducer, tipe tahap, validator, snapshot berversi, dan adaptor penyimpanan. |
| `src/components/revo/industry-2/ElectricProgressProvider.tsx` | Pemulihan progres di browser dan penyimpanan sebelum perpindahan rute. |
| `src/components/revo/industry-2/{ElectricBriefing,ElectricExplore,ElectricDiagram,ElectricScene}.tsx` | Briefing, HUD dan daftar inspeksi, ilustrasi SVG yang juga menjadi fallback, serta diorama R3F. |
| `src/lib/revo/{eras,routes}.ts`, `src/app/revo-lab/eras/page.tsx`, `src/components/revo/RevoEraSelection.tsx` | Akses ke briefing 2.0 dari pemilih era. |

Industry 2.0 memakai kembali `RevoScreenHeader`, `RevoDialog`, dan primitif geometri. Simulator, reducer, progres, dan aturan belajar mesin uap tidak diubah. Kanvas 2.0 dimuat hanya di rute Eksplorasi yang sudah dibuka; keluar dari rute melepas kanvas. Industry 1.0 tetap memakai aturan mount/unmount yang sudah ada. R3F merender sesuai kebutuhan, tanpa animasi berulang. Jika WebGL tidak tersedia atau konteksnya hilang, SVG dan tombol DOM mempertahankan akses ke materi.

## Briefing dan eksplorasi

1. Dari **Menu → Pilih Era → Buka Briefing 2.0**, baca tujuan, konteks, dan petunjuk, lalu pilih **Mulai Eksplorasi**.
2. Pilih objek/penanda dalam diorama dengan mouse atau touch, atau gunakan tombol komponen dengan keyboard. Objek terpilih disorot; panel menampilkan fungsi dan hubungan, dengan status komponen yang sudah dibuka.
3. Tiga tombol jalur menyorot sambungan yang berbeda. Setiap jalur memiliki warna, simbol dan label teks. Kamera dapat diputar, dizum, dan dikembalikan ke posisi awal.
4. Setelah **7/7** komponen unik diperiksa, HUD mengonfirmasi **Eksplorasi selesai. Perakitan belum tersedia.** Hitungan ini adalah bukti komponen telah dibuka, bukan nilai pemahaman siswa.

| ID | Komponen | Apa yang dijelaskan |
| --- | --- | --- |
| `supply` | Pasokan listrik | Pasokan dari jaringan atau pembangkit setempat menuju panel. |
| `panel` | Panel distribusi | Sakelar mengatur jalur listrik ke motor, tanpa menggerakkan konveyor secara langsung. |
| `motor` | Motor listrik | Energi listrik menjadi putaran; titik peralihan ke transmisi mekanis. |
| `shaft` | Poros dan kopling | Putaran motor diteruskan ke puli penggerak. |
| `belt` | Sabuk transmisi | Putaran berpindah ke rol penggerak; sabuk transmisi berbeda dari sabuk pembawa benda kerja. |
| `conveyor` | Konveyor | Rol menggerakkan permukaan pembawa benda kerja antarstasiun. |
| `stations` | Stasiun kerja | Pembagian pekerjaan menjadi pemasangan dan pemeriksaan, serta perubahan ritme kerja. |

| Jalur | Urutan yang ditampilkan |
| --- | --- |
| Listrik | Pasokan → panel → motor |
| Mekanis | Motor → poros → sabuk → rol konveyor |
| Material | Benda kerja → pemasangan → pemeriksaan |

Diorama adalah skema edukatif awal abad ke-20, bukan replika Highland Park atau simulasi listrik untuk praktik bengkel. Briefing memakai Highland Park sebagai contoh: elektrifikasi membantu sebagian pabrik menata ulang mesin; produksi massal juga bergantung pada pembagian tugas dan komponen yang dapat dipertukarkan. Rujukan konten: [The Henry Ford — mesin penggilingan Ingersoll dan produksi massal di Highland Park](https://www.thehenryford.org/collections/explore/articles/detail/articles/2020/04/25/the-henry-ford-s-ingersoll-milling-machine-and-mass-production-at-highland-park), [The Henry Ford — Assembly Line](https://askus.thehenryford.org/K12/faq/433848), dan [National Park Service — Weave Room FAQ](https://home.nps.gov/articles/000/weave-room-frequently-asked-questions.htm) untuk contoh hubungan antara motor, sabuk, dan poros.

## State, penyimpanan, dan batas akses

- **Briefing → Explore.** Rute langsung Eksplorasi memeriksa progres. Sesi baru tanpa rekaman valid diarahkan ke pilihan membuka briefing. Simpanan yang sah dapat melanjutkan eksplorasi.
- **Snapshot V1** hanya memakai `revo:industry-2:progress`: `version`, `stage`, daftar `explored`, `selected`, dan `exploreComplete`. Reducer menolak inspeksi sebelum mulai, ID asing, dan hitungan ganda. Status selesai selalu dihitung ulang dari tujuh ID wajib, termasuk saat restore.
- **Restore** menolak JSON rusak, versi asing, bentuk data yang salah, dan tahap di luar `briefing | explore`. ID duplikat/asing dibersihkan dan pilihan yang belum pernah dibuka dibuang. Jika penyimpanan diblokir, progres bekerja dalam memori selama pengguna berada di subtree era 2.0.
- **Reset** memerlukan konfirmasi, menghapus key 2.0 saja, dan kembali ke Briefing. Tidak ada perubahan pada `revo:industry-1:progress`.
- **Belum dibangun:** Assembly, Experiment, Reflection, Level Completed, penilaian konsep, dan ringkasan 2.0. Tidak ada tombol menuju tahap tersebut atau progres belajar yang disimulasikan. URL Assembly, Experiment, dan Reflection mengembalikan 404.

## Pengujian

Build produksi dijalankan di `127.0.0.1:3004`; browser uji adalah Google Chrome melalui Playwright dengan SwiftShader. Uji touch menggunakan emulasi Chromium. Dua sesi Playwright memisahkan skenario baru dan regresi.

| Pemeriksaan | PASS | FAIL | SKIP |
| --- | ---: | ---: | ---: |
| `npm run typecheck` | 1 | 0 | 0 |
| `npm run lint` | 1 | 0 | 0 |
| `npm run build` | 1 | 0 | 0 |
| `npm test -- --reporter=dot` | 88 (9 baru) | 0 | 0 |
| Playwright — seluruh skenario Industry 2.0 | 13 | 0 | 0 |
| Playwright — regresi terarah Industry 1.0 dan navigasi bersama | 11 | 0 | 0 |

Playwright 2.0 mencakup pemilihan objek WebGL dengan mouse dan tap, tujuh inspeksi unik dengan keyboard, gating/404, reload/reset lintas era, jumlah kanvas, pemulihan penyimpanan, fallback SVG/DOM, tiga sorotan jalur, dan semua viewport target tanpa scroll dokumen maupun overflow horizontal. Seluruh skenario 2.0 memeriksa bahwa tidak ada `pageerror` atau pesan console tingkat `error`. Konfigurasi uji menggunakan preferensi reduced motion.

Regresi 1.0 mencakup navigasi, briefing, pemulihan sesi, pause mesin saat kembali ke menu, perakitan via keyboard dan drag 3D, eksperimen hingga refleksi dan ringkasan, serta fallback saat WebGL hilang. Di luar dua putaran akhir ini, 41 dari 65 skenario Playwright terdaftar tidak dipilih. Angka SKIP di tabel adalah kasus yang dilaporkan sebagai skip oleh runner, bukan kasus di luar filter.

Untuk mengulang dua putaran setelah `npm run build` dan `npm run start -- --port 3004`:

```sh
REVO_BASE_URL=http://127.0.0.1:3004 npm run test:e2e -- tests/revo-industry-2.e2e.spec.ts
REVO_BASE_URL=http://127.0.0.1:3004 npm run test:e2e -- \
  tests/revo-journey.e2e.spec.ts tests/revo-menu.e2e.spec.ts \
  tests/revo-progress.e2e.spec.ts tests/revo-assembly.e2e.spec.ts \
  tests/revo-learning.e2e.spec.ts \
  --grep 'main menu →|unfinished eras|keyboard navigation activates|era selection and briefing fit|journey navigation pauses|fresh menu hides|partial assembly and completed|keyboard selection, wrong|3D raycast dragging|real output and T inspection|transmission learning remains'
```

Putaran awal Playwright 2.0 menemukan overflow di 390 px dan tombol reset kamera terpotong di 320 px (11 lulus, 2 gagal). Kedua kasus ditelusuri ke pengaturan lebar HUD dan label aksesibilitas pada daftar komponen. Putaran berikutnya (11 lulus, 2 gagal) menemukan scroll otomatis tes berhenti di tepi panel pada 1280 dan 390 px; item terakhir kemudian diposisikan ke tengah panel sebelum pengecekan penuh. Putaran akhir mencakup kembali seluruh 13 skenario. Build awal setelah penambahan tes menangkap tipe `this` pada stub WebGL; anotasi diperbaiki dan build dijalankan ulang. Peringatan Next.js mengenai `pnpm-workspace.yaml` di luar repositori tidak menghentikan build.

## Bukti visual dari aplikasi

Tangkapan dari build produksi. Pada layar sempit, daftar komponen dapat digulir horizontal dan panel bacaan bergulir di dalam HUD.

| Viewport | Briefing | Explore |
| --- | --- | --- |
| 1440×900 | [PNG](revo-009b1-media/1440-briefing.png) | [PNG](revo-009b1-media/1440-explore.png) |
| 1366×768 | [PNG](revo-009b1-media/1366-briefing.png) | [PNG](revo-009b1-media/1366-explore.png) |
| 1280×720 | [PNG](revo-009b1-media/1280-briefing.png) | [PNG](revo-009b1-media/1280-explore.png) |
| 390×844 | [PNG](revo-009b1-media/390-briefing.png) | [PNG](revo-009b1-media/390-explore.png) |
| 320×568 | [PNG](revo-009b1-media/320-briefing.png) | [PNG](revo-009b1-media/320-explore.png) |

## Risiko dan tindak lanjut

- **Pedagogis:** guru perlu memeriksa enam tujuan, istilah (khususnya sabuk transmisi vs sabuk konveyor), contoh sejarah, serta pembahasan tentang standardisasi, pembagian kerja, dan dampak sosial. Jumlah klik tidak mengukur pemahaman; tambahkan cek konsep sebab-akibat pada Assembly dan tugas transfer pada Reflection.
- **Teknis:** progres tersimpan per browser/perangkat tanpa sinkronisasi. Validator menahan struktur palsu dan flag selesai buatan, tetapi penyimpanan lokal bukan bukti penilaian antimanipulasi: pengguna yang menulis tujuh ID sah bisa meniru eksplorasi lengkap. Akses WebGL dan kinerja perlu diuji di perangkat sekolah. Safari, Firefox, GPU perangkat sekolah dan touch pada ponsel fisik belum diverifikasi dalam putaran ini.
- **Kesiapan kelas:** ini prototipe internal. Uji siswa di SMAN 16 Bandung baru layak dipertimbangkan setelah alur 2.0 selesai, materi disetujui guru, dan gerbang B6 serta kesiapan sekolah di [REVO-009A](REVO-009A.md) terpenuhi.

| Backlog REVO-009A | Status dan kriteria lanjut |
| --- | --- |
| B0 — konten | Draf 2.0 dapat ditinjau, dengan rujukan dan label penyederhanaan. Validasi guru tetap terbuka. |
| B1–B2 — fondasi, briefing, Explore | Dua rute, progres terpisah, tujuh komponen dan tiga jalur tersedia. |
| B3 — Assembly / REVO-009B.2 | Gunakan `ElectricPartId` untuk referensi komponen dan tipe ID sambungan tersendiri. Reducer memvalidasi sambungan listrik dan mekanis. Buka perakitan hanya sesudah 7/7; tolak koneksi salah/duplikat. Sediakan socket tetap, preview, feedback, kontrol tanpa drag, serta cek konsep dengan retry. Bila bentuk simpanan berubah, migrasikan snapshot V1 dan uji reload/reset tanpa menyentuh 1.0. |
| B4 — Experiment | Modelkan sakelar terbuka vs tertutup, motor aktif tanpa transmisi, dan bottleneck. Unlock sesudah Assembly dan cek konsep yang sah; catat observasi, bukan durasi. |
| B5 — Reflection dan completion | Tambah pertanyaan transfer konsep dan dampak sosial, serta ringkasan berbasis bukti. |
| B6 — aksesibilitas dan integrasi | Verifikasi tiap tahap baru pada semua viewport, keyboard, touch, fallback, dan perangkat sekolah. Ulangi regresi lintas era menjelang rilis. |

**Keputusan: GO untuk REVO-009B.2 (Assembly internal).** Gating, pemisahan progres, akses dasar, dan regresi terarah lulus. Validasi guru berjalan sebagai gerbang kesiapan uji siswa; tahap sekolah belum mendapat persetujuan.

## Inventaris perubahan

- **Dibuat:** empat file rute/gaya, lima komponen dan dua modul 2.0 dalam tabel arsitektur; `tests/revo-industry-2.test.ts`; `tests/revo-industry-2.e2e.spec.ts`; laporan ini dan sepuluh PNG di `docs/revo-009b1-media/`.
- **Diubah:** `src/lib/revo/eras.ts`, `src/lib/revo/routes.ts`, `src/app/revo-lab/eras/page.tsx`, `src/components/revo/RevoEraSelection.tsx`, `playwright.revo.config.ts`, `tests/revo-journey.e2e.spec.ts`, `README.md`, `docs/REVO-LAB.md`. Tes pemilih era disesuaikan untuk kartu 2.0 yang kini bisa dibuka; ekspektasi 1.0 serta kunci 3.0 dan 4.0 dipertahankan.
