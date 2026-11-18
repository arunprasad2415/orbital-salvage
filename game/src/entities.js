// Entities and their behaviour: the tug, its pulse shots, drifting rocks, hunter drones and
// fuel cells. Each one is a small object with an update() and a radius, so collisions stay cheap.
import { PLAYER, ORBIT, WORLD } from "./config.js";
import { rand, randInt, clamp } from "./random.js";

let nextId = 1;
const id = () => nextId++;

export function makePlayer() {
  return {
    id: id(), x: WORLD.w * 0.5, y: WORLD.h * 0.62,
    vx: 0, vy: 0, r: PLAYER.radius,
    hull: PLAYER.hullMax, fuel: ORBIT.fuelMax,
    angle: -Math.PI / 2, cooldown: 0, invuln: 0, thrusting: false,
  };
}

export function updatePlayer(p, input, dt) {
  const { x, y } = input.axis();
  const len = Math.hypot(x, y) || 1;
  p.vx += (x / len) * PLAYER.accel * dt * (x || y ? 1 : 0);
  p.vy += (y / len) * PLAYER.accel * dt * (x || y ? 1 : 0);
  p.thrusting = Boolean(x || y);

  const drag = Math.exp(-PLAYER.drag * dt);
  p.vx *= drag; p.vy *= drag;

  const speed = Math.hypot(p.vx, p.vy);
  if (speed > PLAYER.maxSpeed) {
    p.vx = (p.vx / speed) * PLAYER.maxSpeed;
    p.vy = (p.vy / speed) * PLAYER.maxSpeed;
  }
  p.x = clamp(p.x + p.vx * dt, p.r, WORLD.w - p.r);
  p.y = clamp(p.y + p.vy * dt, p.r, WORLD.h - p.r);

  p.angle = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.fuel = Math.max(0, p.fuel - ORBIT.drainPerSecond * dt);
}

export function shoot(p, out) {
  if (p.cooldown > 0) return false;
  p.cooldown = PLAYER.fireDelay;
  const spread = 0.035;
  for (const off of [-spread, 0, spread]) {
    const a = p.angle + off;
    out.push({
      id: id(),
      x: p.x + Math.cos(a) * (p.r + 6),
      y: p.y + Math.sin(a) * (p.r + 6),
      vx: Math.cos(a) * PLAYER.bulletSpeed,
      vy: Math.sin(a) * PLAYER.bulletSpeed,
      r: 3, life: PLAYER.bulletLife,
    });
  }
  return true;
}

export function updateBullets(list, dt) {
  for (const b of list) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
  }
  return list.filter((b) => b.life > 0 && b.x > -20 && b.x < WORLD.w + 20 && b.y > -20 && b.y < WORLD.h + 20);
}

export function makeRock(rng, wave) {
  const edge = randInt(rng, 0, 3);
  const r = rand(rng, 18, 40);
  const speed = rand(rng, 42, 78) + wave * 9;
  const spot = {
    0: { x: rand(rng, 0, WORLD.w), y: -r },
    1: { x: WORLD.w + r, y: rand(rng, 0, WORLD.h) },
    2: { x: rand(rng, 0, WORLD.w), y: WORLD.h + r },
    3: { x: -r, y: rand(rng, 0, WORLD.h) },
  }[edge];
  const toward = Math.atan2(WORLD.h * 0.55 - spot.y, WORLD.w * 0.5 - spot.x) + rand(rng, -0.5, 0.5);
  const spin = rand(rng, -1.6, 1.6);
  const shape = Array.from({ length: 9 }, (_, i) => ({
    a: (i / 9) * Math.PI * 2,
    m: rand(rng, 0.74, 1.12),
  }));
  return {
    id: id(), x: spot.x, y: spot.y, r,
    vx: Math.cos(toward) * speed, vy: Math.sin(toward) * speed,
    rot: 0, spin, shape, hp: r > 32 ? 2 : 1,
  };
}

export function makeDrone(rng, wave) {
  const edge = randInt(rng, 0, 3);
  const spot = {
    0: { x: rand(rng, 0, WORLD.w), y: -30 },
    1: { x: WORLD.w + 30, y: rand(rng, 0, WORLD.h) },
    2: { x: rand(rng, 0, WORLD.w), y: WORLD.h + 30 },
    3: { x: -30, y: rand(rng, 0, WORLD.h) },
  }[edge];
  return {
    id: id(), x: spot.x, y: spot.y, r: 15,
    vx: 0, vy: 0, speed: 96 + wave * 12, wobble: rand(rng, 0, 6.28), hp: 2, flash: 0,
  };
}

export function makeCell(rng) {
  return {
    id: id(),
    x: rand(rng, 80, WORLD.w - 80), y: rand(rng, 80, WORLD.h - 80),
    r: ORBIT.cellRadius, ttl: 12, bob: rand(rng, 0, 6.28),
  };
}

// Drones steer toward the tug with a small sine wobble so they are readable, not laser-guided.
export function steerDrone(d, player, dt) {
  const a = Math.atan2(player.y - d.y, player.x - d.x) + Math.sin(d.wobble) * 0.35;
  d.wobble += dt * 2.1;
  d.vx += Math.cos(a) * d.speed * dt * 2.2;
  d.vy += Math.sin(a) * d.speed * dt * 2.2;
  const sp = Math.hypot(d.vx, d.vy);
  if (sp > d.speed) { d.vx = (d.vx / sp) * d.speed; d.vy = (d.vy / sp) * d.speed; }
  d.x += d.vx * dt; d.y += d.vy * dt;
  d.flash = Math.max(0, d.flash - dt);
}

export function driftRock(r, dt) {
  r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt;
}
