// Wave composition. A window hands out a fixed budget of rocks and drones, keeps
// at most `alive` hunters on the field at once, and opens the next window once the
// tug has downed `kills` drones. Fuel cells keep trickling in on their own timer.
import { WAVE_PLAN, RUN } from "./config.js";
import { makeRock, makeDrone, makeCell, spawnOffscreen } from "./entities.js";

export function planFor(wave) {
  return WAVE_PLAN[Math.min(Math.max(wave, 1), WAVE_PLAN.length) - 1];
}

export function resetWindow(run) {
  const plan = planFor(run.wave);
  run.spawn = {
    rocks: plan.rocks,
    drones: plan.drones,
    rockTimer: 0.4,
    droneTimer: 1.2,
    cellTimer: 0.8,
  };
  run.need = plan.kills;
  run.kills = 0;
}

function freeSpot(run, pad) {
  for (let tries = 0; tries < 24; tries++) {
    const x = run.rng.range(pad, 1280 - pad);
    const y = run.rng.range(pad, 800 - pad);
    if (Math.hypot(x - run.player.x, y - run.player.y) > 170) return { x, y };
  }
  return { x: run.rng.range(pad, 1280 - pad), y: run.rng.range(pad, 800 - pad) };
}

export function stepSpawner(run, dt) {
  const plan = planFor(run.wave);
  const s = run.spawn;

  s.rockTimer -= dt;
  if (s.rocks > 0 && s.rockTimer <= 0 && run.rocks.length < plan.rocks) {
    const rock = makeRock(run.rng, run.wave);
    const at = spawnOffscreen(run, rock.r);
    rock.x = at.x;
    rock.y = at.y;
    run.rocks.push(rock);
    s.rocks -= 1;
    s.rockTimer = run.rng.range(0.5, 1.7);
  }

  s.droneTimer -= dt;
  if (s.drones > 0 && s.droneTimer <= 0 && run.drones.length < plan.alive) {
    const drone = makeDrone(run.rng, run.wave);
    const at = spawnOffscreen(run, 30);
    drone.x = at.x;
    drone.y = at.y;
    run.drones.push(drone);
    s.drones -= 1;
    s.droneTimer = plan.every * run.rng.range(0.8, 1.3);
  }

  s.cellTimer -= dt;
  if (s.cellTimer <= 0 && run.cells.length < 4) {
    const cell = makeCell(run.rng);
    const at = freeSpot(run, 70);
    cell.x = at.x;
    cell.y = at.y;
    run.cells.push(cell);
    s.cellTimer = run.rng.range(2.2, 4.4);
  }
}

export function windowClear(run) {
  return run.kills >= run.need;
}

export function allWavesDone(run) {
  return run.wave >= RUN.waves && windowClear(run);
}
