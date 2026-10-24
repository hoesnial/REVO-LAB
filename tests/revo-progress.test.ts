import { describe, expect, it } from "vitest";
import { initialAssemblyState } from "@/lib/revo/assembly";
import {
  createRevoProgress,
  hasSavedProgress,
  initialReflectionProgress,
  normalizeProgress,
  readRevoProgress,
  REVO_PROGRESS_KEY,
  REVO_PROGRESS_VERSION,
  scoreReflection,
  writeRevoProgress,
  type RevoProgress,
  type StorageLike,
} from "@/lib/revo/progress";
import { initialLabSimulation, labSimulationReducer } from "@/lib/revo/resourceFilling";

const parts = ["boiler", "pipe", "piston", "flywheel", "textile"] as const;
const checks = ["steam", "rotation", "factory"] as const;
const correctAnswers = [1, 0, 2];

function progress(overrides: Partial<Parameters<typeof createRevoProgress>[0]> = {}) {
  return createRevoProgress({
    explored: [...parts], placed: [...parts], checks: [...checks], experimentComplete: true,
    reflection: initialReflectionProgress(), checkpoint: 2, soundEnabled: false, ...overrides,
  });
}

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

const rawSave = (value: unknown) => JSON.stringify({
  version: REVO_PROGRESS_VERSION,
  selectedEra: "industry-1",
  explored: [...parts],
  assembly: { placed: [...parts], checks: [...checks] },
  completedStages: ["exploration", "assembly", "experiment"],
  experimentComplete: true,
  reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false },
  levelComplete: false,
  checkpoint: 2,
  preferences: { soundEnabled: false },
  ...value as object,
});

