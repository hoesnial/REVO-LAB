"use client";

import { electricResumeRoute } from "@/lib/revo/routes";
import { ELECTRIC_OBJECTIVES } from "@/lib/revo/industry-2/content";
import { electricResumeLabel } from "@/lib/revo/industry-2/progress";
import RevoBriefing from "../RevoBriefing";
import { useElectricProgress } from "./ElectricProgressProvider";

const summaries = [
  "Kenali aliran tenaga listrik",
  "Pahami motor dan gerak putar",
  "Bedakan listrik dan transmisi mekanis",
  "Ikuti alur benda di lini produksi",
  "Pahami prinsip produksi massal",
] as const;

export default function ElectricBriefing() {
  const { progress, status, dispatch } = useElectricProgress();
  const saveMessage = !progress ? "Memeriksa simpanan perangkat…"
    : status === "invalid" ? "Simpanan 2.0 tidak dapat dipulihkan. Mulai untuk membuat progres baru."
    : status === "unavailable" ? "Penyimpanan perangkat tidak tersedia. Progres dapat hilang saat halaman dimuat ulang."
    : undefined;

  return <RevoBriefing era="industry-2" period="1870–1914" title="Era Listrik & Produksi Massal"
    intro="Lihat bagaimana listrik, motor, dan konveyor mengubah cara barang diproduksi."
    theme="Listrik & Produksi Massal" caption="Dari listrik menjadi produksi"
    summaries={summaries} objectives={ELECTRIC_OBJECTIVES} saveMessage={saveMessage}
    href={progress ? electricResumeRoute(progress.stage === "briefing" ? "explore" : progress.stage) : undefined}
    action={progress ? electricResumeLabel(progress) : undefined} onEnter={() => dispatch({ type: "start" })}
    context={<>
      <p>Di awal abad ke-20, motor listrik memungkinkan sebagian pabrik menata ulang mesin sesuai urutan kerja. Di Highland Park, percobaan lini perakitan bergerak pada 1913 menggabungkan perpindahan benda kerja, pembagian tugas, dan komponen yang dapat dipertukarkan.</p>
      <p>Buka tujuh komponen, lalu telusuri jalur listrik, putaran motor, dan perjalanan benda kerja. Diorama adalah penyederhanaan edukatif, bukan rekonstruksi satu pabrik.</p>
      <p>Materi draf untuk ditinjau guru sebelum digunakan bersama siswa.</p>
    </>} />;
}
