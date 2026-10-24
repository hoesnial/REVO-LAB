// Shared authored geometry, in scene units. The crosshead stays outside the
// cylinder throughout its stroke; the crank pin and rod share one front plane.
export const ENGINE = {
  crankX: -0.43, axisY: 1.23, planeZ: 1.74, crankRadius: 0.37,
  rodLength: 1.65, cylinderX: -3.15, cylinderLength: 0.65,
} as const;
export const GAUGE = { x: 0.35, y: 2.34, z: 0.94, radius: 0.205 } as const;
export const BOILER = { radius: 0.73, axisY: 1.32 } as const;

/** Authored centers are world-space coordinates in the factory diorama. The
 * first belt drives a front-to-back countershaft. A bevel pair turns that
 * power into the existing left-to-right line shaft, which drives the loom. */
export const TRANSMISSION = {
  flywheelPulley: { x: -0.43, y: 1.23, z: 1.28, radius: 0.78 },
  counterPulley: { x: 0.8, y: 2.82, z: 1.28, radius: 0.42 },
  countershaft: { x: 0.8, y: 2.82, rearZ: -1.6, frontZ: 1.48 },
  bevel: { x: 0.8, y: 2.82, z: -1.6, ratio: 1 },
  linePulley: { x: 3.9, y: 2.82, z: -1.6, radius: 0.29 },
  loomPulley: { x: 3.9, y: 1.15, z: -0.43, radius: 0.46 },
  beltWidth: 0.13,
  textureRepeat: 0.3,
} as const;

export function transmissionMotion(angle: number, velocity: number) {
  const primaryRatio = TRANSMISSION.flywheelPulley.radius / TRANSMISSION.counterPulley.radius;
  const secondaryRatio = TRANSMISSION.linePulley.radius / TRANSMISSION.loomPulley.radius;
  const counterAngle = angle * primaryRatio;
  const counterVelocity = velocity * primaryRatio;
  // The right-angle bevel pair reverses the signed shaft direction. Both
  // following belts are open drives, so each preserves its shaft direction.
  const lineAngle = counterAngle === 0 ? 0 : -counterAngle * TRANSMISSION.bevel.ratio;
  const lineVelocity = counterVelocity === 0 ? 0 : -counterVelocity * TRANSMISSION.bevel.ratio;
  return {
    primaryRatio,
    secondaryRatio,
    counterAngle,
    counterVelocity,
    lineAngle,
    lineVelocity,
    loomAngle: lineAngle * secondaryRatio,
    loomVelocity: lineVelocity * secondaryRatio,
  };
}

export function transmissionBeltDistances() {
  const primary = Math.hypot(
    TRANSMISSION.counterPulley.x - TRANSMISSION.flywheelPulley.x,
    TRANSMISSION.counterPulley.y - TRANSMISSION.flywheelPulley.y,
  );
  const secondary = Math.hypot(
    TRANSMISSION.linePulley.y - TRANSMISSION.loomPulley.y,
    TRANSMISSION.linePulley.z - TRANSMISSION.loomPulley.z,
  );
  return { primary, secondary };
}

export function linkageAt(angle: number) {
  const crankX = ENGINE.crankX + Math.cos(-angle) * ENGINE.crankRadius;
  const crankY = ENGINE.axisY + Math.sin(-angle) * ENGINE.crankRadius;
  const sliderX = crankX - Math.sqrt(ENGINE.rodLength ** 2 - (crankY - ENGINE.axisY) ** 2);
  const cylinderExit = ENGINE.cylinderX + ENGINE.cylinderLength / 2;
  return { crankX, crankY, sliderX, cylinderExit, pistonLength: sliderX - cylinderExit };
}
