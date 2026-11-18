// Tunable constants and the palette. Every number a designer would want to change lives here.
export const WORLD = { w: 1280, h: 800 };

export const COLORS = {
  void: "#05060d",
  grid: "#121a2e",
  hull: "#8ff0e0",
  hullDark: "#2b8f88",
  thrust: "#ffb457",
  fuel: "#7cf67c",
  fuelDim: "#2f6b35",
  rock: "#6b7590",
  rockEdge: "#9aa6c4",
  drone: "#ff5d73",
  droneEdge: "#ffa8b6",
  bullet: "#c9f7ff",
  text: "#e8f2ff",
  dim: "#6f7d99",
  warn: "#ff9d5c",
  good: "#7cf67c",
  bad: "#ff5d73",
};

export const PLAYER = {
  radius: 14,
  accel: 1500,          // px/s^2
  maxSpeed: 420,
  drag: 2.4,
  hullMax: 3,
  fireDelay: 0.13,      // seconds between shots
  bulletSpeed: 760,
  bulletLife: 0.9,
  invulnAfterHit: 1.4,
};

export const ORBIT = {
  fuelMax: 100,
  drainPerSecond: 2.6,  // the orbit decays, so the run always presses forward
  cellValue: 14,
  cellRadius: 9,
};

export const WAVES = {
  total: 5,             // clearing wave 5 wins the run
  baseRocks: 4,
  rocksPerWave: 2,
  baseDrones: 1,
  dronesPerWave: 1,
  spawnGap: 0.55,       // seconds between spawns inside a wave
  breathe: 2.2,         // calm seconds between waves
};

export const SCORE = {
  perCell: 25,
  perRock: 40,
  perDrone: 90,
  waveClear: 250,
  comboWindow: 3.0,     // seconds before the multiplier resets
  comboMax: 5,
};
