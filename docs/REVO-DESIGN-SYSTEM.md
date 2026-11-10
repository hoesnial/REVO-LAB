# REVO — Sistem Desain Kanonis

Berlaku lintas era. Landasan implementasi adalah token semantik di `src/app/revo-lab/ui-refinements.css`, diperluas oleh `design-system.css`; `cross-era.css` mengatur navigasi bersama. Tidak ada dependensi UI baru. Era mendatang menggunakan komponen ini tanpa menyiratkan bahwa Industri 3.0/4.0 sudah tersedia.

## Tipografi dan ruang

| Peran | Token / aturan |
| --- | --- |
| Judul | Manrope, 800; `--revo-type-title` 24–40 px; tracking −.045em |
| Subjudul / nama komponen | Manrope; `--revo-type-heading` 20–26 px, leading 1.2 |
| Penjelasan belajar | DM Sans; `--revo-type-body` 16 px desktop, 15 px compact; leading 1.55 |
| Label | 13 px, 600–700; angka status tebal |
| Caption | 12 px; teks tahap ringkas boleh 9–11 px pada 320 px, tidak untuk materi inti |
| Spasi | 4, 8, 12, 16, 24 px; inset panel responsif 16–28 px |
| Bentuk | Kontrol 6 px; panel 10 px; nomor komponen lingkaran |

Judul editorial Main Menu/Briefing boleh lebih besar sesuai ruang. Hierarki semantik mengikuti layar: judul halaman h1, panel h2, informasi di dalam panel h3. Skala visual nama komponen tetap sama. Area dokumen setinggi viewport; panel belajar dapat menggulir internal. Jangan memampatkan semua ukuran untuk ponsel.

## Warna dan keadaan

| Semantik | Token yang ada | Pemakaian |
| --- | --- | --- |
| Latar | `--revo-background` | Krim #f6f6f0 |
| Permukaan gelap / terangkat | `--revo-surface`, `--revo-surface-elevated` | Hijau industri #26382e / #34473b |
| Kartu terang / bidang halus | `--revo-surface-paper`, `--revo-surface-subtle` | #fffdf2 / #e9ede2 |
| Teks terang / sekunder | `--revo-text-primary`, `--revo-text-secondary` | #fffdf2 / #d8e2cf di bidang gelap |
| Teks pada krim | `--revo-text-ink`, `--revo-text-muted` | #29372c / #4b5945 |
| Navigasi utama | `--revo-action-primary` + hover | Kuning; masuk / berpindah layar |
| Kemajuan belajar | `--revo-action-learning` + hover | Hijau; hubungkan, periksa, catat |
| Sekunder | `--revo-action-secondary` + hover | Netral; kembali, hentikan, tinjau |
| Informasi | `--revo-info` → `--revo-action-water` | Biru; jangan disamakan dengan transmisi mekanis |
| Berhasil | `--revo-state-success` + border | Teks, ikon centang dan penjelasan |
| Peringatan | `--revo-state-warning` + text | Kuning pucat, konsekuensi dijelaskan |
| Salah / berbahaya | `--revo-state-error`, `--revo-action-danger` | Merah redup, tetap dapat diperbaiki |
| Dipilih | `--revo-selection-background` | Hijau; `aria-pressed` atau checked |
| Nonaktif | `--revo-disabled-background`, `--revo-disabled-text` | Kontras terbaca, border putus, native disabled |
| Fokus | `--revo-focus-on-light`, `--revo-border-focus` | Outline 3 px cokelat pada terang; kuning pada gelap |

Hover memberi perubahan permukaan; active meredup sebentar. Makna benar/salah, status dan progres wajib berupa teks dan/atau ikon selain warna. Warna bahan bakar dan air Industri 1.0 tetap amber dan biru. Jalur diorama 2.0: biru listrik, cokelat mekanis, hijau material; legenda teks tetap tersedia.

## Komponen kanonis

