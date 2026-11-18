// The run itself: state machine, collisions, scoring and the frame loop.
import { WORLD, PLAYER, ORBIT, SCORE, WAVES, COLORS } from "./config.js";
import { Input } from "./input.js";
import { Sfx } from "./audio.js";
import { mulberry32, rand, clamp, dist2 } from "./random.js";
import {
  makePlayer, updatePlayer, shoot, updateBullets,
  steerDrone, driftRock,
} from "./entities.js";
import { beginWave, stepWave, waveCleared } from "./waves.js";
import {
  drawBackdrop, drawTug, drawRock, drawDrone, drawCell,
  drawBullets, drawParticles, makeStars,
} from "./render.js";
import { drawHud, drawTitle, drawEnd } from "./screens.js";
import { applyShot } from "./shots.js";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const input = new Input(canvas);
input.onFirstGesture = () => Sfx.unlock();

const stars = makeStars(mulberry32(7), 190);

function newRun(seed) {
  const rng = mulberry32(seed);
  const run = {
    state: "title",          // title | play | won | lost
    seed, rng, t: 0,
    player: makePlayer(),
    bullets: [], rocks: [], drones: [], cells: [], particles: [],
    wave: 1, waveState: null,
    score: 0, combo: 1, comboTimer: 0, cellsCollected: 0,
    banner: 0, breathe: 0, shake: 0,
    best: Number(localStorage.getItem("orbital-best") || 0),
  };
  return run;
}

let run = newRun(Date.now() % 100000);

function burst(run, x, y, color, n = 14, power = 190) {
  for (let i = 0; i < n; i++) {
    const a = run.rng() * Math.PI * 2;
    const s = rand(run.rng, 40, power);
    const life = rand(run.rng, 0.25, 0.7);
    run.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life, maxLife: life, size: rand(run.rng, 2, 4.5), color,
    });
  }
}

function startRun() {
  const seed = Date.now() % 100000;
  const best = run.best;
  run = newRun(seed);
  run.best = best;
  run.state = "play";
  run.waveState = beginWave(1, run.rng);
  run.banner = 1.6;
  Sfx.wave();
}

function addScore(run, base) {
  run.score += Math.round(base * run.combo);
  run.comboTimer = SCORE.comboWindow;
  run.combo = Math.min(SCORE.comboMax, run.combo + 1);
}

function hurt(run) {
  const p = run.player;
  if (p.invuln > 0) return;
  p.hull -= 1;
  p.invuln = PLAYER.invulnAfterHit;
  run.shake = 0.45;
  run.combo = 1;
  burst(run, p.x, p.y, COLORS.drone, 22, 240);
  Sfx.hurt();
  if (p.hull <= 0) {
    run.state = "lost";
    run.best = Math.max(run.best, run.score);
    localStorage.setItem("orbital-best", String(run.best));
    Sfx.lose();
  }
}

function winRun(run) {
  run.state = "won";
  run.best = Math.max(run.best, run.score);
  localStorage.setItem("orbital-best", String(run.best));
  Sfx.win();
}

function collide(run, dt) {
  const p = run.player;

  // Bullets against rocks and drones.
  for (const b of run.bullets) {
    for (const r of run.rocks) {
      if (r.dead) continue;
      if (dist2(b.x, b.y, r.x, r.y) < (r.r + b.r) ** 2) {
        b.life = 0;
        r.hp -= 1;
        burst(run, b.x, b.y, COLORS.rockEdge, 6, 120);
        if (r.hp <= 0) {
          r.dead = true;
          addScore(run, SCORE.perRock);
          burst(run, r.x, r.y, COLORS.rock, 16, 200);
          Sfx.rock();
        }
        break;
      }
    }
    for (const d of run.drones) {
      if (d.dead) continue;
      if (dist2(b.x, b.y, d.x, d.y) < (d.r + b.r) ** 2) {
        b.life = 0;
        d.hp -= 1;
        d.flash = 0.12;
        if (d.hp <= 0) {
          d.dead = true;
          addScore(run, SCORE.perDrone);
          burst(run, d.x, d.y, COLORS.drone, 20, 240);
          Sfx.drone();
        }
        break;
      }
    }
  }

  // Contact damage.
  for (const r of run.rocks) {
    if (r.dead) continue;
    if (dist2(p.x, p.y, r.x, r.y) < (r.r + p.r * 0.8) ** 2) hurt(run);
  }
  for (const d of run.drones) {
    if (d.dead) continue;
    if (dist2(p.x, p.y, d.x, d.y) < (d.r + p.r * 0.8) ** 2) {
      d.dead = true;
      burst(run, d.x, d.y, COLORS.drone, 16, 220);
      hurt(run);
    }
  }

  // Fuel cells.
  for (const c of run.cells) {
    if (c.dead) continue;
    if (dist2(p.x, p.y, c.x, c.y) < (c.r + p.r) ** 2) {
      c.dead = true;
      run.cellsCollected += 1;
      p.fuel = clamp(p.fuel + ORBIT.cellValue, 0, ORBIT.fuelMax);
      addScore(run, SCORE.perCell);
      burst(run, c.x, c.y, COLORS.fuel, 12, 160);
      Sfx.pickup();
    }
  }
}

