// Screenshot mode. `?shot=start|play|win|lose&seed=N` composes one exact frame and draws
// it once, so the screenshots committed to the repository are real renders of this game,
// reproducible byte for byte from the same URL. Without the parameter the game runs normally.
import { WORLD, COLORS } from "./config.js";
import { makeRock, makeDrone, makeCell } from "./entities.js";
import { mulberry32 } from "./random.js";

function placeRock(run, x, y, r) {
  const rock = makeRock(run.rng, 1);
  rock.x = x; rock.y = y; rock.r = r;
  rock.vx = 0; rock.vy = 0; rock.rot = run.rng() * 3;
  run.rocks.push(rock);
}

function placeDrone(run, x, y, vx, vy) {
  const d = makeDrone(run.rng, 1);
  d.x = x; d.y = y; d.vx = vx; d.vy = vy;
  run.drones.push(d);
}

function placeCell(run, x, y) {
  const c = makeCell(run.rng);
  c.x = x; c.y = y; c.ttl = 8;
  run.cells.push(c);
}

function placeBullet(run, x, y, vx, vy) {
  run.bullets.push({ id: 0, x, y, vx, vy, r: 3, life: 0.6 });
}

function sparks(run, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = run.rng() * Math.PI * 2;
    const s = 40 + run.rng() * 150;
    const life = 0.3 + run.rng() * 0.4;
    run.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life, maxLife: life, size: 2 + run.rng() * 2.5, color,
    });
  }
}

function composePlay(run) {
  run.state = "play";
  run.score = 4820;
  run.combo = 3;
  run.comboTimer = 2.4;
  run.cellsCollected = 11;
  run.wave = 3;
  run.banner = 0;
  const p = run.player;
  p.x = 520; p.y = 470;
  p.angle = -0.42;
  p.hull = 2;
  p.fuel = 61;
  p.thrusting = true;
  p.invuln = 0;

  placeRock(run, 880, 250, 34);
  placeRock(run, 1080, 470, 24);
  placeRock(run, 300, 190, 28);
  placeRock(run, 980, 640, 38);
  placeRock(run, 700, 150, 20);

  placeDrone(run, 760, 360, 120, 40);
  placeDrone(run, 340, 620, 60, -90);

  placeCell(run, 660, 520);
  placeCell(run, 430, 330);
  placeCell(run, 900, 520);

  for (let i = 0; i < 4; i++) {
    placeBullet(run, p.x + 30 + i * 34, p.y - 14 - i * 15, 640, -280);
  }
  sparks(run, 862, 268, COLORS.rockEdge, 10);
  sparks(run, 742, 372, COLORS.drone, 8);
}

function composeWin(run) {
  run.state = "won";
  run.score = 12480;
  run.wave = 5;
  run.cellsCollected = 27;
  run.best = 12480;
  run.player.x = 640; run.player.y = 470;
}

function composeLose(run) {
  run.state = "lost";
  run.score = 3960;
  run.wave = 3;
  run.cellsCollected = 9;
  run.best = 12480;
  run.player.hull = 0;
  run.player.x = 640; run.player.y = 470;
}

export function applyShot(run, api) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (!shot) return false;

  const seed = Number(params.get("seed") || 1);
  const fresh = api.newRun(seed);
  fresh.rng = mulberry32(seed);
  fresh.best = 12480;

  if (shot === "play") composePlay(fresh);
  else if (shot === "win") composeWin(fresh);
  else if (shot === "lose") composeLose(fresh);
  else fresh.state = "title";

  api.setRun(fresh);
  api.draw();
  return true;
}
