# REVO-009B.2 — Assembly Sistem Elektrifikasi Pabrik

**Status: DONE untuk lingkup REVO-009B.2.**

Industry 2.0 berlanjut dari Briefing → Eksplorasi (7/7) → Perakitan. Pemain memilih sumber dan tujuan, menekan **Hubungkan**, lalu membaca mengapa energi atau putaran dapat diteruskan. Lima hubungan yang sah membuka tiga cek konsep. Ringkasan akhir hanya menyatakan bahwa **Perakitan selesai**; Experiment, Reflection, dan Level Completed belum diimplementasikan.

## Aturan sambungan

| ID | Jalur | Sumber → tujuan | Sebab dan akibat pada model |
| --- | --- | --- | --- |
| E1 | Listrik | Pasokan listrik → Panel distribusi | Pasokan membawa energi listrik ke panel, tempat jalur diatur dengan sakelar. |
| E2 | Listrik | Panel distribusi → Motor listrik | Panel menyalurkan energi listrik ke motor; motor mengubahnya menjadi putaran. |
| M1 | Mekanis | Motor listrik → Poros dan kopling | Poros dan kopling meneruskan putaran motor ke puli penggerak. |
| M2 | Mekanis | Poros dan kopling → Sabuk transmisi | Putaran poros menggerakkan puli; sabuk meneruskan putaran ke puli berikutnya. |
| M3 | Mekanis | Sabuk transmisi → Rol penggerak konveyor | Rol memutar permukaan konveyor, yang membawa benda kerja antarstasiun. |

Pemain dapat mencoba sambungan dalam urutan apa pun. Hubungan harus tepat dan berarah; hubungan terbalik, ke komponen sendiri, ke jalur yang keliru, atau ke stasiun kerja diberi umpan balik sesuai kekeliruannya. Pilihan yang salah tidak menambah progres dan tidak membuka kunci jawaban. Duplikat memberi tahu bahwa sambungan sudah terpasang. Stasiun kerja dan aliran material tetap konteks, karena sabuk transmisi membawa putaran dan sabuk konveyor membawa benda kerja. Diorama ini bukan diagram pengawatan atau prosedur instalasi listrik nyata.

## Cek konsep dan kelulusan

| ID | Yang diperiksa | Bukti yang diterima |
| --- | --- | --- |
| C1 | Peran motor setelah panel | Motor mengubah energi listrik menjadi putaran; panel hanya menyalurkan. |
| C2 | Motor berputar ketika transmisi terputus | Motor dapat tetap berputar, tetapi putaran tidak sampai ke rol. |
| C3 | Mengapa pasokan saja tidak cukup | Daya harus mencapai motor dan putaran harus diteruskan ke rol melalui transmisi. |

Setiap cek menyajikan tiga pilihan dengan penjelasan yang sesuai dengan pilihan. Jawaban salah dapat diulang tanpa mengulang sambungan atau terkena penalti waktu. Penyelesaian membutuhkan lima ID sambungan unik dan tiga pasangan soal–jawaban yang benar. Hitungan waktu, klik, dan animasi tidak dinilai. Ringkasan mencatat bukti aktivitas dalam model dan tidak menetapkan penguasaan materi di kelas.

## Arsitektur, migrasi, dan reset

| Berkas | Perubahan |
| --- | --- |
| `src/app/revo-lab/industry-2/assembly/page.tsx`, `src/lib/revo/routes.ts` | Rute Assembly di bawah layout dan provider 2.0 yang sudah ada. |
| `src/lib/revo/industry-2/assembly.ts` | Lima ID bertipe, kontrak arah koneksi, kandidat pasangan, umpan balik, dan cek konsep. |
| `src/lib/revo/industry-2/progress.ts`, `src/components/revo/industry-2/ElectricProgressProvider.tsx` | Tahap `assembly`, aksi dan validasi sambungan serta jawaban, migrasi V1→V2 pada key yang sama. |
| `src/components/revo/industry-2/ElectricAssembly.tsx`, `src/app/revo-lab/industry-2/electric.css` | HUD, progres, kontrol, feedback, cek, ringkasan, dan layout internal responsif. |
| `src/components/revo/industry-2/{ElectricScene,ElectricDiagram,ElectricExplore,ElectricBriefing}.tsx` | Geometri lama dengan highlight dua endpoint dan overlay per koneksi; fallback SVG; akses perakitan setelah 7/7; resume dari briefing. |
| `tests/revo-industry-2.test.ts`, `tests/revo-industry-2.e2e.spec.ts` | Aturan domain, migrasi, skenario browser, dan pengambilan bukti visual. Ekspektasi Explore disesuaikan dengan tahap baru. |
| `README.md`, `docs/REVO-LAB.md`, `docs/revo-009b2-media/` | Panduan status fitur dan bukti visual. |

