import { describe, expect, it } from "vitest";
import { ASSEMBLY_PARTS, ASSEMBLY_CHECKS, ASSEMBLY_SOCKETS, assemblyComplete, assemblyProgress, assemblyReducer, canEnterStage, initialAssemblyState, socketAtPoint, type AssemblyState } from "@/lib/revo/assembly";

const placeAll = (): AssemblyState => ASSEMBLY_PARTS.reduce((state, part) => assemblyReducer(state, { type: "place", id: part.id, socket: part.id }), initialAssemblyState());
const complete = (): AssemblyState => ASSEMBLY_CHECKS.reduce((state, check) => assemblyReducer(state, { type: "answer", id: check.id, answer: check.answer }), placeAll());

describe("REVO assembly rules and stage gates", () => {
  it("starts locked and only 5/5 exploration opens assembly", () => {
    for (let explored = 0; explored < 5; explored++) expect(canEnterStage(1, explored, initialAssemblyState(), false)).toBe(false);
    expect(canEnterStage(1, 5, initialAssemblyState(), false)).toBe(true);
    expect(canEnterStage(2, 5, initialAssemblyState(), false)).toBe(false);
  });
  it("selects a component and target without granting placement", () => {
    let state = assemblyReducer(initialAssemblyState(), { type: "select", id: "boiler" });
    state = assemblyReducer(state, { type: "socket", id: "pipe" });
    expect(state.selected).toBe("boiler"); expect(state.socket).toBe("pipe"); expect(state.placed).toEqual([]);
  });
  it("accepts known matching IDs and gives relationship feedback", () => {
    const state = assemblyReducer(initialAssemblyState(), { type: "place", id: "boiler", socket: "boiler" });
    expect(state.placed).toEqual(["boiler"]); expect(state.selected).toBeNull(); expect(state.feedback).toContain("pipa");
  });
  it.each(["pipe", null] as const)("rejects a wrong or missed socket %s, retaining selection", socket => {
    const selected = assemblyReducer(initialAssemblyState(), { type: "select", id: "boiler" });
    const state = assemblyReducer(selected, { type: "place", id: "boiler", socket });
    expect(state.placed).toEqual([]); expect(state.selected).toBe("boiler"); expect(state.feedback).toContain("Belum cocok");
  });
  it("prevents duplicate placements and selecting installed parts", () => {
    let state = assemblyReducer(placeAll(), { type: "place", id: "boiler", socket: "boiler" });
    state = assemblyReducer(state, { type: "select", id: "boiler" });
    expect(state.placed).toHaveLength(5); expect(state.selected).toBeNull();
  });
  it("knowledge checks only accept answers once the relevant parts are installed", () => {
    const state = initialAssemblyState();
    expect(assemblyReducer(state, { type: "answer", id: "steam", answer: 0 })).toBe(state);
  });
  it("explains wrong answers and allows the same check to be retried", () => {
    let state = assemblyReducer(placeAll(), { type: "answer", id: "steam", answer: 1 });
    expect(state.checks).toEqual([]); expect(state.checkFeedback.steam?.message).toContain("Coba lagi"); expect(state.checkFeedback.steam?.message).toContain("Pipa menyalurkan");
    state = assemblyReducer(state, { type: "answer", id: "steam", answer: 0 });
    expect(state.checks).toEqual(["steam"]);
    expect(assemblyReducer(state, { type: "answer", id: "steam", answer: 0 })).toBe(state);
  });
  it.each([-1, 3, 0.5, NaN])("ignores invalid answer index %s", answer => {
    const state = placeAll(); expect(assemblyReducer(state, { type: "answer", id: "steam", answer })).toBe(state);
  });
  it("requires every part and every knowledge check to unlock Experiment", () => {
    const placed = placeAll(); expect(assemblyComplete(placed)).toBe(false); expect(canEnterStage(2, 5, placed, true)).toBe(false);
    const ready = complete(); expect(assemblyComplete(ready)).toBe(true); expect(assemblyProgress(ready)).toBe(100); expect(canEnterStage(2, 5, ready, false)).toBe(true);
    expect(canEnterStage(2, 4, ready, true)).toBe(false);
  });
  it("keeps Reflection locked until the simulation's safe mission succeeds", () => {
    expect(canEnterStage(3, 5, complete(), false)).toBe(false); expect(canEnterStage(3, 5, complete(), true)).toBe(true); expect(canEnterStage(4, 5, complete(), true)).toBe(false);
  });
  it("resets only assembly, revoking Experiment while exploration stays available", () => {
    const session = { explored: 5, assembly: complete(), production: 12 };
    const next = { ...session, assembly: assemblyReducer(session.assembly, { type: "reset" }) };
    expect(next.assembly).toEqual(initialAssemblyState()); expect(next.explored).toBe(5); expect(next.production).toBe(12);
    expect(canEnterStage(1, next.explored, next.assembly, false)).toBe(true); expect(canEnterStage(2, next.explored, next.assembly, false)).toBe(false);
  });
  it("detects the nearest fixed socket and rejects outside the snap area", () => {
    for (const part of ASSEMBLY_PARTS) { const [x,,z] = ASSEMBLY_SOCKETS[part.id]; expect(socketAtPoint(x, z)).toBe(part.id); }
    expect(socketAtPoint(4, 4)).toBeNull(); expect(socketAtPoint(Infinity, NaN)).toBeNull();
  });
});
