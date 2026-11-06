# Audit isi sejarah dan mekanika

Tanggal: 1 November 2026. Acuan: kode `a4c135d`. Metode: membaca materi, narasi, semua opsi/kunci/penjelasan tiga cek perakitan dan tiga soal refleksi, simpulan, label, model mekanis, serta aturan simulasi; membandingkan klaim dengan sumber museum, arsip, dan lembaga warisan. Ini audit teknik–instruksional, **bukan persetujuan ahli sejarah/guru**.

Tidak ada isi game yang diubah pada REVO-008. Usulan berikut diajukan untuk review. Potongan teks pendek adalah kutipan kode proyek sendiri. ID temuan dipakai kembali di checklist rilis.

## Temuan dan usulan keputusan

| ID / prioritas | Lokasi dan isi saat ini | Penilaian / alasan | Usulan untuk guru/PM; status |
| --- | --- | --- | --- |
| H01 / sedang | `HistoricalInfoPanel.tsx`: “1769”, “Kondensor terpisah James Watt menghemat bahan bakar” | Inti tepat, tetapi tahun tidak menjelaskan paten; pembaca bisa mengira penemuan awal terjadi tepat 1769 atau Watt pencipta pertama mesin uap. S1 membedakan model 1765 dan paten 1769 | Pertimbangkan label “Paten kondensor terpisah, 1769”; jelaskan Watt mengembangkan mesin sebelumnya. Belum disetujui |
| H02 / tinggi | `RevoLab.tsx`: “INGGRIS, MODEL ±1800”; diorama piston horizontal/engkol dan alat tenun; narasi menyebut Britania Raya | Tidak ditemukan sumber yang mengidentifikasi keseluruhan tata mesin ini sebagai satu instalasi ±1800. Contoh mesin Watt 1788 memakai beam dan sun-and-planet (S2); pabrik 1797 pada S3 adalah pemintalan flax, bukan bukti alat tenun REVO. Label model dan disclaimer sudah ada | Guru mengonfirmasi kedalaman kronologi dan menyampaikan bahwa bentuk merupakan skema lintas contoh, bukan replika mesin Watt/pabrik tertentu. Jangan mengklaim semua fitur alat tenun umum dipakai pada 1800. Belum disetujui |
| H03 / sedang | `RevoLevelCompleted.tsx`, simpulan “Engkol dan roda gila mengubah serta meratakan putaran” | Ringkasan ambigu: seolah roda gila ikut mengubah gerak bolak-balik menjadi putaran. Uraian di `content.ts` dan cek `rotation` sudah lebih jelas | Usulan: “Batang penghubung dan engkol mengubah gerak bolak-balik menjadi putaran; roda gila membantu meratakannya.” Guru menilai redaksi; belum diterapkan |
| H04 / sedang | `narrationText`: “batang penghubung memutar roda gila”; narasi menghubungkan produksi dan dampak | Engkol tidak disebut eksplisit dalam kalimat itu, padahal penting untuk LO transmisi. Tidak otomatis salah, tetapi berisiko pemahaman mekanisme tidak lengkap | Selaraskan narasi dengan uraian piston/cek `rotation` setelah persetujuan. Tetap bedakan peran engkol dan roda gila |
| H05 / tinggi | `steamEngine.ts`, `simulationConstants.ts`: bahan bakar → target panas → target tekanan; tambah air mendinginkan; pelepasan uap menurunkan tekanan dengan angka tetap; batas 75/90 | Penyederhanaan eksplisit dan bukan termodinamika/aturan keselamatan nyata. Tinggi-rendah bahan bakar dipakai sebagai variabel kendali sederhana; tidak memodelkan laju pembakaran, kondensor, valve timing, massa uap, efisiensi, atau kondisi tekanan fisik. S1 menunjukkan kondensor penting pada mesin Watt tetapi tidak dimodelkan REVO | Guru menerima batas model dan membedakan eksperimen konseptual dari pelatihan mesin. Angka tidak boleh diberi satuan bar/°C atau dianggap rekomendasi operasi. Pertahankan disclaimer; konfirmasi sebelum uji kelas |
| H06 / sedang | `content.ts`, ketel/pipa, cek `factory`, refleksi Q1: tenaga uap mengurangi ketergantungan arus sungai tetapi tetap memerlukan air/bahan bakar | Tepat sebagai pengantar. S3 dan S4 mendukung peran pasokan air dan batu bara. Hindari perluasan menjadi semua pabrik langsung meninggalkan tenaga air | Guru memvalidasi generalisasi dan menekankan transisi berlangsung bertahap. Tidak perlu koreksi kunci |
| H07 / sedang | `PowerTransmission.tsx`, dialog Transmisi Tenaga: sabuk, poros, roda gigi siku; garis energi kuning | Mekanisme umum didukung S3/S5; lokasi dan kronologi tiap tata letak berbeda. S5 membahas Lowell/Amerika, termasuk perubahan pada 1828; tidak membuktikan tata REVO di Inggris ±1800 | Terima sebagai skema jika disclaimer dinyatakan. Garis kuning bukan uap mengalir sampai alat tenun. Guru memastikan siswa memahami batas geografis sumber |
| H08 / sedang | `TextileMachine.tsx`, `content.ts`, hasil: produksi kain meningkat; “unit kain” | Model mewakili penenunan, tidak seluruh rantai serat–pemintalan–penenunan. Seratus unit adalah target game; tidak ada bukti produktivitas historis dari hitungan itu | Guru memastikan istilah menenun dan memintal dibedakan. Jangan mengonversi unit ke meter, jam kerja riil, atau persentase peningkatan |
| H09 / sedang | Refleksi Q3/narasi/hasil: produksi, buruh, kota, risiko, polusi dan manfaat tidak merata | Tidak ditemukan pertentangan pada inti klaim umum; S4 mendukung polusi, S6 kondisi buruh, S7 konteks pekerja pabrik. Uraian game masih ringkas dan tidak membahas kolonialisme, perbudakan/rantai kapas, gender, atau perbedaan wilayah secara mendalam | Guru memilih konteks tambahan sesuai CP/TP; jangan menyebut cakupan game sebagai sejarah industrialisasi yang menyeluruh. Tidak menambah fitur pada checkpoint ini |
| H10 / sedang | Menu, briefing, hasil: 1760–1840; Inggris vs Britania Raya; judul Industry 1.0 | Rentang adalah pembabakan pengantar yang dipakai UI, bukan tanggal universal untuk semua negara. Inggris adalah bagian dari Britania Raya. Label empat era adalah kerangka produk, bukan pengganti historiografi | Guru mengonfirmasi rentang dan glosarium. Gunakan Britania Raya untuk proses luas; Inggris untuk konteks lokasi model. Status: menunggu konfirmasi |
| H11 / rendah | `QuizPanel.tsx`: “TAHAP 03 / REFLEKSI”; HUD menempatkan Refleksi pada urutan 04 | Ketidakkonsistenan label yang terkonfirmasi dari kode; tampaknya tertinggal dari sebelum penambahan Assembly | Usulkan label tahap 04 atau hilangkan angka. Tidak diubah pada tugas dokumentasi |
| H12 / tinggi | Hasil 5/5 “komponen dipelajari”; skor 3/3 disertai “Kamu memahami tenaga perubahan”; level selesai tanpa skor minimal | Bahasa capaian lebih kuat daripada bukti sistem. Membuka informasi tidak memastikan membaca; tiga pilihan ganda/retry tidak cukup membuktikan pemahaman historis menyeluruh | Guru/PM menilai apakah label perlu diperlunak pada revisi terpisah. Saat presentasi sebut kunjungan, penyelesaian, dan skor sesuai definisi [matriks](02-learning-outcomes.md) |
| H13 / sedang | `docs/REVO-LAB.md`: catatan referensi Smithsonian sekitar 1870; model tampak sekitar 1800 | S8 adalah model mesin yang lebih muda; metadata halaman juga mencantumkan tanggal terkait sekitar 1880. Mendukung contoh pompa, bukan penanggalan mesin REVO | Batasi penggunaannya sebagai pembanding mekanis belakangan; jangan jadikan bukti bahwa pompa/tata mesin identik digunakan di pabrik 1800. Guru konfirmasi sumber sezaman bila memerlukan klaim spesifik |

