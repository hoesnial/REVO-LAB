"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, CircleHelp, Cog, Compass, FlaskConical, GraduationCap, Headphones, Info, LockKeyhole, Maximize2, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, ShieldCheck, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useSteamSimulation } from "@/hooks/useSteamSimulation";
import { useRevoAudio } from "@/hooks/useRevoAudio";
import { components, narrationText } from "@/lib/revo/content";
import { REVO_ROUTES } from "@/lib/revo/routes";
import { SIMULATION } from "@/lib/simulation/simulationConstants";
import type { SteamAction } from "@/lib/simulation/steamEngine";
import type { ComponentId } from "./scene-types";
import MachineControlPanel from "./MachineControlPanel";
import MissionPanel from "./MissionPanel";
import HistoricalInfoPanel from "./HistoricalInfoPanel";
import RevoDialog from "./RevoDialog";
import QuizPanel from "./QuizPanel";

const FactoryScene = dynamic(() => import("./FactoryScene"), { ssr: false, loading: () => <div className="revo-scene-loading"><Cog size={30} /><span>Menyiapkan bengkel revolusi…</span></div> });
type Modal = "guide" | "history" | "reset" | "complete" | "quiz" | null;
const initialExploration = { visited: [] as ComponentId[], feedback: "Buka informasi setiap komponen untuk mencatat penemuanmu." };

