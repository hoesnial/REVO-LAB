export type ElectricSettings = {
  power: boolean;
  transmission: boolean;
  obstruction: boolean;
};
export type ElectricRun = ElectricSettings & { running: boolean };

export const initialElectricRun: Readonly<ElectricRun> = {
  power: true, transmission: true, obstruction: false, running: false,
};

export type ElectricOutcome = {
  motor: "off" | "turning" | "stalled";
  conveyor: "stopped" | "moving" | "blocked";
  production: "idle" | "flowing" | "interrupted";
  driveMoving: boolean;
};

export function evaluateElectricRun(run: ElectricRun): ElectricOutcome {
  const energized = run.running && run.power;
  const stalled = energized && run.transmission && run.obstruction;
  const motor = !energized ? "off" : stalled ? "stalled" : "turning";
  const driveMoving = motor === "turning" && run.transmission;
  return {
    motor,
    driveMoving,
    conveyor: run.obstruction ? "blocked" : driveMoving ? "moving" : "stopped",
    production: driveMoving ? "flowing" : run.running ? "interrupted" : "idle",
  };
}

export const ELECTRIC_SCENARIOS = [
  {
    id: "normal", letter: "A", title: "Operasi normal",
    settings: { power: true, transmission: true, obstruction: false },
    change: "Nyalakan listrik, sambungkan transmisi, dan pastikan konveyor bebas.",
    result: "Motor berputar, konveyor bergerak, dan aliran produksi berjalan.",
    why: "Motor mengubah energi listrik menjadi putaran. Poros dan sabuk menyalurkan putaran ke rol, sehingga benda kerja bergerak antarestasiun.",
  },
  {
    id: "no-power", letter: "B", title: "Listrik terputus",
    settings: { power: false, transmission: true, obstruction: false },
    change: "Dari operasi normal, matikan listrik. Biarkan transmisi tersambung dan konveyor bebas.",
    result: "Motor dan konveyor berhenti. Aliran produksi terputus.",
    why: "Tanpa pasokan listrik, motor tidak menghasilkan putaran. Sambungan yang lengkap tidak dapat menggerakkan konveyor sendirian.",
  },
  {
    id: "no-drive", letter: "C", title: "Transmisi terputus",
    settings: { power: true, transmission: false, obstruction: false },
    change: "Nyalakan listrik kembali, lalu putuskan transmisi. Biarkan konveyor bebas.",
    result: "Motor tetap berputar, tetapi konveyor dan aliran produksi berhenti.",
    why: "Putaran motor tidak sampai ke rol. Listrik saja tidak cukup jika jalur mekanis terputus.",
  },
  {
    id: "blocked", letter: "D", title: "Konveyor terhalang",
    settings: { power: true, transmission: true, obstruction: true },
    change: "Sambungkan kembali transmisi. Dengan listrik menyala, beri penghalang pada konveyor.",
    result: "Konveyor macet, putaran motor tertahan, dan aliran produksi terputus.",
    why: "Model menganggap sambungan tidak selip: hambatan menahan konveyor dan putaran motor. Model ini tidak menghitung panas atau proteksi motor.",
  },
] as const satisfies readonly { id: string; letter: string; title: string; settings: ElectricSettings; change: string; result: string; why: string }[];

export type ElectricScenario = (typeof ELECTRIC_SCENARIOS)[number];
export type ElectricScenarioId = ElectricScenario["id"];
export type ElectricObservation = { inputs: ElectricRun; outcome: ElectricOutcome };
export type ElectricObservations = Partial<Record<ElectricScenarioId, ElectricObservation>>;

export function matchElectricScenario(settings: ElectricSettings): ElectricScenario | undefined {
  return ELECTRIC_SCENARIOS.find(({ settings: expected }) => expected.power === settings.power
    && expected.transmission === settings.transmission && expected.obstruction === settings.obstruction);
}

export function observeElectricRun(run: ElectricRun): { id: ElectricScenarioId; evidence: ElectricObservation } | null {
  if (run.running !== true) return null;
  const scenario = matchElectricScenario(run);
  return scenario ? {
    id: scenario.id,
    evidence: { inputs: { ...scenario.settings, running: true }, outcome: evaluateElectricRun(run) },
  } : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeElectricObservations(raw: unknown): ElectricObservations {
  const restored: ElectricObservations = {};
  if (!isRecord(raw)) return restored;
  for (const { id } of ELECTRIC_SCENARIOS) {
    const entry = raw[id];
    if (!isRecord(entry) || !isRecord(entry.inputs) || !isRecord(entry.outcome)) continue;
    const { power, transmission, obstruction, running } = entry.inputs;
    if (typeof power !== "boolean" || typeof transmission !== "boolean" || typeof obstruction !== "boolean" || running !== true) continue;
    const observed = observeElectricRun({ power, transmission, obstruction, running });
    if (!observed || observed.id !== id) continue;
    const { motor, conveyor, production, driveMoving } = observed.evidence.outcome;
    if (entry.outcome.motor === motor && entry.outcome.conveyor === conveyor
      && entry.outcome.production === production && entry.outcome.driveMoving === driveMoving) restored[id] = observed.evidence;
  }
  return restored;
}