Prioritas “tinggi” berarti dapat menimbulkan klaim akademik/operasional yang keliru bila tidak dijelaskan, bukan pernyataan mekanik game rusak. Tidak ditemukan kunci jawaban yang berlawanan dengan konsep pengantar yang dimaksud; temuan bukan jaminan tidak ada masalah lain.

## Audit keenam soal in-game

| Soal / kunci menurut kode | Apa yang dinilai | Catatan validasi |
| --- | --- | --- |
| Assembly `steam` / opsi pertama: ketel memanaskan air | Fungsi ketel vs pipa/roda | Benar; jawaban dan penjelasan tersedia saat salah, retry tanpa batas. Distraktor cukup mudah ditebak |
| Assembly `rotation` / opsi kedua: batang penghubung dan engkol, dibantu roda gila | Konversi gerak vs stabilisasi | Benar untuk mekanisme yang dipilih model; bukan satu-satunya desain historis |
| Assembly `factory` / opsi ketiga: tidak bergantung sepenuhnya pada tenaga aliran sungai | Perubahan sumber tenaga | Benar; penjelasan menghindari klaim tenaga air langsung hilang |
| Refleksi Q1 / opsi kedua: ketergantungan arus sungai berkurang | Lokasi pabrik | Benar; mirip cek `factory`, sehingga bukan bukti transfer independen |
| Refleksi Q2 / opsi pertama: kimia → panas → energi uap → mekanis | Alur energi | Benar sebagai skema; membahas kerugian panas, bukan efisiensi kuantitatif |
| Refleksi Q3 / opsi ketiga: produksi meningkat tetapi kerja/risiko/lingkungan berubah | Dampak majemuk | Benar pada tingkat pengantar; distractor absolut memudahkan eliminasi, tidak menilai argumen berbasis sumber |

