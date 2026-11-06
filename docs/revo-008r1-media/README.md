# Screenshot REVO-008R.1

Pilihan screenshot untuk review PM/dosen. Sebelum revisi diambil 1 November 2026, sesudah revisi diambil 2 November 2026 dari Chrome pada build produksi lokal. Ini hasil QA perangkat lunak, bukan data validasi siswa.

| Tampilan | Sebelum | Sesudah |
|---|---|---|
| Briefing desktop 1440×900 | [Sebelum](before-1440-briefing.png) | [Sesudah](after-1440-briefing.png) |
| Briefing ponsel 390×844 | [Sebelum](before-390-briefing.png) | [Sesudah](after-390-briefing.png) |
| HUD Eksperimen desktop 1440×900 | — | [Sesudah](after-1440-lab.png) |
| HUD Eksperimen ponsel 390×844 | — | [Sesudah](after-390-lab.png) |
| Dialog tujuan 320×568 | — | [Sesudah](after-320-objectives.png) |

HUD menggunakan fixture QA dengan eksplorasi dan perakitan lengkap; mesin masih berhenti. Screenshot ini tidak menyatakan pencapaian siswa. Bukti pengamatan mesin dan skor aktual diuji dalam skenario browser terpisah.

Set lengkap keenam viewport ada di `test-results/revo/revo-008r1/before/` dan `after/` pada workspace lokal (diabaikan Git). Rekaman demo yang dibuat ulang tes ada di `test-results/revo/videos/revo-007/revo-007-interactive-demo.webm`; nama direktori mengikuti infrastruktur tes lama, sedangkan tampilannya mengikuti build saat tes dijalankan.
