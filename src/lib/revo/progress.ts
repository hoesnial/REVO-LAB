import { ASSEMBLY_CHECKS, ASSEMBLY_PARTS, type AssemblyCheckId } from "@/lib/revo/assembly";
import { quizQuestions, type ComponentId } from "@/lib/revo/content";

export const REVO_PROGRESS_KEY = "revo:industry-1:progress";
export const REVO_PROGRESS_VERSION = 1 as const;

export type LearningCheckpoint = 0 | 1 | 2 | 3 | 4;
export type CompletedLearningStage = "exploration" | "assembly" | "experiment" | "reflection" | "level";

export interface ReflectionProgress {
  /** Submitted answers from the current or most recent attempt. */
  answers: number[];
  /** A selected answer is safe to restore; no quiz answer is scored until checked. */
  draftAnswer: number | null;
  checked: boolean;
  /** The latest fully submitted attempt, retained while a retry is in progress. */
  resultAnswers: number[] | null;
  retaking: boolean;
}

export interface RevoProgress {
  version: typeof REVO_PROGRESS_VERSION;
  selectedEra: "industry-1";
  explored: ComponentId[];
  assembly: { placed: ComponentId[]; checks: AssemblyCheckId[] };
  completedStages: CompletedLearningStage[];
  experimentComplete: boolean;
  reflection: ReflectionProgress;
  levelComplete: boolean;
  checkpoint: LearningCheckpoint;
  preferences: { soundEnabled: boolean };
}

export const initialReflectionProgress = (): ReflectionProgress => ({
  answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false,
});

export function scoreReflection(answers: readonly number[]): number {
  return answers.reduce((score, answer, index) => score + (answer === quizQuestions[index]?.answer ? 1 : 0), 0);
}