- Satu reducer dan satu provider 2.0 mengelola tahap yang sudah dicapai, eksplorasi, sambungan, dan jawaban. URL langsung menampilkan layar terkunci sebelum 7/7, tanpa kanvas atau kontrol perakitan. Explore dapat dikunjungi kembali setelah Assembly tanpa menghapus progres.
- Snapshot **V2** mempertahankan key `revo:industry-2:progress`. Migrasi V1 mempertahankan ID Explore dan pilihan yang sah, memulai sambungan dan cek dengan data kosong, serta menulis V2 kembali untuk simpanan aktif. Pilihan sumber/tujuan dan umpan balik percobaan salah tidak disimpan; jawaban benar dan sambungan sah dipulihkan setelah reload.
- Restore menolak JSON, versi, dan tahap yang tidak sah. V2 Assembly tanpa eksplorasi lengkap diturunkan ke Explore; koneksi asing dan duplikat disaring. Jawaban diterima hanya bila semua sambungan tersedia dan jawaban cocok dengan soalnya. Flag selesai dihitung ulang, bukan dipercaya.
- Reset dengan konfirmasi dari **Eksplorasi → Reset progres 2.0** menghapus Explore dan Assembly era 2.0. Key dan mekanika Industry 1.0 tidak berubah.

## Aksesibilitas dan tata letak

- Pilihan Sumber dan Tujuan memakai kontrol native berlabel. Pilihan pasangan terstruktur menyediakan tombol sumber dan opsi tujuan, termasuk distraktor. Mouse/touch juga dapat memilih endpoint di diorama, tanpa drag. SVG menampilkan sambungan yang sama saat WebGL tidak tersedia.
- Status koneksi dan jawaban tersedia sebagai teks. Listrik dan mekanis dibedakan oleh label serta garis putus-putus/utuh. Progres dan feedback diumumkan melalui area status; fokus dapat terlihat pada tombol, select, radio, dan panel.
- Di ponsel, diorama tetap tampil di atas panel. Tombol **Hubungkan** atau **Periksa jawaban** berada di bilah aksi yang tetap dapat dijangkau; bagian instruksi dan pilihan bergulir di dalam panel. Daftar horizontal Explore sekarang memiliki petunjuk geser. Pilihan panjang bisa dibaca melalui daftar pasangan yang membungkus teks.
- Overlay 3D muncul ketika bukti diterima, tanpa loop animasi. Efek singkat pada feedback/SVG dinonaktifkan ketika perangkat meminta reduced motion. Teks, legenda, dan bukti koneksi tetap tampil.

## Hasil pengujian

Produksi lokal: `http://127.0.0.1:3004`. Playwright memakai Chrome lokal dengan SwiftShader, reduced motion, dan emulasi touch untuk skenario ponsel.

| Pemeriksaan | PASS | FAIL | SKIP |
| --- | ---: | ---: | ---: |
| `npm run typecheck` | 1 | 0 | 0 |
| `npm run lint` | 1 | 0 | 0 |
| `npm run build` | 1 | 0 | 0 |
| `npm test -- --reporter=dot` | 95 (7 baru) | 0 | 0 |
| Playwright — seluruh skenario Industry 2.0 (putaran akhir) | 23 | 0 | 0 |
| Playwright — regresi terarah Industry 1.0 dan navigasi bersama | 11 | 0 | 0 |