export default function RevoLab({ active = true }: { active?: boolean }) {
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const clockActive = active && stage === 1 && !paused && modal === null;
  const { state, dispatch } = useSteamSimulation(clockActive);
  const audio = useRevoAudio();
  const [selected, setSelected] = useState<ComponentId | null>(null);
  const [exploration, setExploration] = useState(initialExploration);
  const visited = exploration.visited;
  const [score, setScore] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<{ kind: "reset" | "zoom-in" | "zoom-out" | "focus"; serial: number }>({ kind: "reset", serial: 0 });
  const previousEvent = useRef(-1);
  const completionShown = useRef(false);
  const current = components.find(component => component.id === selected);
  const explorationComplete = visited.length === components.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const { play, setEngineSpeed, stopNarration } = audio;
  useEffect(() => { setEngineSpeed(clockActive ? state.speed : 0); }, [clockActive, state.speed, setEngineSpeed]);
  useEffect(() => { if (!active) stopNarration(); }, [active, stopNarration]);
  useEffect(() => {
    if (!active || previousEvent.current === state.event.id) return;
    previousEvent.current = state.event.id;
    if (state.event.type === "warning" || state.event.type === "emergency") play("warning");
    if (state.event.type === "started") play("start");
    if (state.event.type === "vented") play("steam");
    if (state.missionComplete && !completionShown.current) { completionShown.current = true; play("complete"); stopNarration(); setModal("complete"); }
  }, [active, state.event, state.missionComplete, play, stopNarration]);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  function selectComponent(id: ComponentId) {
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
  function reset() {
    dispatch({ type: "reset" }); setExploration(initialExploration); setSelected(null); setStage(0); setScore(null); setModal(null); setPaused(false);
    completionShown.current = false; audio.stopNarration();
    setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 }));
  }
  function retryExperiment() {
    dispatch({ type: "reset" }); setStage(1); setPaused(false); setModal(null); setScore(null);
    completionShown.current = false; audio.stopNarration();
  }
  function openQuiz() {
    if (!state.missionComplete) return;
    setStage(2); setModal("quiz"); audio.stopNarration();
  }
  function enterStage(next: number) {
    if (next === 0) setStage(0);
    if (next === 1 && explorationComplete) setStage(1);
    if (next === 2) openQuiz();
  }
  const explorationFeedback = explorationComplete
    ? "Seluruh komponen berhasil dipelajari. Saatnya mengoperasikan mesin."
    : exploration.feedback;
  const hint = paused ? "Simulasi dijeda. Tekan lanjutkan untuk meneruskan percobaan tanpa kehilangan progres."
    : state.missionComplete ? "Selamat! Target produksi tercapai dengan aman. Saatnya melihat gambaran besarnya."
    : stage === 0 ? explorationComplete ? "Eksplorasi lengkap. Lanjutkan ke tahap Eksperimen untuk menjalankan pabrik." : "Jelajahi lima komponen mesin untuk membuka kendali eksperimen."
    : state.unsafeCount > 0 ? "Batas aman terlewati. Lepaskan tekanan dan kurangi bahan bakar, lalu ulangi misi untuk mencoba lagi."
    : state.water <= SIMULATION.lowWater ? "Persediaan air rendah. Tambahkan air agar mesin tetap beroperasi."
    : state.fuel <= SIMULATION.lowFuel ? "Bahan bakar menipis. Tambahkan secukupnya agar produksi tetap berjalan."
    : state.pressure > SIMULATION.safePressure ? "Tekanan uap meningkat. Kurangi bahan bakar atau lepaskan tekanan."
    : state.running ? "Perhatikan roda dan piston. Energi uap kini berubah menjadi gerakan yang menghasilkan kain."
    : state.elapsed > 0 ? "Mesin berhenti. Periksa air, bahan bakar, dan tekanan; nyalakan kembali saat aman."
    : "Nyalakan mesin uap dan amati perubahan tekanan, gerak, serta produksi kain.";
  const liveFeedback = stage === 0 ? explorationFeedback : paused ? "Waktu, persediaan, dan produksi berhenti selama jeda." : state.event.message;

  return <main className="revo-app revo-hud" lang="id">
    <a className="revo-skip" href="#revo-controls">Langsung ke kendali mesin</a>
    <header className="revo-header revo-hud-header">
      <Link className="revo-brand" href={REVO_ROUTES.menu} aria-label="REVO — Jelajah Revolusi Industri"><span className="revo-brand-symbol"><Cog size={26} strokeWidth={2.3} /></span><strong>REVO<span>®</span></strong><i /><small>Jelajah Revolusi<br />Industri</small></Link>
      <div className="revo-hud-title"><span>INDUSTRY 1.0 · REVOLUSI INDUSTRI PERTAMA</span><h1>THE AGE OF <span>STEAM<span className="revo-title-dot">.</span></span></h1></div>
      <nav aria-label="Navigasi laboratorium"><Link className="revo-back-menu" href={REVO_ROUTES.menu}><ArrowRight size={13} style={{ transform: "rotate(180deg)" }} />Kembali ke Menu</Link><button onClick={() => setModal("guide")}>Panduan belajar<CircleHelp size={15} /></button></nav>
    </header>
    <section id="revo-workspace" className="revo-workspace revo-hud-workspace" aria-label="Laboratorium interaktif">
        <div className="revo-stage-bar">
          <div className="revo-stages" role="tablist" aria-label="Tahap belajar">
            {[{ name: "Eksplorasi", icon: Compass }, { name: "Eksperimen", icon: FlaskConical }, { name: "Refleksi", icon: GraduationCap }].map((item, index) => {
              const locked = index === 1 && !explorationComplete || index === 2 && !state.missionComplete;
              return <button key={item.name} id={`revo-stage-${index}`} role="tab" tabIndex={stage === index ? 0 : -1}
                onKeyDown={event => {
                  const available = [0, ...(explorationComplete ? [1] : []), ...(state.missionComplete ? [2] : [])];
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
                <span className="revo-stage-number">{index === 0 && explorationComplete || index === 1 && state.missionComplete || index === 2 && score !== null ? <Check size={13} /> : `0${index + 1}`}</span>
                {item.name}{locked && <LockKeyhole size={11} />}
              </button>;
            })}
          </div>
          <div className="revo-lab-tools"><span className="revo-session-label"><span />LABORATORIUM INTERAKTIF</span>
            <div className="revo-workspace-actions"><span className="revo-era-chip"><i />ERA 01 <span>/</span> 1760–1840</span>
              <button className="revo-icon-button" onClick={audio.toggle} aria-label={audio.enabled ? "Matikan suara" : "Aktifkan suara"} aria-pressed={audio.enabled} title={audio.enabled ? "Matikan suara" : "Aktifkan suara"}>{audio.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
              <button className="revo-icon-button revo-pause-button" onClick={() => setPaused(value => !value)} disabled={stage !== 1 || state.missionComplete} aria-label={paused ? "Lanjutkan simulasi" : "Jeda simulasi"} data-paused={paused} title={paused ? "Lanjutkan simulasi" : "Jeda simulasi"}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
              <button className="revo-reset" aria-label="Mulai ulang" onClick={() => setModal("reset")}><RotateCcw size={15} /><span>Mulai ulang</span></button>
            </div>
          </div>
        </div>
        <div className={`revo-lab-grid ${expanded ? "revo-lab-expanded" : ""}`} id="revo-learning-panel" role="tabpanel" aria-labelledby={`revo-stage-${stage}`}>
          <div className={`revo-exhibit ${expanded ? "revo-exhibit-expanded" : ""}`}>
            <div className="revo-exhibit-title"><div><span className="revo-kicker">{stage === 0 ? "KENALI SETIAP BAGIANNYA" : "ENERGI MENJADI GERAK"}</span><h2>Bengkel yang mengubah dunia</h2></div><span className="revo-location">INGGRIS, ±1780</span></div>
            <div className="revo-scene" aria-label="Diorama pabrik mesin uap 3D. Gunakan tombol komponen untuk menjelajah dengan keyboard.">{active && <FactoryScene speed={clockActive ? state.speed : 0} heat={state.heat} pressure={state.pressure} running={clockActive && state.running} safety={state.safety} selected={selected} onSelect={selectComponent} cameraCommand={cameraCommand} reducedMotion={reducedMotion} />}</div>
            <div className="revo-scene-bottom"><div className="revo-orbit-hint"><MousePointer2 size={13} /><span>Geser untuk memutar<i />Gulir untuk mendekat</span></div><div className="revo-camera-tools"><button aria-label="Perkecil tampilan" title="Perkecil" onClick={() => setCameraCommand(old => ({ kind: "zoom-out", serial: old.serial + 1 }))}><Minus size={16} /></button><button aria-label="Perbesar tampilan" title="Perbesar" onClick={() => setCameraCommand(old => ({ kind: "zoom-in", serial: old.serial + 1 }))}><Plus size={16} /></button><i /><button aria-label="Reset kamera" title="Reset kamera" onClick={() => { setSelected(null); setCameraCommand(old => ({ kind: "reset", serial: old.serial + 1 })); }}><RotateCcw size={15} /></button><button aria-label={expanded ? "Kecilkan diorama" : "Perluas diorama"} title="Perluas diorama" aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><Maximize2 size={15} /></button></div></div>
            {current && <div className="revo-component-info" aria-live="polite"><div className="revo-component-info-number">{current.number}</div><div><span className="revo-kicker">{current.subtitle}</span><h2>{current.name}</h2></div><p>{current.description}</p><div className="revo-component-role"><span>PERAN DALAM MESIN</span><p>{current.role}</p></div><div className="revo-component-actions"><button onClick={() => setSelected(null)} aria-label="Tutup informasi komponen"><span aria-hidden="true">×</span></button><button onClick={() => { const index = components.findIndex(component => component.id === selected); selectComponent(components[(index + 1) % components.length].id); }} aria-label="Jelajahi komponen berikutnya"><ArrowRight size={19} /></button></div></div>}
            <div className="revo-component-list" aria-label="Pilih komponen mesin">{components.map(component => <button key={component.id} onClick={() => selectComponent(component.id)} aria-pressed={selected === component.id}><span>{visited.includes(component.id) ? <Check size={11} /> : component.number}</span>{{ boiler: "Ketel uap", flywheel: "Roda gila", piston: "Piston", pipe: "Pipa uap", textile: "Mesin tekstil" }[component.id]}<ArrowUpRight size={12} /></button>)}</div>
          </div>
          <div className="revo-hud-sidebar">
            <div id="revo-controls" className="revo-hud-controls"><MachineControlPanel state={state} onAction={action} lockedReason={!explorationComplete ? "Jelajahi 5 komponen dahulu" : stage !== 1 ? "Pilih tahap Eksperimen" : paused ? "Simulasi dijeda" : null} /><details className="revo-hud-history"><summary><BookOpen size={17} />Konteks sejarah<ArrowRight size={15} /></summary><HistoricalInfoPanel onHistory={() => setModal("history")} /></details></div>
            <MissionPanel state={state} visited={visited.length} stage={stage} canExperiment={explorationComplete} onExperiment={() => enterStage(1)} onQuiz={openQuiz} onReset={retryExperiment} />
          </div>
        </div>
        <div className={`revo-learning-note ${state.safety !== "safe" ? "revo-learning-warning" : ""}`}><div className="revo-note-icon">{state.safety !== "safe" ? <Info size={19} /> : <Sparkles size={19} />}</div><div><span>{state.safety !== "safe" ? "PERHATIKAN MESINMU" : "CATATAN PENJELAJAH"}</span><p>{hint}</p><p className="revo-live-feedback" role="status" aria-live="polite">{liveFeedback}</p></div><button onClick={() => setModal("guide")} aria-label="Buka bantuan"><CircleHelp size={19} /></button></div>
    </section>
    {modal === "reset" && <RevoDialog active={active} title="Mulai ulang laboratorium" onClose={() => setModal(null)}><div className="revo-dialog-emblem"><RotateCcw size={28} /></div><span className="revo-kicker">PERCOBAAN BARU</span><h2>Setiap revolusi<br />punya awal.</h2><p>Mulai ulang mesin, produksi, komponen yang dijelajahi, dan hasil evaluasi untuk percobaan baru.</p><div className="revo-dialog-actions"><button className="revo-secondary-button" onClick={() => setModal(null)}>Lanjutkan percobaan</button><button className="revo-primary-button" onClick={reset}>Mulai ulang<ArrowRight size={16} /></button></div></RevoDialog>}
    {modal === "guide" && <RevoDialog active={active} title="Panduan belajar" onClose={() => setModal(null)} wide><span className="revo-kicker">PANDUAN PENJELAJAH</span><h2>Belajar dengan<br />menggerakkan sejarah.</h2><div className="revo-guide-steps"><div><span>01</span><h3>Kenali mesinnya</h3><p>Klik lima penanda atau tombol komponen. Geser diorama untuk memutar, gulir untuk memperbesar, atau gunakan tombol kamera.</p></div><div><span>02</span><h3>Jalankan pabrik</h3><p>Setelah 5/5 komponen, lanjut ke Eksperimen dan nyalakan mesin. Tambahkan air saat menipis, kendalikan bahan bakar, dan jaga tekanan ≤ {SIMULATION.safePressure} sampai mencapai {SIMULATION.missionTarget} unit.</p></div><div><span>03</span><h3>Hubungkan dengan dunia</h3><p>Selesaikan misi untuk membuka tiga pertanyaan refleksi. Jika melewati batas aman, ulangi misi tanpa mengulang eksplorasi.</p></div></div><p className="revo-guide-note"><Info size={16} />Percobaan hanya berjalan saat tab terlihat dan Eksperimen aktif. Jeda, dialog, atau kembali ke menu menghentikan waktu simulasi. Lepaskan tekanan dan kurangi bahan bakar jika perlu.</p><button className="revo-primary-button" onClick={() => setModal(null)}>Mulai menjelajah<ArrowRight size={16} /></button></RevoDialog>}
    {modal === "history" && <RevoDialog active={active} title="Cerita tenaga uap" onClose={() => { audio.stopNarration(); setModal(null); }} wide><span className="revo-kicker">DARI BENGKEL KE DUNIA</span><h2>Ketika uap<br />mengubah kehidupan.</h2><div className="revo-narration"><Headphones size={19} /><span>Dengarkan cerita</span><button onClick={audio.toggle} aria-pressed={audio.enabled}>{audio.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}{audio.enabled ? "Matikan suara" : "Aktifkan suara"}</button><button onClick={() => audio.narrate(narrationText)}><AudioLines size={15} />Putar narasi</button><button onClick={audio.stopNarration}>Hentikan</button></div><p className="revo-narration-status" role="status">{audio.narrationStatus}</p><p className="revo-transcript">{narrationText}</p><div className="revo-history-sources"><BookOpen size={16} /><span>Jelajahi koleksi: <a href="https://blog.sciencemuseum.org.uk/james-watt-high-street-fashion/" target="_blank" rel="noreferrer">Science Museum<ArrowUpRight size={12} /></a> · <a href="https://blog.scienceandindustrymuseum.org.uk/manchester-our-rainy-city/" target="_blank" rel="noreferrer">Science and Industry Museum<ArrowUpRight size={12} /></a></span></div></RevoDialog>}
    {modal === "complete" && <RevoDialog active={active} title="Misi berhasil" onClose={() => setModal(null)}><div className="revo-dialog-emblem"><ShieldCheck size={32} /></div><span className="revo-kicker">MISI SELESAI</span><h2>Kamu menggerakkan<br />sebuah perubahan.</h2><p>Selamat! Kamu telah menyelesaikan simulasi Revolusi Industri 1.0. Tenaga uap menghasilkan 100 unit kain dengan tekanan tetap aman.</p><div className="revo-results-strip"><span><strong>{Math.floor(state.production)}</strong>unit kain</span><span><strong>{Math.round(state.peakPressure)}</strong>tekanan tertinggi</span><span><strong>{Math.round(state.elapsed)}</strong>detik percobaan</span></div><p>Produksi mekanis membuat barang dapat diproduksi dalam jumlah lebih besar. Namun, kehidupan pekerja juga berubah. Mari pikirkan dampaknya.</p><button className="revo-primary-button" onClick={openQuiz}>Lanjut refleksi<ArrowRight size={16} /></button></RevoDialog>}
    {modal === "quiz" && <RevoDialog active={active} title="Refleksi dan evaluasi" onClose={() => setModal(null)} wide><QuizPanel onClose={() => setModal(null)} onComplete={value => { setScore(value); audio.play("complete"); }} /></RevoDialog>}
  </main>;
}
