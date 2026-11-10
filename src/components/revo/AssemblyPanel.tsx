"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, Wrench } from "lucide-react";
import RevoAnswerFace from "./RevoAnswerFace";
import { ASSEMBLY_CHECKS, ASSEMBLY_PARTS, assemblyComplete, assemblyProgress, type AssemblyAction, type AssemblyState } from "@/lib/revo/assembly";

function KnowledgeChoices({ check, feedback, onAction }: {
  check: typeof ASSEMBLY_CHECKS[number];
  feedback: AssemblyState["checkFeedback"][typeof ASSEMBLY_CHECKS[number]["id"]];
  onAction: (action: AssemblyAction) => void;
}) {
  // Only presentation of the last attempt lives here; the reducer still validates learning.
  const [attempt, setAttempt] = useState<number | null>(null);
  return <>
    <p className="revo-answer-instruction">Pilih jawaban untuk langsung memeriksa pemahamanmu. Kamu dapat mencoba lagi.</p>
    {check.options.map((option, index) => {
      const incorrect = attempt === index && feedback?.correct === false;
      return <button type="button" key={option} aria-label={option} className={`revo-answer-card ${incorrect ? "is-incorrect" : ""}`} onClick={() => { setAttempt(index); onAction({ type: "answer", id: check.id, answer: index }); }}>
        <RevoAnswerFace index={index} text={option} state={incorrect ? "incorrect" : undefined} />
      </button>;
    })}
    {feedback && <p role="status" className={`revo-assembly-answer ${feedback.correct ? "is-correct" : "is-incorrect"}`}>{feedback.message}</p>}
  </>;
}

