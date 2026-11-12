# REVO-010C.2 — Responsive Layout & Regression Triage

**Status: DONE.** Layout C.2 diterima PM dan final regression alignment lulus. Matriks di bawah mempertahankan temuan triase awal.

## Perbaikan

- Pada 1280×720, kontrol kamera kedua era bergeser ke sisi kiri flying card ketika kartu terbuka. Kartu mempertahankan scroll internal. Pada mobile, kontrol kembali ke posisi normal.
- Pada 320×568, sheet ringkas dipadatkan menjadi 80px dan scene Industry 2.0 mendapat framing kamera 1.25× agar model tetap terbaca; tinggi canvas saat kartu ringkas terbuka terukur 163px. Scene Industry 1.0 terukur 131px.
- Pada 320×568, sheet yang diperluas masuk ke mode baca: area 3D dan kontrol kamera disembunyikan sementara, daftar komponen tetap dapat dipilih, penjelasan memakai scroll internal, dan affordance **Kembali ke model** memulihkan scene.
- Completion dock tetap menjadi baris layout tersendiri.
- Status progres 2.0 duplikat yang tersembunyi dari panel inspector dihapus; badge atas adalah satu-satunya angka progres eksplorasi.
- Petunjuk geser daftar Industry 2.0 tetap tersedia untuk teknologi bantu; secara visual disembunyikan pada mobile karena ruangnya bertumpuk dengan navigator komponen.
- Setelah reload, komponen Industry 2.0 yang tersimpan sebagai pilihan akan membuka kembali kartu informasinya.

## Matriks 18 kegagalan dari run regresi C.1

Status didasarkan pada snapshot Playwright lama dan verifikasi ulang setelah C.2. “Test drift” berarti tes masih mengharapkan pola navigasi atau label sebelum perubahan produk yang memang diminta pada pekerjaan sebelumnya.

