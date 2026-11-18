// Entity factories. Everything is a plain object in world units (1280x800) so the
// simulation, the shot composer and the renderer can share it without a class tree.
import { WAVE_PLAN } from "./config.js";

export function makePlayer() {
  return {
    x: 640, y: 470,
    vx: 0, vy: 0,
    angle: -Math.PI / 2,
    hull: 3,
    fuel: 100,
    invuln: 0,
    cooldown: 0,
    dash: 0,
    dashCooldown: 0,
    thrusting: false,
  };
}

export function makeRock(rng, wave, radius) {
  const plan = WAVE_PLAN[Math.min(wave - 1, WAVE_PLAN.length - 1)];
  const r = radius ?? rng.range(18, 42);
  const speed = rng.range(16, 44) * plan.speed;
  const dir = rng.range(0, Math.PI * 2);
  const verts = [];
  const sides = rng.int(7, 10);
  for (let i = 0; i < sides; i++) {
    verts.push({ a: (i / sides) * Math.PI * 2, d: r * rng.range(0.74, 1.12) });
  }
  return {
    x: 0, y: 0,
    vx: Math.cos(dir) * speed,
    vy: Math.sin(dir) * speed,
    r,
    hp: 1 + Math.floor(r / 18),
    rot: rng.range(0, Math.PI * 2),
    spin: rng.range(-0.7, 0.7),
    verts,
    tint: rng.range(0, 1),
  };
}

export function makeDrone(rng, wave) {
  const plan = WAVE_PLAN[Math.min(wave - 1, WAVE_PLAN.length - 1)];
  return {
    x: 0, y: 0,
    vx: 0, vy: 0,
    r: 17,
    hp: 2,
    speed: 96 * plan.speed,
    turn: 0.9 + plan.aim * 0.8,
    fire: rng.range(1.2, 2.6),
    phase: rng.range(0, Math.PI * 2),
    flash: 0,
  };
}

export function makeCell(rng) {
  return {
    x: 0, y: 0,
    r: 13,
    ttl: 9,
    maxTtl: 9,
    phase: rng.range(0, Math.PI * 2),
    drift: rng.range(-14, 14),
  };
}

export function makeBullet(x, y, angle, speed, life, fromPlayer) {
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: fromPlayer ? 3 : 5,
    life,
    maxLife: life,
    hostile: !fromPlayer,
  };
}

export function burst(run, x, y, color, count, power = 1) {
  for (let i = 0; i < count; i++) {
    const a = run.rng() * Math.PI * 2;
    const s = run.rng.range(30, 190) * power;
    const life = run.rng.range(0.24, 0.7);
    run.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      maxLife: life,
      size: run.rng.range(1.4, 3.6),
      color,
    });
  }
  if (run.particles.length > 460) run.particles.splice(0, run.particles.length - 460);
}

// Enter from a random edge, never on top of the tug: a module that materialises
// on the player would cost a hull for nothing.
export function spawnOffscreen(run, r) {
  const margin = r + 40;
  const side = run.rng.int(0, 3);
  let x, y;
  if (side === 0) { x = -margin; y = run.rng.range(0, 800); }
  else if (side === 1) { x = 1280 + margin; y = run.rng.range(0, 800); }
  else if (side === 2) { x = run.rng.range(0, 1280); y = -margin; }
  else { x = run.rng.range(0, 1280); y = 800 + margin; }

  const p = run.player;
  if (Math.hypot(x - p.x, y - p.y) < 240) {
    x = 1280 - x;
    y = 800 - y;
  }
  return { x, y };
}
