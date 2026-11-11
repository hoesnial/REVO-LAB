"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Save, Target } from "lucide-react";
import { useState, type ReactNode } from "react";
import { REVO_ROUTES } from "@/lib/revo/routes";
import RevoBriefingPreview, { type BriefingEra } from "./RevoBriefingPreview";
import RevoDialog from "./RevoDialog";
import RevoLearningObjectives from "./RevoLearningObjectives";
import RevoScreenHeader from "./RevoScreenHeader";

interface BriefingProps {
  era: BriefingEra;
  period: string;
  title: string;
  intro: string;
  theme: string;
  caption: string;
  summaries: readonly string[];
  objectives?: readonly (readonly [string, string])[];
  context: ReactNode;
  href?: string;
  action?: string;
  onEnter?: () => void;
  saveMessage?: string;
}

export default function RevoBriefing({ era, period, title, intro, theme, caption, summaries, objectives, context, href,
  action = "Mulai Eksplorasi", onEnter, saveMessage }: BriefingProps) {
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  const number = era === "industry-1" ? 1 : 2;

  return <main className="revo-briefing" lang="id" aria-label={`Briefing Revolusi Industri ${number}.0`}>
    <div className="revo-menu-skyline" aria-hidden="true" />
    <RevoScreenHeader step={`Industri ${number}.0 / Briefing`} back={{ href: REVO_ROUTES.menu, label: "Kembali ke Menu Utama" }} />
    <div className="revo-briefing-content revo-flow-entrance" role="region" aria-label="Ringkasan level dan tujuan pembelajaran" tabIndex={0}>
      <section className="revo-briefing-lead">
        <p className="revo-briefing-era">Era 0{number} <span aria-hidden="true">·</span> {period}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <RevoBriefingPreview era={era} theme={theme} caption={caption} />
      <section className="revo-briefing-summary" aria-labelledby="briefing-objectives-heading">
        <h2 id="briefing-objectives-heading"><Target size={30} aria-hidden="true" />Tujuan Pembelajaran</h2>
        <ol>{summaries.map((summary, index) => <li key={summary}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{summary}</li>)}</ol>
        <button className="revo-briefing-details" onClick={() => setObjectivesOpen(true)}>
          Lihat tujuan lengkap<ChevronRight size={19} aria-hidden="true" />
        </button>
      </section>
    </div>
    <footer className="revo-briefing-footer-bar">
      <p role="status"><Save size={23} aria-hidden="true" /><span>{saveMessage ?? "Progres belajar tersimpan di perangkat ini."}</span></p>
      {href ? <Link className="revo-primary-button" href={href} prefetch={false} onNavigate={onEnter}>{action}<ArrowRight size={22} aria-hidden="true" /></Link>
        : <button className="revo-primary-button" disabled>Memuat progres…</button>}
    </footer>
    {objectivesOpen && <RevoDialog title="Tujuan Pembelajaran" onClose={() => setObjectivesOpen(false)} wide>
      <RevoLearningObjectives objectives={objectives} />
      <div className="revo-briefing-context">{context}</div>
    </RevoDialog>}
  </main>;
}
