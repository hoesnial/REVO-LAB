"use client";

import { REVO_ROUTES } from "@/lib/revo/routes";
import RevoBriefing from "./RevoBriefing";
import { useRevoProgress } from "./RevoProgressProvider";

const summaries = [
  "Kenali komponen utama mesin uap",
  "Pahami gerak piston dan roda gila",
  "Ikuti tenaga menuju mesin tenun",
  "Pahami dampak mekanisasi",
] as const;

export default function RevoLevelBriefing() {
  const { storageStatus, hydrated } = useRevoProgress();
  const saveMessage = !hydrated ? "Memeriksa simpanan perangkat…"
    : storageStatus === "unavailable" ? "Penyimpanan perangkat tidak tersedia. Progres dapat hilang saat halaman dimuat ulang."
    : storageStatus !== "available" ? "Simpanan tidak dapat dipulihkan. Kamu dapat memulai kembali."
    : undefined;

  return <RevoBriefing era="industry-1" period="1760–1840" title="Era Mesin Uap"
    intro="Temukan bagaimana tenaga uap menggerakkan mesin dan mengubah proses produksi."
    theme="Mesin Uap & Mekanisasi" caption="Dari panas menjadi gerak" summaries={summaries}
    href={REVO_ROUTES.simulator} saveMessage={saveMessage} context={<>
      <p>Masuki era ketika tenaga uap membantu mengubah cara manusia memproduksi barang.</p>
      <p className="revo-briefing-path">Alur belajar: Eksplorasi → Perakitan → Eksperimen → Refleksi → Rangkuman.</p>
      <p>Simulasi edukasi sederhana. Skala 0–100, bukan ukuran termodinamika nyata.</p>
    </>} />;
}
