import { describe, expect, it } from "vitest";
import { PARTS } from "../src/lib/revo/industry-2/content";
import { CONCEPTS, CONNECTIONS, assessConnection } from "../src/lib/revo/industry-2/assembly";
import { ELECTRIC_PROGRESS_KEY, electricReducer, initialElectricProgress, normalizeElectricProgress, readElectricProgress, saveElectricProgress } from "../src/lib/revo/industry-2/progress";

describe("Industry 2.0 progress", () => {
  it("requires starting the briefing and all distinct part inspections", () => {
    const initial = initialElectricProgress();
    expect(electricReducer(initial, { type: "inspect", id: "supply" })).toBe(initial);
    let progress = electricReducer(initial, { type: "start" });
    for (const part of PARTS.slice(0, -1)) {
      progress = electricReducer(progress, { type: "inspect", id: part.id });
      expect(progress.exploreComplete).toBe(false);
    }
    expect(electricReducer(progress, { type: "inspect", id: "conveyor" })).toBe(progress);
    progress = electricReducer(progress, { type: "inspect", id: "stations" });
    expect(progress.explored).toHaveLength(PARTS.length);
    expect(progress.exploreComplete).toBe(true);
    expect(electricReducer(progress, { type: "start" })).toBe(progress);
    expect(electricReducer(progress, { type: "reset" })).toEqual(initial);
  });

  it("repairs duplicates, forged completion and a selection without matching evidence", () => {
    const value = normalizeElectricProgress({ version: 1, stage: "explore", explored: ["motor", "motor", "boiler", {}, 2], selected: "conveyor", exploreComplete: true });
    expect(value).toMatchObject({ stage: "explore", explored: ["motor"], selected: null, exploreComplete: false });
    expect(normalizeElectricProgress({ ...value, stage: "briefing" })).toEqual(initialElectricProgress());
  });

  it.each([
    null,
    [],
    { version: 4, stage: "explore", explored: [] },
    { version: 1, stage: "assembly", explored: PARTS.map(part => part.id) },
    { version: 1, stage: "explore", explored: "motor" },
  ])("rejects unsupported or malformed records: %j", raw => {
    expect(normalizeElectricProgress(raw)).toBeNull();
  });

  it("writes and resets only the Industry 2.0 key", () => {
    const steam = "revo:industry-1:progress";
    const data = new Map([[steam, "unchanged"]]);
    const store = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
    let progress = electricReducer(initialElectricProgress(), { type: "start" });
    progress = electricReducer(progress, { type: "inspect", id: "motor" });
    saveElectricProgress(store, progress);
    expect(readElectricProgress(store)).toEqual({ progress, status: "available" });
    data.set(ELECTRIC_PROGRESS_KEY, "{");
    expect(readElectricProgress(store)).toEqual({ progress: initialElectricProgress(), status: "invalid" });
    saveElectricProgress(store, initialElectricProgress());
    expect([...data]).toEqual([[steam, "unchanged"]]);
  });

  it("reports blocked storage as unavailable without granting access", () => {
    expect(readElectricProgress({ getItem: () => { throw new Error("blocked"); }, setItem() {}, removeItem() {} })).toEqual({ progress: initialElectricProgress(), status: "unavailable" });
  });
});

const ids = PARTS.map(part => part.id);
const completeExplore = () => ids.reduce((p, id) => electricReducer(p, { type: "inspect", id }), electricReducer(initialElectricProgress(), { type: "start" }));
const enterAssembly = () => electricReducer(completeExplore(), { type: "enter-assembly" });
const buildLinks = () => CONNECTIONS.reduce((p, link) => electricReducer(p, { type: "connect", from: link.from, to: link.to }), enterAssembly());