Sumber kunci: [assembly.ts](../../src/lib/revo/assembly.ts), [content.ts](../../src/lib/revo/content.ts). Kunci tidak diganti. Pretest/posttest luar game memakai situasi baru dan uraian untuk menambah bukti, bukan menganggap enam soal ini ujian baku.

## Glosarium yang diajukan

| Istilah utama | Padanan / batas makna |
| --- | --- |
| Ketel uap | Boiler; menghasilkan uap dari air yang dipanaskan |
| Pipa dan katup uap | Penyaluran/pengaturan; bukan sumber energi baru |
| Piston dan silinder | Piston bergerak di dalam silinder karena perbedaan tekanan |
| Batang penghubung dan engkol | Linkage/crank; pengubah gerak pada skema REVO |
| Roda gila | Flywheel; penyimpan energi gerak dan perata perubahan kecepatan |
| Puli, sabuk, poros transmisi | Pulley, belt, line shaft; penyalur tenaga mekanis |
| Mesin tekstil dalam REVO | Representasi mesin tenun; istilah umum UI tidak mencakup semua proses tekstil |
| Aman pada game | Memenuhi kriteria simulasi, bukan izin keselamatan mesin nyata |

## Sumber pembanding yang diperiksa

Tautan berikut diakses untuk audit pada 1 November 2026. Ringkasan hanya digunakan pada bagian yang relevan; koleksi luar tidak diunduh atau dipakai sebagai aset gambar.

- **S1 — Science Museum Group:** [model kondensor 1765](https://collection.sciencemuseumgroup.org.uk/objects/co50928) dan [James Watt and the separate condenser](https://blog.sciencemuseum.org.uk/james-watt-and-the-separate-condenser/). Membedakan pengembangan model dan paten 1769; memberi dasar efisiensi kondensor, bukan rumus simulasi.
- **S2 — Science Museum Group:** [Rotative Steam Engine by Boulton and Watt, 1788](https://collection.sciencemuseumgroup.org.uk/objects/co50948/rotative-steam-engine-by-boulton-and-watt-1788-beam-engine-steam-engine). Contoh beam engine dan sun-and-planet; pembanding untuk tidak menggeneralisasi satu mekanisme.
- **S3 — English Heritage:** [History of Shrewsbury Flaxmill Maltings](https://www.english-heritage.org.uk/visit/places/shrewsbury-flaxmill-maltings/history/), bagian Steam power. Memuat mesin 1797, pasokan batu bara lewat kanal, poros, dan sabuk. Akses langsung tidak stabil (salah satu permintaan ulang 403); bagian relevan juga tersedia dalam hasil indeks. Bukan bukti rekonstruksi diorama REVO.
- **S4 — Science and Industry Museum:** [Manchester: Our rainy city](https://blog.scienceandindustrymuseum.org.uk/manchester-our-rainy-city/). Konteks air, tekstil, dan polusi; jangan menggeser contoh abad ke-19 menjadi kejadian tepat tahun 1800.
- **S5 — National Park Service:** [Lowell: Mill Power Drives](https://www.nps.gov/articles/lowell-handbook-mill-power-drives.htm). Konteks poros, roda gigi dan sabuk di Amerika; tidak dijadikan bukti kronologi identik di Inggris.
- **S6 — The National Archives:** [1833 Factory Act](https://www.nationalarchives.gov.uk/education/resources/1833-factory-act/). Sumber pendidikan berbasis dokumen untuk mendiskusikan kondisi buruh dan keterbatasan penegakan hukum.
- **S7 — Historic England:** [The History of Shrewsbury Flaxmill Maltings](https://historicengland.org.uk/campaigns/visit/shrewsbury-flax-mill/history/). Konteks pemintalan flax, tenaga uap, dan tenaga kerja; tidak menyamakan pemintalan dengan penenunan.
- **S8 — Smithsonian, National Museum of American History:** [Model of a Horizontal Mill Engine and Boiler, ca 1870](https://americanhistory.si.edu/collections/object/nmah_846116). Pembanding pompa pengisi pada model belakangan; judul sekitar 1870 dan related date sekitar 1880 perlu dicatat jika dikutip.

[Referensi teknis lama](../REVO-LAB.md#historical-references) tetap tersedia. Buku Historic England *Textile Mills of Lancashire: The Legacy* berhasil terbuka sebagai PDF 140 halaman; tidak diaudit seluruhnya dan tidak menjadi dasar klaim halaman tertentu pada paket ini. Sumber Science Museum *James Watt, office equipment and high-street fashion* pada tautan UI berhasil dibuka; ia memberi konteks aplikasi tenaga uap, bukan bukti semua tata mekanik model.

## Lembar keputusan guru

Untuk setiap H01–H13: keputusan ______ (terima sebagai penyederhanaan / perlu revisi / perlu sumber tambahan); alasan dan rujukan ______; redaksi yang disetujui ______; penanggung jawab ______; tanggal ______. Revisi materi yang disetujui dibuat sebagai pekerjaan terpisah, kemudian ditinjau ulang. Jangan mengisi keputusan atas nama guru.
