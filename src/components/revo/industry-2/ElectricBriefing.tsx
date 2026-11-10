"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { electricResumeRoute, REVO_ROUTES } from "@/lib/revo/routes";
import { ELECTRIC_OBJECTIVES } from "@/lib/revo/industry-2/content";
import { electricResumeLabel } from "@/lib/revo/industry-2/progress";
import RevoScreenHeader from "../RevoScreenHeader";
import RevoLearningObjectives from "../RevoLearningObjectives";
import ElectricDiagram from "./ElectricDiagram";
import { useElectricProgress } from "./ElectricProgressProvider";

export default function ElectricBriefing() {
  const { progress, status, dispatch } = useElectricProgress();
  return <main className="electric-shell electric-briefing" lang="id">
    <RevoScreenHeader step="02 / BRIEFING" back={{ href: REVO_ROUTES.eraSelect, label: "Kembali ke Pilih Era" }} />
    <div className="electric-briefing-body">
      <section className="electric-reading" tabIndex={0} aria-label="Konteks dan tujuan pembelajaran">
        <p className="electric-kicker">ERA 02 / INDUSTRI 2.0</p>
        <h1>The Age of <em>Electricity.</em></h1>
        <p className="electric-lead">Dari tenaga listrik ke lini produksi.</p>
        <RevoLearningObjectives objectives={ELECTRIC_OBJECTIVES} className="electric-objectives" />
        <p>Di awal abad ke-20, motor listrik memungkinkan sebagian pabrik menata ulang mesin sesuai urutan kerja. Di Highland Park, percobaan lini perakitan bergerak pada 1913 menggabungkan perpindahan benda kerja, pembagian tugas, dan komponen yang dapat dipertukarkan.</p>
        <p>Buka tujuh komponen, lalu telusuri jalur listrik, putaran motor, dan perjalanan benda kerja. Diorama adalah penyederhanaan edukatif, bukan rekonstruksi satu pabrik.</p>
        <p className="electric-draft">Materi draf untuk ditinjau guru sebelum digunakan bersama siswa.</p>
      </section>
      <figure className="electric-hero">
        <div><span>ARSIP VISUAL / 02</span><span>AWAL ABAD KE-20</span></div>
        <ElectricDiagram />
        <figcaption><strong>Pabrik era elektrifikasi</strong><span>Distribusi listrik · Transmisi · Lini perakitan</span></figcaption>
      </figure>
    </div>
    <footer className="electric-briefing-actions">
      <p role="status">{status === "invalid" ? "Simpanan 2.0 tidak dapat dipulihkan. Mulai untuk membuat progres baru." : status === "unavailable" ? "Penyimpanan perangkat tidak tersedia. Progres dapat hilang saat halaman dimuat ulang." : "Gulir panel untuk membaca · Materi draf"}</p>
      {progress ? <Link className="electric-primary" href={progress.stage === "briefing" ? REVO_ROUTES.electricExplore : electricResumeRoute(progress.stage)} onNavigate={() => dispatch({ type: "start" })}>
        {electricResumeLabel(progress)} <ArrowRight size={18} aria-hidden="true" />
      </Link> : <button className="electric-primary" disabled>Memuat progres…</button>}
    </footer>
  </main>;
}
