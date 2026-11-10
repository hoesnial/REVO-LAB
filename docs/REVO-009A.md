# REVO-009A — Audit Kesiapan dan Fondasi Industry 2.0

Tanggal audit: 8 November 2026  
Checkpoint: REVO-008R.1.1  
Keputusan: **GO bersyarat untuk implementasi REVO-009B.** Ini mengizinkan prototipe dengan gerbang validasi di bawah; bukan persetujuan materi guru, kesiapan uji siswa, atau persetujuan rilis.

## Ringkasan keputusan

Repository bersih pada 7f0fcb3 (feat(revo): finalize academic delivery and UI refinement); main, origin/main, dan branch kerja berada di commit yang sama. Industry 1.0 adalah satu-satunya era dengan alur permainan lengkap. Progres dan mekaniknya khusus untuk mesin uap.

Screenshot produksi terakhir yang tersedia di repository telah ditinjau. Tidak ditemukan masalah visual kritis yang menghalangi perjalanan belajar pada desktop atau ponsel. Di 320×568, penanda diorama rapat dan catatan HUD memiliki ruang vertikal terbatas; daftar komponen dan kontrol DOM memberi jalur alternatif. Ini perlu diperiksa pada perangkat fisik, tetapi tidak membenarkan perubahan pada I.1 yang lolos regresi.

REVO-008R.2 tercatat sebagai audit geometri mekanis, aset, dan audiovisual I.1 yang ditunda untuk PM review. Belum ada laporan atau bukti penyelesaian R.2 di repository. Pekerjaan itu tidak menjadi prasyarat teknis untuk merancang I.2. Review guru atas materi I.2 dan alur sebab-akibat wajib dilakukan sebelum uji siswa.

Belum ada perubahan kode pada checkpoint ini. Kontrak konten/identitas komponen I.2 belum tervalidasi, sedangkan provider, penyimpanan, komponen, dan simulasi saat ini terikat khusus pada I.1. Membuat scaffold yang belum dipakai atau memperluas provider lama akan mengunci asumsi materi atau menyentuh jalur stabil I.1 tanpa manfaat yang dapat diuji. Fondasi aman yang diselesaikan di sini adalah rancangan arsitektur, model belajar, backlog dan acceptance criteria.

## Status repository setelah R.1.1

- HEAD: 7f0fcb3; branch lokal codex/revo-008-academic-delivery.
- main dan origin/main sama; remote GitHub adalah https://github.com/hoesnial/REVO-LAB.git.
- git status --short --branch menunjukkan branch tanpa perubahan lokal; working tree bersih.
- R.1.1 tercatat DONE, menunggu PM Visual Review. Industry 1.0 tetap satu-satunya era playable.
- Typecheck, lint, build, unit dan Playwright pada checkpoint R.1.1 dirangkum dalam [laporan R.1.1](REVO-008R1-1.md). Suite tersebut tidak dijalankan ulang untuk audit dokumentasi ini.

## Audit fitur I.1 dan aset yang dapat digunakan kembali

