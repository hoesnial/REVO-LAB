# Checklist kesiapan review dan serah terima

Tanggal: 1 November 2026. Acuan kode `a4c135d`; dokumentasi REVO-008 di atas basis yang sama. **Paket siap diajukan untuk review; penggunaan kelas dan rilis produksi masih memerlukan keputusan yang tercatat.** Tidak ada deployment produksi pada tugas ini.

Status: **terverifikasi** = diperiksa langsung pada checkpoint ini; **tersedia di kode** = hasil inspeksi, bukan uji perangkat baru; **menunggu** = membutuhkan tindakan/keputusan; **di luar cakupan** = tidak disediakan. Kotak kosong sengaja tidak menyiratkan persetujuan.

## Kesiapan pendidikan dan persetujuan

| Item | Status saat serah terima | Pemilik / bukti yang diperlukan |
| --- | --- | --- |
| Alur Industry 1.0 dan batas era 2–4 | Terverifikasi melalui inspeksi sumber | [Overview](01-project-overview.md) dan file sumber tertaut |
| Ketertelusuran lima LO | Draf tersedia | Guru mengesahkan CP/TP, tingkat kelas, dan kriteria bukti pada [matriks](02-learning-outcomes.md) |
| Audit H01–H13 | Temuan tersedia; belum ada persetujuan revisi | Guru/ahli mengisi keputusan; prioritas H02/H05/H12 dijelaskan sebelum demo/uji |
| Angket guru, siswa, pre/post dan observasi | Draf tersedia, belum tervalidasi | Ahli materi/instrumen, pilot bahasa dan prosedur |
| Kelayakan uji siswa | Menunggu | Keputusan guru/sekolah/universitas, prosedur data dan dokumentasi |
| Klaim efektivitas belajar | Belum dapat dibuat | Data nyata dan rancangan evaluasi; tidak menggunakan fixture demo sebagai data siswa |
| Persetujuan PM | Menunggu | Review paket, daftar revisi dan penanggung jawab |

## Instalasi dan kebutuhan produksi

Manual utama: [README](../../README.md) dan [REVO-LAB](../REVO-LAB.md). Instalasi dari lockfile dengan `npm ci` direkomendasikan untuk reproduksi rilis; README tetap menyediakan `npm install` untuk penggunaan lokal biasa. Pada checkpoint ini `npm ci`, build dan preview lokal berhasil.

| Aspek | Temuan | Tindakan sebelum rilis |
| --- | --- | --- |
| Runtime | README mensyaratkan Node.js ≥22.12; verifikasi ini memakai Node.js 24.21.0 dan npm 11.19.0 | Gunakan versi yang didukung proyek/penyedia dan simpan versi dalam catatan rilis |
| Model hosting | Next.js App Router; ada route fallback dinamis; belum dikonfigurasi sebagai static export | Sediakan runtime Node/hosting kompatibel Next.js. Jangan mengasumsikan unggah folder HTML ke hosting statis cukup |
| Perintah | `npm run build`, lalu `npm run start`; server bawaan terikat `127.0.0.1` | Untuk container/server yang perlu menerima koneksi jaringan internal, konfigurasi bind/port melalui perintah platform, misalnya `./node_modules/.bin/next start --hostname 0.0.0.0 --port 3000`, di balik HTTPS/proxy yang disiapkan operator |
| Variabel lingkungan | Tidak ada `.env`/API key/database/login yang diwajibkan REVO | Jangan menambahkan kredensial untuk menjalankan aplikasi. `REVO_BASE_URL` adalah alamat target tes, bukan setting gameplay |
| Aset | Geometri dibuat kode; preview dan font dibundel lokal | Pastikan aset/font tersedia setelah build. Tautan referensi eksternal memerlukan internet saat dibuka |
| HTTPS dan alamat demo | Demo lokal dapat berjalan di loopback; URL produksi belum ditetapkan | Tetapkan domain, HTTPS, kebijakan jaringan, dan periksa suara/storage pada origin produksi sebelum acara |
| Header | Konfigurasi menyediakan nosniff, frame DENY, referrer same-origin | Bila perlu embed dalam LMS/iframe, kebijakan DENY akan menghalangi; belum ada integrasi LMS yang disetujui |
| Dependensi | Audit seluruh paket menemukan **16 paket terdampak tingkat sedang** pada rantai ESLint/minimatch; audit `--omit=dev` menemukan **0** | Tinjau advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) dan pilihan pembaruan toolchain dalam pekerjaan terpisah. Tidak melakukan `audit fix --force` pada checkpoint dokumentasi |
| Offline | Tidak ada service worker/PWA atau paket offline khusus | Jangan menjanjikan aplikasi dapat dimulai tanpa server/jaringan. Untuk demo tanpa internet gunakan server lokal yang telah dibangun dan uji perangkat |
| Kapasitas/performa | Tidak ada load test atau pengukuran frame rate perangkat kelas pada REVO-008 | Uji laptop/proyektor dan sampel perangkat siswa yang sebenarnya |
| Hak distribusi | Tidak ditemukan berkas LICENSE proyek pada root saat audit; paket font/dependensi mempunyai ketentuan sendiri | Pemilik menentukan hak distribusi/atribusi sebelum publikasi akademik atau penggunaan aset pihak ketiga |

