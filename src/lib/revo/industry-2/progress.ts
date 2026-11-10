import { PARTS, type ElectricPartId } from "./content";
import { assessConnection, CONCEPTS, CONNECTIONS, isConnectionId, isCorrectAnswer, type ConceptAnswerId, type ConceptAnswers, type ConceptId, type ConnectionId } from "./assembly";
import { ELECTRIC_SCENARIOS, normalizeElectricObservations, observeElectricRun, type ElectricObservations, type ElectricRun } from "./experiment";

export const ELECTRIC_PROGRESS_KEY = "revo:industry-2:progress";
export const ELECTRIC_PROGRESS_VERSION = 3 as const;
export type ElectricStage = "briefing" | "explore" | "assembly" | "experiment";
type Progress = {
  stage: ElectricStage;
  explored: readonly ElectricPartId[];
  selected: ElectricPartId | null;
  connections: readonly ConnectionId[];
  conceptAnswers: ConceptAnswers;
  observations: ElectricObservations;
};
export type ElectricProgress = Progress & { version: typeof ELECTRIC_PROGRESS_VERSION; exploreComplete: boolean; assemblyComplete: boolean; experimentComplete: boolean };
export type ElectricAction =
  | { type: "start" }
  | { type: "inspect"; id: ElectricPartId }
  | { type: "enter-assembly" }
  | { type: "connect"; from: ElectricPartId; to: ElectricPartId }
  | { type: "answer-concept"; id: ConceptId; answer: ConceptAnswerId }
  | { type: "enter-experiment" }
  | { type: "observe"; run: ElectricRun }
  | { type: "reset-experiment" }
  | { type: "reset-assembly" }
  | { type: "reset" };

const knownParts = new Set<string>(PARTS.map(part => part.id));
function isPartId(id: unknown): id is ElectricPartId {
  return typeof id === "string" && knownParts.has(id);
}

function snapshot(progress: Progress): ElectricProgress {
  const exploreComplete = PARTS.every(part => progress.explored.includes(part.id));
  const assemblyComplete = exploreComplete && (progress.stage === "assembly" || progress.stage === "experiment")
    && CONNECTIONS.every(link => progress.connections.includes(link.id))
    && CONCEPTS.every(concept => isCorrectAnswer(concept.id, progress.conceptAnswers[concept.id]));
  const experimentComplete = assemblyComplete && progress.stage === "experiment"
    && ELECTRIC_SCENARIOS.every(({ id }) => Boolean(progress.observations[id]));
  return { ...progress, version: ELECTRIC_PROGRESS_VERSION, exploreComplete, assemblyComplete, experimentComplete };
}

const emptyAssembly = { connections: [], conceptAnswers: {}, observations: {} } as const;
export const initialElectricProgress = (): ElectricProgress => snapshot({ stage: "briefing", explored: [], selected: null, ...emptyAssembly });

export function electricResumeLabel(progress: ElectricProgress) {
  switch (progress.stage) {
    case "briefing": return "Mulai Eksplorasi";
    case "explore": return "Lanjutkan Eksplorasi";
    case "assembly": return progress.assemblyComplete ? "Tinjau Perakitan" : "Lanjutkan Perakitan";
    case "experiment": return progress.experimentComplete ? "Tinjau Eksperimen" : "Lanjutkan Eksperimen";
  }
}

