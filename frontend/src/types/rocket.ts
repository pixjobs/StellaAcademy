export interface RocketConfig {
  dryMass: number; // kg
  fuelMass: number; // kg
  isp: number; // seconds
  payloadMass: number; // kg
}

export interface LaunchTelemetry {
  progress: number; // 0 to 100
  altitude: number; // km
  velocity: number; // m/s
  fuelRemaining: number; // kg
  thrust: number; // N
  acceleration: number; // m/s^2
}

export type LaunchStatus = 'Standby' | 'Ignition Sequence Started...' | 'Liftoff!' | 'Passing Max-Q' | 'Main Engine Cutoff (MECO)' | 'Orbit Insertion Burn' | 'Orbit Achieved' | 'Sub-orbital / Burn Up';

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}