| Area | Implementasi yang ditemukan | Pemakaian yang disarankan untuk I.2 |
| --- | --- | --- |
| Navigasi dan era | RevoExperience/RevoLab memakai rute industry-1; ERAS menampilkan I.2–I.4 terkunci. Briefing, tujuan dan ilustrasi saat ini bertema uap. | Pertahankan pola menu/pemilihan era; tambahkan rute I.2 sendiri. Jangan mengubah rute I.1. Briefing memerlukan tujuan dan aset I.2. |
| Progres/simpan | RevoProgressProvider membaca revo:industry-1:progress. RevoProgress menetapkan selectedEra industry-1, checkpoint dan validasi ID komponen uap, migrasi serta dependensi tahap. | Buat tipe/reducer/validator/provider/key versi I.2 sendiri, misalnya revo:industry-2:progress. Reset/migrasi satu era tidak boleh mengubah era lain. |
| Orkestrasi gameplay | RevoLab mengelola Explore → Assembly → Experiment → Reflection, pause/modal/audio, penyimpanan dan mesin uap dalam satu komponen. Aturan tahap ada di assembly.ts dan experiment.ts. | Pertahankan urutan serta prinsip gating; implementasikan model tahap I.2 tersendiri. Jangan menambah kondisi I.2 ke reducer atau model eksperimen uap. Turunkan completion dari bukti tervalidasi, bukan tampilan/animasi. |
| Scene 3D | FactoryScene, SteamEngine, Boiler, TextileMachine, PowerTransmission dan AssemblyScene mengikat geometri/gerak pada mesin uap, pabrik tekstil dan ID komponen I.1. | Bangun scene I.2 yang ringan dan mandiri; jangan merender mesin uap sebagai mesin pusat atau memakai transformasinya. |
| Primitif 3D | ScenePrimitives menyediakan Block, Cylinder, Ring, Pipe, Rod dan Crate; SceneVector menyediakan tipe koordinat. FactoryEnvironment berisi detail spesifik pabrik uap/tekstil. | Primitif, pencahayaan dan pola kamera boleh dipakai jika sesuai. Buat lingkungan I.2 sendiri; jangan pakai ulang FactoryEnvironment secara keseluruhan. |
| Perakitan | AssemblyScene memakai ID/socket tetap, pointer capture, snap, tray inventory, proyeksi DOM dan fallback input tanpa physics kompleks. AssemblyPanel dan reducer memuat copy/soal uap. | Gunakan pola interaksi, bukan data/soal. Buat ID, reducer, target, feedback dan cek konsep I.2. Keberhasilan harus memerlukan pemahaman koneksi fungsi, bukan hanya bentuk/lokasi. |
| UI bersama | RevoDialog, RevoScreenHeader, pemilihan era, EraGridKeyboard, pola fokus, reduced motion dan token REVO bersifat lintas layar. | Pakai ulang yang memang generik setelah props diuji. QuizPanel, RevoLearningObjectives, RevoLevelCompleted dan MachineControlPanel mengikat copy/kontrak I.1; jangan dipakai mentah-mentah untuk I.2. |
| Audio | useRevoAudio dan preference mengikuti lifecycle mesin uap. | Gunakan prinsip opt-in, pause dan fallback visual. Efek listrik/konveyor bukan syarat untuk prototipe pertama. |

### Batas arsitektur yang harus dijaga

1. Rute/sesi harus membedakan industry-1 dan industry-2, tanpa dua Canvas aktif bersamaan.
2. Modul I.2 berada di namespace sendiri, misalnya src/lib/revo/industry-2/ dan src/components/revo/industry-2/. Jangan menaruh state I.2 dalam RevoLab, progress.ts, mekanika uap atau storage key I.1.
3. Penyimpanan I.2 memiliki key dan versi schema sendiri. Restore memvalidasi dependensi, mencabut state downstream yang tidak valid dan selalu memuat mesin berhenti.
4. Simpan ID yang dieksplorasi, koneksi yang diterima, cek yang benar, observasi dan jawaban. Completion dihitung dari bukti itu, bukan animasi.
5. Pause, menu, tab tersembunyi dan dialog menghentikan clock, produksi dan animasi. Reset I.2 hanya menghapus data I.2.
6. Hindari ekstraksi besar dari I.1 sebagai prasyarat. Bagikan gaya atau komponen generik tanpa menggabungkan state dan aturan kedua era.

## Pemeriksaan Visual — PM Visual Review

Sumbernya adalah screenshot final setelah/after di [indeks bukti R.1.1](revo-008r1-1-media/README.md), hasil build produksi yang diperbarui 3 November 2026. Tinjauan singkat mencakup menu desktop, eksplorasi/perakitan/eksperimen desktop, kuis ponsel 390px dan HUD kontrol 320px.

