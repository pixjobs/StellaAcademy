import type { RocketConfig, LaunchTelemetry } from '@/types/rocket';

const GRAVITY = 9.81; // m/s^2
export const TARGET_DELTAV = 9400; // m/s required for LEO orbit

/**
 * Calculates the total wet mass of the vehicle.
 */
export function getWetMass(config: RocketConfig): number {
  return config.dryMass + config.fuelMass + config.payloadMass;
}

/**
 * Calculates the vehicle's mass ratio (R).
 */
export function getMassRatio(config: RocketConfig): number {
  const wet = getWetMass(config);
  const dry = config.dryMass + config.payloadMass;
  return wet / dry;
}

/**
 * Calculates total Delta-V capability of the vehicle using the Tsiolkovsky Rocket Equation.
 * Δv = Isp * g * ln(m0 / m1)
 */
export function calculateDeltaV(config: RocketConfig): number {
  const R = getMassRatio(config);
  return Math.round(config.isp * GRAVITY * Math.log(R));
}

/**
 * Generates live telemetry frames during launch simulation.
 * This is designed to be easily extensible to support full numerical integration (Runge-Kutta, drag, etc.).
 */
export function calculateTelemetryFrame(
  progress: number,
  config: RocketConfig,
  deltaV: number,
  isOrbitAchieved: boolean
): LaunchTelemetry {
  const fraction = progress / 100;
  
  // Basic trajectory kinematics (allowing easy transition to physical gravity turn math later)
  const velocity = Math.round(deltaV * fraction * (isOrbitAchieved ? 1 : 0.75));
  const altitude = Math.round(400 * Math.pow(fraction, 2) * (isOrbitAchieved ? 1 : 0.3));
  
  // Propellant depletion
  const fuelRemaining = Math.max(0, Math.round(config.fuelMass * (1 - fraction)));
  
  // Acceleration calculation a = Thrust / Mass
  // (Assuming thrust is roughly constant; Isp * g * flowRate)
  const flowRate = config.fuelMass / 10; // kg/s (assuming 10s burn time for visual simulation simplicity)
  const thrust = config.isp * GRAVITY * flowRate;
  
  const currentMass = config.dryMass + config.payloadMass + fuelRemaining;
  const acceleration = Number((thrust / currentMass).toFixed(2));

  return {
    progress,
    altitude,
    velocity,
    fuelRemaining,
    thrust,
    acceleration,
  };
}
