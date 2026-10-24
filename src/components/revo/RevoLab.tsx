"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, CircleHelp, Cog, Compass, FlaskConical, GraduationCap, Headphones, Info, LockKeyhole, Maximize2, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, RotateCw, ShieldCheck, Sparkles, Volume2, VolumeX, Wrench } from "lucide-react";
import { useSteamSimulation } from "@/hooks/useSteamSimulation";
import { useRevoAudio } from "@/hooks/useRevoAudio";
import { components, narrationText, quizQuestions } from "@/lib/revo/content";
import { REVO_ROUTES } from "@/lib/revo/routes";
import { SIMULATION } from "@/lib/simulation/simulationConstants";
import type { SteamAction } from "@/lib/simulation/steamEngine";
import type { ComponentId } from "./scene-types";
import MachineControlPanel from "./MachineControlPanel";
import MissionPanel from "./MissionPanel";
import HistoricalInfoPanel from "./HistoricalInfoPanel";
import RevoDialog from "./RevoDialog";
import QuizPanel from "./QuizPanel";
import AssemblyPanel from "./AssemblyPanel";
import RevoLevelCompleted from "./RevoLevelCompleted";
import { useRevoProgress } from "./RevoProgressProvider";
import { ASSEMBLY_CHECKS, ASSEMBLY_PARTS, assemblyComplete, assemblyReducer, canEnterStage, initialAssemblyState, type AssemblyAction } from "@/lib/revo/assembly";
import type { ResourceKind } from "@/lib/revo/resourceFilling";
import { createRevoProgress, hasSavedProgress, initialReflectionProgress, scoreReflection, type LearningCheckpoint, type ReflectionProgress } from "@/lib/revo/progress";

const FactoryScene = dynamic(() => import("./FactoryScene"), { ssr: false, loading: () => <div className="revo-scene-loading"><Cog size={30} /><span>Menyiapkan bengkel revolusi…</span></div> });
type Modal = "guide" | "history" | "complete" | "quiz" | "transmission" | "reset-level" | null;
const initialExploration = { visited: [] as ComponentId[], feedback: "Buka informasi setiap komponen untuk mencatat penemuanmu." };

