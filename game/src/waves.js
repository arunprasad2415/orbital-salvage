// Wave direction: what spawns, when, and how the run escalates to a win.
import { WAVES } from "./config.js";
import { makeRock, makeDrone, makeCell } from "./entities.js";

export function wavePlan(wave) {
  return {
    rocks: WAVES.baseRocks + (wave - 1) * WAVES.rocksPerWave,
    drones: WAVES.baseDrones + (wave - 1) * WAVES.dronesPerWave,
    cells: 2 + wave,
  };
}

// A spawn queue keeps arrivals spaced out instead of all at once, so a wave reads as
// a build-up rather than a wall of rocks.
export function beginWave(wave, rng) {
  const plan = wavePlan(wave);
  const queue = [];
  for (let i = 0; i < plan.rocks; i++) queue.push({ kind: "rock", at: i * WAVES.spawnGap });
  for (let i = 0; i < plan.drones; i++) queue.push({ kind: "drone", at: 1.2 + i * WAVES.spawnGap * 2 });
  for (let i = 0; i < plan.cells; i++) queue.push({ kind: "cell", at: 0.8 + i * 1.4 });
  queue.sort((a, b) => a.at - b.at);
  return { wave, plan, queue, t: 0, spawned: 0, alive: 0, done: false, rng };
}

export function stepWave(w, dt, spawn) {
  if (w.done) return;
  w.t += dt;
  while (w.spawned < w.queue.length && w.queue[w.spawned].at <= w.t) {
    const kind = w.queue[w.spawned].kind;
    if (kind === "rock") spawn.rock(makeRock(w.rng, w.wave));
    else if (kind === "drone") spawn.drone(makeDrone(w.rng, w.wave));
    else spawn.cell(makeCell(w.rng));
    w.spawned++;
  }
}

// The wave is cleared when everything it spawned is gone and nothing is left to spawn.
export function waveCleared(w, rocks, drones) {
  if (w.done) return false;
  if (w.spawned < w.queue.length) return false;
  return rocks.length === 0 && drones.length === 0;
}
