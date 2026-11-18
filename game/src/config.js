// Tuning constants and the palette. One place to change how the game feels.
export const WORLD = { w: 1280, h: 800 };

export const COLORS = {
  sky0: "#05060d",
  sky1: "#0b1226",
  nebula: "#1b2b5a",
  star: ["#4a5f8c", "#7d93c4", "#cfd9ee"],
  hull: "#dfe9ff",
  hullDark: "#2a3654",
  thruster: "#ffb454",
  thrusterCore: "#fff2d0",
  rock: "#3a4159",
  rockEdge: "#7f8db3",
  drone: "#ff5d6c",
  droneShell: "#4a1622",
  eye: "#ffd3a1",
  bolt: "#ff8a6b",
  cell: "#5ef2a0",
  cellCore: "#e8fff2",
  bullet: "#9fe8ff",
  hud: "#c8d6f2",
  hudDim: "#5a6b8f",
  good: "#5ef2a0",
  warn: "#ffcc66",
  danger: "#ff5d6c",
  text: "#eaf1ff",
};

export const SHIP = {
  turnRate: 3.5,
  thrust: 360,
  reverse: 150,
  drag: 0.55,
  maxSpeed: 430,
  radius: 15,
  fireDelay: 0.16,
  bulletSpeed: 720,
  bulletLife: 0.85,
  invuln: 1.6,
  dashSpeed: 780,
  dashTime: 0.16,
  dashCooldown: 2.6,
};

export const RUN = {
  hullStart: 3,
  fuelMax: 100,
  fuelDrain: 1.9,
  cellFuel: 26,
  cellLife: 9,
  comboWindow: 3.4,
  waves: 5,
};

// Per-wave budget. `rocks` and `drones` are the totals for the window; `kills` is
// the number of drones that must go down before the next window opens.
export const WAVE_PLAN = [
  { rocks: 5, drones: 3, kills: 3, alive: 2, every: 1.8, speed: 1.0, aim: 0 },
  { rocks: 6, drones: 5, kills: 5, alive: 3, every: 1.6, speed: 1.12, aim: 0.4 },
  { rocks: 7, drones: 7, kills: 7, alive: 3, every: 1.45, speed: 1.24, aim: 0.7 },
  { rocks: 8, drones: 9, kills: 9, alive: 4, every: 1.3, speed: 1.36, aim: 0.9 },
  { rocks: 9, drones: 11, kills: 11, alive: 4, every: 1.15, speed: 1.5, aim: 1.0 },
];