function update(dt) {
  run.t += dt;

  if (run.state === "title") {
    if (input.hit(" ") || input.mouse.down) startRun();
    input.endFrame();
    return;
  }

  if (run.state === "won" || run.state === "lost") {
    if (input.hit("r") || input.mouse.down || input.hit(" ")) {
      input.mouse.down = false;
      startRun();
    }
    input.endFrame();
    return;
  }

  // Playing.
  const p = run.player;
  updatePlayer(p, input, dt);

  if (input.firing() && shoot(p, run.bullets)) Sfx.shoot();
  run.bullets = updateBullets(run.bullets, dt);

  for (const r of run.rocks) driftRock(r, dt);
  for (const d of run.drones) steerDrone(d, p, dt);
  for (const c of run.cells) c.ttl -= dt;

  for (const q of run.particles) {
    q.x += q.vx * dt; q.y += q.vy * dt;
    q.vx *= 0.94; q.vy *= 0.94;
    q.life -= dt;
  }
  run.particles = run.particles.filter((q) => q.life > 0);

  collide(run, dt);

  run.rocks = run.rocks.filter((r) => !r.dead);
  run.drones = run.drones.filter((d) => !d.dead);
  run.cells = run.cells.filter((c) => !c.dead && c.ttl > 0);

  run.shake = Math.max(0, run.shake - dt * 2);
  run.banner = Math.max(0, run.banner - dt * 0.8);
  run.comboTimer -= dt;
  if (run.comboTimer <= 0) run.combo = 1;

  // Orbit decay is the lose condition that is not a collision.
  if (p.fuel <= 0) {
    hurt(run);
    p.fuel = ORBIT.fuelMax * 0.35;   // a grace refill so decay alone is not instant death
  }

  // Wave flow.
  stepWave(run.waveState, dt, {
    rock: (r) => run.rocks.push(r),
    drone: (d) => run.drones.push(d),
    cell: (c) => run.cells.push(c),
  });

  if (waveCleared(run.waveState, run.rocks, run.drones)) {
    run.waveState.done = true;
    addScore(run, SCORE.waveClear);
    Sfx.wave();
    if (run.wave >= WAVES.total) {
      winRun(run);
    } else {
      run.wave += 1;
      run.breathe = WAVES.breathe;
      run.banner = 1.4;
      run.waveState = beginWave(run.wave, run.rng);
    }
  }

  input.endFrame();
}

function draw() {
  const shake = run.shake;
  ctx.save();
  if (shake > 0) {
    ctx.translate(rand(run.rng, -1, 1) * shake * 9, rand(run.rng, -1, 1) * shake * 9);
  }

  drawBackdrop(ctx, stars, run.t);
  for (const c of run.cells) drawCell(ctx, c, run.t);
  for (const r of run.rocks) drawRock(ctx, r);
  for (const d of run.drones) drawDrone(ctx, d);
  drawBullets(ctx, run.bullets);
  if (run.state === "play" || run.state === "won") drawTug(ctx, run.player);
  if (run.state === "lost") drawTug(ctx, run.player);
  drawParticles(ctx, run.particles);
  ctx.restore();

  if (run.state === "title") drawTitle(ctx, run.t);
  else if (run.state === "play") drawHud(ctx, run);
  else drawEnd(ctx, run, run.t);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

// Screenshot mode: ?shot=start|play|win|lose&seed=N builds that exact frame, so the
// screenshots in the repository are real renders of this code, reproducible on demand.
const shotMode = applyShot(run, { newRun, startRun, update, draw, setRun: (r) => { run = r; }, getRun: () => run });
if (!shotMode) requestAnimationFrame(frame);