describe("REVO local progress schema", () => {
  it("treats a fresh player as having no continue checkpoint", () => {
    expect(readRevoProgress(new MemoryStorage())).toEqual({ progress: null, status: "available" });
    expect(hasSavedProgress(null)).toBe(false);
  });

  it("saves and restores partial exploration IDs without duplicates", () => {
    const storage = new MemoryStorage();
    const partial = progress({ explored: ["boiler", "pipe", "boiler"], placed: [], checks: [], experimentComplete: false, checkpoint: 0 });
    expect(writeRevoProgress(storage, partial)).toBe(true);
    const restored = readRevoProgress(storage).progress;
    expect(restored?.explored).toEqual(["boiler", "pipe"]);
    expect(restored?.checkpoint).toBe(0);
    expect(restored?.assembly).toEqual({ placed: [], checks: [] });
  });

  it("marks exploration complete only after all five known components", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ explored: [...parts].reverse(), assembly: { placed: [], checks: [] }, experimentComplete: false })));
    expect(restored?.completedStages).toEqual(["exploration"]);
    expect(restored?.explored).toEqual([...parts]);
    expect(restored?.checkpoint).toBeLessThanOrEqual(1);
  });

  it("restores a partial assembly and its correct knowledge-check results", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({
      assembly: { placed: ["boiler", "pipe"], checks: ["steam"] }, experimentComplete: false, checkpoint: 1,
    })));
    expect(restored?.assembly).toEqual({ placed: ["boiler", "pipe"], checks: ["steam"] });
    expect(restored?.completedStages).toEqual(["exploration"]);
    expect(restored?.checkpoint).toBe(1);
  });

  it("persists completed assembly and unlocks Experiment after reload", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ checkpoint: 2 })));
    expect(restored?.assembly.placed).toHaveLength(5);
    expect(restored?.assembly.checks).toHaveLength(3);
    expect(restored?.completedStages).toEqual(["exploration", "assembly", "experiment"]);
    expect(restored?.checkpoint).toBe(2);
  });

  it("does not restore downstream progress if exploration is incomplete", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ explored: ["boiler"], checkpoint: 4, levelComplete: true,
      reflection: { answers: correctAnswers, draftAnswer: null, checked: false, resultAnswers: correctAnswers, retaking: false } })));
    expect(restored?.explored).toEqual(["boiler"]);
    expect(restored?.assembly).toEqual({ placed: [], checks: [] });
    expect(restored?.experimentComplete).toBe(false);
    expect(restored?.reflection.resultAnswers).toBeNull();
    expect(restored?.levelComplete).toBe(false);
    expect(restored?.checkpoint).toBe(0);
  });

  it("revokes checks whose required parts are missing", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ assembly: { placed: ["boiler"], checks: ["steam", "rotation", "factory"] }, experimentComplete: true, checkpoint: 3 })));
    expect(restored?.assembly.checks).toEqual([]);
    expect(restored?.experimentComplete).toBe(false);
    expect(restored?.checkpoint).toBe(1);
  });

  it("clamps an invalid checkpoint to the last dependency-valid stage", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ assembly: { placed: ["boiler", "pipe"], checks: ["steam"] }, checkpoint: 4, levelComplete: true })));
    expect(restored?.checkpoint).toBe(1);
    expect(restored?.levelComplete).toBe(false);
  });

  it("derives reflection score from the submitted answer IDs", () => {
    expect(scoreReflection(correctAnswers)).toBe(3);
    expect(scoreReflection([0, 1, 0])).toBe(0);
  });

  it("completes reflection with any fully submitted answer set, without requiring a perfect score", () => {
    const saved = progress({ reflection: { answers: correctAnswers, draftAnswer: null, checked: false, resultAnswers: [0, 1, 0], retaking: false }, checkpoint: 4 });
    expect(saved.levelComplete).toBe(true);
    expect(saved.completedStages).toEqual(["exploration", "assembly", "experiment", "reflection", "level"]);
    expect(scoreReflection(saved.reflection.resultAnswers ?? [])).toBe(0);
  });

  it("restores a draft choice and its checked feedback for the current reflection question", () => {
    const draft = { answers: [1], draftAnswer: 0, checked: true, resultAnswers: null, retaking: false };
    const restored = normalizeProgress(JSON.parse(rawSave({ reflection: draft, checkpoint: 3 })));
    expect(restored?.reflection).toEqual(draft);
    expect(restored?.checkpoint).toBe(3);
    expect(restored?.levelComplete).toBe(false);
  });

  it("preserves a prior submitted result while a safely stored retry is in progress", () => {
    const retry = { answers: [1], draftAnswer: 0, checked: false, resultAnswers: correctAnswers, retaking: true };
    const restored = normalizeProgress(JSON.parse(rawSave({ reflection: retry, levelComplete: true, checkpoint: 4 })));
    expect(restored?.levelComplete).toBe(true);
    expect(restored?.reflection).toEqual(retry);
    expect(scoreReflection(restored?.reflection.resultAnswers ?? [])).toBe(3);
  });

  it("restores experiment completion as a stopped machine with no filling", () => {
    const initial = initialLabSimulation();
    const restored = labSimulationReducer(initial, { type: "restore-complete" });
    expect(restored.steam.missionComplete).toBe(true);
    expect(restored.steam.production).toBe(100);
    expect(restored.steam.running).toBe(false);
    expect(restored.steam.speed).toBe(0);
    expect(restored.filling.kind).toBeNull();
  });

  it("keeps an incomplete experiment at safe initial resources rather than restoring a running timer", () => {
    const initial = initialLabSimulation();
    const filling = labSimulationReducer(initial, { type: "fill", kind: "coal" });
    const stopped = labSimulationReducer({ ...filling, steam: { ...filling.steam, running: true } }, { type: "cancel-fill" });
    expect(stopped.steam.running).toBe(true);
    const safeReload = initialLabSimulation();
    expect(safeReload.steam.running).toBe(false);
    expect(safeReload.filling.kind).toBeNull();
    expect(safeReload.steam.fuel).toBe(initial.steam.fuel);
  });

  it("handles missing, malformed and unsupported browser saves without throwing", () => {
    const storage = new MemoryStorage();
    storage.setItem(REVO_PROGRESS_KEY, "not-json");
    expect(readRevoProgress(storage)).toEqual({ progress: null, status: "malformed" });
    storage.setItem(REVO_PROGRESS_KEY, JSON.stringify({ version: 999 }));
    expect(readRevoProgress(storage)).toEqual({ progress: null, status: "unsupported" });
    expect(readRevoProgress(null)).toEqual({ progress: null, status: "unavailable" });
  });

  it("rejects invalid top-level field types and answer indices", () => {
    expect(normalizeProgress({ version: 1, selectedEra: "industry-1", explored: "boiler" })).toBeNull();
    expect(normalizeProgress(JSON.parse(rawSave({ reflection: { answers: [99], draftAnswer: null, checked: false, resultAnswers: null, retaking: false } })))).toBeNull();
  });

  it("ignores contradictory completion flags and derives completed stages from validated progress", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ completedStages: ["level"], levelComplete: true, experimentComplete: false, checkpoint: 4 })));
    expect(restored?.levelComplete).toBe(false);
    expect(restored?.completedStages).toEqual(["exploration", "assembly"]);
    expect(restored?.checkpoint).toBe(2);
  });

  it("retains the audio preference as data without automatically starting a context", () => {
    const restored = normalizeProgress(JSON.parse(rawSave({ preferences: { soundEnabled: true } })));
    expect(restored?.preferences.soundEnabled).toBe(true);
  });

  it("keeps an empty assembly reset from removing completed exploration", () => {
    const assembly = initialAssemblyState();
    expect(assembly.placed).toEqual([]);
    const restored = normalizeProgress(JSON.parse(rawSave({ assembly: { placed: [], checks: [] }, experimentComplete: false, checkpoint: 1 })));
    expect(restored?.explored).toHaveLength(5);
    expect(restored?.assembly.placed).toEqual([]);
    expect(restored?.completedStages).toEqual(["exploration"]);
  });

  it("removes saved level progress when a full replay is confirmed", () => {
    const storage = new MemoryStorage();
    expect(writeRevoProgress(storage, progress())).toBe(true);
    expect(writeRevoProgress(storage, null)).toBe(true);
    expect(readRevoProgress(storage).progress).toBeNull();
  });

  it("keeps storage exceptions in the session fallback path", () => {
    const unavailable: StorageLike = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("quota"); },
      removeItem() { throw new Error("blocked"); },
    };
    expect(readRevoProgress(unavailable).status).toBe("unavailable");
    expect(writeRevoProgress(unavailable, progress())).toBe(false);
  });

  it("round-trips the versioned schema and derives results instead of trusting a stored score", () => {
    const storage = new MemoryStorage();
    const record: RevoProgress = progress({ reflection: { answers: correctAnswers, draftAnswer: null, checked: false, resultAnswers: correctAnswers, retaking: false }, checkpoint: 4 });
    expect(writeRevoProgress(storage, record)).toBe(true);
    const raw = JSON.parse(storage.getItem(REVO_PROGRESS_KEY) ?? "null");
    expect(raw.version).toBe(REVO_PROGRESS_VERSION);
    expect(raw.reflection.score).toBeUndefined();
    expect(readRevoProgress(storage).progress?.levelComplete).toBe(true);
  });
});
