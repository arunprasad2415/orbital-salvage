// All drawing. Every shape is generated here, so the game ships with no image assets.
import { WORLD, COLORS } from "./config.js";

export function drawBackdrop(ctx, stars, t) {
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // Parallax starfield, two layers drifting at different speeds.
  for (const s of stars) {
    const y = (s.y + t * s.drift) % (WORLD.h + 40) - 20;
    ctx.globalAlpha = s.a;
    ctx.fillStyle = s.warm ? "#ffd9a8" : "#cfe6ff";
    ctx.fillRect(s.x, y, s.size, s.size);
  }
  ctx.globalAlpha = 1;

  // Faint hex grid to give the play field a sense of deck plating.
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const step = 64;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); }
  for (let y = 0; y <= WORLD.h; y += step) { ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); }
  ctx.stroke();

  // Orbit limb: a warm rim at the bottom, the planet the salvage yard is falling toward.
  const g = ctx.createLinearGradient(0, WORLD.h - 170, 0, WORLD.h);
  g.addColorStop(0, "rgba(255,120,60,0)");
  g.addColorStop(1, "rgba(255,120,60,0.16)");
  ctx.fillStyle = g;
  ctx.fillRect(0, WORLD.h - 170, WORLD.w, 170);
}

export function drawTug(ctx, p) {
  const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2);
  ctx.globalAlpha = blink ? 0.45 : 1;

  if (p.thrusting) {
    const flick = 12 + Math.random() * 10;
    const grad = ctx.createLinearGradient(0, p.r, 0, p.r + flick);
    grad.addColorStop(0, "rgba(255,180,87,0.95)");
    grad.addColorStop(1, "rgba(255,90,40,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-6, p.r - 2);
    ctx.lineTo(6, p.r - 2);
    ctx.lineTo(0, p.r + flick);
    ctx.closePath();
    ctx.fill();
  }

  // Hull: a swept tug silhouette with a bright cockpit.
  ctx.beginPath();
  ctx.moveTo(0, -p.r - 4);
  ctx.lineTo(p.r * 0.86, p.r * 0.62);
  ctx.lineTo(p.r * 0.34, p.r * 0.30);
  ctx.lineTo(-p.r * 0.34, p.r * 0.30);
  ctx.lineTo(-p.r * 0.86, p.r * 0.62);
  ctx.closePath();
  ctx.fillStyle = COLORS.hullDark;
  ctx.fill();
  ctx.strokeStyle = COLORS.hull;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -p.r * 0.24, p.r * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.hull;
  ctx.fill();

  // Grapple prongs either side.
  ctx.strokeStyle = COLORS.hull;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-p.r * 0.7, p.r * 0.1); ctx.lineTo(-p.r * 1.15, p.r * 0.5);
  ctx.moveTo(p.r * 0.7, p.r * 0.1); ctx.lineTo(p.r * 1.15, p.r * 0.5);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawRock(ctx, r) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(r.rot);
  ctx.beginPath();
  r.shape.forEach((pt, i) => {
    const x = Math.cos(pt.a) * r.r * pt.m;
    const y = Math.sin(pt.a) * r.r * pt.m;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = r.hp > 1 ? "#59637d" : COLORS.rock;
  ctx.fill();
  ctx.strokeStyle = COLORS.rockEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // A couple of craters so the rock reads as a rock, not a blob.
  ctx.fillStyle = "rgba(10,14,24,0.5)";
  ctx.beginPath(); ctx.arc(-r.r * 0.22, -r.r * 0.12, r.r * 0.2, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(r.r * 0.26, r.r * 0.22, r.r * 0.13, 0, 6.28); ctx.fill();
  ctx.restore();
}

export function drawDrone(ctx, d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  const a = Math.atan2(d.vy, d.vx);
  ctx.rotate(a);
  ctx.fillStyle = d.flash > 0 ? "#ffffff" : COLORS.drone;
  ctx.beginPath();
  ctx.moveTo(d.r, 0);
  ctx.lineTo(-d.r * 0.7, d.r * 0.72);
  ctx.lineTo(-d.r * 0.35, 0);
  ctx.lineTo(-d.r * 0.7, -d.r * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.droneEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Sensor eye, so it reads as a hunter.
  ctx.fillStyle = "#2a0710";
  ctx.beginPath(); ctx.arc(d.r * 0.12, 0, d.r * 0.22, 0, 6.28); ctx.fill();
  ctx.restore();
}

export function drawCell(ctx, c, t) {
  const pulse = 1 + Math.sin(t * 4 + c.bob) * 0.14;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.globalAlpha = c.ttl < 3 ? 0.45 + Math.sin(t * 18) * 0.3 : 1;
  ctx.beginPath();
  ctx.arc(0, 0, c.r * 1.9 * pulse, 0, 6.28);
  ctx.fillStyle = "rgba(124,246,124,0.12)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, 6.28);
  ctx.fillStyle = COLORS.fuel;
  ctx.fill();
  ctx.strokeStyle = COLORS.fuelDim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // A plus, the universal "pick me up" mark.
  ctx.strokeStyle = "#0b2a10";
  ctx.beginPath();
  ctx.moveTo(-c.r * 0.5, 0); ctx.lineTo(c.r * 0.5, 0);
  ctx.moveTo(0, -c.r * 0.5); ctx.lineTo(0, c.r * 0.5);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawBullets(ctx, list) {
  for (const b of list) {
    ctx.strokeStyle = COLORS.bullet;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.014, b.y - b.vy * 0.014);
    ctx.stroke();
  }
}

export function drawParticles(ctx, list) {
  for (const p of list) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

export function makeStars(rng, n) {
  return Array.from({ length: n }, () => ({
    x: rng() * WORLD.w,
    y: rng() * WORLD.h,
    size: rng() < 0.82 ? 1 : 2,
    a: 0.18 + rng() * 0.6,
    drift: 4 + rng() * 16,
    warm: rng() < 0.18,
  }));
}