export function electricReducer(progress: ElectricProgress, action: ElectricAction): ElectricProgress {
  switch (action.type) {
    case "reset": return initialElectricProgress();
    case "reset-assembly":
      return (progress.stage === "assembly" || progress.stage === "experiment") && progress.connections.length > 0
        ? snapshot({ ...progress, ...emptyAssembly, stage: "assembly" }) : progress;
    case "reset-experiment":
      return progress.stage === "experiment" && Object.keys(progress.observations).length > 0
        ? snapshot({ ...progress, observations: {} }) : progress;
    case "enter-experiment":
      return progress.stage === "assembly" && progress.assemblyComplete
        ? snapshot({ ...progress, stage: "experiment" }) : progress;
    case "observe": {
      if (progress.stage !== "experiment" || !progress.assemblyComplete) return progress;
      const observed = observeElectricRun(action.run);
      if (!observed || progress.observations[observed.id]) return progress;
      return snapshot({ ...progress, observations: { ...progress.observations, [observed.id]: observed.evidence } });
    }
    case "start": return progress.stage !== "briefing" ? progress : snapshot({ ...progress, stage: "explore" });
    case "inspect": {
      if (progress.stage === "briefing" || !isPartId(action.id) || progress.selected === action.id) return progress;
      const explored = progress.explored.includes(action.id) ? progress.explored : [...progress.explored, action.id];
      return snapshot({ ...progress, explored, selected: action.id });
    }
    case "enter-assembly":
      return progress.stage === "explore" && progress.exploreComplete ? snapshot({ ...progress, stage: "assembly" }) : progress;
    case "connect": {
      if (progress.stage !== "assembly" || !isPartId(action.from) || !isPartId(action.to)) return progress;
      const result = assessConnection(action.from, action.to, progress.connections);
      return result.kind === "correct" ? snapshot({ ...progress, connections: [...progress.connections, result.connection.id] }) : progress;
    }
    case "answer-concept": {
      if (progress.stage !== "assembly" || !CONNECTIONS.every(link => progress.connections.includes(link.id))
        || !isCorrectAnswer(action.id, action.answer) || progress.conceptAnswers[action.id]) return progress;
      return snapshot({ ...progress, conceptAnswers: { ...progress.conceptAnswers, [action.id]: action.answer } });
    }
  }
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
}

export function normalizeElectricProgress(raw: unknown): ElectricProgress | null {
  if (!isRecord(raw)) return null;
  const { version, stage, explored, selected } = raw;
  if (version !== 1 && version !== 2 && version !== ELECTRIC_PROGRESS_VERSION) return null;
  const knownStage = stage === "briefing" || stage === "explore" || (version !== 1 && stage === "assembly")
    || (version === ELECTRIC_PROGRESS_VERSION && stage === "experiment");
  if (!knownStage || !Array.isArray(explored)) return null;
  if (stage === "briefing") return initialElectricProgress();
  const valid = [...new Set(explored.filter(isPartId))];
  const exploration = { explored: valid, selected: isPartId(selected) && valid.includes(selected) ? selected : null };
  // Earlier saves cannot contain evidence from a stage that did not exist.
  if ((stage !== "assembly" && stage !== "experiment") || !PARTS.every(part => valid.includes(part.id))) return snapshot({ stage: "explore", ...exploration, ...emptyAssembly });
  const connections = Array.isArray(raw.connections) ? [...new Set(raw.connections.filter(isConnectionId))] : [];
  const savedAnswers = raw.conceptAnswers;
  const conceptAnswers: Partial<Record<ConceptId, ConceptAnswerId>> = {};
  if (CONNECTIONS.every(link => connections.includes(link.id)) && isRecord(savedAnswers)) {
    for (const concept of CONCEPTS) if (savedAnswers[concept.id] === concept.correct) conceptAnswers[concept.id] = concept.correct;
  }
  const assembled = snapshot({ stage: "assembly", ...exploration, connections, conceptAnswers, observations: {} });
  return stage === "experiment" && assembled.assemblyComplete
    ? snapshot({ ...assembled, stage, observations: normalizeElectricObservations(raw.observations) })
    : assembled;
}

export type ElectricStorageStatus = "available" | "invalid" | "unavailable";
type ElectricStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function readElectricProgress(storage: ElectricStorage): { progress: ElectricProgress; status: ElectricStorageStatus; migrate?: true } {
  let raw: string | null;
  try { raw = storage.getItem(ELECTRIC_PROGRESS_KEY); }
  catch { return { progress: initialElectricProgress(), status: "unavailable" }; }
  if (raw === null) return { progress: initialElectricProgress(), status: "available" };
  try {
    const parsed: unknown = JSON.parse(raw);
    const progress = normalizeElectricProgress(parsed);
    if (progress) return isRecord(parsed) && parsed.version !== ELECTRIC_PROGRESS_VERSION
      ? { progress, status: "available", migrate: true } : { progress, status: "available" };
  } catch { /* Invalid JSON is treated like an unsupported save. */ }
  return { progress: initialElectricProgress(), status: "invalid" };
}

export function saveElectricProgress(storage: ElectricStorage, progress: ElectricProgress): void {
  if (progress.stage === "briefing") storage.removeItem(ELECTRIC_PROGRESS_KEY);
  else storage.setItem(ELECTRIC_PROGRESS_KEY, JSON.stringify(progress));
}
