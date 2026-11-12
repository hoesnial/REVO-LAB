import { ArrowUpRight, Check, Circle, TriangleAlert } from "lucide-react";
import type { SteamState } from "@/lib/simulation/steamEngine";
import { experimentReady, type ExperimentObservations } from "@/lib/revo/experiment";

export default function LearningProgressPanel({ state, observations, onTransmission, enabled, visited, stage, canAssemble, assembled, onAssembly, onQuiz, onReset }: { state: SteamState; observations: ExperimentObservations; onTransmission: () => void; enabled: boolean; visited: number; stage: number; canAssemble: boolean; assembled: boolean; onAssembly: () => void; onQuiz: () => void; onReset: () => void }) {
  const ready = experimentReady(observations);
  const checks = [
    ["Mesin berhasil dioperasikan", observations.operated],
    ["Gerak mesin dan produksi diamati", observations.motionObserved && observations.production > 0],
    ["Transmisi tenaga T diperiksa", observations.transmissionInspected],
    ["Tekanan model tetap ≤75", observations.unsafeCount === 0 && observations.peakPressure <= 75],
  ] as const;
  return <section className="revo-learning-progress" aria-label="Progres Pembelajaran">
    <div className="revo-learning-body">
      <h2>Progres Pembelajaran</h2>
      <p>{visited}/5 komponen dijelajahi · {assembled ? "Perakitan lengkap" : "Perakitan belum lengkap"}</p>
      <div className="revo-observation-output"><span>Produksi kain — hasil pengamatan</span><strong><span data-testid="production">{state.production > 0 && state.production < 1 ? state.production.toFixed(2) : Math.floor(state.production)}</span> <small>unit</small></strong></div>
      {stage === 2 && <>
        <details><summary>Panduan Eksperimen</summary><p>Nyalakan mesin, amati piston dan mesin tenun, lalu periksa penanda T. Produksi merupakan data pengamatan, tanpa target jumlah.</p><ul>{checks.map(([label, done]) => <li key={label}>{done ? <Check size={16} /> : <Circle size={16} />}{label}</li>)}</ul><p>Skala tekanan 0–100 adalah model edukasi, bukan satuan fisika nyata.</p></details>
        {observations.legacyCompleted && <p>Eksperimen selesai pada versi sebelumnya. Rincian pengamatan tidak tersimpan.</p>}
        {observations.unsafeCount > 0 && <p className="revo-observation-warning" role="status"><TriangleAlert size={18} />Batas aman terlewati — ulangi eksperimen. Reset mesin tetap menyimpan riwayat keselamatan.</p>}
        <button className="revo-secondary-button" disabled={!enabled} onClick={onTransmission}>Pelajari transmisi tenaga (T)</button>
        <button className="revo-secondary-button" onClick={onReset}>Ulangi eksperimen</button>
      </>}
    </div>
    {((stage === 2) || (stage === 3 && ready) || (stage === 0 && canAssemble)) && <div className="revo-learning-actions">
      {(stage === 2 || stage === 3) && <button className="revo-primary-button" disabled={!ready || !enabled} onClick={onQuiz}>Lanjut ke Refleksi<ArrowUpRight size={18} /></button>}
      {stage === 0 && canAssemble && <button className="revo-primary-button" onClick={onAssembly}>{assembled ? "Tinjau perakitan" : "Lanjut ke perakitan"}<ArrowUpRight size={18} /></button>}
    </div>}
  </section>;
}
