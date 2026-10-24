import { applySteamAction, initialSteamState, stepSteam, type SteamAction, type SteamState } from "@/lib/simulation/steamEngine";
import { SIMULATION } from "@/lib/simulation/simulationConstants";

export type ResourceKind = "coal" | "water";
export type FillingState = { kind: ResourceKind | null; elapsed: number; duration: number; serial: number };
export type LabSimulationState = { steam: SteamState; filling: FillingState };
export type LabSimulationAction = SteamAction | { type: "tick"; steps: number } | { type: "fill"; kind: ResourceKind } | { type: "cancel-fill" } | { type: "restore-complete" };
export const FILL_DURATION = { coal: 3.6, water: 3.2 } as const;
export const emptyFilling = (): FillingState => ({ kind: null, elapsed: 0, duration: 0, serial: 0 });
export const initialLabSimulation = (): LabSimulationState => ({ steam: initialSteamState(), filling: emptyFilling() });
export const fillingProgress = (fill: FillingState) => fill.kind ? Math.min(1, fill.elapsed / fill.duration) : 0;

export function fillingBlocked(steam: SteamState, kind: ResourceKind): string | null {
  if (steam.missionComplete) return "Misi sudah selesai. Ulangi misi untuk mencoba pengisian lagi.";
  if (kind === "coal" && steam.fuel >= 100) return "Persediaan bahan bakar sudah penuh. Tidak ada batu bara yang ditambahkan.";
  if (kind === "water" && steam.water >= 100) return "Persediaan air sudah penuh. Tidak ada air yang ditambahkan.";
  if (steam.safety === "danger" || steam.pressure > SIMULATION.safePressure)
    return "Pengisian tidak aman saat tekanan tinggi atau pengaman aktif. Hentikan mesin, lepaskan tekanan, dan tunggu pengaman pulih.";
  return null;
}
function feedback(steam: SteamState, type: string, message: string): SteamState {
  return { ...steam, event: { id: steam.event.id + 1, type, message } };
}
function cancel(state: LabSimulationState): LabSimulationState {
  if (!state.filling.kind) return state;
  return { steam: feedback(state.steam, "filling-cancelled", "Pengisian dibatalkan saat meninggalkan Eksperimen. Tidak ada sumber daya yang ditambahkan."), filling: { ...emptyFilling(), serial: state.filling.serial } };
}

/** One authority for simulation and filling time. Only a successful terminal
 * transition invokes the existing resource action; frames never award resources. */
export function labSimulationReducer(state: LabSimulationState, action: LabSimulationAction): LabSimulationState {
  if (action.type === "cancel-fill") return cancel(state);
  if (action.type === "restore-complete") {
    const steam = initialSteamState();
    return {
      steam: { ...steam, production: SIMULATION.missionTarget, missionComplete: true, event: { id: steam.event.id + 1, type: "complete", message: "Misi 100 unit yang aman dipulihkan. Mesin tetap berhenti." } },
      filling: emptyFilling(),
    };
  }
  if (action.type === "machine-reset") return {
    steam: applySteamAction(state.steam, action),
    filling: { ...emptyFilling(), serial: state.filling.serial + (state.filling.kind ? 1 : 0) },
  };
  if (action.type === "reset") return { steam: applySteamAction(state.steam, action), filling: { ...emptyFilling(), serial: state.filling.serial + 1 } };
  if (action.type === "fill") {
    if (state.filling.kind) return state;
    const blocked = fillingBlocked(state.steam, action.kind);
    if (blocked) return { ...state, steam: feedback(state.steam, "blocked", blocked) };
    return {
      steam: feedback(state.steam, "filling-started", action.kind === "coal"
        ? "Sekop mengambil batu bara menuju ruang bakar. Batu bara digunakan sebagai bahan bakar untuk memanaskan air dan menghasilkan uap."
        : "Pompa memasok air dari tangki luar melalui pipa dan katup satu arah. Air dipanaskan dalam ketel untuk menghasilkan uap yang digunakan menggerakkan mesin."),
      filling: { kind: action.kind, elapsed: 0, duration: FILL_DURATION[action.kind], serial: state.filling.serial + 1 },
    };
  }
  // Keep even internal callers on the same animated action path.
  if (action.type === "add-fuel" || action.type === "add-water")
    return labSimulationReducer(state, { type: "fill", kind: action.type === "add-fuel" ? "coal" : "water" });
  if (action.type !== "tick") return { ...state, steam: applySteamAction(state.steam, action) };
  let next = state;
  for (let i = 0; i < action.steps; i++) {
    let steam = stepSteam(next.steam, SIMULATION.fixedStep);
    let filling = next.filling;
    if (filling.kind) {
      const blocked = fillingBlocked(steam, filling.kind);
      if (blocked) {
        steam = feedback(steam, steam.event.type === "emergency" ? "emergency" : "blocked", `${blocked} Pengisian dibatalkan tanpa penambahan sumber daya.`);
        filling = { ...emptyFilling(), serial: filling.serial };
      } else {
        filling = { ...filling, elapsed: Math.min(filling.duration, filling.elapsed + SIMULATION.fixedStep) };
        if (filling.elapsed >= filling.duration - 1e-9) {
          steam = applySteamAction(steam, { type: filling.kind === "coal" ? "add-fuel" : "add-water" });
          filling = { ...emptyFilling(), serial: filling.serial };
        }
      }
    }
    next = { steam, filling };
  }
  return next;
}

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
export function coalPose(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const points = [[-4.2, 0.51, 1.5], [-4.18, 1.03, 1.5], [-2.85, 0.68, 1.98], [-2.85, 0.42, 1.43], [-3.7, 0.8, 2.2], [-4.2, 0.51, 1.5]];
  const times = [0, 0.23, 0.5, 0.66, 0.83, 1];
  const segment = Math.min(4, times.findIndex((time, index) => index > 0 && p <= time) - 1);
  const index = Math.max(0, segment);
  const t = smooth((p - times[index]) / (times[index + 1] - times[index]));
  return {
    position: points[index].map((value, axis) => value + (points[index + 1][axis] - value) * t) as [number, number, number],
    door: smooth((p - 0.2) / 0.18) * (1 - smooth((p - 0.76) / 0.2)),
    coalVisible: p >= 0.12 && p < 0.66,
    ember: p > 0.6 && p < 0.95 ? Math.sin((p - 0.6) / 0.35 * Math.PI) : 0,
  };
}