## Browser, akses dan fallback

Dokumentasi Next yang terpasang menyebut baseline Chrome/Edge 111+, Firefox 111+, Safari 16.4+. Itu baseline framework, **bukan jaminan seluruh WebGL, Web Audio, sintesis suara dan drag REVO pada versi tersebut**. Pengujian media checkpoint ini menggunakan Chrome lokal dan render SwiftShader sesuai konfigurasi tes; bukan pengukuran GPU asli atau uji lintas browser.

| Jalur | Dukungan yang tersedia | Verifikasi yang masih diperlukan |
| --- | --- | --- |
| Chrome desktop | Skenario media berhasil pada production preview; tidak ada pageerror/console error yang ditangkap skenario | Uji proyektor, GPU asli, audio speaker dan kondisi kelas |
| Edge/Firefox desktop | Sasaran kompatibilitas; API browser diperlukan | Smoke test alur/pause/storage/WebGL di versi yang akan digunakan |
| Safari macOS/iOS | Sasaran kompatibilitas, belum diverifikasi pada checkpoint ini | Uji gesture audio, voice Indonesia, touch, viewport pendek dan penyimpanan |
| Android/mobile | Screenshot dan layout 390×844 diperiksa dalam browser desktop | Perangkat sentuh fisik, kinerja, dan keterjangkauan panel yang menggulir internal |
| Audio | Opt-in, Web Audio prosedural; narasi hanya jika SpeechSynthesis dan voice Indonesia tersedia; transkrip selalu ada | Jangan menganggap preferensi tersimpan otomatis mengizinkan autoplay. Narasi/efek adalah subsistem berbeda; uji keduanya |
| Tanpa WebGL/context hilang | Fallback status dari Canvas/error boundary; komponen dan panel kontrol di luar Canvas tetap tersedia | Uji penyelesaian melalui inventaris, pilihan sambungan dan tombol pada perangkat target; gambar/video untuk mengganti ilustrasi gerak |
| Keyboard/reduced motion | Kontrol alternatif, label, fokus, dialog, preferensi reduced motion tersedia di kode | Review dengan pengguna sasaran; tidak menyebut sertifikasi WCAG tanpa audit tersendiri |

Tidak perlu mengubah setting keamanan browser untuk menjalankan demo. Gunakan panel fallback atau perangkat lain jika grafis tidak tersedia. Flag SwiftShader hanya bagian lingkungan tes otomatis, bukan petunjuk instalasi untuk siswa.

## Progres dan hasil

- Penyimpanan `localStorage`, key `revo:industry-1:progress`, schema 1; terikat origin, profil browser dan perangkat. Data dapat hilang karena clear storage, mode privat, kebijakan browser, perubahan origin, atau konfirmasi Ulangi Level.
- Jika storage tidak tersedia, permainan masih dapat berjalan pada sesi aktif. Tidak ada backup akun, ekspor, sinkronisasi, arsip nilai kelas, atau proteksi dari modifikasi data oleh pengguna perangkat.
- Eksplorasi, pemasangan/cek perakitan, status misi selesai, refleksi/checkpoint dan preferensi suara dipulihkan setelah validasi. Eksperimen yang belum selesai kembali ke kondisi awal yang aman dan berhenti; pengisian tidak dilanjutkan otomatis.
- Mesin selesai dipulihkan sebagai status selesai dengan mesin berhenti; bukan rekaman rinci kondisi percobaan. Hasil refleksi adalah percobaan lengkap terbaru, bukan histori seluruh percobaan.
- Reset mesin mempertahankan progres/riwayat keselamatan misi. Ulangi misi mengulang eksperimen sambil mempertahankan eksplorasi dan perakitan. Ulangi perakitan mempertahankan eksplorasi, tetapi membatalkan hasil eksperimen/refleksi yang bergantung pada assembly jika hasil tersebut sudah selesai. Ulangi Level menghapus perjalanan setelah konfirmasi.