| Layar | Temuan |
| --- | --- |
| Menu 1440px | Hierarki judul, aksi utama dan diorama jelas. |
| Explore 1440px | Kartu fungsi dan status tahap terbaca; kontrol memiliki affordance jelas. |
| Assembly 1440px | Instruksi, cek konsep, inventaris/socket dan diorama terbaca. Outline pada judul di screenshot adalah fokus keyboard. |
| Experiment 1440px | Diorama dan kontrol utama terlihat. Panel lebih tinggi dari satu viewport dan menggunakan scroll internal sesuai dokumentasi; tidak tampak scroll dokumen. |
| Reflection 390px | Dialog dan jawaban terpilih muat; status pilihan eksplisit. Soal panjang memakai scroll internal. |
| HUD 320px | Kanvas masih terlihat; penanda 3D cukup rapat dan catatan HUD membungkus/scroll. Jalur daftar komponen dan kontrol DOM tersedia. Tidak terlihat clipping kritis pada bukti yang diperiksa; validasi perangkat fisik tetap diperlukan. |

Kesimpulan: tidak ada defect visual kritis yang perlu ditambal pada I.1. Jangan ubah I.1 hanya agar sama dengan era baru. Catat defect terpisah bila perangkat nyata menunjukkan tombol tertutup, isi tahap tak dapat dicapai, atau teks penting tertimpa.

## Status REVO-008R.2

Catatan formal di [REVO-008R.1](REVO-008R1.md) menyisakan **REVO-008R.2 — 3D Mechanical, Audiovisual & Asset Audit** dan menyebut pekerjaan tersebut menunggu PM review. Repository tidak memuat laporan R.2 atau bukti bahwa tugas selesai; status yang dapat dipertanggungjawabkan adalah **belum dimulai/selesai belum terverifikasi**.

| Bagian R.2 | Menghalangi I.2? | Alasan |
| --- | --- | --- |
| Akurasi geometri dan gerak mesin uap/transmisi I.1 | Tidak | I.2 membutuhkan rantai listrik → motor → transmisi → konveyor tersendiri. Audit tetap bermanfaat bagi pemeliharaan I.1. |
| Pemolesan animasi/feedback I.1 | Tidak | Simulasi I.2 dapat memakai state deterministik sendiri; animasi hanya memvisualkan state. Jangan menyalin persamaan uap. |
| Review aset/audio I.1 | Tidak | Aset I.2 akan memiliki identitas baru. Audio opsional dapat ditunda; review lintas produk perlu jika sistem audio bersama diubah. |
| Rute, lifecycle pause dan regresi I.1 | Bukan blokir desain; gerbang integrasi | I.2 tidak boleh merusak progres I.1. Tes regresi I.1 wajib pada integrasi. |
| Review guru atas sejarah, istilah dan tujuan I.2 | **Ya, untuk uji siswa** | Prototipe internal boleh dibangun sebagai draft. Guru perlu menyetujui konteks, fungsi, istilah dan interpretasi dampak sebelum siswa menggunakannya. |

R.2 dapat berjalan paralel atau sesudah I.2. Bila R.2 menemukan defect lintas sistem seperti pause tidak menghentikan audio bersama, perbaiki dan uji sebagai isu lintas era; tanpa temuan semacam itu tidak ada alasan menunda rancangan I.2.

## Rancangan pembelajaran Industry 2.0

### Cakupan dan kehati-hatian sejarah

Tema pusat: elektrifikasi mengubah penyediaan/distribusi tenaga pabrik; motor listrik mengubah energi listrik menjadi putaran; transmisi mekanis menggerakkan konveyor; urutan stasiun, pembagian tugas dan komponen yang dapat dipertukarkan mendukung produksi massal.

Unsur ini berkembang pada waktu berbeda dan tidak hadir serentak di semua pabrik. Smithsonian menghubungkan inovasi listrik sekitar 1900 dengan perubahan pabrik/kota dan kemungkinan lokasi usaha yang lebih luas. The Henry Ford menjelaskan motor listrik membebaskan tata letak mesin dari keterbatasan line shaft serta menempatkan percobaan jalur perakitan Ford pada 1913. National Park Service memberi contoh tekstil: motor listrik menggerakkan line shaft dan belt, lalu pada masa lebih kemudian pabrik beralih ke motor individual. Jadi, jangan mengajarkan “listrik langsung menciptakan conveyor/assembly line” atau menjadikan satu pabrik contoh universal.

