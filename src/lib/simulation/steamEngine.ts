import { SIMULATION as C } from "./simulationConstants";

export type SteamSafety = "safe" | "warning" | "danger";

export interface SteamState {
  water: number;
  fuel: number;
  heat: number;
  pressure: number;
  speed: number;
  production: number;
  running: boolean;
  safety: SteamSafety;
  /** Cumulative time the engine has operated, excluding hidden-tab time. */
  elapsed: number;
  peakPressure: number;
  /** Distinct crossings above the mission's safe pressure limit. */
  unsafeCount: number;
  missionComplete: boolean;
  event: { id: number; type: string; message: string };
}

export type SteamAction =
  | { type: "add-fuel" }
  | { type: "reduce-fuel" }
  | { type: "add-water" }
  | { type: "start" }
  | { type: "stop" }
  | { type: "vent" }
  | { type: "machine-reset" }
  | { type: "reset" };

export function initialSteamState(): SteamState {
  return {
    ...C.initial,
    speed: 0,
    production: 0,
    running: false,
    safety: "safe",
    elapsed: 0,
    peakPressure: C.initial.pressure,
    unsafeCount: 0,
    missionComplete: false,
    event: {
      id: 0,
      type: "ready",
      message: "Ketel siap. Nyalakan mesin, lalu amati hubungan panas, tekanan, dan produksi.",
    },
  };
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const approach = (value: number, target: number, dt: number, time: number) =>
  value + (target - value) * (1 - Math.exp(-dt / time));

function feedback(state: SteamState, type: string, message: string): SteamState {
  return { ...state, event: { id: state.event.id + 1, type, message } };
}

function hasResources(state: SteamState) {
  return state.water >= C.minimumWater && state.fuel > C.minimumFuel;
}

function safetyFor(state: SteamState, wasDanger: boolean): SteamSafety {
  if (
    state.pressure >= C.emergencyPressure ||
    (wasDanger && (state.pressure > C.recoveryPressure || state.heat > C.recoveryHeat))
  ) return "danger";
  if (state.pressure > C.safePressure || state.water <= C.lowWater || state.fuel <= C.lowFuel)
    return "warning";
  return "safe";
}

/** One bounded integration step. All subsequent values derive from these equations. */
function integrate(state: SteamState, dt: number): SteamState {
  const firing = state.running && hasResources(state) && state.safety !== "danger" && !state.missionComplete;
  const heatTarget = firing ? clamp(C.ambientHeat + state.fuel * C.fuelHeatGain) : C.ambientHeat;
  const heat = clamp(approach(state.heat, heatTarget, dt, firing ? C.heatingTime : C.coolingTime));
  const pressureTarget = state.water >= C.minimumWater
    ? clamp(Math.max(0, heat - C.ambientHeat) * C.steamGain)
    : 0;
  const pressure = clamp(approach(state.pressure, pressureTarget, dt, C.pressureResponseTime));
  const crossing = state.pressure <= C.safePressure && pressure > C.safePressure;
  let next: SteamState = {
    ...state,
    heat,
    pressure,
    peakPressure: Math.max(state.peakPressure, pressure),
    unsafeCount: state.unsafeCount + (crossing ? 1 : 0),
    elapsed: state.elapsed + (firing ? dt : 0),
  };

  next.safety = safetyFor(next, state.safety === "danger");
  next.running = firing && next.safety !== "danger";
  next.speed = clamp(approach(state.speed, next.running ? pressure * C.pressureSpeedGain : 0,
    dt, next.running ? C.accelerationTime : C.coastTime));
  // Snap imperceptible coasting to zero so a stopped machine eventually rests.
  if (!next.running && next.speed < 0.05) next.speed = 0;

  if (firing) {
    next.fuel = clamp(state.fuel - dt * (C.baseFuelConsumption + next.speed * C.speedFuelConsumption));
    next.water = clamp(state.water - dt * (C.baseWaterConsumption + next.speed * C.speedWaterConsumption));
    if (!hasResources(next)) next.running = false;
  }

  next.safety = safetyFor(next, state.safety === "danger");
  if (next.running && pressure <= C.safePressure) {
    next.production += dt * (next.speed / 100) * C.maximumProductionRate;
  }

  if (
    !state.missionComplete && next.production >= C.missionTarget &&
    next.unsafeCount === 0 && next.peakPressure <= C.safePressure
  ) {
    next = { ...next, production: C.missionTarget, missionComplete: true, running: false };
    return feedback(next, "complete", "Selamat! 100 unit diproduksi tanpa melewati batas tekanan aman. Mari refleksikan penemuanmu.");
  }

  if (next.safety === "danger" && state.safety !== "danger") {
    return feedback({ ...next, running: false }, "emergency",
      "Mesin berhenti darurat karena tekanan mencapai 90. Lepaskan uap dan tunggu ketel mendingin sebelum menyalakan kembali.");
  }
  if (state.running && !next.running && !hasResources(next)) {
    return feedback(next, "resource-low", next.water < C.minimumWater
      ? "Mesin berhenti: persediaan air terlalu rendah. Tambahkan air sebelum melanjutkan."
      : "Mesin berhenti: bahan bakar habis. Tambahkan bahan bakar sebelum melanjutkan.");
  }
  if (crossing) return feedback(next, "warning",
    "Tekanan melewati batas aman 75. Kurangi bahan bakar dan lepaskan uap. Reset diperlukan untuk mengulang misi aman.");
  if (state.safety === "danger" && next.safety !== "danger") return feedback(next, "recovered",
    "Tekanan dan panas sudah turun. Mesin dapat dinyalakan kembali; reset untuk mencoba ulang misi aman.");
  if (state.safety === "safe" && next.safety === "warning") return feedback(next, "resource-low",
    next.water <= C.lowWater ? "Air mulai menipis. Tambahkan air sebelum mesin berhenti." : "Bahan bakar mulai menipis. Tambahkan secukupnya.");
  return next;
}

/**
 * Pure deterministic evolution, subdivided to at most 50 ms per integration step.
 * Browser scheduling lives in the hook; this function never reads clocks or randomness.
 */
export function stepSteam(state: SteamState, dt: number): SteamState {
  if (!Number.isFinite(dt) || dt <= 0) return state;
  // Keep the initial exhibit ready while learners inspect components.
  if (!state.running && state.elapsed === 0 && state.heat === C.ambientHeat && state.speed === 0)
    return state;
  const steps = Math.max(1, Math.ceil(dt / C.fixedStep - 1e-9));
  const stepTime = dt / steps;
  let next = state;
  for (let i = 0; i < steps; i += 1) next = integrate(next, stepTime);
  return next;
}

export function applySteamAction(state: SteamState, action: SteamAction): SteamState {
  if (action.type === "machine-reset") {
    const reset = initialSteamState();
    return feedback({
      ...reset,
      production: state.production,
      elapsed: state.elapsed,
      peakPressure: state.peakPressure,
      unsafeCount: state.unsafeCount,
      missionComplete: state.missionComplete,
    }, "machine-reset", "Kondisi operasi mesin direset. Progres dan riwayat keselamatan misi tetap tersimpan.");
  }
  if (action.type === "reset") {
    return feedback({ ...initialSteamState(), event: state.event }, "reset",
      "Simulasi direset. Coba hasilkan 100 unit dengan tekanan tidak lebih dari 75.");
  }
  if (state.missionComplete) return state;
  switch (action.type) {
    case "start": {
      if (state.running) return state;
      if (state.safety === "danger" || state.pressure >= C.emergencyPressure)
        return feedback(state, "blocked", "Pengaman aktif. Lepaskan uap hingga tekanan ≤60 dan tunggu panas ≤65.");
      if (!hasResources(state)) return feedback(state, "blocked", state.water < C.minimumWater
        ? "Air terlalu rendah. Tambahkan air hingga setidaknya 8 sebelum menyalakan mesin."
        : "Bahan bakar tidak cukup. Tambahkan bahan bakar sebelum menyalakan mesin.");
      return feedback({ ...state, running: true }, "started",
        "Bagus! Mesin dinyalakan. Panas membentuk uap; tekanan akan menggerakkan roda dan meningkatkan produksi.");
    }
    case "stop":
      if (!state.running) return state;
      return feedback({ ...state, running: false }, "stopped",
        "Pembakaran dihentikan. Roda melambat, tetapi sisa panas dan tekanan perlu waktu untuk turun.");
    case "add-fuel":
      if (state.fuel >= 100) return feedback(state, "blocked", "Persediaan bahan bakar sudah penuh. Tidak ada bahan bakar yang ditambahkan.");
      return feedback({ ...state, fuel: clamp(state.fuel + C.fuelAddition) }, "fuel-added",
        "Bahan bakar ditambahkan. Batu bara memanaskan air untuk menghasilkan uap saat pembakaran aktif; awasi tekanan.");
    case "reduce-fuel":
      if (state.fuel <= 0) return feedback(state, "blocked", "Persediaan bahan bakar sudah kosong. Tidak ada pasokan yang dapat dikurangi.");
      return feedback({ ...state, fuel: clamp(state.fuel - C.fuelReduction) }, "fuel-reduced",
        "Pasokan bahan bakar dikurangi. Panas dan tekanan akan turun secara bertahap.");
    case "add-water": {
      if (state.water >= 100) return feedback(state, "blocked", "Ketel sudah berisi air hingga batas model. Tidak ada air yang ditambahkan.");
      const added = Math.min(C.waterAddition, 100 - state.water);
      const next = {
        ...state,
        water: clamp(state.water + added),
        heat: Math.max(C.ambientHeat, state.heat - (added / C.waterAddition) * C.refillCooling),
      };
      next.safety = safetyFor(next, state.safety === "danger");
      return feedback(next, "water-added", "Air ditambahkan ke ketel melalui pompa pengisi dan katup satu arah. Air dipanaskan menjadi uap; dalam model sederhana ini, air baru juga sedikit menurunkan panas.");
    }
    case "vent": {
      const next = {
        ...state,
        pressure: clamp(state.pressure - C.ventPressureDrop),
        heat: Math.max(C.ambientHeat, state.heat - C.ventHeatDrop),
        water: clamp(state.water - (state.pressure > 0 ? C.ventWaterCost : 0)),
      };
      next.safety = safetyFor(next, state.safety === "danger");
      if (!hasResources(next)) next.running = false;
      return feedback(next, "vented", next.safety === "danger"
        ? "Uap dilepaskan. Pengaman masih aktif; lanjutkan pendinginan hingga tekanan ≤60 dan panas ≤65."
        : "Uap dilepaskan dengan aman. Tekanan dan panas turun; sedikit air ikut keluar sebagai uap.");
    }
  }
}
