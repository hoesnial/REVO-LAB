import { describe, expect, it } from "vitest";
import { experimentReady, initialObservations, normalizeObservations, observeExperiment } from "@/lib/revo/experiment";
import { applySteamAction, initialSteamState, stepSteam } from "@/lib/simulation/steamEngine";
import { ASSEMBLY_CHECKS } from "@/lib/revo/assembly";

describe("learning through real experiment observations", () => {
  it("does not accept fresh state, animation time, a start action, or transmission alone", () => {
    const initial = initialObservations();
    expect(experimentReady(initial)).toBe(false);
    expect(experimentReady({ ...initial, transmissionInspected: true })).toBe(false);
    expect(experimentReady(observeExperiment(initial, applySteamAction(initialSteamState(), { type: "start" })))).toBe(false);
  });
  it("unlocks with real motion, output above zero, transmission inspection and safe pressure, without waiting for a target", () => {
    const running = stepSteam(applySteamAction(initialSteamState(), { type: "start" }), 3);
    const observed = observeExperiment(initialObservations(), running);
    expect(observed.operated).toBe(true);
    expect(observed.motionObserved).toBe(true);
    expect(observed.production).toBeGreaterThan(0);
    expect(observed.production).toBeLessThan(1);
    expect(experimentReady(observed)).toBe(false);
    expect(experimentReady({ ...observeExperiment(initialObservations(), { ...running, speed: 0.001 }), transmissionInspected: true })).toBe(false);
    expect(experimentReady({ ...observed, transmissionInspected: true })).toBe(true);
  });
  it("retains unsafe history through cooling, machine reset and save normalization", () => {
    const unsafe = { ...initialSteamState(), running: true, speed: 40, production: 2, peakPressure: 76, unsafeCount: 1, elapsed: 2 };
    const observed = { ...observeExperiment(initialObservations(), unsafe), transmissionInspected: true };
    const reset = applySteamAction(unsafe, { type: "machine-reset" });
    const later = observeExperiment(observed, reset);
    expect(later.unsafeCount).toBe(1);
    expect(experimentReady(later)).toBe(false);
    expect(normalizeObservations(later)).toEqual(later);
    expect(initialObservations().unsafeCount).toBe(0);
  });
  it("preserves exact measured values and returns unchanged evidence without a sample change", () => {
    const state = stepSteam(applySteamAction(initialSteamState(), { type: "start" }), 3);
    const observed = observeExperiment(initialObservations(), state);
    expect(observed.production).toBe(state.production);
    expect(observed.peakPressure).toBe(state.peakPressure);
    expect(observeExperiment(observed, state)).toBe(observed);
  });
  it("uses the connecting rod and crank for conversion and flywheel for steadier rotation", () => {
    const check = ASSEMBLY_CHECKS.find(check => check.id === "rotation")!;
    expect(check.options).toHaveLength(4);
    expect(check.answer).toBe(1);
    expect(check.question).toContain("piston bergerak maju-mundur");
    expect(check.options[1]).toContain("engkol yang mengubahnya menjadi gerak putar");
    expect(check.explanation).toContain("roda gila membantu mempertahankan putaran yang lebih stabil");
  });
});