describe("Industry 2.0 assembly", () => {
  it("guards entry and link actions until the seven inspections and a stage transition", () => {
    const start = electricReducer(initialElectricProgress(), { type: "start" });
    expect(electricReducer(start, { type: "enter-assembly" })).toBe(start);
    const explored = completeExplore();
    expect(electricReducer(explored, { type: "connect", from: "supply", to: "panel" })).toBe(explored);
    const entered = electricReducer(explored, { type: "enter-assembly" });
    expect(entered).toMatchObject({ stage: "assembly", connections: [], conceptAnswers: {}, assemblyComplete: false });
    expect(electricReducer(entered, { type: "start" })).toBe(entered);
    expect(electricReducer(entered, { type: "inspect", id: "supply" })).toMatchObject({ stage: "assembly", selected: "supply" });
  });

  it("accepts only the five directed links once; feedback distinguishes reversal and material flow", () => {
    const initial = enterAssembly();
    const send = (from: typeof ids[number], to: typeof ids[number]) => electricReducer(initial, { type: "connect", from, to });
    expect(send("supply", "conveyor")).toBe(initial);
    expect(send("panel", "supply")).toBe(initial);
    expect(send("belt", "stations")).toBe(initial);
    expect(send("motor", "motor")).toBe(initial);
    expect(send("boiler" as "motor", "panel")).toBe(initial);
    expect(assessConnection("panel", "supply", [])).toMatchObject({ kind: "wrong", explanation: expect.stringContaining("terbalik") });
    expect(assessConnection("belt", "stations", [])).toMatchObject({ kind: "wrong", explanation: expect.stringContaining("Stasiun kerja") });
    expect(assessConnection("supply", "panel", ["E1"])).toMatchObject({ kind: "duplicate" });
    const installed = buildLinks();
    expect(installed.connections).toEqual(["E1", "E2", "M1", "M2", "M3"]);
    expect(electricReducer(installed, { type: "connect", from: "supply", to: "panel" })).toBe(installed);
  });

  it("requires all three correct answers after all five links; wrong answers and duplicates do not count", () => {
    const early = enterAssembly();
    expect(electricReducer(early, { type: "answer-concept", id: "C1", answer: "rotate" })).toBe(early);
    let progress = buildLinks();
    expect(progress.assemblyComplete).toBe(false);
    expect(electricReducer(progress, { type: "answer-concept", id: "C1", answer: "regulate" })).toBe(progress);
    expect(electricReducer(progress, { type: "answer-concept", id: "C2", answer: "rotate" })).toBe(progress);
    for (const concept of CONCEPTS) progress = electricReducer(progress, { type: "answer-concept", id: concept.id, answer: concept.correct });
    expect(progress).toMatchObject({ assemblyComplete: true, conceptAnswers: { C1: "rotate", C2: "no-drive", C3: "chain" } });
    expect(electricReducer(progress, { type: "answer-concept", id: "C1", answer: "rotate" })).toBe(progress);
    expect(electricReducer(progress, { type: "reset" })).toEqual(initialElectricProgress());
  });

  it("migrates V1 exploration, never fabricating Assembly evidence", () => {
    const v1 = JSON.stringify({ version: 1, stage: "explore", explored: [...ids, "boiler", "motor"], selected: "belt", connections: ["E1"], conceptAnswers: { C1: "rotate" }, assemblyComplete: true });
    const read = readElectricProgress({ getItem: () => v1, setItem() {}, removeItem() {} });
    expect(read).toMatchObject({ status: "available", migrate: true, progress: {
      version: 3, stage: "explore", explored: ids, selected: "belt", exploreComplete: true, connections: [], conceptAnswers: {}, assemblyComplete: false,
    } });
  });

  it("downgrades a V2 Assembly stage if exploration is incomplete and ignores forged flags", () => {
    const forged = { ...buildLinks(), version: 2, explored: ["motor", "motor", "boiler"], selected: "belt", exploreComplete: true, assemblyComplete: true };
    expect(normalizeElectricProgress(forged)).toMatchObject({
      stage: "explore", explored: ["motor"], selected: null, exploreComplete: false, connections: [], conceptAnswers: {}, assemblyComplete: false,
    });
    expect(normalizeElectricProgress({ ...forged, explored: ids, stage: "experiment" })).toBeNull();
  });

  it("strips foreign and duplicate connection IDs and removes answers if any link is missing", () => {
    const forged = { ...enterAssembly(), connections: ["E1", "E1", "boiler", {}, 4, "M3"], conceptAnswers: { C1: "rotate" }, assemblyComplete: true };
    expect(normalizeElectricProgress(forged)).toMatchObject({ connections: ["E1", "M3"], conceptAnswers: {}, assemblyComplete: false });
    expect(normalizeElectricProgress({ ...forged, connections: "E1" })).toMatchObject({ connections: [], conceptAnswers: {}, assemblyComplete: false });
  });

  it("restores accepted answer IDs without trusting cross-question options or completion flags", () => {
    const assembled = buildLinks();
    const partial = { ...assembled, conceptAnswers: { C1: "rotate", C2: "rotate", C3: true, C8: "fake" }, assemblyComplete: true };
    expect(normalizeElectricProgress(partial)).toMatchObject({ conceptAnswers: { C1: "rotate" }, assemblyComplete: false });
    const complete = { ...assembled, conceptAnswers: { C1: "rotate", C2: "no-drive", C3: "chain" }, assemblyComplete: false };
    expect(normalizeElectricProgress(complete)).toMatchObject({ assemblyComplete: true, conceptAnswers: complete.conceptAnswers });
  });
});