export default function RevoLab({ active = true }: { active?: boolean }) {
  const { hydrated, progress: savedProgress, storageStatus, save } = useRevoProgress();
  const hadSavedProgress = hasSavedProgress(savedProgress);
  const [restored, setRestored] = useState(false);
  const restoreOnce = useRef(false);
  const [stage, setStage] = useState<LearningCheckpoint>(0);
  const [paused, setPaused] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [assembly, updateAssembly] = useReducer(assemblyReducer, undefined, initialAssemblyState);
  const assembled = assemblyComplete(assembly);
  const interactionActive = active && !paused && modal === null;
  const assemblyActive = interactionActive && stage === 1;
  const { state, filling, dispatch, restoreMissionComplete, cancelFilling } = useSteamSimulation(interactionActive && stage === 2 && assembled);
  const clockActive = interactionActive && stage === 2 && assembled && !state.missionComplete;
  const [resourceSelected, setResourceSelected] = useState<ResourceKind | null>(null);
  const audio = useRevoAudio();
  const [soundPreference, setSoundPreference] = useState(false);
  const [selected, setSelected] = useState<ComponentId | null>(null);
  const [exploration, setExploration] = useState(initialExploration);
  const visited = exploration.visited;
  const [reflection, setReflection] = useState<ReflectionProgress>(initialReflectionProgress);
  const [reducedMotion, setReducedMotion] = useState(false);
  const gameplayHeading = useRef<HTMLHeadingElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<{ kind: "reset" | "zoom-in" | "zoom-out" | "focus"; serial: number }>({ kind: "reset", serial: 0 });
  const previousEvent = useRef(-1);
  const completionShown = useRef(false);
  const current = components.find(component => component.id === selected);
  const explorationComplete = visited.length === components.length;
  const reflectionScore = reflection.resultAnswers === null ? null : scoreReflection(reflection.resultAnswers);
  const levelComplete = explorationComplete && assembled && state.missionComplete && reflection.resultAnswers !== null;

  useEffect(() => {
    if (!hydrated || restoreOnce.current) return;
    restoreOnce.current = true;
    if (savedProgress) {
      setStage(savedProgress.checkpoint);
      setExploration({ visited: savedProgress.explored, feedback: "Progres penjelajahan dipulihkan dari penyimpanan perangkat." });
      for (const id of savedProgress.assembly.placed) updateAssembly({ type: "place", id, socket: id });
      for (const check of savedProgress.assembly.checks) {
        const answers = { steam: 0, rotation: 1, factory: 2 } as const;
        updateAssembly({ type: "answer", id: check, answer: answers[check] });
      }
      setReflection(savedProgress.reflection);
      setSoundPreference(savedProgress.preferences.soundEnabled);
      if (savedProgress.experimentComplete) {
        completionShown.current = true;
        restoreMissionComplete();
      }
      if (savedProgress.checkpoint === 3) setModal("quiz");
    }
    setRestored(true);
  }, [hydrated, savedProgress, updateAssembly, restoreMissionComplete]);

  useEffect(() => {
    if (!active || !restored) return;
    const frame = window.requestAnimationFrame(() => gameplayHeading.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [active, restored]);

  useEffect(() => { if (!active || stage !== 2) cancelFilling(); }, [active, stage, cancelFilling]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const { play, setEngineSpeed, stopEffects, stopNarration } = audio;
  useEffect(() => { setEngineSpeed(clockActive ? state.speed : 0); }, [clockActive, state.speed, setEngineSpeed]);
  useEffect(() => { if (!active || paused) stopEffects(); }, [active, paused, stopEffects]);
  useEffect(() => { if (!active) stopNarration(); }, [active, stopNarration]);
  useEffect(() => {
    if (previousEvent.current === state.event.id) return;
    previousEvent.current = state.event.id;
    if (!active) return;
    if (state.event.type === "warning" || state.event.type === "emergency") play("warning");
    if (state.event.type === "started") play("start");
    if (state.event.type === "vented") play("steam");
    if (state.event.type === "fuel-added") play("coal");
    if (state.event.type === "water-added") play("water");
    if (state.missionComplete && !completionShown.current) { completionShown.current = true; play("complete"); stopNarration(); setModal("complete"); }
  }, [active, state.event, state.missionComplete, play, stopNarration]);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  const progressSnapshot = useMemo(() => createRevoProgress({
    explored: visited,
    placed: assembly.placed,
    checks: assembly.checks,
    experimentComplete: state.missionComplete,
    reflection,
    checkpoint: stage,
    soundEnabled: soundPreference,
  }), [visited, assembly.placed, assembly.checks, state.missionComplete, reflection, stage, soundPreference]);

  useEffect(() => {
    if (!restored) return;
    if (hasSavedProgress(progressSnapshot)) save(progressSnapshot);
    else if (hadSavedProgress) save(null);
  }, [restored, progressSnapshot, hadSavedProgress, save]);

  function selectComponent(id: ComponentId) {
    setResourceSelected(null);
    const name = components.find(component => component.id === id)?.name.toLowerCase() ?? "komponen ini";
    setSelected(id);
    setExploration(old => {
      const repeated = old.visited.includes(id);
      return {
        visited: repeated ? old.visited : [...old.visited, id],
        feedback: repeated ? `Kamu meninjau kembali ${name}.` : `Bagus! Kamu telah mengenal fungsi ${name}.`,
      };
    });
    setCameraCommand(old => ({ kind: "focus", serial: old.serial + 1 }));
    audio.play("click");
  }
  function action(value: SteamAction) {
    if (!clockActive) return;
    audio.play("click");
    dispatch(value);
  }
  function resetLevel() {
    dispatch({ type: "reset" }); updateAssembly({ type: "reset" }); setExploration(initialExploration); setSelected(null); setStage(0); setReflection(initialReflectionProgress()); setModal(null); setPaused(false);
    completionShown.current = false; audio.stopNarration(); setResourceSelected(null);
    setSoundPreference(false);
    if (audio.enabled) audio.toggle();
    save(null);
    setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 }));
  }
  function retryExperiment() {
    if (!assembled) return;
    dispatch({ type: "reset" }); setStage(2); setPaused(false); setModal(null); setReflection(initialReflectionProgress());
    completionShown.current = false; audio.stopNarration(); setResourceSelected(null);
  }
  function openQuiz() {
    if (!canEnterStage(3, visited.length, assembly, state.missionComplete)) return;
    setStage(3); setModal("quiz"); audio.stopNarration();
  }
  function assemblyAction(value: AssemblyAction) {
    if (!assemblyActive) return;
    const next = assemblyReducer(assembly, value);
    if (value.type === "place") {
      if (next.placed.length > assembly.placed.length) audio.play("place");
      else if (next !== assembly) audio.play("reject");
    } else if (value.type === "answer") {
      const check = ASSEMBLY_CHECKS.find(candidate => candidate.id === value.id);
      if (check && next.checkFeedback[value.id] !== assembly.checkFeedback[value.id]) audio.play(next.checkFeedback[value.id]?.correct ? "place" : "reject");
    } else audio.play("click");
    updateAssembly(value);
  }
  function retryAssembly() {
    if (!assemblyActive) return;
    updateAssembly({ type: "reset" });
    if (state.missionComplete) {
      // Completed Experiment depends on the finished Assembly. Revoke those
      // downstream stages if the student explicitly clears the assembly.
      dispatch({ type: "reset" });
      setReflection(initialReflectionProgress());
      completionShown.current = false;
    } else {
      // A partial experiment belongs to the active session and stays intact;
      // entering Assembly has already paused its clock and filling timeline.
      dispatch({ type: "stop" });
    }
    setStage(1);
    setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 }));
  }
  function enterExperiment() {
    if (!canEnterStage(2, visited.length, assembly, state.missionComplete)) return;
    dispatch({ type: "stop" });
    setStage(2);
    setPaused(false);
    setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 }));
  }
  function enterStage(next: number) {
    if (!active || modal) return;
    if (next === 4) {
      if (!levelComplete) return;
      setStage(4); setResourceSelected(null); setModal(null); return;
    }
    if (!canEnterStage(next, visited.length, assembly, state.missionComplete)) return;
    if (next === 3) { openQuiz(); return; }
    if (next === 1 && stage !== 1) dispatch({ type: "stop" });
    setStage(next as LearningCheckpoint);
    setResourceSelected(null);
    setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 }));
  }
  function closeQuiz() {
    setModal(null);
    if (levelComplete) setStage(4);
  }
  function toggleAudio() {
    setSoundPreference(!audio.enabled);
    audio.toggle();
  }
  const explorationFeedback = explorationComplete
    ? "Seluruh komponen berhasil dipelajari. Saatnya merangkai sistem penggerak mesin."
    : exploration.feedback;
  const hint = paused ? "Simulasi dijeda. Tekan lanjutkan untuk meneruskan percobaan tanpa kehilangan progres."
    : stage === 1 ? assembled ? "Perakitan selesai. Ikuti aliran energi dari ketel sampai mesin tekstil, lalu pilih UJI MESIN." : "Pilih komponen dan hubungan yang tepat. Seret dari baki 3D, atau gunakan inventaris, sambungan tujuan, dan tombol Pasang komponen."
    : state.missionComplete ? "Selamat! Target produksi tercapai dengan aman. Saatnya melihat gambaran besarnya."
    : stage === 0 ? explorationComplete ? "Eksplorasi lengkap. Lanjutkan ke tahap Perakitan untuk menghubungkan komponen." : "Jelajahi lima komponen mesin untuk membuka Perakitan."
    : state.unsafeCount > 0 ? "Batas aman terlewati. Lepaskan tekanan dan kurangi bahan bakar, lalu ulangi misi untuk mencoba lagi."
    : state.water <= SIMULATION.lowWater ? "Persediaan air rendah. Tambahkan air agar mesin tetap beroperasi."
    : state.fuel <= SIMULATION.lowFuel ? "Bahan bakar menipis. Tambahkan secukupnya agar produksi tetap berjalan."
    : state.pressure > SIMULATION.safePressure ? "Tekanan uap meningkat. Kurangi bahan bakar atau lepaskan tekanan."
    : state.running ? "Perhatikan roda dan piston. Energi uap kini berubah menjadi gerakan yang menghasilkan kain."
    : state.elapsed > 0 ? "Mesin berhenti. Periksa air, bahan bakar, dan tekanan; nyalakan kembali saat aman."
    : "Nyalakan mesin uap dan amati perubahan tekanan, gerak, serta produksi kain.";
  const liveFeedback = stage === 0 ? explorationFeedback : stage === 1 ? paused ? "Perakitan dijeda. Progres pemasangan dan pemahaman tetap tersimpan." : assembly.feedback : paused ? "Waktu, persediaan, dan produksi berhenti selama jeda." : state.event.message;

  if (!restored) return <main className="revo-progress-loading" lang="id" aria-busy="true"><Cog size={24} /><span>Memulihkan progres belajar…</span></main>;
  if (stage === 4 && levelComplete) return <RevoLevelCompleted
    explored={visited.length}
    installed={assembly.placed.length}
    checks={assembly.checks.length}
    experimentComplete={state.missionComplete}
    quizScore={reflectionScore ?? 0}
    quizTotal={quizQuestions.length}
    onReviewReflection={() => { setStage(3); setModal("quiz"); }}
    onReplay={resetLevel}
  />;

  return <main className="revo-app revo-hud" lang="id">
    <a className="revo-skip" href="#revo-controls">Langsung ke kendali mesin</a>
    <header className="revo-header revo-hud-header">
      <Link className="revo-brand" href={REVO_ROUTES.menu} aria-label="REVO — Jelajah Revolusi Industri"><span className="revo-brand-symbol"><Cog size={26} strokeWidth={2.3} /></span><strong>REVO<span>®</span></strong><i /><small>Jelajah Revolusi<br />Industri</small></Link>
      <div className="revo-hud-title"><span>INDUSTRY 1.0 · REVOLUSI INDUSTRI PERTAMA</span><h1 ref={gameplayHeading} tabIndex={-1}>THE AGE OF <span>STEAM<span className="revo-title-dot">.</span></span></h1></div>
      <nav aria-label="Navigasi laboratorium"><Link className="revo-back-menu" href={REVO_ROUTES.menu}><ArrowRight size={13} style={{ transform: "rotate(180deg)" }} />Kembali ke Menu</Link><button onClick={() => setModal("guide")}>Panduan belajar<CircleHelp size={15} /></button></nav>
    </header>
    <section id="revo-workspace" className="revo-workspace revo-hud-workspace" aria-label="Laboratorium interaktif">
        <div className="revo-stage-bar">
          <div className="revo-stages" role="tablist" aria-label="Tahap belajar">
            {[{ name: "Eksplorasi", icon: Compass }, { name: "Perakitan", icon: Wrench }, { name: "Eksperimen", icon: FlaskConical }, { name: "Refleksi", icon: GraduationCap }].map((item, index) => {
              const locked = !canEnterStage(index, visited.length, assembly, state.missionComplete);
              return <button key={item.name} id={`revo-stage-${index}`} role="tab" tabIndex={stage === index ? 0 : -1}
                onKeyDown={event => {
                  const available = [0, 1, 2, 3].filter(next => canEnterStage(next, visited.length, assembly, state.missionComplete));
                  let next: number;
                  if (event.key === "ArrowRight") next = available[(available.indexOf(index) + 1) % available.length];
                  else if (event.key === "ArrowLeft") next = available[(available.indexOf(index) + available.length - 1) % available.length];
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = available[available.length - 1];
                  else return;
                  event.preventDefault();
                  document.getElementById(`revo-stage-${next}`)?.focus();
                  enterStage(next);
                }}
                aria-controls="revo-learning-panel" aria-selected={stage === index} disabled={locked} onClick={() => enterStage(index)}>
                <span className="revo-stage-number">{index === 0 && explorationComplete || index === 1 && assembled || index === 2 && state.missionComplete || index === 3 && reflection.resultAnswers !== null ? <Check size={13} /> : `0${index + 1}`}</span>
                {item.name}{locked && <LockKeyhole size={11} />}
              </button>;
            })}
          </div>
          <div className="revo-lab-tools"><span className="revo-session-label"><span />LABORATORIUM INTERAKTIF</span>{storageStatus === "unavailable" ? <span className="revo-save-status" role="status">PROGRES HANYA DI SESI INI</span> : savedProgress && <span className="revo-save-status" role="status">TERSIMPAN DI PERANGKAT</span>}
            <div className="revo-workspace-actions"><span className="revo-era-chip"><i />ERA 01 <span>/</span> 1760–1840</span>
              <button className="revo-icon-button" onClick={toggleAudio} aria-label={audio.enabled ? "Matikan suara" : soundPreference ? "Aktifkan suara tersimpan" : "Aktifkan suara"} aria-pressed={audio.enabled} title={audio.enabled ? "Matikan suara" : soundPreference ? "Aktifkan suara tersimpan setelah memuat ulang" : "Aktifkan suara"}>{audio.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
              <button className="revo-icon-button revo-pause-button" onClick={() => setPaused(value => !value)} disabled={stage !== 1 && stage !== 2 || stage === 2 && state.missionComplete} aria-label={paused ? "Lanjutkan simulasi" : "Jeda simulasi"} data-paused={paused} title={paused ? "Lanjutkan simulasi" : "Jeda simulasi"}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
              <button className="revo-reset" aria-label="Reset mesin" title="Reset kondisi mesin; progres misi tetap tersimpan" disabled={!clockActive} onClick={() => action({ type: "machine-reset" })}><RotateCcw size={15} /><span>Reset mesin</span></button>
              <button className="revo-icon-button" aria-label="Ulangi seluruh level" title="Ulangi seluruh Industry 1.0" onClick={() => setModal("reset-level")}><RotateCw size={16} /></button>
            </div>
          </div>
        </div>
        <div className={`revo-lab-grid ${stage === 1 ? "revo-assembly-grid" : ""} ${expanded ? "revo-lab-expanded" : ""}`} id="revo-learning-panel" role="tabpanel" aria-labelledby={`revo-stage-${stage}`}>
          <div className={`revo-exhibit ${expanded ? "revo-exhibit-expanded" : ""}`}>
            <div className="revo-exhibit-title"><div><span className="revo-kicker">{stage === 0 ? "KENALI SETIAP BAGIANNYA" : stage === 1 ? "PERAKITAN MESIN" : "ENERGI MENJADI GERAK"}</span><h2>{stage === 1 ? assembled ? "Sistem siap diuji" : "Hubungkan sistem penggerak" : "Bengkel yang mengubah dunia"}</h2></div><span className="revo-location">INGGRIS, MODEL ±1800</span></div>
            <div className="revo-scene" aria-label="Diorama pabrik mesin uap 3D. Gunakan tombol komponen untuk menjelajah dengan keyboard.">{active && <FactoryScene speed={state.speed} heat={state.heat} pressure={state.pressure} water={state.water} running={state.running} animationActive={clockActive} safety={state.safety} selected={stage === 1 ? null : selected} onSelect={selectComponent} onTransmissionInfo={() => setModal("transmission")} assembly={stage === 1 ? { state: assembly, enabled: assemblyActive, onAction: assemblyAction } : undefined} resources={stage === 2 ? { filling, enabled: clockActive && !state.missionComplete, selected: resourceSelected, onSelect: kind => { setResourceSelected(kind); setSelected(null); }, onFill: kind => action({ type: kind === "coal" ? "add-fuel" : "add-water" }) } : undefined} cameraCommand={cameraCommand} reducedMotion={reducedMotion} />}</div>
            <div className="revo-scene-bottom"><div className="revo-orbit-hint"><MousePointer2 size={13} /><span>Geser untuk memutar<i />Gulir untuk mendekat</span></div><div className="revo-camera-tools"><button aria-label="Perkecil tampilan" title="Perkecil" onClick={() => setCameraCommand(old => ({ kind: "zoom-out", serial: old.serial + 1 }))}><Minus size={16} /></button><button aria-label="Perbesar tampilan" title="Perbesar" onClick={() => setCameraCommand(old => ({ kind: "zoom-in", serial: old.serial + 1 }))}><Plus size={16} /></button><i /><button aria-label="Reset kamera" title="Reset kamera" onClick={() => { setSelected(null); setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 })); }}><RotateCcw size={15} /></button><button aria-label={expanded ? "Kecilkan diorama" : "Perluas diorama"} title="Perluas diorama" aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><Maximize2 size={15} /></button></div></div>
            {stage !== 1 && current && <div className="revo-component-info" aria-live="polite"><div className="revo-component-info-number">{current.number}</div><div><span className="revo-kicker">{current.subtitle}</span><h2>{current.name}</h2></div><p>{current.description}</p><div className="revo-component-role"><span>PERAN DALAM MESIN</span><p>{current.role}</p></div><div className="revo-component-actions"><button onClick={() => setSelected(null)} aria-label="Tutup informasi komponen"><span aria-hidden="true">×</span></button><button onClick={() => { const index = components.findIndex(component => component.id === selected); selectComponent(components[(index + 1) % components.length].id); }} aria-label="Jelajahi komponen berikutnya"><ArrowRight size={19} /></button></div></div>}
            {stage === 1 ? <><div className="revo-assembly-flow" aria-label="Aliran energi"><strong>{assembled ? "ALIRAN ENERGI" : "BAKI KOMPONEN · SERET KE SAMBUNGAN"}</strong>{assembled && ASSEMBLY_PARTS.map((part, index) => <span key={part.id}>{index > 0 && <ArrowRight size={11} />}{part.name}</span>)}</div><p className="revo-assembly-caption">Model hubungan sederhana; engkol, poros, dan sabuk ditampilkan sebagai skema.</p>{paused && <div className="revo-assembly-paused"><strong>PERAKITAN DIJEDA</strong><button onClick={() => setPaused(false)}>Lanjutkan perakitan</button></div>}</> : <div className="revo-component-list" aria-label="Pilih komponen mesin">{components.map(component => <button key={component.id} onClick={() => selectComponent(component.id)} aria-pressed={selected === component.id}><span>{visited.includes(component.id) ? <Check size={11} /> : component.number}</span>{{ boiler: "Ketel uap", flywheel: "Roda gila", piston: "Piston", pipe: "Pipa uap", textile: "Mesin tekstil" }[component.id]}<ArrowUpRight size={12} /></button>)}</div>}
          </div>
          {stage === 1 ? <AssemblyPanel state={assembly} enabled={assemblyActive} onAction={assemblyAction} onExperiment={enterExperiment} onReset={retryAssembly} /> : <div className="revo-hud-sidebar">
            <div id="revo-controls" className="revo-hud-controls"><MachineControlPanel state={state} filling={filling} onAction={action} lockedReason={!explorationComplete ? "Jelajahi 5 komponen dahulu" : !assembled ? "Selesaikan Perakitan dahulu" : stage !== 2 ? "Pilih tahap Eksperimen" : !interactionActive ? "Simulasi dijeda" : null} /><details className="revo-hud-history"><summary><BookOpen size={17} />Konteks sejarah<ArrowRight size={15} /></summary><HistoricalInfoPanel onHistory={() => setModal("history")} /></details></div>
            <MissionPanel state={state} visited={visited.length} stage={stage} canAssemble={explorationComplete} assembled={assembled} onAssembly={() => enterStage(1)} onQuiz={openQuiz} onReset={retryExperiment} />
          </div>}
        </div>
        <div className={`revo-learning-note ${state.safety !== "safe" ? "revo-learning-warning" : ""}`}><div className="revo-note-icon">{state.safety !== "safe" ? <Info size={19} /> : <Sparkles size={19} />}</div><div><span>{state.safety !== "safe" ? "PERHATIKAN MESINMU" : "CATATAN PENJELAJAH"}</span><p>{hint}</p><p className="revo-live-feedback" role="status" aria-live="polite">{liveFeedback}</p></div><button onClick={() => setModal("guide")} aria-label="Buka bantuan"><CircleHelp size={19} /></button></div>
    </section>
    {modal === "reset-level" && <RevoDialog active={active} title="Ulangi seluruh Industry 1.0" onClose={() => setModal(null)}><div className="revo-dialog-emblem"><RotateCw size={28} /></div><span className="revo-kicker">RESET SELURUH LEVEL</span><h2>Mulai kembali<br />dari awal?</h2><p>Eksplorasi, perakitan, hasil misi, dan refleksi Industry 1.0 yang tersimpan di perangkat akan dihapus. Reset mesin dan ulangi misi hanya mengatur percobaan, bukan seluruh level.</p><div className="revo-dialog-actions"><button className="revo-secondary-button" onClick={() => setModal(null)}>Pertahankan progres</button><button className="revo-primary-button" onClick={resetLevel}>Ulangi Level<ArrowRight size={16} /></button></div></RevoDialog>}
    {modal === "guide" && <RevoDialog active={active} title="Panduan belajar" onClose={() => setModal(null)} wide><span className="revo-kicker">PANDUAN PENJELAJAH</span><h2>Belajar dengan<br />menggerakkan sejarah.</h2><div className="revo-guide-steps"><div><span>01</span><h3>Kenali mesinnya</h3><p>Klik lima penanda atau tombol komponen. Geser diorama untuk memutar, gulir untuk memperbesar, atau gunakan tombol kamera.</p></div><div><span>02</span><h3>Rangkai, lalu jalankan</h3><p>Setelah 5/5 eksplorasi, buka Perakitan. Seret komponen dari baki 3D, atau pilih komponen dan sambungan tujuan lalu tekan Pasang komponen. Lengkapi tiga cek pemahaman, pilih UJI MESIN, lalu nyalakan mesin di Eksperimen. Pilih batu bara atau pompa air di diorama untuk mengisi; tombol Tambah juga tersedia. Tunggu pengisian selesai. Tambahkan air saat menipis, kendalikan bahan bakar, dan jaga tekanan ≤ {SIMULATION.safePressure} sampai mencapai {SIMULATION.missionTarget} unit.</p></div><div><span>03</span><h3>Hubungkan dengan dunia</h3><p>Selesaikan misi untuk membuka tiga pertanyaan refleksi. Jika melewati batas aman, ulangi misi tanpa mengulang eksplorasi.</p></div></div><p className="revo-guide-note"><Info size={16} />Percobaan hanya berjalan saat tab terlihat dan Eksperimen aktif. Jeda, dialog, atau kembali ke menu menghentikan waktu simulasi. Lepaskan tekanan dan kurangi bahan bakar jika perlu.</p><button className="revo-primary-button" onClick={() => setModal(null)}>Mulai menjelajah<ArrowRight size={16} /></button></RevoDialog>}
    {modal === "transmission" && <RevoDialog active={active} title="Transmisi Tenaga" onClose={() => setModal(null)} wide><span className="revo-kicker">JALUR TENAGA MEKANIS</span><h2>Uap bergerak.<br />Mesin tenun bekerja.</h2><ol className="revo-energy-flow" aria-label="Aliran energi: uap, piston, engkol, roda gila, sabuk, poros transmisi, roda gigi siku, mesin tenun">{["Uap", "Piston", "Engkol", "Roda gila", "Sabuk", "Poros atas", "Roda gigi siku", "Mesin tenun"].map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong>{index < 7 && <ArrowRight size={13} aria-hidden="true" />}</li>)}</ol><p>Tenaga putar dari mesin uap disalurkan melalui puli (pulley), sabuk, dan poros transmisi untuk menggerakkan mesin tenun. Piston mendorong engkol; roda gila meratakan putaran. Poros dan sabuk membawa gerak itu ke poros penggerak alat tenun.</p><p>Model ini menyederhanakan beberapa tata transmisi pabrik yang berbeda menjadi satu rangkaian untuk memperlihatkan hubungan antarkomponen. Letak poros dan sabuk berubah menurut bangunan, mesin, dan masa.</p><button className="revo-primary-button" onClick={() => setModal(null)}>Kembali ke mesin<ArrowRight size={16} /></button></RevoDialog>}
    {modal === "history" && <RevoDialog active={active} title="Cerita tenaga uap" onClose={() => { audio.stopNarration(); setModal(null); }} wide><span className="revo-kicker">DARI BENGKEL KE DUNIA</span><h2>Ketika uap<br />mengubah kehidupan.</h2><div className="revo-narration"><Headphones size={19} /><span>Dengarkan cerita</span><button onClick={toggleAudio} aria-pressed={audio.enabled}>{audio.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}{audio.enabled ? "Matikan suara" : "Aktifkan suara"}</button><button onClick={() => audio.narrate(narrationText)}><AudioLines size={15} />{audio.narrationPlayback === "idle" ? "Putar / ulangi" : "Putar ulang"}</button>{audio.narrationPlayback === "playing" && <button onClick={audio.pauseNarration}><Pause size={15} />Jeda narasi</button>}{audio.narrationPlayback === "paused" && <button onClick={audio.resumeNarration}><Play size={15} />Lanjutkan narasi</button>}<button onClick={audio.stopNarration} disabled={audio.narrationPlayback === "idle"}>Hentikan</button></div><p className="revo-narration-status" role="status" aria-live="polite">{audio.narrationStatus}</p><p className="revo-transcript"><strong>Transkrip</strong><br />{narrationText}</p><div className="revo-history-sources"><BookOpen size={16} /><span>Jelajahi koleksi: <a href="https://blog.sciencemuseum.org.uk/james-watt-high-street-fashion/" target="_blank" rel="noreferrer">Science Museum<ArrowUpRight size={12} /></a> · <a href="https://blog.scienceandindustrymuseum.org.uk/manchester-our-rainy-city/" target="_blank" rel="noreferrer">Science and Industry Museum<ArrowUpRight size={12} /></a></span></div></RevoDialog>}
    {modal === "complete" && <RevoDialog active={active} title="Misi berhasil" onClose={() => setModal(null)}><div className="revo-dialog-emblem"><ShieldCheck size={32} /></div><span className="revo-kicker">MISI SELESAI</span><h2>Kamu menggerakkan<br />sebuah perubahan.</h2><p>Selamat! Kamu telah menyelesaikan simulasi Revolusi Industri 1.0. Tenaga uap menghasilkan 100 unit kain dengan tekanan tetap aman.</p><div className="revo-results-strip"><span><strong>{Math.floor(state.production)}</strong>unit kain</span><span><strong>{Math.round(state.peakPressure)}</strong>tekanan tertinggi</span><span><strong>{Math.round(state.elapsed)}</strong>detik percobaan</span></div><p>Produksi mekanis membuat barang dapat diproduksi dalam jumlah lebih besar. Namun, kehidupan pekerja juga berubah. Mari pikirkan dampaknya.</p><button className="revo-primary-button" onClick={openQuiz}>Lanjut refleksi<ArrowRight size={16} /></button></RevoDialog>}
    {modal === "quiz" && <RevoDialog active={active} title="Refleksi dan evaluasi" onClose={closeQuiz} wide><QuizPanel progress={reflection} onProgress={next => setReflection(next)} onClose={closeQuiz} onComplete={() => { audio.play("level-complete"); }} /></RevoDialog>}
  </main>;
}
