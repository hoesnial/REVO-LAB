"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assessConnection, CONCEPTS, CONNECTIONS, PAIR_CHOICES, partName, targetName, type ConceptAnswerId } from "@/lib/revo/industry-2/assembly";
import { PARTS, PATHS, type ElectricPartId } from "@/lib/revo/industry-2/content";
import type { ElectricProgress } from "@/lib/revo/industry-2/progress";
import { REVO_ROUTES } from "@/lib/revo/routes";
import RevoScreenHeader from "../RevoScreenHeader";
import RevoAnswerFace from "../RevoAnswerFace";
import RevoDialog from "../RevoDialog";
import ElectricDiagram from "./ElectricDiagram";
import ElectricCameraControls from "./ElectricCameraControls";
import ElectricHud from "./ElectricHud";
import { useElectricProgress } from "./ElectricProgressProvider";

const ElectricScene = dynamic(() => import("./ElectricScene"), {
  ssr: false, loading: () => <p className="electric-scene-status" role="status">Memuat diorama…</p>,
});

export default function ElectricAssembly() {
  const { progress, status, dispatch } = useElectricProgress();
  const ready = progress?.exploreComplete && (progress.stage === "assembly" || progress.stage === "experiment");
  useEffect(() => {
    if (progress?.stage === "explore" && progress.exploreComplete) dispatch({ type: "enter-assembly" });
  }, [dispatch, progress]);

  if (ready) return <AssemblyWorkspace progress={progress} />;
  const loading = !progress || progress.exploreComplete;
  return <main className="electric-shell electric-gate" lang="id" aria-busy={loading}>
    <RevoScreenHeader step="02 / PERAKITAN" back={{ href: REVO_ROUTES.menu, label: "Pilih Era" }} />
    <section>
      <p className="electric-kicker">INDUSTRI 2.0</p>
      <h1>{loading ? "Memuat perakitan…" : "Perakitan terkunci"}</h1>
      {!loading && <>
        <p>Buka semua 7 komponen sebelum merakit. Progres saat ini: {progress.explored.length}/7.</p>
        {status === "invalid" && <p>Simpanan 2.0 tidak dapat dipulihkan.</p>}
        <Link className="electric-primary" href={progress.stage === "briefing" ? REVO_ROUTES.electricBriefing : REVO_ROUTES.electricExplore}>
          {progress.stage === "briefing" ? "Buka Briefing" : "Kembali ke Eksplorasi"} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </>}
    </section>
  </main>;
}

type Feedback = { kind: "correct" | "wrong" | "duplicate"; text: string };

