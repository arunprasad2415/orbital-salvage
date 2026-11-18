// Screens and the HUD: the title, the in-run readout, the win and the loss, plus the
// shared panel helper they draw on. Kept apart from main.js so the loop stays readable.
import { WORLD, COLORS, ORBIT, PLAYER, WAVES } from "./config.js";

export function panel(ctx, x, y, w, h, alpha = 0.82) {
  ctx.fillStyle = `rgba(6,10,20,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(143,240,224,0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function text(ctx, str, x, y, size, color = COLORS.text, align = "left", weight = "600") {
  ctx.font = `${weight} ${size}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, color, dim) {
  ctx.fillStyle = dim;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
}

export function drawHud(ctx, run) {
  const p = run.player;
  panel(ctx, 24, 20, 372, 92);

  text(ctx, "SCORE", 40, 44, 12, COLORS.dim);
  text(ctx, String(run.score).padStart(6, "0"), 40, 74, 26, COLORS.text);

  text(ctx, "WAVE", 210, 44, 12, COLORS.dim);
  text(ctx, `${Math.min(run.wave, WAVES.total)} / ${WAVES.total}`, 210, 74, 26, COLORS.hull);

  text(ctx, "COMBO", 320, 44, 12, COLORS.dim);
  text(ctx, `x${run.combo}`, 320, 74, 26, run.combo > 1 ? COLORS.warn : COLORS.text);

  // Hull pips.
  text(ctx, "HULL", 40, 100, 11, COLORS.dim);
  for (let i = 0; i < PLAYER.hullMax; i++) {
    ctx.fillStyle = i < p.hull ? COLORS.hull : "rgba(143,240,224,0.16)";
    ctx.fillRect(96 + i * 22, 90, 16, 10);
  }

  // Orbit fuel, the clock that keeps the run moving.
  panel(ctx, 24, WORLD.h - 92, 372, 68);
  text(ctx, "ORBIT", 40, WORLD.h - 62, 12, COLORS.dim);
  const frac = p.fuel / ORBIT.fuelMax;
  bar(ctx, 100, WORLD.h - 74, 276, 14, frac,
      frac > 0.35 ? COLORS.fuel : COLORS.bad,
      "rgba(124,246,124,0.14)");
  text(ctx, frac > 0.35 ? "STABLE" : "DECAYING", 40, WORLD.h - 38, 12,
       frac > 0.35 ? COLORS.good : COLORS.bad);

  // Wave banner while a wave is arriving.
  if (run.banner > 0) {
    ctx.globalAlpha = Math.min(1, run.banner);
    text(ctx, `WAVE ${run.wave}`, WORLD.w / 2, 120, 44, COLORS.hull, "center", "700");
    text(ctx, run.wave === WAVES.total ? "FINAL SWEEP" : "SALVAGE WINDOW OPEN",
         WORLD.w / 2, 148, 14, COLORS.dim, "center");
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, t) {
  ctx.fillStyle = "rgba(5,6,13,0.72)";
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  const cy = 250;
  text(ctx, "ORBITAL", WORLD.w / 2, cy, 96, COLORS.hull, "center", "800");
  text(ctx, "SALVAGE", WORLD.w / 2, cy + 86, 96, COLORS.text, "center", "800");
  text(ctx, "a salvage tug, a decaying orbit, five windows to clear",
       WORLD.w / 2, cy + 128, 16, COLORS.dim, "center");

  panel(ctx, WORLD.w / 2 - 300, 452, 600, 176);
  text(ctx, "MOVE", WORLD.w / 2 - 268, 492, 13, COLORS.dim);
  text(ctx, "WASD or arrows", WORLD.w / 2 - 268, 516, 17, COLORS.text);
  text(ctx, "AIM", WORLD.w / 2 - 268, 552, 13, COLORS.dim);
  text(ctx, "mouse", WORLD.w / 2 - 268, 576, 17, COLORS.text);
  text(ctx, "FIRE", WORLD.w / 2 + 40, 492, 13, COLORS.dim);
  text(ctx, "click or space", WORLD.w / 2 + 40, 516, 17, COLORS.text);
  text(ctx, "GRAB", WORLD.w / 2 + 40, 552, 13, COLORS.dim);
  text(ctx, "fly into green cells", WORLD.w / 2 + 40, 576, 17, COLORS.fuel);

  const pulse = 0.55 + Math.sin(t * 3) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, "CLICK OR PRESS SPACE TO LAUNCH", WORLD.w / 2, 690, 20, COLORS.warn, "center", "700");
  ctx.globalAlpha = 1;
}

export function drawEnd(ctx, run, t) {
  const won = run.state === "won";
  ctx.fillStyle = "rgba(5,6,13,0.78)";
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  text(ctx, won ? "SALVAGE COMPLETE" : "HULL BREACHED",
       WORLD.w / 2, 240, 72, won ? COLORS.good : COLORS.bad, "center", "800");
  text(ctx, won
        ? "all five windows cleared, the tug makes the yard"
        : "the orbit won this time",
       WORLD.w / 2, 280, 16, COLORS.dim, "center");

  panel(ctx, WORLD.w / 2 - 250, 330, 500, 150);
  text(ctx, "SCORE", WORLD.w / 2 - 218, 372, 13, COLORS.dim);
  text(ctx, String(run.score), WORLD.w / 2 - 218, 414, 34, COLORS.text);
  text(ctx, "WAVES", WORLD.w / 2 + 40, 372, 13, COLORS.dim);
  text(ctx, `${Math.min(run.wave, WAVES.total)} / ${WAVES.total}`, WORLD.w / 2 + 40, 414, 34, COLORS.hull);
  text(ctx, "BEST", WORLD.w / 2 - 218, 456, 13, COLORS.dim);
  text(ctx, String(run.best), WORLD.w / 2 - 218, 480, 20, COLORS.warn);
  text(ctx, "CELLS", WORLD.w / 2 + 40, 456, 13, COLORS.dim);
  text(ctx, String(run.cellsCollected), WORLD.w / 2 + 40, 480, 20, COLORS.fuel);

  const pulse = 0.5 + Math.sin(t * 3) * 0.4;
  ctx.globalAlpha = pulse;
  text(ctx, "PRESS R OR CLICK TO RUN AGAIN", WORLD.w / 2, 560, 20, COLORS.text, "center", "700");
  ctx.globalAlpha = 1;
  text(ctx, won ? "a clean sweep. try to beat it." : "the cells are still out there.",
       WORLD.w / 2, 596, 14, COLORS.dim, "center");
}
