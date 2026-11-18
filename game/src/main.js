// Orbital Salvage: simulation, collisions, scoring and the frame loop. The game is
// plain canvas 2D with ES modules, no dependencies and no network calls, so it runs
// from any static file server (or straight off the disk).
import { WORLD, COLORS, SHIP, RUN } from "./config.js";
import { makeRng } from "./random.js";
import { attachInput } from "./input.js";
import { makePlayer, makeRock, makeBullet, burst, makeCell } from "./entities.js";
import { makeStars, drawWorld } from "./render.js";
import { resetWindow, stepSpawner, windowClear, planFor } from "./waves.js";
import { drawHud, drawBanner, drawTitle, drawWin, drawLose } from "./screens.js";
import { applyShot } from "./shots.js";
import { audio } from "./audio.js";

const BEST_KEY = "orbital-salvage:best";

function readBest() {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const n = raw === null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch (_) {
    return 0;
  }
}

function writeBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch (_) {
    /* private mode, storage full: the run still counts */
  }
}

export function newRun(seed) {
  const rng = makeRng(seed >>> 0);
  const run = {
    seed: seed >>> 0,
    rng,
    t: 0,
    state: "title",
    score: 0,
    best: readBest(),
    wave: 1,
    kills: 0,
    need: 3,
    cellsCollected: 0,
    combo: 0,
    comboTimer: 0,
    banner: 0,
    bannerWave: 1,
    shake: 0,
    player: makePlayer(),
    rocks: [],
    drones: [],
    cells: [],
    bullets: [],
    particles: [],
    spawn: null,
    stars: makeStars(rng),
    frozen: false,
  };
  resetWindow(run);
  return run;
}

function blank(run, state) {
  run.state = state;
  run.score = 0;
  run.wave = 1;
  run.kills = 0;
  run.need = 3;
  run.cellsCollected = 0;
  run.combo = 0;
  run.comboTimer = 0;
  run.banner = 0;
  run.shake = 0;
  run.player = makePlayer();
  run.rocks = [];
  run.drones = [];
  run.cells = [];
  run.bullets = [];
  run.particles = [];
  resetWindow(run);
}

export function launch(run) {
  blank(run, "play");
  run.bannerWave = 1;
  run.banner = 2.2;
  audio.unlock();
  audio.wave();
}

function nextSeed(run) {
  return (Math.imul(run.seed, 1664525) + 1013904223) >>> 0;
}

function endRun(run, state) {
  run.state = state;
  if (state === "won") {
    run.score += 400 + run.player.hull * 150 + Math.round(run.player.fuel * 2);
    audio.win();
  } else {
    audio.lose();
  }
  if (run.score > run.best) {
    run.best = run.score;
    writeBest(run.best);
  }
}

function damage(run) {
  const p = run.player;
  if (p.invuln > 0) return;
  p.hull -= 1;
  p.invuln = SHIP.invuln;
  run.combo = 0;
  run.comboTimer = 0;
  run.shake = 1;
  burst(run, p.x, p.y, COLORS.danger, 22, 1.3);
  audio.hurt();
  if (p.hull <= 0) endRun(run, "lost");
}

function addScore(run, base) {
  const mult = 1 + Math.min(run.combo, 8) * 0.25;
  run.score += Math.round(base * mult);
}

function bumpCombo(run) {
  run.combo += 1;
  run.comboTimer = RUN.comboWindow;
}

function splitRock(run, rock) {
  if (rock.r < 24) return;
  for (let i = 0; i < 2; i++) {
    const shard = makeRock(run.rng, run.wave, rock.r * 0.58);
    shard.x = rock.x;
    shard.y = rock.y;
    const a = run.rng.range(0, Math.PI * 2);
    const s = run.rng.range(50, 130);
    shard.vx = Math.cos(a) * s + rock.vx * 0.4;
    shard.vy = Math.sin(a) * s + rock.vy * 0.4;
    shard.hp = 1;
    run.rocks.push(shard);
  }
}

function updateBullets(run, dt) {
  const keep = [];
  for (const b of run.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0) continue;
    if (b.x < -30 || b.x > WORLD.w + 30 || b.y < -30 || b.y > WORLD.h + 30) continue;
    keep.push(b);
  }
  run.bullets = keep;
}