function AssemblyWorkspace({ progress }: { progress: ElectricProgress }) {
  const { dispatch, status } = useElectricProgress();
  const [from, setFrom] = useState<ElectricPartId | null>(null);
  const [to, setTo] = useState<ElectricPartId | null>(null);
  const [focus, setFocus] = useState<ElectricPartId | null>(null);
  const [reset, setReset] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState<ConceptAnswerId | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<ConceptAnswerId | null>(null);
  const [retry, setRetry] = useState(false);
  const [mobileTaskView, setMobileTaskView] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const ledger = useRef<HTMLDetailsElement>(null);
  const message = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const count = progress.connections.length;
  const checked = CONCEPTS.filter(concept => progress.conceptAnswers[concept.id] === concept.correct).length;
  const concept = questionIndex === null ? undefined : CONCEPTS[questionIndex];
  const confirmedAnswer = concept && progress.conceptAnswers[concept.id];
  const shownAnswer = concept?.options.find(option => option.id === (confirmedAnswer || wrongAnswer));
  const candidates = from ? PAIR_CHOICES[from] : undefined;

  function selectPart(role: "from" | "to", id: ElectricPartId | null) {
    if (role === "from") setFrom(id);
    else setTo(id);
    setFeedback(null);
  }

  function inspect(id: ElectricPartId) {
    if (concept || progress.assemblyComplete) return;
    if (!from) selectPart("from", id);
    else if (!to) selectPart("to", id);
    else { selectPart("from", id); setTo(null); }
  }

  function revealFeedback() {
    requestAnimationFrame(() => message.current?.scrollIntoView({ block: "nearest", behavior: "instant" }));
  }

  function connect() {
    if (!from || !to) return;
    const outcome = assessConnection(from, to, progress.connections);
    if (outcome.kind === "wrong") setFeedback({ kind: "wrong", text: outcome.explanation });
    else if (outcome.kind === "duplicate") setFeedback({ kind: "duplicate", text: "Hubungan ini sudah terpasang. Pilih pasangan lain untuk melengkapi sistem." });
    else {
      dispatch({ type: "connect", from, to });
      setFeedback({ kind: "correct", text: outcome.connection.explanation });
    }
    revealFeedback();
  }

  function openQuestion(index: number | null) {
    setQuestionIndex(index);
    setAnswer(null);
    setWrongAnswer(null);
    if (index !== null) { setFrom(null); setTo(null); setFeedback(null); }
    requestAnimationFrame(() => {
      panel.current?.scrollTo({ top: 0, behavior: "instant" });
      title.current?.focus({ preventScroll: true });
    });
  }

  function checkAnswer() {
    if (!concept || !answer) return;
    if (answer !== concept.correct) {
      setWrongAnswer(answer);
      revealFeedback();
      return;
    }
    dispatch({ type: "answer-concept", id: concept.id, answer });
    if (checked === CONCEPTS.length - 1) {
      openQuestion(null);
    } else revealFeedback();
  }

  const fallback = <div className="electric-fallback">
    <ElectricDiagram selected={from} target={to} connections={progress.connections} />
    <p role="status">3D tidak tersedia. Gunakan kontrol sambungan.</p>
  </div>;

  return <main className="electric-shell electric-assembly" data-mobile-task-view={mobileTaskView} lang="id">
    <ElectricHud stage="assembly" progress={progress} />
    <div className="electric-mobile-view-switch" role="group" aria-label="Tampilan laboratorium">
      <button type="button" aria-pressed={!mobileTaskView} onClick={() => { setMobileTaskView(false); requestAnimationFrame(() => document.getElementById("electric-model")?.focus()); }}>Fokus model</button>
      <button type="button" aria-pressed={mobileTaskView} onClick={() => { setMobileTaskView(true); requestAnimationFrame(() => panel.current?.focus()); }}>Baca tugas</button>
    </div>
    <div className="electric-workspace">
      <section id="electric-model" tabIndex={-1} className="electric-stage" aria-label="Diorama perakitan">
        <div className="electric-stage-title">
          <p className="electric-kicker">LABORATORIUM INTERAKTIF / 02</p>
          <h1>Rakit penggerak konveyor</h1>
          <p className="electric-flow-caption">Model edukatif · Sambungan fungsional</p>
        </div>
        <div className="electric-canvas">
          <ElectricScene focus={focus} selected={from} target={to} path={null} connections={progress.connections} inspect={inspect} fallback={fallback} reset={reset} />
        </div>
        <div className="electric-scene-tools electric-assembly-tools">
          <p className="electric-legend"><span><i aria-hidden="true" /> Listrik</span><span><i aria-hidden="true" /> Mekanis</span></p>
          <ElectricCameraControls focus={focus} onFocus={setFocus} onReset={() => { setFocus(null); setReset(old => old + 1); }} />
        </div>
      </section>
      <section className="electric-assembly-panel" aria-labelledby="electric-assembly-title">
        <div className="electric-assembly-meter">
          <p className="electric-kicker">PERAKITAN MESIN</p>
          {!progress.assemblyComplete && <>
            <h2 ref={!concept ? title : undefined} tabIndex={-1} id={!concept ? "electric-assembly-title" : undefined}>Susun sambungan</h2>
            <p className="electric-assembly-instruction">Pilih sumber dan tujuan, lalu hubungkan komponen.</p>
          </>}
          <div><strong role="status">{count}/5 sambungan · {checked}/3 cek konsep</strong><span>Gulir panel ↓</span></div>
          <progress className="electric-progress" max={CONNECTIONS.length + CONCEPTS.length} value={count + checked} aria-label="Progres perakitan" />
          {!progress.assemblyComplete && <div className="electric-assembly-steps" role="group" aria-label="Langkah perakitan">
            <button type="button" aria-current={!concept && count < CONNECTIONS.length ? "step" : undefined} onClick={() => panel.current?.scrollTo({ top: 0, behavior: "smooth" })}>01 <span>Sambungan</span></button>
            <button type="button" onClick={() => { if (ledger.current) { ledger.current.open = true; ledger.current.scrollIntoView({ block: "nearest", behavior: "smooth" }); } }}>02 <span>Alur</span></button>
            <button type="button" aria-current={concept ? "step" : undefined} disabled={count < CONNECTIONS.length} onClick={() => openQuestion(CONCEPTS.findIndex(check => !progress.conceptAnswers[check.id]))}>03 <span>Cek konsep</span></button>
          </div>}
        </div>
        <div ref={panel} id="electric-controls" className="electric-assembly-body" tabIndex={0} aria-label="Panel perakitan yang dapat digulir">
          {progress.assemblyComplete ? <div className="electric-assembly-summary" role="status">
            <p className="electric-kicker"><Check size={15} aria-hidden="true" /> 5 sambungan · 3 cek benar</p>
            <h2 ref={title} tabIndex={-1} id="electric-assembly-title">Perakitan selesai</h2>
            <p>Panel menyalurkan listrik ke motor. Motor mengubahnya menjadi putaran; poros dan sabuk meneruskan putaran ke rol. Sabuk konveyor kemudian membawa benda kerja dari pemasangan ke pemeriksaan.</p>
            <p className="electric-summary-note">Sekarang uji apa yang terjadi pada produksi saat listrik, transmisi, atau konveyor terganggu.</p>
          </div> : concept ? <>
            <p className="electric-kicker">Cek konsep {questionIndex! + 1} / {CONCEPTS.length}</p>
            <h2 ref={title} tabIndex={-1} id="electric-assembly-title">{concept.question}</h2>
            <fieldset className="electric-concept-options" aria-labelledby="electric-assembly-title" disabled={Boolean(confirmedAnswer)}>
              {concept.options.map((option, index) => {
                const state = confirmedAnswer === option.id ? "correct" : wrongAnswer === option.id ? "incorrect" : answer === option.id ? "selected" : undefined;
                const descriptionId = `electric-answer-${concept.id}-${index}`;
                return <label key={option.id} className={`revo-answer-card ${state ? `is-${state}` : ""}`}>
                  <input type="radio" name={concept.id} value={option.id} aria-label={option.text} aria-describedby={descriptionId} checked={(confirmedAnswer || answer) === option.id} onChange={() => { setAnswer(option.id); setWrongAnswer(null); }} />
                  <RevoAnswerFace index={index} text={option.text} state={state} descriptionId={descriptionId} />
                </label>;
              })}
            </fieldset>
            <div ref={message} aria-live="polite" aria-atomic="true">
              {shownAnswer && <p className={`electric-assembly-feedback electric-concept-feedback is-${confirmedAnswer ? "correct" : "wrong"}`}>
                <strong>{confirmedAnswer ? "Jawaban benar." : "Belum tepat. Coba lagi."}</strong> {shownAnswer.explanation}
              </p>}
            </div>
          </> : <>
            <div className="electric-assembly-pickers">
              <label>Sumber<select value={from ?? ""} onChange={event => selectPart("from", (event.target.value || null) as ElectricPartId | null)}>
                <option value="">Pilih sumber</option>
                {PARTS.map(part => <option key={part.id} value={part.id}>{part.name}</option>)}
              </select></label>
              <label>Tujuan<select value={to ?? ""} onChange={event => selectPart("to", (event.target.value || null) as ElectricPartId | null)}>
                <option value="">Pilih tujuan</option>
                {PARTS.map(part => <option key={part.id} value={part.id}>{targetName(part.id)}</option>)}
              </select></label>
            </div>
            <details className="electric-pair-choices">
              <summary>Pilihan pasangan dari daftar</summary>
              <p>Pilih sumber, lalu coba salah satu pasangan.</p>
              <ul className="electric-pair-sources" aria-label="Sumber untuk pilihan pasangan">
                {PARTS.filter(part => PAIR_CHOICES[part.id]).map(part => <li key={part.id}><button className="electric-secondary" aria-pressed={from === part.id}
                  onClick={() => { selectPart("from", part.id); setTo(null); }}>{part.name}</button></li>)}
              </ul>
              {candidates ? <ul aria-label={`Pilihan tujuan dari ${partName(from!)}`}>
                {candidates.map(id => <li key={id}><button className="electric-secondary" aria-pressed={to === id} onClick={() => selectPart("to", id)}>{partName(from!)} → {targetName(id)}</button></li>)}
              </ul> : null}
            </details>
            <div ref={message} aria-live="polite" aria-atomic="true">
              {feedback && <p key={feedback.text} className={`electric-assembly-feedback is-${feedback.kind}`}>
                <strong>{feedback.kind === "correct" ? "Tersambung." : feedback.kind === "duplicate" ? "Sudah terpasang." : "Sambungan belum tepat."}</strong> {feedback.text}
              </p>}
            </div>
            <p className="electric-material-note">Stasiun kerja adalah bagian dari aliran barang. Sabuk transmisi memindahkan putaran; sabuk konveyor membawa benda kerja.</p>
          </>}
          <details ref={ledger} className="electric-assembly-ledger" open={progress.assemblyComplete || undefined}>
            <summary>Sambungan terpasang ({count})</summary>
            {count > 0 ? <ul>{CONNECTIONS.filter(link => progress.connections.includes(link.id)).map(link => <li key={link.id}>
              <strong>{link.id} · {PATHS[link.kind].name}</strong><span>{partName(link.from)} → {targetName(link.to)}</span>
            </li>)}</ul> : <p>Belum ada sambungan.</p>}
          </details>
          {count > 0 && <button className="electric-secondary electric-retry" onClick={() => setRetry(true)}>Ulangi Perakitan</button>}
          {status === "unavailable" && <p role="status" className="electric-material-note">Penyimpanan tidak tersedia. Progres bertahan selama sesi REVO ini.</p>}
        </div>
        <div className="electric-assembly-actions">
          {progress.assemblyComplete ? <>
            <Link className="electric-secondary" href={REVO_ROUTES.electricExplore}>Lihat Eksplorasi</Link>
            <Link className="electric-primary" href={REVO_ROUTES.electricExperiment}>Uji Penggerak <ArrowRight size={16} aria-hidden="true" /></Link>
          </>
            : concept ? <>
              <button className="electric-secondary" onClick={() => openQuestion(null)}>Sambungan</button>
              {confirmedAnswer ? <button className="electric-primary" onClick={() => openQuestion(CONCEPTS.findIndex(check => !progress.conceptAnswers[check.id]))}>Cek berikutnya <ArrowRight size={16} aria-hidden="true" /></button>
                : <button className="electric-primary" disabled={!answer || answer === wrongAnswer} onClick={checkAnswer}>Periksa jawaban</button>}
            </> : <>
              <button className={count === CONNECTIONS.length ? "electric-secondary" : "electric-primary electric-learning-action"} disabled={!from || !to} onClick={connect}><Link2 size={17} aria-hidden="true" /> Hubungkan</button>
              {count === CONNECTIONS.length && <button className="electric-primary" onClick={() => openQuestion(CONCEPTS.findIndex(check => !progress.conceptAnswers[check.id]))}>
                {checked ? "Lanjutkan Cek Konsep" : "Mulai Cek Konsep"} <ArrowRight size={16} aria-hidden="true" />
              </button>}
            </>}
        </div>
      </section>
    </div>
    {retry && <RevoDialog title="Ulangi Perakitan" onClose={() => setRetry(false)}>
      <span className="revo-kicker">RESET TAHAP</span><h2>Rakit kembali dari awal?</h2>
      <p>Sambungan dan jawaban cek konsep Industri 2.0 akan dihapus. Eksplorasi 7/7 dan progres Industri 1.0 tetap tersimpan.</p>
      {Object.keys(progress.observations).length > 0 && <p>Catatan eksperimen juga akan dihapus karena perakitan harus diselesaikan kembali.</p>}
      <div className="revo-dialog-actions">
        <button className="revo-secondary-button" onClick={() => setRetry(false)}>Batal</button>
        <button className="revo-primary-button revo-action-danger" onClick={() => {
          setRetry(false); dispatch({ type: "reset-assembly" });
          setFrom(null); setTo(null); setFeedback(null); openQuestion(null);
        }}>Hapus hasil perakitan</button>
      </div>
    </RevoDialog>}
  </main>;
}
