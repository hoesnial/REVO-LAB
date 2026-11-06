# Skenario demonstrasi dan aset presentasi

Acuan kode `a4c135d`; paket REVO-008, 1 November 2026. Gunakan [petunjuk lokal](../../README.md#run-locally) dan [checklist prademo](07-release-checklist.md). Durasi berikut adalah perkiraan, bukan waktu penyelesaian rata-rata siswa.

## Persiapan presenter

- Sediakan browser/profil demo tersendiri agar progres pribadi atau siswa tidak tertimpa. Penyimpanan terikat origin (skema/host/port); pindah dari localhost/port lain dapat terlihat seperti progres hilang.
- Siapkan proyektor, mouse/keyboard, dan teks sebagai jalur utama; audio dapat diaktifkan setelah klik. Gunakan transkrip bila suara Indonesia tidak tersedia.
- Siapkan kondisi baru untuk demo alur asli. Untuk presentasi singkat, kondisi lanjut harus sudah diperoleh lewat permainan atau dinyatakan sebagai **fixture demonstrasi**, bukan progres siswa.
- Jangan mengedit localStorage di tengah presentasi lalu menyebut hasilnya sebagai penyelesaian tanpa bantuan. Rekaman otomatis di bawah memakai fixture dan tidak membuktikan capaian peserta didik.

## Run of show: sekitar 8–12 menit

| Waktu usulan | Tindakan presenter | Narasi / pertanyaan belajar | Bukti yang ditunjukkan |
| --- | --- | --- | --- |
| 0:00–0:45 | Buka menu; Mulai Jelajah; tampilkan empat kartu era | “Yang dapat dimainkan saat ini adalah Industry 1.0. Era lainnya masih dikembangkan.” | Tombol tersedia vs Dalam Pengembangan |
| 0:45–1:30 | Masuk briefing dan sebut tujuan/misi | “Kita menghubungkan komponen, tenaga, produksi, dan dampaknya. Angka game adalah skala pembelajaran.” | Tujuan, 100 unit, tekanan ≤75, disclaimer |
| 1:30–2:45 | Buka lima komponen; putar/fokus kamera seperlunya; buka konteks sejarah/transmisi | “Apa yang menghasilkan uap? Apa yang hanya menyalurkan? Apa perbedaan engkol dan roda gila?” | Hitungan unik 5/5 dan informasi fungsi; bagian Transmisi Tenaga |
| 2:45–5:00 | Buka Perakitan. Peragakan satu target salah, baca feedback, lalu pasang benar. Tunjukkan drag dan alternatif inventaris–sambungan–Pasang komponen. Lengkapi lima bagian dan tiga cek konsep | “Kecocokan posisi adalah alat bantu. Alasan mekanisnya yang harus dijelaskan.” | Penolakan tanpa hukuman permanen; fungsi/hubungan; energi kuning setelah selesai |
| 5:00–7:00 | UJI MESIN; tunjukkan mesin masih berhenti; klik Nyalakan mesin; amati indikator. Peragakan pause/bantuan dan lanjutkan. Biarkan berjalan sampai target bila waktu cukup | “Prediksikan apa yang berubah ketika pasokan bahan bakar diubah. Apakah hasil di layar membenarkan alasan kita?” | Kontrol sumber daya, indikator dan produksi, jeda; **jangan sengaja mengubah bahan bakar hanya demi efek visual bila ingin mempertahankan percobaan aman** |
| 7:00–9:00 | Setelah misi berhasil, buka Refleksi; jawab tiga soal dan baca penjelasan, termasuk satu contoh salah bila diperlukan | “Apakah produksi lebih banyak selalu membuat semua orang sejahtera? Air tetap diperlukan atau tidak?” | Umpan balik dan skor x/3 |
| 9:00–10:00 | Tutup evaluasi untuk melihat Level Completed; tunjukkan hasil, tinjau refleksi, kembali ke menu lalu reload pada profil demo | “Selesai level adalah selesai rangkaian kegiatan. Penguasaan sejarah dinilai lagi dari alasan siswa dan tes luar game.” | Ringkasan, hasil tersimpan, menu Lanjutkan/Lihat Hasil |

Jika simulasi belum mencapai 100 unit dalam jendela presentasi, lanjutkan menampilkan rekaman hasil yang telah ditandai sebagai fixture. Jangan menyatakan demonstrasi langsung berhasil jika belum. Dapat pula membagi demo menjadi bagian awal dan kondisi lanjut yang disiapkan sebelumnya, dengan penjelasan terbuka.

## Penanganan gangguan saat demo

| Kondisi | Respons |
| --- | --- |
| Tidak ada suara/narasi | Pastikan opt-in; bila tetap tidak tersedia, baca transkrip. Hindari menghabiskan waktu mencari suara OS saat presentasi |
| WebGL gagal atau perangkat lambat | Gunakan panel komponen/perakitan dan kontrol teks. Untuk ilustrasi gerak, tampilkan rekaman/gambar. Katakan bahwa tampilan 3D sedang tidak tersedia |
| Tekanan melampaui 75 | Jelaskan bahwa percobaan aman perlu diulang melalui **Ulangi misi**, bukan menghapus seluruh level; mencapai 90 menghentikan mesin darurat |
| Progres tampak tidak ada | Periksa origin dan profil browser. Jika penyimpanan diblokir, lanjutkan sesi atau gunakan backup; jangan mengklaim ada sinkronisasi akun |
| Waktu habis | Gunakan tiga gambar: perakitan, HUD, hasil. Sebutkan dengan jelas bagian yang tidak didemokan langsung |

## Register media

### Aset yang sudah ada di repository

[factory-preview.png](../../public/revo/factory-preview.png) adalah ilustrasi pratinjau pabrik yang dipakai menu/briefing, **bukan screenshot capaian siswa**. Aset ini dapat dipakai untuk sampul dengan keterangan “Diorama REVO — model edukasi”.

### Cuplikan yang diregenerasi untuk REVO-008

Rekaman/screenshot lama dari REVO-007 tidak ditemukan pada checkout baru maupun lokasi artefak lama yang diperiksa. Satu tes pengambilan media REVO-007 yang sudah tersedia dijalankan ulang pada kode audit; hasilnya disalin ke folder `media/` paket ini agar tidak bergantung pada `test-results/` yang diabaikan Git.

| Berkas | Isi dan asal state | Penggunaan yang tepat |
| --- | --- | --- |
| [Menu desktop](media/main-menu-desktop.png) | Menu sesi browser baru; tidak memakai hasil siswa | Pembukaan konsep/navigasi |
| [Menu mobile](media/main-menu-mobile.png) | Menu yang sama, viewport 390×844 | Contoh tampilan ringkas, bukan bukti semua ponsel kompatibel |
| [Target perakitan salah](media/assembly-feedback-wrong-target.png) | Fixture awal: eksplorasi selesai, tiga bagian dan satu cek; mesin tekstil sengaja ditargetkan ke piston | Menjelaskan feedback dan alasan hubungan |
| [Perakitan selesai](media/assembly-feedback-correct-snap.png) | Dilanjutkan melalui interaksi panel nyata dari fixture; lima bagian dan tiga cek selesai | Aliran energi serta gerbang UJI MESIN |
| [HUD desktop](media/gameplay-hud-desktop.png) | Mesin benar-benar dinyalakan setelah assembly, diambil setelah produksi mulai | Kontrol dan keterkaitan indikator; bukan misi 100 unit penuh |
| [HUD mobile](media/gameplay-hud-mobile.png) | Sesi eksperimen yang sama pada 390×844 | Keterjangkauan panel ringkas |
| [Hasil desktop](media/level-completed-desktop.png) | Fixture kedua: misi selesai dan jawaban `[1,0,2]` (3/3), bukan hasil eksperimen langsung sampai target | Susunan ringkasan hasil; labeli “data demonstrasi” |
| [Hasil mobile](media/level-completed-mobile.png) | Hasil fixture yang sama pada 390×844 | Layout hasil ringkas |
| [Video demo interaktif](media/revo-007-interactive-demo.webm) | Rekaman browser otomatis dari rangkaian di atas; ada perpindahan melalui fixture/reload | Backup visual singkat; **bukan** rekaman satu perjalanan utuh, narasi pengajar, atau validasi siswa |

Video browser tidak menyertakan jaminan audio desktop; presentasikan sebagai video visual dan gunakan penjelasan presenter/transkrip. Tidak ada wajah, suara siswa, atau nilai siswa nyata dalam media ini.

Sumber generator: [tes polish, skenario `captures REVO-007`](../../tests/revo-polish.e2e.spec.ts). Nama REVO-007 dipertahankan untuk menunjukkan asal generator, bukan tanggal produksi lama. Catatan eksekusi, perangkat, verifikasi media, dan hash berada pada [manifest](media/manifest.json); status pengujian pada [checklist](07-release-checklist.md#verifikasi-pada-revo-008).

Untuk regenerasi, jalankan production preview sesuai README kemudian hanya skenario pengambilan media:

```sh
REVO_BASE_URL=http://127.0.0.1:3002 npm run test:e2e -- tests/revo-polish.e2e.spec.ts --grep 'captures REVO-007'
```

Perintah tersebut menghasilkan fixture dalam konteks browser tes tersendiri. Tidak menjalankan uji kelas dan tidak mengumpulkan hasil belajar. Periksa ulang framing dan tautan setelah menyalin hasil; perbarui manifest jika aset diganti.
