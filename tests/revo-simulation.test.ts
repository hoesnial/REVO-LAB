import { describe, expect, it } from "vitest";
import { SIMULATION as C } from "@/lib/simulation/simulationConstants";
import { applySteamAction, initialSteamState, stepSteam, type SteamState } from "@/lib/simulation/steamEngine";

const start = (overrides: Partial<SteamState> = {}) =>
  applySteamAction({ ...initialSteamState(), ...overrides }, { type: "start" });
const run = (state: SteamState, seconds: number) => stepSteam(state, seconds);

describe("REVO steam engine learning model", () => {
  it("starts from stocked resources and creates measurable motion within seconds", () => {
    const state = run(start(), 3);
    expect(state.running).toBe(true);
    expect(state.heat).toBeGreaterThan(C.initial.heat);
    expect(state.speed).toBeGreaterThan(5);
    expect(state.production).toBeGreaterThan(0);
    expect(state.water).toBeLessThan(C.initial.water);
    expect(state.fuel).toBeLessThan(C.initial.fuel);
  });

  it("prevents operation without sufficient water or fuel", () => {
    for (const overrides of [{ water: 0 }, { water: C.minimumWater - 0.1 }, { fuel: 0 }]) {
      const state = run(start(overrides), 20);
      expect(state.running).toBe(false);
      expect(state.production).toBe(0);
      expect(state.event.type).toBe("blocked");
    }
  });

  it("completes 100 safe units in the 60–90 second demonstration window", () => {
    let state = start();
    while (!state.missionComplete && state.elapsed < 90) state = stepSteam(state, C.fixedStep);
    expect(state.missionComplete).toBe(true);
    expect(state.elapsed).toBeGreaterThanOrEqual(60);
    expect(state.elapsed).toBeLessThanOrEqual(90);
    expect(state.production).toBe(C.missionTarget);
    expect(state.peakPressure).toBeLessThanOrEqual(C.safePressure);
    expect(state.unsafeCount).toBe(0);
    expect(state.running).toBe(false);
    expect(state.event.type).toBe("complete");
    const later = run(state, 90);
    expect(later.missionComplete).toBe(true);
    expect(later.production).toBe(100);
    expect(later.unsafeCount).toBe(0);
    expect(later.event.id).toBe(state.event.id);
  });

  it("excess fuel leads to a warning and a latched emergency stop", () => {
    let state = start();
    for (let i = 0; i < 5; i += 1) state = applySteamAction(state, { type: "add-fuel" });
    let warningSeen = false;
    for (let t = 0; t < 90 && state.running; t += C.fixedStep) {
      state = stepSteam(state, C.fixedStep);
      warningSeen ||= state.safety === "warning";
    }
    expect(warningSeen).toBe(true);
    expect(state.safety).toBe("danger");
    expect(state.running).toBe(false);
    expect(state.event.type).toBe("emergency");
    expect(state.unsafeCount).toBe(1);
    expect(state.peakPressure).toBeGreaterThanOrEqual(C.emergencyPressure);
    expect(applySteamAction(state, { type: "start" }).running).toBe(false);
    expect(state.missionComplete).toBe(false);
  });

  it("counts separate unsafe crossings and cannot erase a failed mission by venting", () => {
    let state = start({ heat: 65, pressure: 74.99, fuel: 50 });
    state = run(state, 0.2);
    expect(state.unsafeCount).toBe(1);
    state = applySteamAction(state, { type: "vent" });
    expect(state.pressure).toBeLessThan(75);
    state = run(state, 10);
    expect(state.unsafeCount).toBe(2);
    state = { ...state, running: true, pressure: 50, heat: 42, fuel: 25, safety: "safe", production: 99.99 };
    state = run(state, 1);
    expect(state.production).toBeGreaterThan(100);
    expect(state.missionComplete).toBe(false);
  });

  it("vents pressure and heat, and only releases the latch once both are safe", () => {
    const emergency: SteamState = { ...initialSteamState(), pressure: 92, heat: 95, safety: "danger", elapsed: 10 };
    let state = applySteamAction(emergency, { type: "vent" });
    expect(state.pressure).toBeLessThan(emergency.pressure);
    expect(state.heat).toBeLessThan(emergency.heat);
    expect(state.water).toBeLessThan(emergency.water);
    expect(state.safety).toBe("danger");
    state = applySteamAction(state, { type: "vent" });
    expect(state.pressure).toBeLessThan(60);
    expect(state.safety).toBe("danger");
    state = run(state, 40);
    expect(state.safety).not.toBe("danger");
    expect(applySteamAction(state, { type: "start" }).running).toBe(true);
  });

  it("stopping cuts heat input and lets mechanical speed coast to rest", () => {
    const working = run(start(), 30);
    const stopped = applySteamAction(working, { type: "stop" });
    expect(stopped.speed).toBe(working.speed);
    const coasting = run(stopped, 1);
    expect(coasting.speed).toBeGreaterThan(0);
    expect(coasting.speed).toBeLessThan(stopped.speed);
    const rested = run(coasting, 30);
    expect(rested.speed).toBe(0);
    expect(rested.heat).toBeLessThan(working.heat);
    expect(rested.production).toBe(working.production);
    expect(rested.fuel).toBe(working.fuel);
  });

  it("stops when a resource is depleted during operation", () => {
    const state = run(start({ water: 8.1, heat: 45, pressure: 50 }), 5);
    expect(state.running).toBe(false);
    expect(state.water).toBeLessThan(C.minimumWater);
    expect(state.event.type).toBe("resource-low");
  });

  it("is deterministic and leaves previous snapshots untouched", () => {
    const initial = initialSteamState();
    const snapshot = structuredClone(initial);
    const scenario = () => {
      let state = applySteamAction(initial, { type: "start" });
      state = run(state, 18);
      state = applySteamAction(state, { type: "add-fuel" });
      state = run(state, 12);
      state = applySteamAction(state, { type: "vent" });
      return run(state, 15);
    };
    expect(scenario()).toEqual(scenario());
    expect(initial).toEqual(snapshot);
    expect(stepSteam(initial, Number.NaN)).toBe(initial);
    expect(stepSteam(initial, Number.POSITIVE_INFINITY)).toBe(initial);
    expect(stepSteam(initial, -1)).toBe(initial);
  });

  it("matches the same elapsed time when fixed steps are batched", () => {
    const initial = start();
    const batched = stepSteam(initial, 10);
    let individual = initial;
    for (let i = 0; i < 200; i += 1) individual = stepSteam(individual, C.fixedStep);
    expect(batched).toEqual(individual);
  });

  it("adding water cools a warm boiler without cooling below ambient", () => {
    const warm = run(start(), 20);
    const filled = applySteamAction(warm, { type: "add-water" });
    expect(filled.water).toBeGreaterThan(warm.water);
    expect(filled.heat).toBeLessThan(warm.heat);
    const cold = applySteamAction(initialSteamState(), { type: "add-water" });
    expect(cold.heat).toBe(C.ambientHeat);
  });

  it("keeps resource and machine levels bounded through repeated controls", () => {
    let state = start();
    for (let i = 0; i < 200; i += 1) {
      state = applySteamAction(state, { type: i % 2 ? "add-fuel" : "add-water" });
      state = run(state, 1);
      state = applySteamAction(state, { type: "vent" });
      for (const field of ["water", "fuel", "heat", "pressure", "speed"] as const) {
        expect(state[field]).toBeGreaterThanOrEqual(0);
        expect(state[field]).toBeLessThanOrEqual(100);
      }
    }
    for (let i = 0; i < 20; i += 1) state = applySteamAction(state, { type: "reduce-fuel" });
    expect(state.fuel).toBe(0);
  });

  it("resets resources, output, and failed safety history for a fresh attempt", () => {
    const failed = { ...run(start({ fuel: 100 }), 35), unsafeCount: 2, production: 34 };
    const reset = applySteamAction(failed, { type: "reset" });
    expect({ ...reset, event: initialSteamState().event }).toEqual(initialSteamState());
    expect(reset.event.type).toBe("reset");
    expect(reset.event.id).toBeGreaterThan(failed.event.id);
  });

  it("reports full and empty resource controls without claiming a change", () => {
    const full = { ...initialSteamState(), water: 100, fuel: 100, heat: 50 };
    const fuel = applySteamAction(full, { type: "add-fuel" });
    const water = applySteamAction(full, { type: "add-water" });
    const empty = applySteamAction({ ...full, fuel: 0 }, { type: "reduce-fuel" });
    expect(fuel.fuel).toBe(100);
    expect(water.water).toBe(100);
    expect(water.heat).toBe(50);
    expect(empty.fuel).toBe(0);
    for (const state of [fuel, water, empty]) expect(state.event.type).toBe("blocked");
  });
});
