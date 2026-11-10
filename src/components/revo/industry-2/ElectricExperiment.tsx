"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check, Circle, CircleStop, Cog, Link2, Play, RotateCcw, Zap, Package, MoveHorizontal, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ELECTRIC_SCENARIOS, evaluateElectricRun, initialElectricRun, matchElectricScenario, type ElectricRun, type ElectricSettings } from "@/lib/revo/industry-2/experiment";
import type { ElectricPartId } from "@/lib/revo/industry-2/content";
import type { ElectricProgress } from "@/lib/revo/industry-2/progress";
import { REVO_ROUTES } from "@/lib/revo/routes";
import RevoDialog from "../RevoDialog";
import RevoScreenHeader from "../RevoScreenHeader";
import ElectricDiagram from "./ElectricDiagram";
import ElectricCameraControls from "./ElectricCameraControls";
import ElectricHud from "./ElectricHud";
import { useElectricProgress } from "./ElectricProgressProvider";

const ElectricScene = dynamic(() => import("./ElectricScene"), {
  ssr: false, loading: () => <p className="electric-scene-status" role="status">Memuat diorama…</p>,
});
const noInspect = () => {};
const motorLabels = { off: "Berhenti", turning: "Berputar", stalled: "Tertahan" };
const conveyorLabels = { stopped: "Berhenti", moving: "Bergerak", blocked: "Terhalang" };
const productionLabels = { idle: "Siaga", flowing: "Mengalir", interrupted: "Terputus" };

export default function ElectricExperiment() {
  const { progress, dispatch } = useElectricProgress();
  useEffect(() => {
    if (progress?.stage === "assembly" && progress.assemblyComplete) dispatch({ type: "enter-experiment" });
  }, [dispatch, progress]);

  if (progress?.stage === "experiment" && progress.assemblyComplete) return <ExperimentWorkspace progress={progress} />;
  const loading = !progress || progress.assemblyComplete;
  const next = progress?.stage === "briefing" ? [REVO_ROUTES.electricBriefing, "Buka Briefing"] : progress?.exploreComplete
    ? [REVO_ROUTES.electricAssembly, "Buka Perakitan"] : [REVO_ROUTES.electricExplore, "Kembali ke Eksplorasi"];
  return <main className="electric-shell electric-gate" lang="id" aria-busy={loading}>
    <RevoScreenHeader step="02 / EKSPERIMEN" back={{ href: REVO_ROUTES.eraSelect, label: "Pilih Era" }} />
    <section>
      <p className="electric-kicker">INDUSTRI 2.0</p>
      <h1>{loading ? "Memuat eksperimen…" : "Eksperimen terkunci"}</h1>
      {!loading && <>
        <p>Selesaikan eksplorasi 7/7, pasang lima sambungan, dan jawab tiga cek konsep dengan benar.</p>
        <Link className="electric-primary" href={next[0]}>{next[1]} <ArrowRight size={17} aria-hidden="true" /></Link>
      </>}
    </section>
  </main>;
}

