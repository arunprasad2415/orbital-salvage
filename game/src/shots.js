// Screenshot mode: `?shot=title|play|win|lose&seed=N` composes one exact frame and
// draws it once, so every screenshot in screenshots/ is a real render of this game
// and reproduces from its URL. Without the parameter the game runs normally.
import { COLORS, RUN } from "./config.js";
import { makeRock, makeDrone, makeCell, makeBullet } from "./entities.js";
import { resetWindow } from "./waves.js";

function putRock(run, x, y, r) {
  const rock = makeRock(run.rng, 3, r);
  rock.x = x;
  rock.y = y;
  rock.vx = 0;
  rock.vy = 0;
  rock.rot = run.rng.range(0, Math.PI * 2);
  run.rocks.push(rock);
}

function putDrone(run, x, y, vx, vy, fire) {
  const drone = makeDrone(run.rng, 3);
  drone.x = x;
  drone.y = y;
  drone.vx = vx;
  drone.vy = vy;
  drone.fire = fire;
  run.drones.push(drone);
}

function putCell(run, x, y, ttl = 8) {
  const cell = makeCell(run.rng);
  cell.x = x;
  cell.y = y;
  cell.ttl = ttl;
  cell.maxTtl = ttl;
  run.cells.push(cell);
}

function putBolt(run, x, y, vx, vy, hostile) {
  const angle = Math.atan2(vy, vx);
  const bullet = makeBullet(x, y, angle, Math.hypot(vx, vy), 0.7, !hostile);
  bullet.hostile = hostile;
  run.bullets.push(bullet);
}

function spray(run, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = run.rng() * Math.PI * 2;
    const s = run.rng.range(40, 170);
    const life = run.rng.range(0.3, 0.66);
    run.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      maxLife: life,
      size: run.rng.range(1.6, 3.4),
      color,
    });
  }
}

function composePlay(run) {
  run.state = "play";
  run.t = 3.4;
  run.score = 4820;
  run.wave = 3;
  run.kills = 5;
  run.need = 7;
  run.combo = 4;
  run.comboTimer = 2.6;
  run.cellsCollected = 11;
  run.banner = 0;
  run.shake = 0;

  const p = run.player;
  p.x = 502;
  p.y = 468;
  p.angle = -0.44;
  p.vx = 60;
  p.vy = -30;
  p.hull = 2;
  p.fuel = 61;
  p.thrusting = true;
  p.invuln = 0;
  p.dashCooldown = 0;

  putRock(run, 872, 246, 36);
  putRock(run, 1084, 472, 24);
  putRock(run, 296, 188, 29);
  putRock(run, 972, 646, 40);
  putRock(run, 706, 148, 19);

  putDrone(run, 756, 356, 120, 40, 0.22);
  putDrone(run, 338, 622, 60, -90, 1.7);

  putCell(run, 662, 520, 8);
  putCell(run, 428, 330, 6.4);
  putCell(run, 902, 522, 7.2);

  for (let i = 0; i < 4; i++) {
    putBolt(run, p.x + 34 + i * 36, p.y - 16 - i * 16, 700, -300, false);
  }
  putBolt(run, 840, 300, -260, 180, true);

  spray(run, 856, 264, COLORS.rockEdge, 10);
  spray(run, 738, 368, COLORS.drone, 9);
  spray(run, 502, 500, COLORS.thruster, 7);
}

function composeWin(run) {
  run.state = "won";
  run.t = 2.2;
  run.score = 12480;
  run.wave = RUN.waves;
  run.cellsCollected = 27;
  run.best = 12480;
  run.player.hull = 2;
  run.player.fuel = 48;
  run.player.x = 640;
  run.player.y = 470;
  putRock(run, 210, 610, 26);
  putRock(run, 1080, 190, 32);
  putCell(run, 900, 620, 5);
}

function composeLose(run) {
  run.state = "lost";
  run.t = 2.2;
  run.score = 3960;
  run.wave = 3;
  run.cellsCollected = 9;
  run.best = 12480;
  run.player.hull = 0;
  run.player.x = 640;
  run.player.y = 470;
  putRock(run, 430, 540, 34);
  putRock(run, 880, 600, 22);
  spray(run, 640, 470, COLORS.danger, 18);
}

export function applyShot(run, api) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (!shot) return false;

  resetWindow(run);
  run.best = 12480;

  if (shot === "play") composePlay(run);
  else if (shot === "win") composeWin(run);
  else if (shot === "lose") composeLose(run);
  else {
    run.state = "title";
    run.t = 2.4;
    run.best = 12480;
    putRock(run, 214, 250, 30);
    putRock(run, 1064, 606, 26);
    putCell(run, 940, 240, 6);
  }

  api.setRun(run);
  api.draw();
  return true;
}
