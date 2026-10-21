/**
 * REVO's deliberately simplified, dimensionless teaching model.
 * Levels are percentages, time is seconds, and output is illustrative units.
 * These values are NOT boiler operating instructions or physical SI units.
 */
export const SIMULATION = {
  fixedStep: 0.05,
  maxFrameTime: 0.25,
  initial: { water: 65, fuel: 35, heat: 20, pressure: 10 },
  ambientHeat: 20,
  minimumWater: 8,
  minimumFuel: 0.5,
  lowWater: 15,
  lowFuel: 5,
  safePressure: 75,
  emergencyPressure: 90,
  recoveryPressure: 60,
  recoveryHeat: 65,
  fuelAddition: 15,
  fuelReduction: 10,
  waterAddition: 15,
  refillCooling: 5,
  ventPressureDrop: 24,
  ventHeatDrop: 8,
  ventWaterCost: 1,
  // heatTarget = ambientHeat + fuel × fuelHeatGain while firing.
  fuelHeatGain: 1,
  heatingTime: 9,
  coolingTime: 16,
  // pressureTarget = (heat - ambientHeat) × steamGain, if water is sufficient.
  steamGain: 2.35,
  pressureResponseTime: 11,
  // speedTarget = pressure × pressureSpeedGain, capped at 100 while running.
  pressureSpeedGain: 1.3,
  accelerationTime: 2.2,
  coastTime: 1.8,
  // Resource consumption per second = base + speed × speed coefficient.
  baseFuelConsumption: 0.045,
  speedFuelConsumption: 0.0006,
  baseWaterConsumption: 0.1,
  speedWaterConsumption: 0.0018,
  // Safe production per second = speed / 100 × maximumProductionRate.
  maximumProductionRate: 2.3,
  missionTarget: 100,
} as const;