Guru mencatat bukti asesmen secara terpisah sesuai instrumen. Jangan memakai localStorage sebagai sistem nilai resmi.

## Verifikasi pada REVO-008

| Pemeriksaan | Hasil yang benar-benar dieksekusi |
| --- | --- |
| Pembacaan source dan dokumen | Alur, gerbang tahap, enam soal, simpulan, simulasi, progres, audio/fallback, konfigurasi dan tes terkait ditinjau |
| Instalasi lockfile | `npm ci` selesai; 16 temuan sedang dilaporkan; lockfile tidak diubah |
| Production build | `npm run build` **lulus** pada Next.js 16.4.3. Ada warning workspace config di direktori pengguna di luar repo diabaikan; build tetap selesai tanpa mengubah konfigurasi |
| Playwright terbatas | **1 skenario pengambilan media lulus** (40,5 detik total), `tests/revo-polish.e2e.spec.ts --grep 'captures REVO-007'`; preview lokal port 3002; skenario memeriksa array pageerror/console error kosong |
| Artefak | Delapan PNG dan satu WebM disalin ke [media](media/); provenance dan hash di [manifest](media/manifest.json); beberapa state memakai fixture, sesuai [register demo](05-demo-script.md#register-media) |
| Audit dependensi penuh | 16 paket terdampak sedang, 0 tinggi/kritis; terkait rantai alat pengembangan, bukan 16 advisory independen |
| Audit dependensi produksi | `npm audit --omit=dev` **0 kerentanan** pada saat pemeriksaan; bukan jaminan permanen |
| Typecheck/lint/unit/full E2E terpisah | **Tidak dijalankan ulang** pada checkpoint dokumentasi. Build menjalankan pemeriksaan TypeScript internal, tetapi tidak dilaporkan sebagai eksekusi script `typecheck` tersendiri |
| Tautan lokal, manifest, batas perubahan | Diperiksa sebelum serah terima; kode gameplay, konfigurasi, dan lockfile harus tetap identik dengan basis audit |

Laporan percakapan pemisahan repo pada 26 Oktober 2026 mencatat typecheck/lint/build, 69 unit dan 38 E2E lulus. Itu **hasil sebelumnya**, bukan eksekusi REVO-008 dan bukan hasil validasi pendidikan. Paket ini tidak mengulang seluruh QA karena tidak mengubah gameplay.

## Checklist sebelum presentasi dan keputusan rilis

- [ ] PM membaca tujuh dokumen dan menerima daftar batas klaim.
- [ ] Guru mengonfirmasi CP/TP dan keputusan H01–H13; setiap revisi materi dicatat pada tugas terpisah.
- [ ] Instrumen disetujui untuk pilot; prosedur siswa/data mengikuti aturan institusi.
- [ ] Pembaruan/penanganan risiko toolchain ditinjau oleh penanggung jawab teknis.
- [ ] Laptop, proyektor, perangkat target dan backup media diperiksa pada lokasi acara.
- [ ] Profile demo/progres disiapkan; presenter dapat membedakan progres asli dan fixture.
- [ ] Rekaman WebM dapat diputar pada perangkat presentasi; tidak mengandalkan audio rekaman.
- [ ] Kebutuhan domain/hosting/HTTPS diputuskan jika rilis produksi diminta terpisah.
- [ ] Setelah perubahan kode atau konfigurasi berikutnya, jalankan kembali tes sesuai area yang berubah sebelum rilis.

Persetujuan: PM ______ tanggal ______; guru materi ______ tanggal ______; penanggung jawab teknis ______ tanggal ______; keputusan uji/presentasi/produksi ______; syarat yang tersisa ______.

REVO-008 berhenti pada serah terima paket dan menunggu review PM. Tidak mengerjakan era baru, revisi mekanik, upgrade dependensi, pengumpulan hasil kelas, atau deployment produksi.
