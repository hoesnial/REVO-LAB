# REVO-009B.3R — Penyempurnaan visual Industri 2.0

Status: selesai untuk tinjauan visual PM. Lingkup berhenti sebelum Refleksi dan Ringkasan 2.0. Branch awal `codex/revo-008-academic-delivery`, HEAD `7f0fcb3`; working tree sudah berisi pekerjaan 009A sampai 009B.3. Perubahan itu dipertahankan, tanpa reset/commit/push/deploy.

## Audit lintas era

Audit sumber meliputi Main Menu, Briefing, Learning Objectives, RevoLab, FactoryScene, ScenePrimitives, AssemblyPanel, QuizPanel, RevoLevelCompleted, seluruh layar Electric, validator V3, dan tes yang ada. Referensi 1.0 tetap dipakai sesuai kekuatannya, bukan disalin seluruhnya.

| Komponen | Industri 1.0 | Industri 2.0 awal | Ketidakselarasan | Keputusan kanonis |
| --- | --- | --- | --- | --- |
| Menu / Briefing | Judul editorial, tujuan hijau, navigasi shared | Header/tujuan sudah shared, body tersendiri | Ukuran teks/helper tidak satu skala | Pertahankan editorial; token heading/body/label untuk workspace |
| HUD | Tab, progres di sidebar, kontrol mesin hijau gelap | Route link, kartu/panel krem | Hierarki dan banyak border | Pertahankan tab vs link; satu semantik aktif/selesai/locked, panel terang/gelap sesuai fungsi |
| Informasi komponen | Nomor, subjudul, nama, uraian, peran, tutup/berikutnya | Nama/fungsi/hubungan dalam kartu tipis | Nomor dan blok peran berbeda, heading/spacing lokal | `RevoComponentInfo` shared; host overlay 1.0 dan inspector 2.0 |
| Aksi | Kuning navigasi, hijau kemajuan, netral sekunder | Sebagian memakai aturan shared | Masih ukuran/radius tersendiri | Alias token shared, min 44 px, teks status selain warna |
| Cek konsep / Refleksi | Kartu jawaban shared, penjelasan salah/benar | Kartu konsep shared | Tidak perlu mengganti logika | Reuse RevoAnswerFace dan RevoDialog; Refleksi 2.0 tetap unavailable |
| Ringkasan | Hasil eksplorasi, pengamatan, nilai aktual | Belum ada | Bukan kekurangan visual dalam scope ini | Tidak membangun atau mengarang hasil 2.0 |
| Kendali eksperimen | Panel mesin, indikator tekanan, aksi sumber daya | Sakelar, empat skenario, lima kartu kecil | Terlalu banyak kotak dan teks 11 px di ponsel | Satu bidang status, 3×2 compact, sakelar terpisah, uraian 15–16 px |
| Kamera | Fokus komponen, zoom/reset; mesin dominan | Overview/reset, fit tinggi 8.7 unit | Mesin sangat kecil saat tinggi canvas pendek | Fit overview 14×6.6 unit, sudut lebih frontal, pilihan fokus + reset |
| Lingkungan | Tembok bata, rangka, dudukan, bayangan | Dinding rata, jendela, tanpa shadow | Kurang kedalaman/kontak tanah | Tembok berlapis, baseplate, satu shadow light, roughness material |
| Mekanisme | Engkol, poros, puli tersambung | Sambungan sederhana, kaki dan rol kurang jelas | Komponen tampak melayang, roda penggerak kurang terbaca | Dudukan/bantalan, rol koaksial, baut instanced, penguat konveyor, conduit terpisah |
| Fallback | Deskripsi/kontrol tetap tersedia | Diagram SVG dan daftar | Gaya skematik memang berbeda dari 3D | Pertahankan alternatif penuh, jangan memaksa WebGL |

## Implementasi

[Sistem desain kanonis](REVO-DESIGN-SYSTEM.md) memperluas token yang sudah ada. Komponen baru hanya memisahkan presentasi informasi dan kontrol kamera. Model, reducer, penilaian, gerbang dan skema V3 tidak diubah.

Detail 3D baru meliputi kaki/mounting motor, tutup pendingin, bantalan poros, rol penggerak segaris dengan puli, penguat kaki konveyor, 28 fastener dalam satu instanced mesh, conduit listrik, laci/peralatan stasiun dan struktur bangunan. Rangkaian tetap ilustrasi edukatif, bukan rekonstruksi pabrik atau panduan rekayasa.

Kamera lebih frontal mengurangi pemendekan lintasan konveyor. Tombol Pilih sudut pandang membuka pilihan Seluruh pabrik, Motor listrik, Poros dan transmisi, Konveyor, Stasiun kerja dapat dipakai keyboard/sentuh. Fokus mengubah tampilan saja; reset mengembalikan overview. Kamera detail boleh memotong bangunan. Pemilihan komponen tetap dilakukan via diorama atau daftar; highlight dibuat halus agar warna material tetap terbaca.

