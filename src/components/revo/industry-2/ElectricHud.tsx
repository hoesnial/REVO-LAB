"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, CircleHelp, House, LockKeyhole, RotateCw } from "lucide-react";
import { useState } from "react";
import { electricResumeRoute, LEARNING_STAGES, REVO_ROUTES } from "@/lib/revo/routes";
import { ELECTRIC_OBJECTIVES } from "@/lib/revo/industry-2/content";
import type { ElectricProgress } from "@/lib/revo/industry-2/progress";
import RevoDialog from "../RevoDialog";
import RevoLearningObjectives from "../RevoLearningObjectives";
import RevoScreenHeader from "../RevoScreenHeader";
import RevoStageBadge from "../RevoStageBadge";
import { useElectricProgress } from "./ElectricProgressProvider";

export default function ElectricHud({ stage, progress, onDialogOpen }: { stage: "explore" | "assembly" | "experiment"; progress: ElectricProgress; onDialogOpen?: () => void }) {
  const [dialog, setDialog] = useState<"objectives" | "reset" | "help" | null>(null);
  const { dispatch } = useElectricProgress();
  const router = useRouter();
  const close = () => setDialog(null);
  const resetLabel = progress.stage === "explore" ? "Reset eksplorasi" : "Reset progres 2.0";
  const open = (kind: "objectives" | "reset" | "help") => { onDialogOpen?.(); setDialog(kind); };
  const step = LEARNING_STAGES.find(item => item.id === stage)!;
  return <>
    <a className="revo-skip" href="#electric-controls" onClick={event => {
      const controls = document.getElementById("electric-controls");
      if (controls) { event.preventDefault(); controls.focus(); }
    }}>{stage === "explore" ? "Langsung ke daftar komponen" : "Langsung ke kendali"}</a>
    <RevoScreenHeader gameplay step={stage === "explore" ? "INDUSTRI 2.0 / EKSPLORASI" : `02 / ${step.label.toUpperCase()}`} back={stage === "explore" ? { href: REVO_ROUTES.menu, label: "Pilih Era" } : undefined} actions={<>
      <Link className="revo-game-action" href={REVO_ROUTES.menu} aria-label="Kembali ke Menu" title="Kembali ke Menu"><House size={17} aria-hidden="true" /><span>Menu Utama</span></Link>
      <button className="revo-game-action" onClick={() => open("objectives")} aria-label="Tujuan Pembelajaran" title="Tujuan Pembelajaran"><BookOpen size={17} aria-hidden="true" /><span>Tujuan Pembelajaran</span></button>
      {stage === "explore" && <button className="revo-game-action" aria-label="Panduan belajar" onClick={() => open("help")}><CircleHelp size={17} /><span>Panduan belajar</span></button>}
      <button className="revo-game-action" onClick={() => open("reset")} aria-label={resetLabel} title="Ulangi seluruh Industry 2.0"><RotateCw size={17} aria-hidden="true" /><span>Reset</span></button>
    </>} />
    <nav className="revo-stage-track" aria-label="Tahap belajar">
      {LEARNING_STAGES.map(item => {
        const current = item.id === stage;
        const done = item.id === "explore" ? progress.exploreComplete : item.id === "assembly" ? progress.assemblyComplete : item.id === "experiment" && progress.experimentComplete;
        const unavailable = item.id === "reflection";
        const locked = unavailable || (item.id === "assembly" && !progress.exploreComplete) || (item.id === "experiment" && !progress.assemblyComplete);
        const content = <><RevoStageBadge number={item.number} done={done} /><span>{item.label}{unavailable && <small>Belum tersedia</small>}</span>{locked && <LockKeyhole size={12} aria-hidden="true" />}</>;
        if (current) return <span key={item.id} className="revo-stage-entry" aria-current="step" data-complete={done || undefined}>{content}{done && <span className="revo-sr-only">Selesai</span>}</span>;
        if (unavailable || locked) return <button type="button" key={item.id} className="revo-stage-entry" disabled title={unavailable ? "Belum tersedia" : item.id === "experiment" ? "Selesaikan perakitan dan cek konsep" : "Buka 7 komponen untuk merakit"} aria-label={`${item.label} ${unavailable ? "belum tersedia" : "terkunci"}`}>{content}</button>;
        return <Link key={item.id} className="revo-stage-entry" data-complete={done || undefined} href={electricResumeRoute(item.id)}
          aria-label={item.id === "assembly" ? progress.stage === "explore" ? "Mulai Perakitan" : "Lanjutkan Perakitan" : item.label} aria-description={done ? "Selesai" : undefined}
          onNavigate={() => { if (item.id === "assembly") dispatch({ type: "enter-assembly" }); }}>{content}</Link>;
      })}
    </nav>
    {dialog === "objectives" && <RevoDialog title="Tujuan Pembelajaran" onClose={close} wide>
      <RevoLearningObjectives objectives={ELECTRIC_OBJECTIVES} />
      <div className="revo-dialog-actions">
        <button className="revo-primary-button" onClick={close}>Kembali ke pembelajaran</button>
        <Link className="revo-secondary-button" href={REVO_ROUTES.electricBriefing} onNavigate={close}>Buka Briefing</Link>
      </div>
    </RevoDialog>}
    {dialog === "help" && <RevoDialog title="Panduan belajar" onClose={close}><h2>Jelajahi pabrik</h2><p>Pilih komponen pada diorama atau daftar. Putar dengan menggeser, perbesar dengan gulir atau cubit, atau gunakan tombol kamera. Tutup informasi untuk melihat seluruh pabrik. Pada ponsel, perluas panel untuk membaca selengkapnya.</p></RevoDialog>}
    {dialog === "reset" && <RevoDialog title="Reset progres Industri 2.0" onClose={close}>
      <span className="revo-kicker">RESET SELURUH LEVEL</span><h2>Mulai lagi dari briefing?</h2>
      <p>Progres eksplorasi, perakitan, dan eksperimen Industri 2.0 di perangkat ini akan dihapus. Progres Industri 1.0 tetap tersimpan.</p>
      <div className="revo-dialog-actions">
        <button className="revo-secondary-button" onClick={close}>Batal</button>
        <button className="revo-primary-button revo-action-danger" onClick={() => {
          close(); dispatch({ type: "reset" }); router.replace(REVO_ROUTES.electricBriefing);
        }}>Hapus progres 2.0</button>
      </div>
    </RevoDialog>}
  </>;
}