- **Navigasi:** `RevoScreenHeader` memakai varian laboratorium yang sama di kedua era: merek, konteks era, Pilih Era, Menu, Tujuan Pembelajaran, lalu aksi khusus era. Di ponsel, tombol ikon tetap 44 × 44 px dengan nama aksesibel. Rel tahap dan `RevoStageBadge` berbagi tipografi, jarak, garis kuning untuk tahap aktif, centang untuk selesai, serta label atau ikon untuk tahap terkunci/belum tersedia. HUD 1.0 tetap memakai tab dengan tombol panah; route 2.0 tetap memakai tautan.
- **Informasi komponen:** `RevoComponentInfo`. Urutan nomor → kategori → nama → fungsi → Peran Dalam Mesin. Host tidak menggandakan materi. Industri 1.0 mempertahankan Tutup dan Berikutnya; Industri 2.0 menawarkan Kembali ke Daftar serta Fokus ke Komponen, dengan inspeksi tetap tersimpan.
- **Tujuan:** `RevoLearningObjectives`, dipakai briefing dan dialog kedua era. Kartu hijau, kata kerja menonjol, teks 15–16 px.
- **Jawaban:** `RevoAnswerFace` dan `.revo-answer-card`, native radio/button. Dipilih belum diperiksa, benar, salah, dan nonaktif mempunyai teks keadaan. Evaluasi tetap dimiliki aturan tiap era.
- **Dialog:** `RevoDialog`; fokus masuk/terkurung/dipulihkan, Escape, judul aksesibel, badan bergulir. Membuka tujuan/reset menghentikan percobaan.
- **Eksperimen:** status mesin terpisah dari sakelar, penjelasan sebab-akibat dan bukti. Baris status berupa satu bidang; pada compact menjadi tiga kolom dalam dua baris. Aksi Mulai/Henti, Catat, Reset tetap di bawah panel.
- **Progress:** native progress dengan nama aksesibel dan jumlah dalam teks. Animasi bukan sumber penyelesaian.
- **Kamera:** tempatkan kontrol dekat tepi kanan bawah area diorama, terpisah dari konten informasi. Pada layar sempit dengan inspector terbuka, kontrol uap memiliki baris sendiri di luar kanvas. Industri 2.0 memakai `ElectricCameraControls` dengan native select (overview / motor / transmisi / konveyor / stasiun) dan reset. Kamera uap tetap memakai zoom, reset, dan perluas. Penjelasan dan daftar tetap berfungsi tanpa WebGL.
- **Tooltip:** title hanya pelengkap; kontrol ikon memiliki aria-label. Jangan menyimpan instruksi wajib hanya dalam tooltip.

## Aturan responsif laboratorium

| Area | Layar lebar | Ponsel (≤720 px) |
| --- | --- | --- |
| Diorama | Kolom utama, dengan kendali kamera di tepinya | Area tersendiri di atas panel belajar; inspector tidak memakai ruang kanvas sebagai overlay |
| Informasi | Kartu mengambang 1.0 tetap di kolom adegan; 2.0 memakai panel kanan | Informasi 1.0 berpindah ke dock di bawah diorama dan pemilih komponen. Inspector 2.0 juga berada di bawah adegan |
| Sidebar | Progres, materi, dan kontrol mengisi kolom samping | Saat kartu uap terbuka, informasi tampil lebih dulu dan progres/kendali tetap bisa dicapai dengan menggulir dock yang sama |
| Gulir | Sidebar dan kartu panjang boleh menggulir internal | Hanya panel dan daftar komponen yang menggulir; hindari tinggi tetap pada teks, potongan permanen, dan gulir dokumen |
| Fokus | Aksi di dalam kartu menggunakan outline yang jelas | Pemilihan komponen memindahkan fokus ke panel baca. Tutup/Escape 1.0 mengembalikan fokus ke tombol pembuka di daftar; Kembali/Escape 2.0 kembali ke daftar tanpa menghapus pilihan |

Pada 320 px, pertahankan ukuran teks pembelajaran 15 px dan kontrol utama 44 × 44 px. Nomor tahap yang belum aktif/selesai dapat disembunyikan agar keempat nama tahap tetap muat. Penanda komponen dan kontrol kamera tidak boleh tertutup inspector. Jaga posisi gulir dalam panel ketika mengganti konten: penjelasan komponen berikutnya dimulai dari atas.

## Adegan dan aksesibilitas

Model diorama tetap stilistis: bahan berroughness sedang, hijau cat/metal, kuningan untuk mekanisme dan krim untuk bangunan. Satu shadow light; tanpa tekstur eksternal atau efek pascaproses. Detail memperjelas dudukan dan hubungan mekanis. Kamera overview harus memperlihatkan mesin dan lantai; kamera detail boleh memotong bangunan untuk inspeksi. Reset selalu mengembalikan overview.

Jaga alternatif daftar/keyboard/sentuh, SVG saat WebGL gagal, reduced motion, dan stop ketika tab tersembunyi. Jangan menghapus mekanika karena penyederhanaan visual. Uji viewport 1920×1080, 1440×900, 1366×768, 1280×720, 390×844, 320×568. Audit ini bukan sertifikasi WCAG atau pengujian perangkat sekolah.