Playwright 2.0 memverifikasi kunci sebelum 7/7 dan pembukaan setelah 7/7, klik endpoint 3D, lima sambungan dan feedback, duplikat, cek konsep dan retry, reload, migrasi, snapshot rusak, reset terpisah, dan rute tahap berikutnya yang masih tidak tersedia. Keyboard dan touch masing-masing menyelesaikan tahap dari nol, dan tes keyboard sekaligus menyelesaikannya tanpa WebGL. Semua 23 skenario memeriksa `pageerror` dan console tingkat `error`. Briefing, Explore, dan Assembly diperiksa pada lima viewport; pemeriksaan Assembly mencakup fokus keyboard, aksi dalam viewport, target 44 px dan tidak adanya scroll/overflow dokumen.

Regresi 1.0 mencakup rute dan navigasi, briefing dan viewport, perakitan via keyboard dan drag 3D, eksperimen hingga ringkasan, fallback WebGL, pause, serta reload. Regresi dijalankan pada build sebelum penyesuaian akhir CSS yang hanya menargetkan Assembly 2.0 pada ≤360 px. Dari 75 skenario browser terdaftar, 41 tidak dipilih; kasus di luar filter berbeda dari SKIP runner.

Putaran pertama Industry 2.0: 21 PASS, 2 FAIL, 0 SKIP. Tes klik 3D sempat membaca kanvas sebelum pengukuran R3F selesai, dan tes keyboard tidak berhasil mengubah pilihan dropdown native melalui tombol panah pada konfigurasi browser ini. Tes sekarang menunggu ukuran kanvas yang benar dan menjalankan alur keyboard melalui daftar terstruktur dengan Enter, Tab, dan Space. Kedua skenario lulus pada pengujian ulang terarah (2 PASS, 0 FAIL, 0 SKIP).

Untuk mengulang tes, jalankan `npm run build`, lalu `npm run start -- --port 3004`. Gunakan `REVO_BASE_URL=http://127.0.0.1:3004 npm run test:e2e -- tests/revo-industry-2.e2e.spec.ts` untuk seluruh skenario 2.0. Regresi 1.0 memakai [filter yang sama dengan REVO-009B.1](REVO-009B1.md#pengujian).

## Bukti visual

Tangkapan build produksi, setelah memasang tiga sambungan dan menerima feedback mekanis:

| Viewport | Perakitan |
| --- | --- |
| 1440×900 | [PNG](revo-009b2-media/1440-perakitan.png) |
| 1366×768 | [PNG](revo-009b2-media/1366-perakitan.png) |
| 1280×720 | [PNG](revo-009b2-media/1280-perakitan.png) |
| 390×844 | [PNG](revo-009b2-media/390-perakitan.png) |
| 320×568 | [PNG](revo-009b2-media/320-perakitan.png) |

[Cek konsep di ponsel](revo-009b2-media/390-cek-konsep.png) · [Ringkasan ponsel](revo-009b2-media/390-selesai.png) · [Ringkasan desktop](revo-009b2-media/desktop-selesai.png) · [Ringkasan dengan fallback SVG](revo-009b2-media/fallback-selesai.png)

## Risiko dan rekomendasi REVO-009B.3

Materi dan distraktor masih perlu diperiksa guru. Pengujian browser mencakup emulasi touch dan WebGL dengan SwiftShader; perangkat fisik dan browser sekolah belum diverifikasi. Simpanan lokal tidak terlindung dari pengguna yang memasukkan seluruh bukti sah secara manual, dan tidak cocok untuk penilaian formal atau sinkronisasi antarpengguna.

Untuk **REVO-009B.3**, lanjutkan Experiment internal setelah `assemblyComplete` tervalidasi. Tambahkan model deterministik yang membedakan sakelar terbuka, motor berputar saat transmisi putus, rol aktif, dan aliran material terhambat di stasiun. Mulai dengan mesin berhenti; pause, reload dan menu tidak boleh menghasilkan output. Ukur observasi sebab-akibat, bukan waktu tunggu. Validasi guru, verifikasi perangkat dan gerbang sekolah di [REVO-009A](REVO-009A.md) tetap diperlukan sebelum uji siswa SMAN 16 Bandung.

Perubahan lokal REVO-009A dan REVO-009B.1 dipertahankan. Tidak ada commit, push, atau deployment.