function updateRocks(run, dt) {
  for (const rock of run.rocks) {
    rock.x += rock.vx * dt;
    rock.y += rock.vy * dt;
    rock.rot += rock.spin * dt;
    if (rock.x < -rock.r) rock.x = WORLD.w + rock.r;
    if (rock.x > WORLD.w + rock.r) rock.x = -rock.r;
    if (rock.y < -rock.r) rock.y = WORLD.h + rock.r;
    if (rock.y > WORLD.h + rock.r) rock.y = -rock.r;
  }
}

function updateDrones(run, dt) {
  const p = run.player;
  for (const d of run.drones) {
    d.flash = Math.max(0, d.flash - dt * 4);
    const dx = p.x - d.x;
    const dy = p.y - d.y;
    const dist = Math.hypot(dx, dy) || 1;
    const wantX = (dx / dist) * d.speed;
    const wantY = (dy / dist) * d.speed;
    d.vx += (wantX - d.vx) * Math.min(1, d.turn * dt);
    d.vy += (wantY - d.vy) * Math.min(1, d.turn * dt);
    d.x += d.vx * dt;
    d.y += d.vy * dt;

    d.fire -= dt;
    const plan = planFor(run.wave);
    if (d.fire <= 0 && dist < 640 && run.state === "play") {
      const lead = plan.aim * 0.25;
      const aim = Math.atan2(p.y + p.vy * lead - d.y, p.x + p.vx * lead - d.x);
      const bolt = makeBullet(d.x + Math.cos(aim) * 18, d.y + Math.sin(aim) * 18, aim, 260, 3.2, false);
      run.bullets.push(bolt);
      d.fire = Math.max(1.1, 2.9 - run.wave * 0.22) * run.rng.range(0.85, 1.2);
    }
  }
}

function updateCells(run, dt) {
  const keep = [];
  for (const cell of run.cells) {
    cell.ttl -= dt;
    cell.y += cell.drift * dt;
    if (cell.y < 30 || cell.y > WORLD.h - 30) cell.drift *= -1;
    if (cell.ttl > 0) keep.push(cell);
  }
  run.cells = keep;
}

function updateParticles(run, dt) {
  const keep = [];
  for (const part of run.particles) {
    part.life -= dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vx *= 0.97;
    part.vy *= 0.97;
    if (part.life > 0) keep.push(part);
  }
  run.particles = keep;
}

