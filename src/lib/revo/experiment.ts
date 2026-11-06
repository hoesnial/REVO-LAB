import type { SteamState } from "@/lib/simulation/steamEngine";
import { SIMULATION } from "@/lib/simulation/simulationConstants";

export const OBSERVABLE_ENGINE_SPEED = 5;

/** Evidence is derived from simulation samples, never animation or wall time. */
export interface ExperimentObservations {
  operated: boolean;
  motionObserved: boolean;
  transmissionInspected: boolean;
  production: number;
  peakPressure: number;
  unsafeCount: number;
  elapsed: number;
  /** V1 stored a validated completion flag, but no observation details. */
  legacyCompleted: boolean;
}
export const initialObservations = (): ExperimentObservations => ({
  operated: false, motionObserved: false, transmissionInspected: false,
  production: 0, peakPressure: 0, unsafeCount: 0, elapsed: 0, legacyCompleted: false,
});
export function observeExperiment(old: ExperimentObservations, steam: SteamState): ExperimentObservations {
  const next = { ...old,
    operated: old.operated || steam.running,
    motionObserved: old.motionObserved || (steam.running && steam.speed >= OBSERVABLE_ENGINE_SPEED && steam.production > 0),
    production: Math.max(old.production, steam.production),
    peakPressure: Math.max(old.peakPressure, steam.peakPressure),
    unsafeCount: Math.max(old.unsafeCount, steam.unsafeCount),
    elapsed: Math.max(old.elapsed, steam.elapsed),
  };
  return Object.keys(next).every(key => next[key as keyof ExperimentObservations] === old[key as keyof ExperimentObservations]) ? old : next;
}
export function experimentReady(o: ExperimentObservations): boolean {
  return o.legacyCompleted || (o.operated && o.motionObserved && o.production > 0 && o.transmissionInspected && o.unsafeCount === 0 && o.peakPressure <= SIMULATION.safePressure);
}
export function normalizeObservations(value: unknown): ExperimentObservations | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (!["operated", "motionObserved", "transmissionInspected", "legacyCompleted"].every(key => typeof o[key] === "boolean")) return null;
  if (!["production", "peakPressure", "unsafeCount", "elapsed"].every(key => typeof o[key] === "number" && Number.isFinite(o[key]) && (o[key] as number) >= 0)) return null;
  if ((o.peakPressure as number) > 100 || !Number.isInteger(o.unsafeCount)) return null;
  return { operated: o.operated as boolean, motionObserved: o.motionObserved as boolean, transmissionInspected: o.transmissionInspected as boolean, legacyCompleted: o.legacyCompleted as boolean, production: o.production as number, peakPressure: o.peakPressure as number, unsafeCount: o.unsafeCount as number, elapsed: o.elapsed as number };
}
