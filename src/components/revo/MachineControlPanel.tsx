"use client";

import { Droplets, Flame, Gauge, Info, Minus, Play, Plus, Square, Thermometer, Wind } from "lucide-react";
import type { SteamAction, SteamState } from "@/lib/simulation/steamEngine";
import { SIMULATION } from "@/lib/simulation/simulationConstants";

function Meter({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return <div className="revo-meter">
    <div className="revo-meter-label"><span>{icon}{label}</span><strong>{Math.round(value)}<small>%</small></strong></div>
    <div className="revo-meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><i style={{ width: `${value}%`, background: tone }} /></div>
  </div>;
}

export default function MachineControlPanel({ state, onAction, lockedReason }: { state: SteamState; onAction: (action: SteamAction) => void; lockedReason: string | null }) {
  const pressure = Math.round(state.pressure);
  const controlsDisabled = state.missionComplete || lockedReason !== null;
  const status = state.missionComplete ? "Misi berhasil" : state.safety === "danger" ? "Berhenti darurat" : lockedReason ?? (state.safety === "warning" ? state.pressure > SIMULATION.safePressure ? "Tekanan tinggi" : "Sumber daya menipis" : state.running ? "Mesin beroperasi" : "Mesin siap");
  return <aside className="revo-control" aria-label="Kontrol mesin uap">
    <div className="revo-control-heading"><div><span className="revo-kicker">DI TANGANMU</span><h2>Kendali mesin</h2></div><Gauge size={21} strokeWidth={1.5} /></div>
    <div className={`revo-engine-status ${state.safety}`}><i />{status}<span>MESIN 01</span></div>
    <div className="revo-pressure">
      <svg viewBox="0 0 240 135" aria-hidden="true">
        <path d="M 25 115 A 95 95 0 0 1 215 115" fill="none" stroke="#373a3d" strokeWidth="13" pathLength="100" />
        <path d="M 25 115 A 95 95 0 0 1 215 115" fill="none" stroke={state.safety === "danger" ? "#ff8579" : state.safety === "warning" ? "#f2994a" : "#ffe234"} strokeWidth="13" pathLength="100" strokeDasharray={`${state.pressure} 100`} />
        <path d="M 25 115 A 95 95 0 0 1 215 115" fill="none" stroke="#ed8172" strokeWidth="13" pathLength="100" strokeDasharray=".6 99.4" strokeDashoffset="-75" />
        {Array.from({ length: 11 }, (_, index) => { const angle = Math.PI + index * Math.PI / 10; return <line key={index} x1={Number((120 + Math.cos(angle) * 77).toFixed(4))} y1={Number((115 + Math.sin(angle) * 77).toFixed(4))} x2={Number((120 + Math.cos(angle) * 81).toFixed(4))} y2={Number((115 + Math.sin(angle) * 81).toFixed(4))} stroke="#727574" strokeWidth="1" />; })}
      </svg>
      <div className="revo-pressure-value"><span>TEKANAN UAP</span><strong data-testid="pressure">{pressure}<small>/100</small></strong><span className={state.pressure <= SIMULATION.safePressure ? "revo-safe-text" : "revo-warn-text"}>{state.pressure <= SIMULATION.safePressure ? "Dalam batas aman" : "⚠ Perlu tindakan"}</span></div>
      <div className="revo-pressure-scale"><span>0</span><span>Batas aman ≤ {SIMULATION.safePressure}</span><span>100</span></div>
    </div>
    <div className="revo-resources">
      <div><Meter label="Bahan bakar" value={state.fuel} icon={<Flame size={14} />} tone="#f2994a" /><div className="revo-resource-actions"><button disabled={controlsDisabled} onClick={() => onAction({ type: "reduce-fuel" })} aria-label="Kurangi bahan bakar"><Minus size={13} />Kurangi</button><button disabled={controlsDisabled} onClick={() => onAction({ type: "add-fuel" })} aria-label="Tambah bahan bakar"><Plus size={13} />Tambah</button></div></div>
      <div><Meter label="Persediaan air" value={state.water} icon={<Droplets size={14} />} tone="#8bbdcc" /><div className="revo-resource-actions"><button disabled={controlsDisabled} className="revo-water-button" onClick={() => onAction({ type: "add-water" })}><Plus size={13} />Tambah air</button></div></div>
    </div>
    <div className="revo-engine-readings"><Meter label="Panas" value={state.heat} icon={<Thermometer size={14} />} tone="#eab889" /><Meter label="Kecepatan" value={state.speed} icon={<Gauge size={14} />} tone="#cfcebd" /></div>
    <button className={`revo-start ${state.running ? "is-running" : ""}`} onClick={() => onAction({ type: state.running ? "stop" : "start" })} disabled={controlsDisabled}>{state.running ? <Square size={15} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{state.missionComplete ? "Misi berhasil" : state.running ? "Hentikan mesin" : "Nyalakan mesin"}</button>
    <button disabled={controlsDisabled} className="revo-vent" onClick={() => onAction({ type: "vent" })}><Wind size={16} />Lepaskan tekanan</button>
    <p className="revo-model-note"><Info size={13} /><span>Model edukasi sederhana. Skala 0–100, bukan ukuran termodinamika nyata.</span></p>
  </aside>;
}