function collide(run) {
  const p = run.player;

  // player shots against rocks and hunters
  const liveBullets = [];
  for (const b of run.bullets) {
    if (b.hostile) {
      liveBullets.push(b);
      continue;
    }
    let spent = false;

    for (const rock of run.rocks) {
      if (spent) break;
      if (Math.hypot(b.x - rock.x, b.y - rock.y) < rock.r + b.r) {
        rock.hp -= 1;
        burst(run, b.x, b.y, COLORS.rockEdge, 6, 0.7);
        if (rock.hp <= 0) {
          addScore(run, 18 + Math.round(rock.r));
          burst(run, rock.x, rock.y, COLORS.rockEdge, 16, 1.1);
          splitRock(run, rock);
          rock.dead = true;
          audio.rock();
        } else {
          audio.hit();
        }
        spent = true;
      }
    }

    if (!spent) {
      for (const drone of run.drones) {
        if (Math.hypot(b.x - drone.x, b.y - drone.y) < drone.r + b.r) {
          drone.hp -= 1;
          drone.flash = 1;
          burst(run, b.x, b.y, COLORS.drone, 8, 0.8);
          if (drone.hp <= 0) {
            drone.dead = true;
            run.kills += 1;
            bumpCombo(run);
            addScore(run, 80);
            burst(run, drone.x, drone.y, COLORS.drone, 24, 1.4);
            audio.hit();
          } else {
            audio.hit();
          }
          spent = true;
          break;
        }
      }
    }

    if (!spent) liveBullets.push(b);
  }
  // hostile shots against the tug; the player's spent shots are already gone
  const stillFlying = [];
  for (const b of liveBullets) {
    if (!b.hostile) {
      stillFlying.push(b);
      continue;
    }
    if (Math.hypot(b.x - p.x, b.y - p.y) < SHIP.radius + b.r) {
      damage(run);
      burst(run, b.x, b.y, COLORS.bolt, 10, 0.9);
      run.shake = Math.max(run.shake, 0.6);
      continue;
    }
    stillFlying.push(b);
  }
  run.bullets = stillFlying;

  // rocks knock the hull, then bounce off
  for (const rock of run.rocks) {
    if (rock.dead) continue;
    const dx = p.x - rock.x;
    const dy = p.y - rock.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < rock.r + SHIP.radius) {
      damage(run);
      const nx = dx / dist;
      const ny = dy / dist;
      p.vx = nx * 210;
      p.vy = ny * 210;
      rock.vx = -nx * Math.abs(rock.vx + 40);
      rock.vy = -ny * Math.abs(rock.vy + 40);
      burst(run, p.x - nx * 10, p.y - ny * 10, COLORS.rockEdge, 12, 1);
    }
  }

  // hunters ram
  for (const d of run.drones) {
    if (d.dead) continue;
    if (Math.hypot(p.x - d.x, p.y - d.y) < d.r + SHIP.radius) {
      damage(run);
      const dx = p.x - d.x;
      const dy = p.y - d.y;
      const dist = Math.hypot(dx, dy) || 1;
      p.vx = (dx / dist) * 240;
      p.vy = (dy / dist) * 240;
      d.vx = (-dx / dist) * 120;
      d.vy = (-dy / dist) * 120;
      burst(run, d.x, d.y, COLORS.drone, 14, 1.1);
    }
  }

  // cells
  const leftCells = [];
  for (const cell of run.cells) {
    if (Math.hypot(p.x - cell.x, p.y - cell.y) < cell.r + SHIP.radius) {
      p.fuel = Math.min(RUN.fuelMax, p.fuel + RUN.cellFuel);
      run.cellsCollected += 1;
      bumpCombo(run);
      addScore(run, 40);
      burst(run, cell.x, cell.y, COLORS.cell, 16, 0.9);
      audio.pickup();
      continue;
    }
    leftCells.push(cell);
  }
  run.cells = leftCells;
}

function advance(run) {
  if (run.wave >= RUN.waves) {
    endRun(run, "won");
    return;
  }
  run.wave += 1;
  resetWindow(run);
  run.bannerWave = run.wave;
  run.banner = 2.2;
  run.bullets = run.bullets.filter((b) => !b.hostile);
  audio.wave();
}

function steer(run, input, dt) {
  const p = run.player;
  let turn = 0;
  if (input.any("A", "ARROWLEFT")) turn -= 1;
  if (input.any("D", "ARROWRIGHT")) turn += 1;
  p.angle += turn * SHIP.turnRate * dt;

  const aim = input.pointer;
  if (aim.moved > 0) {
    const want = Math.atan2(aim.y - p.y, aim.x - p.x);
    let delta = want - p.angle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    p.angle += Math.max(-1, Math.min(1, delta)) * 6.5 * dt;
  }
}