Sumber awal untuk penulisan dan verifikasi guru:

- [Smithsonian, National Museum of American History — Generating Change](https://americanhistory.si.edu/explore/exhibitions/american-enterprise/online/corporate-era/generating-change): elektrifikasi pabrik/kota, motor dan fleksibilitas penempatan mesin.
- [The Henry Ford — Ingersoll Milling Machine and Mass Production at Highland Park](https://www.thehenryford.org/collections/explore/articles/detail/articles/2020/04/25/the-henry-ford-s-ingersoll-milling-machine-and-mass-production-at-highland-park): motor listrik, tata letak mesin dan produksi Highland Park.
- [The Henry Ford — K-12 Research Guide: Assembly Line](https://askus.thehenryford.org/K12/faq/433848): komponen yang dapat dipertukarkan, pembagian kerja, perpindahan bahan dan conveyor dalam kasus Ford.
- [National Park Service — Weave Room Frequently Asked Questions](https://home.nps.gov/articles/000/weave-room-frequently-asked-questions.htm): hubungan motor listrik, line shaft, belt dan alat tenun serta perubahan teknologi penggerak.

Sumber ini adalah titik awal, bukan pengganti pemeriksaan guru/kurator. Pilih kasus dan rentang waktu secara eksplisit. Hindari angka produktivitas dan kondisi kerja universal tanpa sumber dan konteks.

### Tujuan pembelajaran draf

Setelah level, siswa diharapkan mampu:

1. Menjelaskan perbedaan sumber/penyaluran listrik dan perubahan energi listrik menjadi gerak oleh motor.
2. Menelusuri dua hubungan berbeda: rangkaian listrik memasok motor; kopling/poros/belt menyalurkan gerak motor ke konveyor.
3. Menjelaskan bagaimana produk melewati stasiun kerja dan bagaimana pembagian tugas serta komponen standar mendukung produksi massal.
4. Menganalisis manfaat dan biaya sosial/lingkungan produksi massal: akses barang, ritme dan jenis kerja, keterampilan, serta sumber listrik.

Semua rumusan masih draf untuk validasi guru.

### Alur dan interaksi sebab-akibat

**Briefing → Explore → Assembly → Experiment → Reflection → Level Completed**

| Tahap | Aktivitas dan bukti belajar |
| --- | --- |
| Briefing | Perkenalkan tujuan, periode/kasus, batas model dan pertanyaan awal: “Apa yang berubah saat tenaga listrik dapat menggerakkan mesin dengan lebih fleksibel?” Mulai level tidak menghapus progres I.1. |
| Explore | Buka tiap komponen, baca fungsi, hubungan dan konteks. Tampilkan jalur energi listrik dan gerak mekanis sebagai dua hubungan berbeda. Eksplorasi menyimpan ID yang benar-benar dibuka. |
| Assembly | Sambung pasokan → sakelar/distribusi → motor sebagai jalur listrik. Sambung poros motor → kopling/puli/belt → konveyor sebagai jalur mekanis. Susun stasiun di sepanjang jalur produk. Snap ke socket tetap; drag opsional, inventaris/pilih socket/pasang wajib tersedia. Cek pengetahuan menguji konsep, bukan posisi. |
| Experiment | Jalankan hanya setelah siswa menekan Mulai. Buka rangkaian: motor dan konveyor berhenti. Sambungkan suplai: motor berputar. Putus transmisi: motor berputar tetapi belt tidak bergerak. Hubungkan kembali: produk bergerak antarestasiun. Putus daya: produksi berhenti. Bandingkan urutan kerja dan amati bottleneck. Unit output adalah skala model, bukan data sejarah. |
| Reflection | Uji pemahaman tentang listrik vs transmisi mekanis, hubungan sebab-akibat dan dampak sosial. Tanyakan siapa menerima manfaat/beban dan apa yang tak dapat disimpulkan dari output. Jawaban salah mendapat penjelasan dan kesempatan ulang. |
| Level Completed | Ringkas bukti eksplorasi, koneksi, eksperimen, refleksi dan skor. Nyatakan bahwa penyelesaian game menunjukkan partisipasi/jawaban, bukan otomatis membuktikan hasil belajar. Ulang I.2 tidak mengubah I.1. |

Kandidat komponen perakitan: sumber listrik/generator ilustratif, sakelar/panel distribusi, motor listrik, kopling/puli, belt/konveyor dan stasiun kerja. Jumlah/nama final menunggu guru. Motor menghasilkan gerak dari suplai listrik; konveyor bergerak melalui transmisi mekanis, bukan karena kabel listrik langsung menggerakkan produk. State konseptual tidak mengajarkan tegangan atau praktik kabel nyata. Status listrik, motor, sambungan, posisi produk dan bottleneck menentukan progres; animasi tidak pernah memberikan completion. Pause, reduced motion, teks dan ikon harus menjelaskan state yang sama.

## Backlog REVO-009B

| ID / prioritas | Pekerjaan | Kriteria penerimaan |
| --- | --- | --- |
| B0 — konten | Tetapkan kasus/rentang waktu; minta guru meninjau tujuan, istilah, urutan energi, komponen, soal dan dampak. Catat sumber klaim. | Setiap klaim dapat ditinjau; copy membedakan sejarah dan abstraksi. Klaim tanpa sumber ditandai atau dihapus; status validasi nyata, tidak direkayasa. |
| B1 — rute/state | Tambah rute I.2 serta model tahap, reducer, validator, provider, storage key/schema sendiri. | Progres I.1 identik sebelum/sesudah navigasi. Simpan, reload, retry dan reset I.2 hanya menyentuh I.2. Rute I.2 tidak merender simulasi termodinamika I.1. State invalid tidak membuka tahap lanjutan. |
| B2 — briefing/explore | Tambah tujuan dan model eksplorasi I.2 dengan daftar kontrol aksesibel. | Setiap komponen dapat dipilih lewat pointer/keyboard/touch; penjelasan berisi fungsi, hubungan dan konteks. Explore selesai hanya setelah semua ID wajib dibuka. |
| B3 — assembly | Bangun scene socket tetap, jalur listrik/mekanis, inventory, snap, ghost/feedback, fallback keyboard dan cek konsep. | Salah/duplikat ditolak; hanya koneksi reducer dihitung; seluruh puzzle dapat selesai tanpa drag; cek salah dapat diulang dan cek benar menjelaskan sebabnya. |
| B4 — experiment | Buat model deterministik sumber, sakelar, motor, transmisi, konveyor, stasiun dan observasi. | Sakelar terbuka menghentikan motor; transmisi putus memisahkan motor dan konveyor; output berhenti pada daya mati/bottleneck; pause/dialog/menu/tab tersembunyi/reload menghentikan simulasi. Skala output dilabeli; eksperimen butuh observasi nyata. |
| B5 — reflection/completion | Buat pertanyaan transfer konsep/dampak dan ringkasan berbasis bukti. | Penilaian dari jawaban, bukan timer/animasi. Salah diberi feedback/retry. Skor bukan satu-satunya bukti. Reset I.2 tidak mengubah I.1. Tidak ada klaim hasil kelas. |
| B6 — a11y/visual/integrasi | Terapkan identitas REVO, panel ringkas, modal/pause/reduced motion, audio fallback dan regresi lintas era. | Tidak ada document scroll/overflow horizontal pada target viewport; panel panjang bergulir internal; fokus/keyboard/touch mencapai semua aksi; tanpa WebGL materi tetap dapat dipelajari. Gerbang uji di bawah lulus. |

## Test plan dan gerbang siap uji sekolah

### Test plan implementasi

- **Unit/domain:** state awal, ID, urutan/gating, socket salah/duplikat, cek benar/salah/retry, simulasi switch/motor/conveyor, bottleneck dan output berhenti.
- **Simpan/migrasi:** schema malformed/unknown/future, restore tiap tahap, revoke dependency, reset I.2 serta interaksi storage I.1/I.2 yang terpisah.
- **Playwright perjalanan:** Briefing → Explore → Assembly → Experiment → Reflection → Completed; setiap tahap terkunci sebelum prerequisite; refresh/resume dan semua reset.
- **3D/input:** hotspot/kamera, valid-invalid socket, snap, duplicate, keyboard inventory/socket/confirm, touch, fallback WebGL; progres tidak bergantung animation frame.
- **Sebab-akibat:** switch mati/hidup, motor tanpa kopling, kopling tersambung, produk/stasiun, macet, pause/modal/menu/hidden tab/reload; tak ada output saat clock/suplai berhenti.
- **Regresi I.1:** unit dan subset E2E progress, assembly, simulation, navigation, pause dan save; semua ekspektasi I.1 dipertahankan. Jalankan suite penuh pada candidate sebelum uji sekolah.
- **Visual/responsif:** 1920×1080, 1440×900, 1366×768, 1280×720, 390×844, 320×568 serta landscape pendek. Periksa seluruh enam layar I.2. Lakukan uji perangkat fisik/lab SMAN 16 Bandung.
- **Aksesibilitas/perangkat:** keyboard, reduced motion, label/status pembaca layar, audio opt-in/transkrip, tanpa WebGL, touch, fokus modal/pause; jangan mengklaim conformance dari warna saja.
- **Release candidate:** typecheck, lint, production build, unit, Playwright lintas era, console/page error, setup lokal dan demo berlabel fixture QA.

### Siap untuk uji langsung siswa hanya jika

1. Guru menyetujui kasus/periode, tujuan, istilah, konten, soal dan kesimpulan sosial; bahan uji menandai lingkup yang sudah divalidasi.
2. B1–B6 lulus tanpa menghapus atau melemahkan assertion I.1.
3. Pemisahan progres terverifikasi pada reload, pindah era, retry dan reset.
4. Tidak ada tahap dapat dilewati, kehilangan data, bug penghambat atau completion berbasis animasi saja.
5. Guru meninjau build/copy final; sekolah menyetujui jadwal, perangkat, prosedur uji dan pengumpulan data.
6. Fallback browser/WebGL/audio, setup dan demo diverifikasi pada perangkat target. Feedback siswa hanya dilaporkan setelah benar-benar dikumpulkan.

## Berkas dan pengujian audit ini

- Dibuat: docs/REVO-009A.md.
- Diperbarui: README.md dan docs/REVO-LAB.md untuk menautkan laporan ini.
- Kode aplikasi tidak diubah. Tidak ada gameplay placeholder yang dinyatakan selesai.
- Screenshot ditinjau: after/1440-menu.png, 1440-exploration.png, 1440-assembly.png, 1440-experiment.png, 390-quiz-selected.png dan 320-controls.png.
- Tes aplikasi/typecheck/build tidak dijalankan ulang karena audit ini hanya mengubah dokumentasi. Pemeriksaan yang benar-benar dijalankan: git diff --check (lulus) dan git status (menunjukkan hanya tiga berkas dokumentasi tersebut berubah).

## Keputusan REVO-009B

**GO bersyarat.** Buat prototipe I.2 pada modul, rute dan state yang terpisah dari I.1 serta ikuti B0–B6. B0 dapat berjalan bersama prototipe internal sebagai gerbang konten; validasi guru wajib selesai sebelum uji siswa. Jangan memulai refactor besar I.1. Jangan menyebut I.2 siap diuji di SMAN 16 Bandung sebelum seluruh gerbang siap uji sekolah terpenuhi.