export default function AssemblyPanel({ state, enabled, onAction, onExperiment, onReset }: {
  state: AssemblyState; enabled: boolean; onAction: (action: AssemblyAction) => void; onExperiment: () => void; onReset: () => void;
}) {
  const complete = assemblyComplete(state);
  const part = ASSEMBLY_PARTS.find(part => part.id === state.selected);
  const nextCheck = ASSEMBLY_CHECKS.find(check => !state.checks.includes(check.id));
  const checkAvailable = nextCheck?.requires.every(id => state.placed.includes(id));
  const panel = useRef<HTMLElement>(null);
  const previousChecks = useRef(state.checks.length);
  const focusAfterCheck = useRef(false);
  useEffect(() => {
    if (state.checks.length > previousChecks.current && focusAfterCheck.current) {
      panel.current?.querySelector<HTMLElement>(".revo-assembly-check h3, .revo-assembly-success button")?.focus();
    }
    focusAfterCheck.current = false;
    previousChecks.current = state.checks.length;
  }, [state.checks.length]);
  return <aside ref={panel} id="revo-controls" tabIndex={-1} className="revo-assembly-panel" aria-label="Kendali perakitan">
    <div className="revo-assembly-intro"><span className="revo-kicker"><Wrench size={13} /> PERAKITAN MESIN</span><h2>{complete ? "PERAKITAN SELESAI" : "Rangkai tenaga. Pahami hubungan."}</h2><p>Rangkai sistem penggerak pabrik tenaga uap dengan memasang komponen pada posisi dan hubungan yang tepat.</p>
      <div className="revo-assembly-counts" role="status"><strong>{state.placed.length}/5 terpasang</strong><span>{5 - state.placed.length} tersisa · {state.checks.length}/3 cek pemahaman</span></div>
      <div className="revo-production-track" role="progressbar" aria-label="Progres perakitan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={assemblyProgress(state)}><i style={{ width: `${assemblyProgress(state)}%` }} /></div>
    </div>
    <div className="revo-assembly-scroll">
      <fieldset disabled={!enabled} className="revo-assembly-fieldset">
        {!complete && <>
          <details className="revo-assembly-inventory" open><summary>01 / Inventaris komponen <span>{5 - state.placed.length} tersisa</span></summary><div className="revo-assembly-parts">{ASSEMBLY_PARTS.map((part, index) => <button key={part.id} type="button" disabled={state.placed.includes(part.id)} aria-label={`Pilih ${part.name}`} aria-pressed={state.selected === part.id} onClick={() => onAction({ type: "select", id: part.id })}><span>{state.placed.includes(part.id) ? <Check size={13} /> : `0${index + 1}`}</span>{part.name}<small>{state.placed.includes(part.id) ? "Terpasang" : state.selected === part.id ? "Dipilih" : "Pilih"}</small></button>)}</div></details>
          {part && <article className="revo-assembly-knowledge" aria-label={`Petunjuk ${part.name}`}><h3>{part.name}</h3><p><b>Fungsi.</b> {part.function}</p><p><b>Hubungan.</b> {part.relationship}</p><p><b>Dalam sejarah.</b> {part.history}</p></article>}
          <details className="revo-assembly-targets" open><summary>02 / Pilih hubungan mekanis</summary><label htmlFor="revo-assembly-socket">Sambungan tujuan</label><select id="revo-assembly-socket" value={state.socket ?? ""} onChange={event => { const part = ASSEMBLY_PARTS.find(part => part.id === event.target.value); if (part) onAction({ type: "socket", id: part.id }); }}><option value="" disabled>Pilih sambungan…</option>{ASSEMBLY_PARTS.map(part => <option key={part.id} value={part.id} disabled={state.placed.includes(part.id)}>{part.socket}</option>)}</select><button className="revo-primary-button" disabled={!state.selected || !state.socket} onClick={() => { if (state.selected) onAction({ type: "place", id: state.selected, socket: state.socket }); }}>Pasang komponen<ArrowRight size={15} /></button></details>
        </>}
        <div className="revo-check-confirmation" role="status" aria-live="polite">{state.checks.length > 0 && <><Check size={18} aria-hidden="true" /><span>{state.checks.length}/3 cek pemahaman benar. Penjelasan tersimpan di bagian “Pemahaman yang sudah diperiksa”.</span></>}</div>
        {nextCheck && <section className="revo-assembly-check" aria-label="Cek pemahaman perakitan"><span className="revo-kicker">03 / CEK PEMAHAMAN · {state.checks.length + 1} DARI 3</span><h3 tabIndex={-1}>{nextCheck.question}</h3>{checkAvailable ? <KnowledgeChoices key={nextCheck.id} check={nextCheck} feedback={state.checkFeedback[nextCheck.id]} onAction={action => { focusAfterCheck.current = true; onAction(action); }} /> : <p>Pasang {nextCheck.requires.map(id => ASSEMBLY_PARTS.find(part => part.id === id)?.name).join(" dan ")} untuk memeriksa hubungan ini.</p>}</section>}
        {state.checks.length > 0 && <details className="revo-assembly-review"><summary>Pemahaman yang sudah diperiksa ({state.checks.length}/3)</summary>{ASSEMBLY_CHECKS.filter(check => state.checks.includes(check.id)).map(check => <p key={check.id}><Check size={12} /> {check.explanation}</p>)}</details>}
        {complete && <div className="revo-assembly-success"><Check size={30} /><p>Panas pembakaran menghasilkan uap di ketel. Uap melalui pipa melakukan kerja pada piston. Batang penghubung dan engkol memutar poros; roda gila meratakan putaran. Poros, puli, dan sabuk meneruskan tenaga ke mesin tekstil. Garis kuning menunjukkan aliran energi, bukan pipa uap sepanjang sistem.</p><button className="revo-primary-button" onClick={onExperiment}>UJI MESIN<ArrowRight size={17} /></button><small>Mesin tetap berhenti sampai kamu menyalakannya di tahap Eksperimen.</small></div>}
        <button className="revo-assembly-retry" onClick={onReset}><RotateCcw size={13} />Ulangi perakitan</button>
      </fieldset>
    </div>
  </aside>;
}