export function validReflectionAnswers(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((answer, index) =>
    Number.isInteger(answer) && answer >= 0 && answer < (quizQuestions[index]?.options.length ?? 0));
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isCheckpoint = (value: unknown): value is LearningCheckpoint =>
  Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= 4;
const uniqueKnown = <T extends string>(values: unknown[], known: readonly T[]): T[] => {
  const set = new Set(known);
  return [...new Set(values.filter((value): value is T => typeof value === "string" && set.has(value as T)))];
};
const completedStages = (explored: ComponentId[], assembled: boolean, experiment: boolean, level: boolean): CompletedLearningStage[] => [
  ...(explored.length === 5 ? ["exploration" as const] : []),
  ...(assembled ? ["assembly" as const] : []),
  ...(experiment ? ["experiment" as const] : []),
  ...(level ? ["reflection" as const, "level" as const] : []),
];

/**
 * Validate browser data as untrusted input and repair only contradictions that
 * can safely be resolved by revoking the dependent, later learning stages.
 */
export function normalizeProgress(value: unknown): RevoProgress | null {
  if (!isObject(value) || value.version !== REVO_PROGRESS_VERSION || value.selectedEra !== "industry-1") return null;
  if (!Array.isArray(value.explored) || !isObject(value.assembly) || !Array.isArray(value.assembly.placed) || !Array.isArray(value.assembly.checks)) return null;
  if (!Array.isArray(value.completedStages) || typeof value.experimentComplete !== "boolean" || typeof value.levelComplete !== "boolean" || !isCheckpoint(value.checkpoint)) return null;
  if (!isObject(value.reflection) || !isObject(value.preferences) || typeof value.preferences.soundEnabled !== "boolean") return null;

  const knownComponents = ASSEMBLY_PARTS.map(part => part.id);
  const explored = uniqueKnown(value.explored, knownComponents);
  const orderedExplored = knownComponents.filter(id => explored.includes(id));
  const explorationComplete = orderedExplored.length === knownComponents.length;
  const placed = explorationComplete ? uniqueKnown(value.assembly.placed, knownComponents) : [];
  const orderedPlaced = knownComponents.filter(id => placed.includes(id));
  const checks = explorationComplete ? uniqueKnown(value.assembly.checks, ASSEMBLY_CHECKS.map(check => check.id)) : [];
  const placedSet = new Set(orderedPlaced);
  const validChecks = ASSEMBLY_CHECKS.filter(check => checks.includes(check.id) && check.requires.every(id => placedSet.has(id))).map(check => check.id);
  const assembled = orderedPlaced.length === knownComponents.length && validChecks.length === ASSEMBLY_CHECKS.length;
  const experimentComplete = value.experimentComplete && assembled;

  const rawReflection = value.reflection;
  if (!Array.isArray(rawReflection.answers) || typeof rawReflection.checked !== "boolean" || typeof rawReflection.retaking !== "boolean") return null;
  if (rawReflection.draftAnswer !== null && (!Number.isInteger(rawReflection.draftAnswer) || typeof rawReflection.draftAnswer !== "number")) return null;
  if (rawReflection.resultAnswers !== null && rawReflection.resultAnswers !== undefined && !validReflectionAnswers(rawReflection.resultAnswers)) return null;
  const rawAnswers = rawReflection.answers;
  if (!validReflectionAnswers(rawAnswers)) return null;

  let reflection = initialReflectionProgress();
  if (experimentComplete) {
    const resultAnswers = rawReflection.resultAnswers === null || rawReflection.resultAnswers === undefined
      ? null
      : rawReflection.resultAnswers.length === quizQuestions.length ? [...rawReflection.resultAnswers] : null;
    const answers = rawAnswers.length <= quizQuestions.length ? [...rawAnswers] : [];
    const questionIndex = answers.length;
    const draftAnswer = rawReflection.draftAnswer as number | null;
    const validDraft = draftAnswer === null || (questionIndex < quizQuestions.length && draftAnswer < quizQuestions[questionIndex].options.length);
    const canResumeAttempt = validDraft && (questionIndex < quizQuestions.length);
    const checked = canResumeAttempt && draftAnswer !== null && rawReflection.checked;
    reflection = {
      answers: canResumeAttempt ? answers : [],
      draftAnswer: canResumeAttempt ? draftAnswer : null,
      checked,
      resultAnswers,
      retaking: !!resultAnswers && rawReflection.retaking,
    };
    if (reflection.answers.length === quizQuestions.length && !reflection.resultAnswers) {
      reflection.resultAnswers = [...reflection.answers];
      reflection.retaking = false;
      reflection.draftAnswer = null;
      reflection.checked = false;
    }
  }

  const levelComplete = experimentComplete && reflection.resultAnswers !== null;
  const stages = completedStages(orderedExplored, assembled, experimentComplete, levelComplete);
  const checkpoint = Math.min(value.checkpoint, levelComplete ? 4 : experimentComplete ? 3 : assembled ? 2 : explorationComplete ? 1 : 0) as LearningCheckpoint;
  // Contradictory stage flags are never trusted; the returned list comes only
  // from the validated component, mission and reflection data above.

  return {
    version: REVO_PROGRESS_VERSION,
    selectedEra: "industry-1",
    explored: orderedExplored,
    assembly: { placed: orderedPlaced, checks: validChecks },
    completedStages: stages,
    experimentComplete,
    reflection,
    levelComplete,
    checkpoint,
    preferences: { soundEnabled: value.preferences.soundEnabled },
  };
}

export function createRevoProgress(input: {
  explored: ComponentId[];
  placed: ComponentId[];
  checks: AssemblyCheckId[];
  experimentComplete: boolean;
  reflection: ReflectionProgress;
  checkpoint: LearningCheckpoint;
  soundEnabled: boolean;
}): RevoProgress {
  const normalized = normalizeProgress({
    version: REVO_PROGRESS_VERSION,
    selectedEra: "industry-1",
    explored: input.explored,
    assembly: { placed: input.placed, checks: input.checks },
    completedStages: [],
    experimentComplete: input.experimentComplete,
    reflection: input.reflection,
    levelComplete: false,
    checkpoint: input.checkpoint,
    preferences: { soundEnabled: input.soundEnabled },
  });
  if (!normalized) throw new Error("Cannot create a REVO progress snapshot from invalid game state.");
  return normalized;
}

export function hasSavedProgress(progress: RevoProgress | null): progress is RevoProgress {
  return !!progress && (progress.explored.length > 0 || progress.assembly.placed.length > 0 || progress.assembly.checks.length > 0 || progress.experimentComplete || progress.reflection.answers.length > 0 || progress.reflection.draftAnswer !== null || progress.reflection.resultAnswers !== null || progress.checkpoint > 0);
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type StorageStatus = "available" | "unavailable" | "malformed" | "unsupported";
export interface ReadProgressResult { progress: RevoProgress | null; status: StorageStatus }

export function readRevoProgress(storage: StorageLike | null): ReadProgressResult {
  if (!storage) return { progress: null, status: "unavailable" };
  try {
    const raw = storage.getItem(REVO_PROGRESS_KEY);
    if (!raw) return { progress: null, status: "available" };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return { progress: null, status: "malformed" }; }
    if (isObject(parsed) && typeof parsed.version === "number" && parsed.version !== REVO_PROGRESS_VERSION) return { progress: null, status: "unsupported" };
    const progress = normalizeProgress(parsed);
    return progress ? { progress, status: "available" } : { progress: null, status: "malformed" };
  } catch {
    return { progress: null, status: "unavailable" };
  }
}

export function writeRevoProgress(storage: StorageLike | null, progress: RevoProgress | null): boolean {
  if (!storage) return false;
  try {
    if (!progress || !hasSavedProgress(progress)) storage.removeItem(REVO_PROGRESS_KEY);
    else {
      const normalized = normalizeProgress(progress);
      if (!normalized) return false;
      storage.setItem(REVO_PROGRESS_KEY, JSON.stringify(normalized));
    }
    return true;
  } catch {
    return false;
  }
}