function ExperimentWorkspace({ progress }: { progress: ElectricProgress }) {
  const { dispatch, status } = useElectricProgress();
  const [run, setRun] = useState<ElectricRun>(initialElectricRun);
  const [retry, setRetry] = useState(false);
  const [focus, setFocus] = useState<ElectricPartId | null>(null);
  const [camera, setCamera] = useState(0);
  const [motion, setMotion] = useState(false);
  const [message, setMessage] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const outcome = evaluateElectricRun(run);
  const scenario = matchElectricScenario(run);
  const count = ELECTRIC_SCENARIOS.filter(({ id }) => progress.observations[id]).length;
  const recorded = scenario ? Boolean(progress.observations[scenario.id]) : false;
  const nextScenario = ELECTRIC_SCENARIOS.find(({ id }) => !progress.observations[id]);
  const stop = useCallback(() => setRun(current => current.running ? { ...current, running: false } : current), []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!preference.matches);
    update();
    preference.addEventListener("change", update);
    const checkVisibility = () => { if (document.visibilityState !== "visible") stop(); };
    document.addEventListener("visibilitychange", checkVisibility);
    window.addEventListener("pagehide", stop);
    return () => {
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", checkVisibility);
      window.removeEventListener("pagehide", stop);
    };
  }, [stop]);

  function change(key: keyof ElectricSettings) {
    setRun(current => ({ ...current, [key]: !current[key] }));
    setMessage("");
  }

  function record() {
    if (document.visibilityState !== "visible" || !run.running || !scenario || recorded || retry) return;
    dispatch({ type: "observe", run });
    setMessage(`Catatan ${scenario.letter} tersimpan: ${scenario.title}.`);
  }

  const statuses = [
    { label: "Listrik", value: run.power ? "Tersedia" : "Terputus", icon: Zap, signal: run.power ? "on" : "alert" },
    { label: "Motor", value: motorLabels[outcome.motor], icon: Cog, signal: outcome.motor === "turning" ? "on" : outcome.motor === "stalled" ? "alert" : "off" },
    { label: "Transmisi", value: run.transmission ? "Tersambung" : "Terputus", icon: Link2, signal: run.transmission ? "on" : "alert" },
    { label: "Konveyor", value: conveyorLabels[outcome.conveyor], icon: MoveHorizontal, signal: outcome.conveyor === "moving" ? "on" : outcome.conveyor === "blocked" ? "alert" : "off" },
    { label: "Produksi", value: productionLabels[outcome.production], icon: Package, signal: outcome.production === "flowing" ? "on" : outcome.production === "interrupted" ? "alert" : "off" },
  ];
  const fallback = <div className="electric-fallback">
    <ElectricDiagram experiment={{ run, outcome }} />
    <p role="status">Skema 2D · WebGL tidak tersedia</p>
  </div>;

  return <main className="electric-shell electric-experiment" lang="id">
    <ElectricHud stage="experiment" progress={progress} onDialogOpen={stop} />
    <div className="electric-workspace">
      <section className="electric-stage electric-experiment-stage" aria-label="Diorama percobaan listrik">
        <div className="electric-stage-title">
          <p className="electric-kicker">LABORATORIUM INTERAKTIF / 02</p>
          <h1>Uji penggerak konveyor</h1>
          <p className="electric-flow-caption">Listrik → Motor → Transmisi → Konveyor → Produksi</p>
        </div>
        <div className="electric-canvas">
          <ElectricScene focus={focus} selected={null} path={null} inspect={noInspect} fallback={fallback} reset={camera} experiment={{ run, outcome, motion }} />
        </div>
        <div className="electric-experiment-scene-footer">
          <dl className="electric-run-status" aria-label="Status mesin" aria-live="polite" aria-atomic="true">
            {statuses.map(({ label, value, icon: Icon, signal }) => <div key={label} data-signal={signal}>
              <dt><Icon size={14} aria-hidden="true" />{label}</dt><dd>{value}</dd>
            </div>)}
          </dl>
          <ElectricCameraControls focus={focus} onFocus={setFocus} onReset={() => { setFocus(null); setCamera(old => old + 1); }} />
        </div>
      </section>
      <section className="electric-experiment-panel" aria-label="Kendali dan catatan eksperimen">
        <div className="electric-assembly-meter electric-experiment-meter">
          <div><strong role="status">{progress.experimentComplete ? "Eksperimen selesai · " : ""}{count}/4 observasi</strong><span>Gulir panel ↓</span></div>
          <progress className="electric-progress" max={4} value={count} aria-label="Progres observasi" />
        </div>
        <div className="electric-experiment-body" ref={panel} id="electric-controls" tabIndex={0} aria-label="Panel eksperimen yang dapat digulir">
          <h2>Kendali mesin</h2>
          <div className="electric-run-settings" role="group" aria-label="Kondisi percobaan">
            {([
              ["power", "Listrik", run.power ? "ON" : "OFF", Zap],
              ["transmission", "Transmisi", run.transmission ? "Sambung" : "Putus", Link2],
              ["obstruction", "Penghalang", run.obstruction ? "Ada" : "Tidak ada", TriangleAlert],
            ] as const).map(([key, title, value, Icon]) => <button key={key} type="button" className="electric-secondary" role="switch" aria-label={title} aria-checked={run[key]} onClick={() => change(key)}>
              <span><Icon size={15} aria-hidden="true" />{title}</span><strong>{value}</strong>
            </button>)}
          </div>
          <article className="electric-experiment-cause" aria-labelledby="electric-cause-title">
            <p className="electric-kicker">{scenario ? `KONDISI ${scenario.letter}` : "KONDISI GABUNGAN"}</p>
            <h3 id="electric-cause-title">{scenario?.title ?? "Lebih dari satu gangguan"}</h3>
            {scenario && <p><strong>Ubah:</strong> {scenario.change}</p>}
            {!run.running ? <p>Tekan <strong>Mulai</strong> untuk melihat akibat dari pengaturan ini.</p> : scenario ? <>
              <p><strong>Amati:</strong> {scenario.result}</p>
              <p><strong>Mengapa:</strong> {scenario.why}</p>
            </> : <p>Periksa status mesin. Uji satu gangguan pada satu waktu agar penyebab perubahan produksi bisa dibandingkan.</p>}
          </article>
          <div className="electric-observation-log">
            <h3>Catatan pengamatan</h3>
            <p>{progress.experimentComplete ? "Keempat kondisi sudah dibandingkan. Produksi memerlukan listrik, transmisi yang tersambung, dan jalur konveyor yang bebas. Refleksi belum tersedia."
              : `Coba kondisi ${nextScenario?.letter}: ${nextScenario?.title}. ${nextScenario?.change}`}</p>
            <ul>{ELECTRIC_SCENARIOS.map(item => {
              const evidence = progress.observations[item.id];
              return <li key={item.id}>{evidence ? <Check size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
                <span>{item.letter}. {item.title}</span><strong>{evidence ? "Tercatat" : "Belum"}</strong>
                {evidence && <small>Motor: {motorLabels[evidence.outcome.motor]} · Konveyor: {conveyorLabels[evidence.outcome.conveyor]} · Produksi: {productionLabels[evidence.outcome.production]}</small>}
              </li>;
            })}</ul>
          </div>
          <p className="electric-material-note">Model kualitatif: aliran benda kerja menunjukkan produksi. Tidak ada angka laju historis atau target unit.</p>
          {status === "unavailable" && <p className="electric-material-note" role="status">Penyimpanan tidak tersedia. Catatan bertahan selama sesi REVO ini.</p>}
        </div>
        <div className="electric-experiment-actions">
          <button type="button" className="electric-secondary" onClick={() => {
            setRun(current => ({ ...current, running: !current.running })); setMessage("");
          }}>{run.running ? <CircleStop size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{run.running ? "Henti" : "Mulai"}</button>
          <button type="button" className="electric-primary electric-learning-action" disabled={!run.running || !scenario || recorded} onClick={record}>
            {recorded ? "Sudah dicatat" : "Catat observasi"}
          </button>
          <button type="button" className="electric-secondary electric-experiment-reset" aria-label="Reset Eksperimen" title="Reset Eksperimen" onClick={() => { stop(); setRetry(true); }}>
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        </div>
        <p className="revo-sr-only" role="status">{message}</p>
      </section>
    </div>
    {retry && <RevoDialog title="Reset Eksperimen" onClose={() => setRetry(false)}>
      <span className="revo-kicker">RESET TAHAP</span><h2>Ulangi eksperimen?</h2>
      <p>Catatan observasi dihapus dan pengaturan kembali ke awal. Eksplorasi, perakitan, dan cek konsep tetap tersimpan.</p>
      <div className="revo-dialog-actions">
        <button className="revo-secondary-button" onClick={() => setRetry(false)}>Batal</button>
        <button className="revo-primary-button revo-action-danger" onClick={() => {
          dispatch({ type: "reset-experiment" }); setRun(initialElectricRun); setMessage(""); setRetry(false);
          panel.current?.scrollTo({ top: 0, behavior: "instant" });
        }}>Hapus catatan eksperimen</button>
      </div>
    </RevoDialog>}
  </main>;
}
