import { describe, expect, it } from "vitest";
import { BOILER, ENGINE, GAUGE, linkageAt } from "@/lib/revo/mechanics";
import { coalPose, fillingBlocked, initialLabSimulation, labSimulationReducer as update, type LabSimulationState, type ResourceKind } from "@/lib/revo/resourceFilling";
import { applySteamAction, stepSteam } from "@/lib/simulation/steamEngine";

const tick = (model: LabSimulationState, seconds: number) => update(model, { type: "tick", steps: Math.round(seconds / 0.05) });

describe("visible mechanical geometry", () => {
  it("keeps a fixed-length rod joined to the rotating crank throughout a revolution", () => {
    let minimumStroke = Infinity;
    let maximumStroke = -Infinity;
    for (let i = 0; i <= 720; i++) {
      const pose = linkageAt(i * Math.PI / 360);
      expect(Math.hypot(pose.crankX - pose.sliderX, pose.crankY - ENGINE.axisY)).toBeCloseTo(ENGINE.rodLength, 10);
      expect(Math.hypot(pose.crankX - ENGINE.crankX, pose.crankY - ENGINE.axisY)).toBeCloseTo(ENGINE.crankRadius, 10);
      expect(pose.sliderX - 0.07).toBeGreaterThan(pose.cylinderExit + 0.25);
      expect(pose.pistonLength).toBeGreaterThan(0);
      minimumStroke = Math.min(minimumStroke, pose.sliderX); maximumStroke = Math.max(maximumStroke, pose.sliderX);
    }
    expect(maximumStroke - minimumStroke).toBeCloseTo(2 * ENGINE.crankRadius, 10);
    // Frontmost boiler cap ends at z=.84, clear of the entire cylinder/rod.
    expect(ENGINE.planeZ - 0.27).toBeGreaterThan(0.84 + 0.4);
  });
  it("mounts the whole gauge dial above the highest boiler surface", () => {
    expect(GAUGE.y - GAUGE.radius).toBeGreaterThan(BOILER.axisY + BOILER.radius + 0.05);
  });
  it("opens the firebox for insertion and closes before completion", () => {
    expect(coalPose(0).door).toBe(0);
    expect(coalPose(0.62).door).toBe(1);
    expect(coalPose(0.62).coalVisible).toBe(true);
    expect(coalPose(0.7).coalVisible).toBe(false);
    expect(coalPose(0.7).ember).toBeGreaterThan(0);
    expect(coalPose(1).door).toBe(0);
    expect(coalPose(1).position).toEqual(coalPose(0).position);
  });
});

describe("one resource filling timeline", () => {
  it.each(["coal", "water"] as ResourceKind[])("adds %s once, only after the complete animation", kind => {
    const initial = initialLabSimulation();
    const started = update(initial, { type: "fill", kind });
    const field = kind === "coal" ? "fuel" : "water";
    const partial = tick(started, 2);
    expect(partial.steam[field]).toBe(initial.steam[field]);
    const completed = tick(partial, 2);
    expect(completed.filling.kind).toBeNull();
    expect(completed.steam[field]).toBe(initial.steam[field] + 15);
    expect(tick(completed, 10).steam[field]).toBe(completed.steam[field]);
  });
  it("uses exactly the original water update including proportional cooling", () => {
    const initial = initialLabSimulation();
    initial.steam = { ...initial.steam, water: 95, heat: 55, elapsed: 10 };
    const started = update(initial, { type: "fill", kind: "water" });
    const beforeCommit = tick(started, 3.15);
    const expected = applySteamAction(stepSteam(beforeCommit.steam, 0.05), { type: "add-water" });
    expect(tick(beforeCommit, 0.05).steam).toEqual(expected);
    expect(expected.water).toBe(100);
  });
  it("ignores repeated and cross-resource requests while a fill is active", () => {
    const started = update(initialLabSimulation(), { type: "add-fuel" });
    let repeated = started;
    for (let i = 0; i < 50; i++) repeated = update(repeated, { type: i % 2 ? "add-water" : "add-fuel" });
    expect(repeated).toBe(started);
    expect(tick(repeated, 4).steam.fuel).toBe(50);
    expect(tick(repeated, 4).steam.water).toBe(65);
  });
  it.each(["coal", "water"] as ResourceKind[])("clamps %s to capacity and explains full capacity", kind => {
    const initial = initialLabSimulation(); const field = kind === "coal" ? "fuel" : "water";
    initial.steam = { ...initial.steam, [field]: 98 };
    const completed = tick(update(initial, { type: "fill", kind }), 4);
    expect(completed.steam[field]).toBe(100);
    const refused = update(completed, { type: "fill", kind });
    expect(refused.filling.kind).toBeNull(); expect(refused.steam.event.message).toContain("penuh");
  });
  it("preserves progress exactly when ticks are suspended and resumes remaining time", () => {
    const partial = tick(update(initialLabSimulation(), { type: "add-water" }), 1);
    expect(partial.filling.elapsed).toBeCloseTo(1);
    expect(partial.steam.water).toBe(65);
    expect(tick(partial, 0)).toBe(partial);
    expect(tick(partial, 2.2).steam.water).toBe(80);
  });
  it("cancels navigation/reset without awarding resources or completing a stale action", () => {
    const partial = tick(update(initialLabSimulation(), { type: "add-fuel" }), 2);
    const cancelled = update(partial, { type: "cancel-fill" });
    expect(tick(cancelled, 10).steam.fuel).toBe(35);
    expect(cancelled.steam.event.message).toContain("dibatalkan");
    const reset = update(partial, { type: "reset" });
    expect(tick(reset, 10).steam.fuel).toBe(35); expect(reset.filling.kind).toBeNull();
  });
  it("blocks unsafe fills and cancels if pressure becomes unsafe during filling", () => {
    const initial = initialLabSimulation();
    initial.steam = { ...initial.steam, pressure: 76 };
    for (const kind of ["coal", "water"] as const) expect(fillingBlocked(initial.steam, kind)).toContain("tidak aman");
    expect(update(initial, { type: "add-water" }).filling.kind).toBeNull();
    const started = update(initialLabSimulation(), { type: "add-fuel" });
    const unsafe = { ...started, steam: { ...started.steam, running: true, elapsed: 10, heat: 100, pressure: 74.99 } };
    const cancelled = tick(unsafe, 1);
    expect(cancelled.filling.kind).toBeNull(); expect(cancelled.steam.fuel).toBeLessThanOrEqual(35);
  });
  it("permits a feed pump at safe operating pressure without changing consumption equations", () => {
    const initial = initialLabSimulation();
    initial.steam = { ...initial.steam, running: true, elapsed: 10, pressure: 40, heat: 40 };
    const working = update(initial, { type: "add-water" });
    const after = tick(working, 1);
    let unmodified = initial.steam;
    for (let i = 0; i < 20; i++) unmodified = stepSteam(unmodified, 0.05);
    expect(after.steam.water).toBe(unmodified.water); expect(after.steam.fuel).toBe(unmodified.fuel);
    expect(after.steam.production).toBe(unmodified.production);
  });
});
