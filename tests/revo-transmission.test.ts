import { describe, expect, it } from "vitest";
import { TRANSMISSION, transmissionBeltDistances, transmissionMotion } from "@/lib/revo/mechanics";

describe("steam mill power transmission", () => {
  it("keeps both open-belt drives tangent to their pulleys", () => {
    const distances = transmissionBeltDistances();
    expect(distances.primary).toBeGreaterThan(Math.abs(TRANSMISSION.flywheelPulley.radius - TRANSMISSION.counterPulley.radius));
    expect(distances.secondary).toBeGreaterThan(Math.abs(TRANSMISSION.linePulley.radius - TRANSMISSION.loomPulley.radius));
  });

  it("derives every driven shaft and loom phase from one engine motion", () => {
    const motion = transmissionMotion(2, 1);
    expect(motion.counterAngle).toBeCloseTo(2 * TRANSMISSION.flywheelPulley.radius / TRANSMISSION.counterPulley.radius);
    expect(motion.lineAngle).toBeCloseTo(-motion.counterAngle * TRANSMISSION.bevel.ratio);
    expect(motion.loomAngle).toBeCloseTo(motion.lineAngle * TRANSMISSION.linePulley.radius / TRANSMISSION.loomPulley.radius);
    expect(motion.loomVelocity).toBeCloseTo(motion.lineVelocity * TRANSMISSION.linePulley.radius / TRANSMISSION.loomPulley.radius);
    const stopped = transmissionMotion(10, 0);
    expect(stopped.counterVelocity).toBeCloseTo(0);
    expect(stopped.lineVelocity).toBeCloseTo(0);
    expect(stopped.loomVelocity).toBeCloseTo(0);
    expect(transmissionMotion(0, 0)).toMatchObject({ counterAngle: 0, lineAngle: 0, loomAngle: 0 });
  });
});
