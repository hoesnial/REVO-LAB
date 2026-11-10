import { describe, expect, it } from "vitest";
import { CONCEPTS, CONNECTIONS } from "../src/lib/revo/industry-2/assembly";
import { PARTS } from "../src/lib/revo/industry-2/content";
import { ELECTRIC_SCENARIOS, evaluateElectricRun, initialElectricRun, observeElectricRun } from "../src/lib/revo/industry-2/experiment";
import { electricReducer, initialElectricProgress, normalizeElectricProgress, readElectricProgress, type ElectricProgress } from "../src/lib/revo/industry-2/progress";

const assembled = () => {
  let progress = electricReducer(initialElectricProgress(), { type: "start" });
  for (const part of PARTS) progress = electricReducer(progress, { type: "inspect", id: part.id });
  progress = electricReducer(progress, { type: "enter-assembly" });
  for (const { from, to } of CONNECTIONS) progress = electricReducer(progress, { type: "connect", from, to });
  return CONCEPTS.reduce((p, { id, correct }) => electricReducer(p, { type: "answer-concept", id, answer: correct }), progress);
};
const enter = (progress: ElectricProgress) => electricReducer(progress, { type: "enter-experiment" });
const observed = () => ELECTRIC_SCENARIOS.reduce((p, { settings }) => electricReducer(p, { type: "observe", run: { ...settings, running: true } }), enter(assembled()));

describe("electric experiment causal model", () => {
  const [normal, noPower, noDrive, blocked] = ELECTRIC_SCENARIOS;
  it.each([
    [normal, "turning", "moving", "flowing", true],
    [noPower, "off", "stopped", "interrupted", false],
    [noDrive, "turning", "stopped", "interrupted", false],
    [blocked, "stalled", "blocked", "interrupted", false],
  ] as const)("matches motor, conveyor and production for $id", (scenario, motor, conveyor, production, driveMoving) => {
    const run = { ...scenario.settings, running: true };
    const expected = { motor, conveyor, production, driveMoving };
    expect(evaluateElectricRun(run)).toEqual(expected);
    expect(observeElectricRun(run)).toEqual({ id: scenario.id, evidence: { inputs: run, outcome: expected } });
  });

  it("keeps the model idle when stopped and rejects evidence from overlapping faults", () => {
    expect(evaluateElectricRun(initialElectricRun)).toEqual({ motor: "off", conveyor: "stopped", production: "idle", driveMoving: false });
    expect(observeElectricRun(initialElectricRun)).toBeNull();
    const mixed = { power: true, transmission: false, obstruction: true, running: true };
    expect(evaluateElectricRun(mixed)).toEqual({ motor: "turning", conveyor: "blocked", production: "interrupted", driveMoving: false });
    expect(observeElectricRun(mixed)).toBeNull();
  });
});

describe("electric experiment progression", () => {
  it("gates entry and requires four distinct, explicit running observations", () => {
    const ready = assembled();
    const early = normalizeElectricProgress({ ...ready, conceptAnswers: { C1: "rotate" } })!;
    expect(enter(early)).toBe(early);
    const running = { ...initialElectricRun, running: true };
    expect(electricReducer(ready, { type: "observe", run: running })).toBe(ready);
    let experiment = enter(ready);
    expect(experiment).toMatchObject({ stage: "experiment", observations: {}, experimentComplete: false });
    expect(electricReducer(experiment, { type: "observe", run: initialElectricRun })).toBe(experiment);
    for (const [i, { id, settings }] of ELECTRIC_SCENARIOS.entries()) {
      const action = { type: "observe", run: { ...settings, running: true } } as const;
      experiment = electricReducer(experiment, action);
      expect(experiment.observations[id]?.inputs).toEqual(action.run);
      expect(experiment.experimentComplete).toBe(i === 3);
      expect(electricReducer(experiment, action)).toBe(experiment);
    }
  });

  it("migrates V2 Assembly including the checks but cannot import Experiment evidence from V2", () => {
    const complete = observed();
    const legacy = JSON.stringify({ ...complete, version: 2, stage: "assembly" });
    const restored = readElectricProgress({ getItem: () => legacy, setItem() {}, removeItem() {} });
    expect(restored).toMatchObject({ status: "available", migrate: true, progress: {
      version: 3, stage: "assembly", explored: complete.explored, connections: complete.connections,
      conceptAnswers: complete.conceptAnswers, assemblyComplete: true, observations: {}, experimentComplete: false,
    } });
    expect(normalizeElectricProgress({ ...complete, version: 2 })).toBeNull();
  });

  it("restores only evidence that matches the model and does not trust stored flags or run controls", () => {
    const complete = observed();
    expect(normalizeElectricProgress(JSON.parse(JSON.stringify(complete)))).toEqual(complete);
    const forged = {
      ...complete, running: true, observations: {
        ...complete.observations,
        "no-power": complete.observations.normal,
        "no-drive": { ...complete.observations["no-drive"], outcome: { motor: "turning", conveyor: "moving", production: "flowing", driveMoving: true } },
        fiction: complete.observations.normal,
      },
    };
    const restored = normalizeElectricProgress(forged)!;
    expect(Object.keys(restored.observations)).toEqual(["normal", "blocked"]);
    expect(restored.experimentComplete).toBe(false);
    expect(restored).not.toHaveProperty("running");
    expect(normalizeElectricProgress({ ...complete, conceptAnswers: {} })).toMatchObject({ stage: "assembly", observations: {}, experimentComplete: false });
    expect(normalizeElectricProgress({ ...complete, explored: ["motor"] })).toMatchObject({ stage: "explore", observations: {}, experimentComplete: false });
  });

  it("resets only observations unless their Assembly prerequisite is explicitly reset", () => {
    const complete = observed();
    expect(electricReducer(complete, { type: "reset-experiment" })).toEqual(enter(assembled()));
    const resetAssembly = electricReducer(complete, { type: "reset-assembly" });
    expect(resetAssembly).toMatchObject({ stage: "assembly", explored: complete.explored, connections: [], conceptAnswers: {}, observations: {}, experimentComplete: false });
    expect(enter(resetAssembly)).toBe(resetAssembly);
  });
});