| # | Tes | Akar masalah terverifikasi | Status pada run akhir | Tindak lanjut |
|---|---|---|---|---|
| 1 | Industry 2.0: buka briefing dari menu | Tes mencari link `Buka Briefing 2.0`; Main Menu saat ini memakai kartu `Jelajahi Industri 2.0` yang langsung membuka briefing. Snapshot DOM membuktikan link yang tersedia. | Test drift | Selaraskan helper menu pada perubahan menu REVO-010A. |
| 2 | Industry 2.0: JSON rusak | Sebelum perbaikan, teks `0/7 dibuka` muncul pada badge dan status inspector tersembunyi sehingga locator menemukan dua elemen. Markup kini hanya punya badge progres yang terlihat. | Lulus setelah perbaikan tampilan | Pertahankan satu sumber progres pada UI. |
| 3 | Industry 2.0: versi tidak didukung | Duplikasi teks `0/7 dibuka` yang sama pada markup sebelumnya. | Lulus setelah perbaikan tampilan | Sama seperti #2. |
| 4 | Industry 2.0: tahap palsu | Duplikasi teks `0/7 dibuka` yang sama pada markup sebelumnya. | Lulus setelah perbaikan tampilan | Sama seperti #2. |
| 5 | Industry 2.0: reload dan simpan lintas era | Assertion kartu `Konveyor` setelah reload kini lulus; tes berikutnya gagal mencari link `Pilih Era`, yang sudah tidak ada pada header gameplay kanonis. | Test drift | Ubah navigasi tes untuk memakai Menu Utama dan kartu era aktif. |
| 6 | Industry 2.0: readiness palsu/ID asing | Normalisasi menolak pilihan `panel` asing. PM menegaskan flying card memang tidak muncul tanpa komponen terpilih; panel “Ikuti tiga jalur” tidak dikembalikan. | Perilaku produk benar; tes lama menyimpang | Tes kini memeriksa ID asing diabaikan, tidak ada kartu, instruksi eksplorasi terlihat, lalu tap hotspot 3D membuka kartu. |
| 7 | Industry 2.0: touch dan sorotan jalur | Helper tes memakai titik tepi geometri dan zoom `min(width/14,height/6.6)`, bukan fit aktual kamera. Pada 320px kini ada zoom sempit 1.25× di `ExplorationCamera`. Proyeksi sesuai fit kamera ke pusat pasokan membuka kartu dengan touch pada 320px; tes 390px juga lulus memakai geometri kamera aktual. | Gagal pada helper lama; touch produk terverifikasi dengan proyeksi aktual | Ganti helper tes dengan pusat hotspot dan rumus framing yang sama dengan kamera produk; jangan longgarkan assertion. |
| 8 | Learning: tujuan briefing dan dialog | Tes mencari heading uppercase `TUJUAN PEMBELAJARAN`; snapshot DOM aktual menunjukkan heading `Tujuan Pembelajaran`. | Gagal; test drift terverifikasi | Sesuaikan nama heading di tes terhadap briefing yang telah disetujui. |
| 9 | Learning: enam viewport briefing | `scrollIntoViewIfNeeded` mencari heading uppercase yang sama dan timeout; snapshot DOM menunjukkan heading title case pada keenam viewport. | Gagal; test drift terverifikasi | Sama seperti #8. |
| 10 | Learning: reset mesin dan retry eksperimen | Setelah retry, route tetap di tab Eksperimen. Tes mencari teks completion dock Eksplorasi yang hanya dirender pada stage Eksplorasi; snapshot menunjukkan stage Eksperimen aktif dan kontrol mesin tersedia. | Gagal; assertion berada di stage yang salah | Verifikasi eksplorasi lewat progres tersimpan atau tab Eksplorasi, bukan dock pada Eksperimen. |
| 11 | Menu: perjalanan dan progres | Snapshot progres menunjukkan link “Pilih Era” ber-href `/revo-lab`; URL setelah klik tetap `/revo-lab`. Test mengharapkan `/revo-lab/eras`, route lama. | Gagal; test drift terhadap route kanonis terverifikasi | Ubah flow tes ke Main Menu kanonis dan pilih kartu era dari sana. |
| 12 | REVO: hotspot transmisi | Helper `openLab` berhenti sebelum interaksi karena mencari heading `THE AGE OF STEAM.`; eksplorasi aktual memakai `Kenali Mesin Uap`. | Gagal; test drift terverifikasi | Perbarui helper eksplorasi ke heading yang sedang dipakai. |
| 13 | REVO: hitungan eksplorasi dan gating | Gagal di selector heading lama pada helper `openLab`, sebelum menguji progres/gating. | Gagal; test drift terverifikasi | Sama seperti #12. |
| 14 | REVO: pause, bantuan, dan stage | Gagal di selector heading lama pada helper `openLab`, sebelum menguji pause/stage. | Gagal; test drift terverifikasi | Sama seperti #12. |
| 15 | REVO: demo desktop lengkap | Gagal di selector heading lama pada helper `openLab`, sebelum demo dimulai. | Gagal; test drift terverifikasi | Sama seperti #12. |
| 16 | REVO: sumber daya dan tekanan | Gagal di selector heading lama pada helper `openLab`, sebelum kontrol sumber daya diuji. | Gagal; test drift terverifikasi | Sama seperti #12. |
| 17 | REVO: demo mobile 390px | Gagal di selector heading lama pada helper `openLab`, sebelum layout diuji. | Gagal; test drift terverifikasi | Sama seperti #12. |
| 18 | REVO: HUD fullscreen | Tes mengharapkan indikator produksi tampil saat Eksplorasi aktif. DOM menyembunyikan indikator operasi dalam stage ini sesuai keputusan UI eksplorasi; indikator produksi relevan di Eksperimen. | Gagal; assertion bertentangan dengan stage yang diuji | Pindahkan assertion indikator produksi ke Eksperimen. |

## Verifikasi C.2

