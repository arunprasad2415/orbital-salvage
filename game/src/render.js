// The renderer: sky, parallax stars, nebula wash, the tug, rocks, hunters, cells,
// shots and sparks. Pure drawing, no simulation state is mutated here.
import { WORLD, COLORS } from "./config.js";

export function makeStars(rng) {
  const layers = [[70, 0.35], [46, 0.6], [26, 1]];
  const stars = [];
  layers.forEach(([count, depth], layer) => {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rng() * WORLD.w,
        y: rng() * WORLD.h,
        z: depth,
        size: layer === 2 ? 1.5 : 1,
        tw: rng() * Math.PI * 2,
        color: COLORS.star[Math.min(layer, 2)],
      });
    }
  });
  return stars;
}

function paintSky(ctx, run, t) {
  const sky = ctx.createLinearGradient(0, 0, WORLD.w * 0.35, WORLD.h);
  sky.addColorStop(0, COLORS.sky0);
  sky.addColorStop(0.55, "#070b18");
  sky.addColorStop(1, COLORS.sky1);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  const wash = ctx.createRadialGradient(WORLD.w * 0.72, WORLD.h * 0.28, 40, WORLD.w * 0.72, WORLD.h * 0.28, 520);
  wash.addColorStop(0, "rgba(46, 84, 168, 0.20)");
  wash.addColorStop(0.5, "rgba(28, 52, 112, 0.10)");
  wash.addColorStop(1, "rgba(5, 6, 13, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  const wash2 = ctx.createRadialGradient(WORLD.w * 0.18, WORLD.h * 0.78, 20, WORLD.w * 0.18, WORLD.h * 0.78, 420);
  wash2.addColorStop(0, "rgba(120, 40, 96, 0.14)");
  wash2.addColorStop(1, "rgba(5, 6, 13, 0)");
  ctx.fillStyle = wash2;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  for (const star of run.stars) {
    const drift = (star.x - star.z * t * 12) % WORLD.w;
    const x = drift < 0 ? drift + WORLD.w : drift;
    const twinkle = 0.55 + 0.45 * Math.sin(t * 1.6 + star.tw);
    ctx.globalAlpha = (0.25 + star.z * 0.7) * twinkle;
    ctx.fillStyle = star.color;
    ctx.fillRect(x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function polyPath(ctx, rock) {
  ctx.beginPath();
  rock.verts.forEach((v, i) => {
    const a = v.a + rock.rot;
    const px = rock.x + Math.cos(a) * v.d;
    const py = rock.y + Math.sin(a) * v.d;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

function drawRock(ctx, rock) {
  polyPath(ctx, rock);
  const g = ctx.createLinearGradient(rock.x - rock.r, rock.y - rock.r, rock.x + rock.r, rock.y + rock.r);
  g.addColorStop(0, "#4a526e");
  g.addColorStop(0.55, COLORS.rock);
  g.addColorStop(1, "#252b3d");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = rock.hp > 1 ? "#9fb0d8" : COLORS.rockEdge;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rock.x - rock.r * 0.22, rock.y - rock.r * 0.24, rock.r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(160, 180, 220, 0.10)";
  ctx.fill();
}

function drawDrone(ctx, drone, t) {
  const bob = Math.sin(t * 3 + drone.phase) * 2.5;
  ctx.save();
  ctx.translate(drone.x, drone.y + bob);
  ctx.rotate(Math.sin(t * 2 + drone.phase) * 0.16);

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = Math.cos(a) * drone.r;
    const py = Math.sin(a) * drone.r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = drone.flash > 0 ? "#ffd0d4" : COLORS.droneShell;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.drone;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 6.4, 0, Math.PI * 2);
  const charge = drone.fire < 0.45 ? 1 - drone.fire / 0.45 : 0;
  ctx.fillStyle = COLORS.eye;
  ctx.globalAlpha = 0.55 + 0.45 * charge;
  ctx.fill();
  ctx.globalAlpha = 1;

  if (charge > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 10 + charge * 5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 138, 107, ${0.15 + charge * 0.45})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCell(ctx, cell, t) {
  const pulse = 0.7 + 0.3 * Math.sin(t * 4 + cell.phase);
  const fade = cell.ttl < 2.5 ? 0.35 + 0.65 * Math.abs(Math.sin(t * 8)) : 1;
  ctx.save();
  ctx.translate(cell.x, cell.y);
  ctx.rotate(t * 1.2 + cell.phase);
  ctx.globalAlpha = fade;

  ctx.beginPath();
  ctx.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(94, 242, 160, 0.10)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(9, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fillStyle = COLORS.cell;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fillStyle = COLORS.cellCore;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawBullet(ctx, b) {
  const len = b.hostile ? 12 : 16;
  const ux = b.vx / (Math.hypot(b.vx, b.vy) || 1);
  const uy = b.vy / (Math.hypot(b.vx, b.vy) || 1);
  ctx.beginPath();
  ctx.moveTo(b.x - ux * len, b.y - uy * len);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = b.hostile ? COLORS.bolt : COLORS.bullet;
  ctx.lineWidth = b.hostile ? 3.5 : 2.6;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.hostile ? 3 : 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function drawShip(ctx, run, t) {
  const p = run.player;
  if (p.invuln > 0 && Math.floor(t * 14) % 2 === 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  if (p.thrusting) {
    const flick = 0.7 + 0.3 * Math.sin(t * 40);
    ctx.beginPath();
    ctx.moveTo(-13, -5.5);
    ctx.lineTo(-13 - 20 * flick, 0);
    ctx.lineTo(-13, 5.5);
    ctx.closePath();
    const flame = ctx.createLinearGradient(-13, 0, -34, 0);
    flame.addColorStop(0, COLORS.thrusterCore);
    flame.addColorStop(1, "rgba(255, 122, 60, 0)");
    ctx.fillStyle = flame;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(-10, 11);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, -11);
  ctx.closePath();
  const hull = ctx.createLinearGradient(-10, -11, 19, 11);
  hull.addColorStop(0, COLORS.hullDark);
  hull.addColorStop(0.5, COLORS.hull);
  hull.addColorStop(1, "#8fa4c9");
  ctx.fillStyle = hull;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "#f4f8ff";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(3, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#2ad6ff";
  ctx.fill();

  if (p.dash > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(159, 232, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineCap = "butt";

  if (p.invuln > 0) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(159, 232, 255, ${0.15 + 0.25 * Math.sin(t * 10)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawParticles(ctx, run) {
  for (const part of run.particles) {
    const k = Math.max(0, part.life / part.maxLife);
    ctx.globalAlpha = k;
    ctx.fillStyle = part.color;
    ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size);
  }
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, run, t) {
  ctx.save();
  if (run.shake > 0) {
    const amp = run.shake * 7;
    ctx.translate((run.rng() - 0.5) * amp, (run.rng() - 0.5) * amp);
  }
  paintSky(ctx, run, t);
  for (const cell of run.cells) drawCell(ctx, cell, t);
  for (const rock of run.rocks) drawRock(ctx, rock);
  for (const drone of run.drones) drawDrone(ctx, drone, t);
  for (const b of run.bullets) drawBullet(ctx, b);
  drawShip(ctx, run, t);
  drawParticles(ctx, run);
  ctx.restore();
}
