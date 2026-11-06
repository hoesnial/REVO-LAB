# Bukti visual REVO-008R.1.1

Tanggal 3 November 2026. [Laporan audit](../REVO-008R1-1.md).

`before/` diambil dari build R.1 asli pada port 3003 sebelum diganti. `after/` menggunakan revisi R.1.1; versi final diperbarui dari build produksi. Chrome desktop 1440×900 dan viewport ponsel 390×844. Gambar memakai fixture QA untuk menjangkau tahap tertentu; bukan data siswa. Mesin dalam tangkapan kontrol awal dalam keadaan berhenti. Isi soal dan kunci tidak berubah.

| Bukti yang diminta | Sebelum — desktop | Sesudah — desktop | Sesudah — ponsel |
| --- | --- | --- | --- |
| Bahan bakar dan air (detail seluruh grup) | [Kontrol](before/1440-resources.png) | [Kontrol](after/1440-resources.png) | [Kontrol](after/390-resources.png) |
| Kuis tanpa pilihan | [Belum dipilih](before/1440-quiz-unselected.png) | [Belum dipilih](after/1440-quiz-unselected.png) | [Belum dipilih](after/390-quiz-unselected.png) |
| Kuis dipilih, belum dinilai | [Dipilih](before/1440-quiz-selected.png) | [Dipilih](after/1440-quiz-selected.png) | [Dipilih](after/390-quiz-selected.png) |
| Jawaban benar setelah evaluasi | [Benar](before/1440-quiz-correct.png) | [Benar](after/1440-quiz-correct.png) | [Benar](after/390-quiz-correct.png) |
| Jawaban salah dan penjelasan | [Salah](before/1440-quiz-incorrect.png) | [Salah](after/1440-quiz-incorrect.png) | [Salah](after/390-quiz-incorrect.png) |
| Tujuan pembelajaran | [Tujuan](before/1440-objectives.png) | [Tujuan](after/1440-objectives.png) | [Tujuan](after/390-objectives.png) |
| Perakitan dan cek pemahaman | [Perakitan](before/1440-assembly.png) | [Perakitan](after/1440-assembly.png) | [Perakitan](after/390-assembly.png) |
| HUD eksperimen | [HUD](before/1440-experiment.png) | [HUD](after/1440-experiment.png) | [HUD](after/390-experiment.png) |
| Refleksi / hasil kuis | [Hasil kuis](before/1440-quiz-result.png) | [Hasil kuis](after/1440-quiz-result.png) | [Hasil kuis](after/390-quiz-result.png) |
| Rangkuman pembelajaran | [Rangkuman](before/1440-summary.png) | [Rangkuman](after/1440-summary.png) | [Rangkuman](after/390-summary.png) |

Bukti tambahan: menu, pilih era, briefing, bantuan, eksplorasi dan percobaan salah pada perakitan berada di folder yang sama. Tangkapan menu `before/` dibuat sebelum gambar selesai dimuat; gambar kosong pada tangkapan itu tidak dipakai sebagai bukti cacat produk atau perbandingan gambar. Perbandingan utama di atas tidak bergantung pada gambar menu.

Pada ponsel, panel kontrol, perakitan, kuis dan rangkuman dapat digulir di dalam aplikasi. Satu screenshot viewport tidak memuat semua teks soal panjang; tes mengoperasikan tombol di bagian bawah panel dan memeriksa tidak adanya scroll/overflow dokumen.

Seluruh enam ukuran yang diuji memiliki bukti tambahan di `test-results/revo/revo-008r1-1/{lebar}/`: 1920×1080, 1440×900, 1366×768, 1280×720, 390×844, 320×568. Folder test-results diabaikan Git; gambar pilihan di direktori docs ini disertakan agar PM dapat meninjau.

Warna dan ukuran kontrol dari browser tersedia pada `before/styles.json` dan `after/styles.json`. Hasil inspeksi manual dan batasan dicatat dalam laporan audit. Tidak ada klaim sertifikasi aksesibilitas atau validasi kelas.

## Hasil inspeksi gambar final

| Kelompok | Pemeriksaan manual |
| --- | --- |
| Sumber daya | Biru/amber/netral berbeda; ikon dan label tetap ada. Pada ponsel, seluruh grup dapat dibaca melalui scroll internal. |
| Kuis belum dipilih/dipilih | Teks dan huruf opsi terang, indikator radio terlihat, pilihan diberi teks “belum diperiksa”. |
| Kuis benar/salah | Centang/silang dan kalimat status terlihat; penjelasan terbaca. Konten panjang berlanjut di scroll dialog. |
| Tujuan dan rangkuman | Verba kuning, teks isi terang, hasil dan skor terbaca; panel panjang dapat digulir. |
| Perakitan | Diorama termuat, kartu cek pemahaman terang di atas hijau gelap, percobaan salah memiliki label dan silang. |
| Eksperimen | Diorama termuat di desktop dan ponsel; toolbar, tahap aktif, komponen dan kendali tetap tersedia. |
| Menu, era dan briefing | Identitas REVO konsisten; hanya Industry 1.0 aktif; bantuan dan navigasi dibedakan dari aksi utama. |

Sampel lebar minimum yang juga diperiksa: [menu awal 320px](after/320-menu.png), [menu dengan hasil tersimpan 320px](after/320-menu-resume.png), [briefing 320px](after/320-briefing.png), [kendali 320px](after/320-controls.png), [jawaban dipilih 320px](after/320-quiz-selected.png), dan [tujuan 320px](after/320-objectives.png). Gambar menu tetap terlihat dengan dua maupun tiga aksi. Kanvas gameplay masih terlihat; teks panjang menggunakan scroll internal. Penanda diorama yang padat tidak diperbesar, dengan alternatif tombol DOM yang lebih besar.

Tangkapan final menunggu penanda 3D tersedia sebelum merekam layar gameplay. Menu desktop menggunakan tangkapan run UI produksi yang gambarnya sudah termuat; tangkapan awal yang terlalu cepat diganti setelah inspeksi. Screenshot saja tidak dipakai untuk menyatakan semua bagian panel dapat dijangkau: keterjangkauan tombol bagian bawah diperiksa melalui tes interaksi.