- Typecheck: lulus.
- Lint: lulus.
- Production build: lulus; Next.js memberi peringatan bahwa `pnpm-workspace.yaml` di parent directory diabaikan karena berada di luar repo.
- Vitest: 104 lulus.
- Playwright eksplorasi terarah: 16/16 lulus, termasuk kedua era, empat viewport, status CTA dan gating, hotspot, keyboard, touch, zoom/reset, sheet mobile, dan fallback WebGL. Tes tambahan men-tap langsung objek Industry 2.0 pada 320×568 dengan matriks kamera aktual.
- Playwright 18 kasus regresi pada run C.2 semula: 3 lulus dan 15 gagal. Tiga kasus data rusak terkait progres tunggal lulus. Kegagalan lain dicatat satu per satu pada matriks; keputusan PM berikutnya menetapkan #6 sebagai perilaku yang disengaja. Hasil penyelarasan final ada di bagian berikut.
- Geometri pada 1280×720: Playwright membandingkan bounding box kartu dan kontrol kamera; tidak beririsan di kedua era.
- Pada 320×568: canvas saat kartu ringkas terbuka setinggi 131px (1.0) dan 163px (2.0). Pada mode baca, canvas disembunyikan sementara, daftar tetap ada, tombol “Kembali ke model” menutup sheet, penjelasan scroll di dalam sheet, dan CTA 5/5 atau 7/7 tetap terlihat.
- Dua puluh screenshot aktual pada kedua era dan empat viewport tersedia di `docs/revo-010c2-media/after/`: desktop kartu terbuka/tertutup; mobile sheet ringkas/diperluas dan kartu tertutup. Pemeriksaan capture mendapati document overflow 0px pada setiap viewport.

## File terkait C.2

- `src/app/revo-lab/exploration.css`
- `src/components/revo/ExplorationCamera.tsx`
- `src/components/revo/industry-2/ElectricExplore.tsx`
- `src/components/revo/industry-2/ElectricScene.tsx`
- `tests/revo-exploration.e2e.spec.ts`
- `docs/revo-010c2-media/after/`

Tidak diubah: mekanika 3D, materi, progres, gating, penyimpanan, dan scoring.

Tidak ada commit, push, atau deployment.

## REVO-010C.2 — Final Regression Alignment

Keputusan PM: layout C.2 diterima. Flying card hanya muncul setelah komponen dipilih. Panel “Ikuti tiga jalur” tidak dipulihkan. Penyelarasan ini hanya mengubah tes dan helper, tanpa mengubah UI, mekanika, materi, scoring, gating, atau skema penyimpanan.

- Tes route kini membuka kartu era dari `/revo-lab` dan memeriksa URL briefing kanonis. Helper Progres Saya menutup dialog setelah link “Pilih Era” menuju halaman menu yang sama.
- Tes Industry 2.0 mempertahankan klik dan tap pada geometri WebGL. Proyeksi eksplorasi memakai pusat hotspot pasokan, sudut kamera, fit, serta zoom layar sempit yang berlaku; proyeksi perakitan tetap memakai kamera perakitan. Kasus ID asing memeriksa normalisasi `selected: null` dan `explored: ["motor"]`, ketiadaan kartu, instruksi eksplorasi, lalu kartu “Pasokan listrik” setelah interaksi 3D.
- Tes Industry 1.0 memeriksa angka progres atas hanya sebelum eksplorasi lengkap, completion dock hanya di tahap eksplorasi, dan indikator operasi hanya di eksperimen. Pengujian reset dan retry tetap memeriksa state, tab, resource, serta gating pada tahap yang tepat.
- Tes briefing memeriksa heading yang benar dan kontras teks terhadap gradien krem kanonis. Alur pause, kuis, simulasi, keselamatan, progres lintas era, WebGL fallback, keyboard, dan konsol tetap diuji.

**File tes yang diubah:** `tests/helpers/revo-menu.ts`, `tests/revo-industry-2.e2e.spec.ts`, `tests/revo-learning.e2e.spec.ts`, `tests/revo-menu.e2e.spec.ts`, dan `tests/revo.e2e.spec.ts`. Perubahan layout C.2 dan screenshot sebelumnya tetap seperti tercatat di atas.

**Verifikasi setelah alignment:** typecheck lulus; lint lulus; build produksi lulus; Vitest 104/104 lulus; Playwright eksplorasi 16/16 lulus. Run regresi 18 kasus pertama setelah alignment menghasilkan 16 lulus dan dua assertion lintas tahap yang kemudian diperbaiki. Pengulangan terarah kedua kasus lulus 2/2; pengulangan penuh terakhir lulus **18/18** pada build produksi. Sisa kegagalan: tidak ada pada paket yang diminta.