Gerak permukaan konveyor memakai state dan fase yang sama dengan barang. Kondisi C mempertahankan putaran motor tanpa gerak puli/belt/barang. Kondisi D tetap model transmisi kaku tanpa selip; motor tertahan. Status teks menjelaskan akibat, tidak hanya animasi. Reduced motion dan berhenti saat dialog/tab tersembunyi tetap berlaku.

## File

- `src/app/revo-lab/design-system.css`, import di layout.
- `src/components/revo/RevoComponentInfo.tsx`, dipakai RevoLab dan ElectricExplore.
- `src/components/revo/industry-2/ElectricCameraControls.tsx`, dipakai Explore/Assembly/Experiment.
- `ElectricMachineDetails.tsx`, `ElectricScene.tsx`: detail, shadow, kamera, gerak permukaan.
- `tests/revo-design.e2e.spec.ts`, registrasi config dan pemeriksaan overlap di tes eksperimen; koordinat raycast tes Industry 2.0 mengikuti kamera baru, tetap mengetuk geometri sungguhan.
- Dokumentasi ini, REVO-DESIGN-SYSTEM, indeks REVO-LAB, dan tangkapan sebelum/sesudah.

## Verifikasi dan batasan

Typecheck (`npm run typecheck`), lint (`npm run lint`), build produksi (`npm run build`), dan Vitest (`npm test`, **104/104**) lulus. Regresi Playwright penuh (`npm run test:revo`) terhadap desain baru menjalankan **85 skenario** (83 lama, dua baru): **84 langsung lulus, satu lulus saat retry**. Satu tes pengisian bahan bakar Industri 1.0 melewati batas waktu pada percobaan pertama, lalu lulus dalam pengujian terisolasi tanpa retry. Mekanika pengisian dan batas waktu tes tersebut tidak diubah.

Setelah tinjauan seluler, label status dan tombol jalur diberi ruang terpisah dari tombol kamera. Penanda dekoratif pada kartu Industri 1.0 tetap tersembunyi di layar sempit. Pada 320 × 568, membuka informasi di tahap Eksplorasi memberi kartu lebih banyak ruang sehingga isi penjelasan langsung mulai terbaca, tanpa menutup tombol kamera atau daftar komponen. Kartu dapat difokuskan dan digulir dengan keyboard. Pada build akhir, dua tes seluler Industri 1.0 lulus. Dari tujuh skenario visual/eksperimen, enam lulus langsung; satu tes reduced motion sempat membaca status berhenti dari kondisi listrik sebelumnya. Tes kini menunggu frame bergerak setelah listrik dipulihkan sebelum mengaktifkan reduced motion, tetap membandingkan dua gambar secara persis, dan lulus **3/3** dalam pengulangan terisolasi.

Kedua era menggunakan kamera WebGL dalam sesi terpisah. Tes mencakup klik pada mesh, kontrol fokus dengan keyboard, reset kamera tanpa menulis progres, alternatif sentuh/SVG, penghentian animasi, reduced motion, gerbang tahap, bukti observasi, dan simpanan. Tes viewport mengecek dokumen tidak bergulir dan kendali eksperimen utama minimal 44 × 44 px.

Pada sampel lokal Chrome/SwiftShader 1440 × 900, penghitung WebGL mencatat **0 panggilan gambar** selama sekitar 500 ms saat idle, setelah berhenti, dan saat reduced motion aktif. Saat kondisi normal berjalan tercatat 4.192 panggilan dalam 501 ms. Ini pengukuran aktivitas renderer, bukan FPS atau tolok ukur lintas perangkat. Detail baru memakai geometri sederhana, baut instanced, satu shadow map 1024 × 1024, dan render sesuai kebutuhan.

## Bukti visual

Empat kolom tahap memperlihatkan Industri 1.0 dan 2.0 berdampingan. Kolom kondisi membandingkan khusus Industri 2.0: normal, listrik terputus, transmisi terputus, konveyor terhalang, dan observasi 4/4. Tangkapan baseline dibuat dari build 009B.3 sebelum redesign; build 009B.3R ditangkap dengan viewport dan checkpoint yang sebanding. Tangkapan setiap tahap dan kondisi ditinjau manual di empat ukuran desktop dan dua ukuran seluler. Tinjauan ini memicu koreksi tabrakan kontrol dan ruang baca pada layar sempit.