function fly(run, input, dt) {
  const p = run.player;
  steer(run, input, dt);

  const forward = input.any("W", "ARROWUP");
  const back = input.any("S", "ARROWDOWN");
  p.thrusting = forward;

  if (forward) {
    p.vx += Math.cos(p.angle) * SHIP.thrust * dt;
    p.vy += Math.sin(p.angle) * SHIP.thrust * dt;
  }
  if (back) {
    p.vx -= Math.cos(p.angle) * SHIP.reverse * dt;
    p.vy -= Math.sin(p.angle) * SHIP.reverse * dt;
  }

  if (input.took("SHIFT") && p.dashCooldown <= 0) {
    p.dash = SHIP.dashTime;
    p.dashCooldown = SHIP.dashCooldown;
    p.vx += Math.cos(p.angle) * SHIP.dashSpeed;
    p.vy += Math.sin(p.angle) * SHIP.dashSpeed;
    burst(run, p.x, p.y, COLORS.bullet, 12, 1.1);
  }

  const damp = Math.exp(-SHIP.drag * dt);
  p.vx *= damp;
  p.vy *= damp;

  const speed = Math.hypot(p.vx, p.vy);
  const ceiling = p.dash > 0 ? SHIP.dashSpeed : SHIP.maxSpeed;
  if (speed > ceiling) {
    p.vx = (p.vx / speed) * ceiling;
    p.vy = (p.vy / speed) * ceiling;
  }

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if (p.x < SHIP.radius) { p.x = SHIP.radius; p.vx = Math.abs(p.vx) * 0.4; }
  if (p.x > WORLD.w - SHIP.radius) { p.x = WORLD.w - SHIP.radius; p.vx = -Math.abs(p.vx) * 0.4; }
  if (p.y < SHIP.radius) { p.y = SHIP.radius; p.vy = Math.abs(p.vy) * 0.4; }
  if (p.y > WORLD.h - SHIP.radius) { p.y = WORLD.h - SHIP.radius; p.vy = -Math.abs(p.vy) * 0.4; }

  if (input.any("SPACE") || input.pointer.down || input.took("SPACE")) {
    if (p.cooldown <= 0) {
      const nose = SHIP.radius + 6;
      run.bullets.push(makeBullet(
        p.x + Math.cos(p.angle) * nose,
        p.y + Math.sin(p.angle) * nose,
        p.angle,
        SHIP.bulletSpeed,
        SHIP.bulletLife,
        true,
      ));
      p.cooldown = SHIP.fireDelay;
      audio.shoot();
    }
  }

  p.cooldown = Math.max(0, p.cooldown - dt);
  p.dash = Math.max(0, p.dash - dt);
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);

  p.fuel -= RUN.fuelDrain * dt;
  if (p.fuel <= 0) {
    p.fuel = 0;
    if (p.invuln <= 0) {
      damage(run);
      if (run.state === "play") p.fuel = 34;
    }
  }
}

export function update(run, dt, input) {
  run.t += dt;
  run.shake = Math.max(0, run.shake - dt * 2.6);
  run.banner = Math.max(0, run.banner - dt);
  run.comboTimer = Math.max(0, run.comboTimer - dt);
  if (run.comboTimer === 0) run.combo = 0;

  if (run.state === "title") {
    updateParticles(run, dt);
    updateRocks(run, dt * 0.4);
    if (input.took("ENTER")) launch(run);
    return;
  }

  if (run.state !== "play") {
    updateParticles(run, dt);
    updateRocks(run, dt * 0.5);
    if (input.took("R")) {
      run.seed = nextSeed(run);
      run.rng = makeRng(run.seed);
      run.stars = makeStars(run.rng);
      blank(run, "play");
      run.banner = 2.2;
      run.bannerWave = 1;
    }
    return;
  }

  fly(run, input, dt);
  stepSpawner(run, dt);
  updateBullets(run, dt);
  updateRocks(run, dt);
  updateDrones(run, dt);
  updateCells(run, dt);
  updateParticles(run, dt);
  collide(run);

  run.rocks = run.rocks.filter((r) => !r.dead);
  run.drones = run.drones.filter((d) => !d.dead);

  if (run.state === "play" && windowClear(run)) advance(run);
}

export function render(ctx, run) {
  drawWorld(ctx, run, run.t);
  if (run.state === "title") {
    drawTitle(ctx, run, run.t);
    return;
  }
  drawHud(ctx, run);
  drawBanner(ctx, run);
  if (run.state === "won") drawWin(ctx, run, run.t);
  if (run.state === "lost") drawLose(ctx, run, run.t);
}

// ---- boot -----------------------------------------------------------------
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const input = attachInput(canvas);

function seedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const n = Number(params.get("seed"));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20261118;
}

let run = newRun(seedFromUrl());

const api = {
  newRun,
  setRun(next) { run = next; },
  getRun() { return run; },
  draw() { render(ctx, run); },
  launch() { launch(run); },
};

window.orbitalSalvage = api;

if (!applyShot(run, api)) {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, Math.max(0.0005, (now - last) / 1000));
    last = now;
    update(run, dt, input);
    render(ctx, run);
    input.endFrame(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
