"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, X, MoveHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { PARTS, PATHS, type ElectricPartId, type PathKind } from "@/lib/revo/industry-2/content";
import { REVO_ROUTES } from "@/lib/revo/routes";
import RevoScreenHeader from "../RevoScreenHeader";
import ExplorationSheetToggle from "../ExplorationSheetToggle";
import RevoComponentInfo from "../RevoComponentInfo";
import RevoExplorationComplete from "../RevoExplorationComplete";
import ElectricDiagram from "./ElectricDiagram";
import ElectricCameraControls from "./ElectricCameraControls";
import ElectricHud from "./ElectricHud";
import { useElectricProgress } from "./ElectricProgressProvider";

const ElectricScene = dynamic(() => import("./ElectricScene"), {
  ssr: false, loading: () => <p className="electric-scene-status" role="status">Memuat diorama…</p>,
});

export default function ElectricExplore() {
  const { progress, status, dispatch } = useElectricProgress();
  const [path, setPath] = useState<PathKind | null>(null);
  const [focus, setFocus] = useState<ElectricPartId | null>(null);
  const [reset, setReset] = useState(0);
  const [cardOpen, setCardOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [cameraCommand, setCameraCommand] = useState({ kind: "reset", serial: 0 });
  const detail = useRef<HTMLElement>(null);
  const partButtons = useRef<Partial<Record<ElectricPartId, HTMLButtonElement | null>>>({});

  if (!progress || progress.stage === "briefing") return <main className="electric-shell electric-gate" lang="id" aria-busy={!progress}>
    <RevoScreenHeader step="02 / INDUSTRI 2.0" back={{ href: REVO_ROUTES.menu, label: "Pilih Era" }} />
    <section>
      <p className="electric-kicker">INDUSTRI 2.0</p>
      <h1>{progress ? "Mulai dari briefing" : "Memuat eksplorasi…"}</h1>
      {progress && <><p>{status === "invalid" ? "Simpanan 2.0 tidak dapat dipulihkan. Mulai sesi baru dari briefing." : "Baca tujuan pembelajaran sebelum memasuki pabrik."}</p>
        <Link className="electric-primary" href={REVO_ROUTES.electricBriefing}>Buka Briefing <ArrowLeft size={18} aria-hidden="true" /></Link></>}
    </section>
  </main>;

  const selected = PARTS.find(part => part.id === progress.selected);
  const inspect = (id: ElectricPartId) => {
    dispatch({ type: "inspect", id });
    setCardOpen(true); setSheetExpanded(false);
    const compact = window.matchMedia("(max-width: 720px)").matches;
    requestAnimationFrame(() => {
      if (detail.current) detail.current.scrollTop = 0;
      detail.current?.scrollIntoView({ block: compact ? "start" : "nearest", behavior: "instant" });
      if (compact) detail.current?.focus({ preventScroll: true });
    });
  };
  const returnToParts = () => {
    setCardOpen(false);
    if (selected) partButtons.current[selected.id]?.focus({ preventScroll: true });
  };
  const fallback = <div className="electric-fallback">
    <ElectricDiagram selected={progress.selected} path={path} />
    <p role="status">Tampilan 3D tidak tersedia. Gunakan daftar komponen untuk melanjutkan.</p>
  </div>;

  return <main className="electric-shell electric-explore revo-exploration" data-inspector-open={cardOpen && Boolean(selected)} data-sheet-expanded={sheetExpanded} data-path-active={Boolean(path)} data-exploration-complete={progress.exploreComplete || undefined} lang="id">
    <ElectricHud stage="explore" progress={progress} />
    <div className="electric-workspace">
      <section className="electric-stage" aria-label="Diorama pabrik elektrifikasi">
        <div className="electric-stage-title">
          <p className="electric-kicker">LABORATORIUM INTERAKTIF / 02</p>
          <h1>Kenali Pabrik Listrik</h1>{!progress.exploreComplete && <strong className="revo-explore-count">{progress.explored.length}/7 dibuka</strong>}
          <p className="revo-explore-subtitle">Pilih titik pada model untuk mempelajari komponen dan fungsinya.</p>
          {path && <p className="electric-flow-caption" aria-live="polite">{PATHS[path].flow}</p>}
        </div>
        <div className="electric-canvas">
          <ElectricScene explorationCamera={cameraCommand} focus={focus} selected={progress.selected} path={path} inspect={inspect} fallback={fallback} reset={reset} />
        </div>
        <div className="electric-scene-tools">
          <div className="electric-paths" role="group" aria-label="Sorot jalur dalam diorama">
            {(Object.keys(PATHS) as PathKind[]).map(kind => <button key={kind} className={`electric-path electric-path-${kind}`} aria-pressed={path === kind} onClick={() => setPath(path === kind ? null : kind)}>
              <span aria-hidden="true">{PATHS[kind].symbol}</span>{PATHS[kind].name}
            </button>)}
          </div>
          <ElectricCameraControls onZoom={kind => setCameraCommand(old => ({ kind, serial: old.serial + 1 }))} focus={focus} onFocus={setFocus} onReset={() => { setFocus(null); setReset(old => old + 1); setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 })); }} />
        </div>
      </section>
      <section className="electric-inspector" aria-labelledby="electric-inspector-title">
        <div className="electric-inspector-heading">
          <h2 id="electric-inspector-title">Komponen pabrik</h2>
        </div>
        <progress className="electric-progress" max={PARTS.length} value={progress.explored.length} aria-label="Progres eksplorasi" />
        <p className="electric-hint">Pilih dari diorama atau daftar berikut.</p>
        <p className="electric-swipe-hint"><MoveHorizontal size={14} aria-hidden="true" /> Geser daftar untuk melihat semua komponen</p>
        <ul className="electric-parts" id="electric-controls" tabIndex={-1}>
          {PARTS.map((part, index) => {
            const visited = progress.explored.includes(part.id);
            return <li key={part.id}>
              <button ref={button => { partButtons.current[part.id] = button; }} aria-pressed={progress.selected === part.id} aria-controls="electric-detail" onClick={() => inspect(part.id)}>
                <span className="electric-part-number" aria-hidden="true">{visited ? <Check size={16} /> : String(index + 1).padStart(2,"0")}</span>
                {part.name}<span className="revo-sr-only">{visited ? " · sudah dibuka" : ""}</span>
              </button>
            </li>;
          })}
        </ul>
        {cardOpen && selected && <article ref={detail} id="electric-detail" className="electric-detail revo-component-card" role={selected ? "region" : undefined}
          aria-label={selected ? "Informasi komponen" : undefined} tabIndex={selected ? 0 : undefined} aria-live="polite" aria-atomic="true"
          onKeyDown={event => { if (event.key === "Escape") returnToParts(); }}>
          <>
            <ExplorationSheetToggle expanded={sheetExpanded} onToggle={() => setSheetExpanded(value => !value)} />
            <RevoComponentInfo heading="h3" number={String(PARTS.indexOf(selected) + 1).padStart(2, "0")} subtitle={`Jalur ${PATHS[selected.kind].name}`} name={selected.name} description={selected.function} relationship={selected.relationship}
              actions={<><button aria-label="Tutup informasi komponen" title="Tutup informasi komponen" onClick={returnToParts}><X size={18} aria-hidden="true" /></button><button aria-label="Jelajahi komponen berikutnya" onClick={() => inspect(PARTS[(PARTS.indexOf(selected) + 1) % PARTS.length].id)}><ArrowRight size={18} aria-hidden="true" /></button></>} />
            <p className="electric-detail-feedback"><Check size={14} aria-hidden="true" /> Komponen sudah dijelajahi</p>
            <button className="electric-secondary" onClick={() => setFocus(selected.id)}>Fokus ke komponen</button>
          </>
        </article>}
        <div className="electric-inspector-footer">
          <p role="status">{status === "unavailable" ? "Progres bertahan selama sesi ini. Penyimpanan tidak tersedia." : "Progres era 2.0 tersimpan di perangkat."}</p>
        </div>
      </section>
    </div>
    {progress.exploreComplete && <RevoExplorationComplete total={PARTS.length} action={
      <Link className="revo-primary-button revo-explore-completion-action" href={REVO_ROUTES.electricAssembly} onNavigate={() => dispatch({ type: "enter-assembly" })}>Lanjut ke Perakitan<ArrowRight size={18} aria-hidden="true" /></Link>
    } />}
  </main>;
}