| Ukuran | Eksplorasi | Informasi | Perakitan | Eksperimen | Empat kondisi + selesai |
| --- | --- | --- | --- | --- | --- |
| 1920 × 1080 | [Sebelum](revo-009b3r-media/1920-before-explore.webp) · [Sesudah](revo-009b3r-media/1920-after-explore.webp) | [Sebelum](revo-009b3r-media/1920-before-info.webp) · [Sesudah](revo-009b3r-media/1920-after-info.webp) | [Sebelum](revo-009b3r-media/1920-before-assembly.webp) · [Sesudah](revo-009b3r-media/1920-after-assembly.webp) | [Sebelum](revo-009b3r-media/1920-before-experiment.webp) · [Sesudah](revo-009b3r-media/1920-after-experiment.webp) | [Bandingkan](revo-009b3r-media/1920-conditions.webp) |
| 1440 × 900 | [Sebelum](revo-009b3r-media/1440-before-explore.webp) · [Sesudah](revo-009b3r-media/1440-after-explore.webp) | [Sebelum](revo-009b3r-media/1440-before-info.webp) · [Sesudah](revo-009b3r-media/1440-after-info.webp) | [Sebelum](revo-009b3r-media/1440-before-assembly.webp) · [Sesudah](revo-009b3r-media/1440-after-assembly.webp) | [Sebelum](revo-009b3r-media/1440-before-experiment.webp) · [Sesudah](revo-009b3r-media/1440-after-experiment.webp) | [Bandingkan](revo-009b3r-media/1440-conditions.webp) |
| 1366 × 768 | [Sebelum](revo-009b3r-media/1366-before-explore.webp) · [Sesudah](revo-009b3r-media/1366-after-explore.webp) | [Sebelum](revo-009b3r-media/1366-before-info.webp) · [Sesudah](revo-009b3r-media/1366-after-info.webp) | [Sebelum](revo-009b3r-media/1366-before-assembly.webp) · [Sesudah](revo-009b3r-media/1366-after-assembly.webp) | [Sebelum](revo-009b3r-media/1366-before-experiment.webp) · [Sesudah](revo-009b3r-media/1366-after-experiment.webp) | [Bandingkan](revo-009b3r-media/1366-conditions.webp) |
| 1280 × 720 | [Sebelum](revo-009b3r-media/1280-before-explore.webp) · [Sesudah](revo-009b3r-media/1280-after-explore.webp) | [Sebelum](revo-009b3r-media/1280-before-info.webp) · [Sesudah](revo-009b3r-media/1280-after-info.webp) | [Sebelum](revo-009b3r-media/1280-before-assembly.webp) · [Sesudah](revo-009b3r-media/1280-after-assembly.webp) | [Sebelum](revo-009b3r-media/1280-before-experiment.webp) · [Sesudah](revo-009b3r-media/1280-after-experiment.webp) | [Bandingkan](revo-009b3r-media/1280-conditions.webp) |
| 390 × 844 | [Sebelum](revo-009b3r-media/390-before-explore.webp) · [Sesudah](revo-009b3r-media/390-after-explore.webp) | [Sebelum](revo-009b3r-media/390-before-info.webp) · [Sesudah](revo-009b3r-media/390-after-info.webp) | [Sebelum](revo-009b3r-media/390-before-assembly.webp) · [Sesudah](revo-009b3r-media/390-after-assembly.webp) | [Sebelum](revo-009b3r-media/390-before-experiment.webp) · [Sesudah](revo-009b3r-media/390-after-experiment.webp) | [Bandingkan](revo-009b3r-media/390-conditions.webp) |
| 320 × 568 | [Sebelum](revo-009b3r-media/320-before-explore.webp) · [Sesudah](revo-009b3r-media/320-after-explore.webp) | [Sebelum](revo-009b3r-media/320-before-info.webp) · [Sesudah](revo-009b3r-media/320-after-info.webp) | [Sebelum](revo-009b3r-media/320-before-assembly.webp) · [Sesudah](revo-009b3r-media/320-after-assembly.webp) | [Sebelum](revo-009b3r-media/320-before-experiment.webp) · [Sesudah](revo-009b3r-media/320-after-experiment.webp) | [Bandingkan](revo-009b3r-media/320-conditions.webp) |

[Skema SVG pada 320 px](revo-009b3r-media/320-fallback.webp) · [Tampilan fokus transmisi](revo-009b3r-media/320-focus.webp)

Kamera overview memperlihatkan seluruh lantai, motor, dan konveyor pada ukuran yang diuji. Pada tampilan detail, kamera sengaja dapat memotong tepi diorama untuk mendekatkan mekanisme. Pada 320 × 568, instruksi dan catatan dibaca dengan menggulir panel dalam; sakelar dan aksi utama tetap terjangkau.

Tidak ada klaim FPS atau uji siswa. Chrome lokal/SwiftShader dan emulasi sentuh bukan pengganti perangkat sekolah. Model rigid non-slip harus ditinjau guru. PM perlu meninjau visual sebelum REVO-009B.4. Tidak ada perubahan skor/soal maupun klaim validasi guru.
