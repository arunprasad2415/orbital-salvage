// Overlays: the heads-up display during a run, the title, the two endings and the
// wave banner. Drawn in screen space on top of the world.
import { WORLD, COLORS, RUN } from "./config.js";

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function text(ctx, str, x, y, opts = {}) {
  const {
    size = 16,
    color = COLORS.text,
    align = "left",
    weight = 500,
    tracking = 0,
    alpha = 1,
  } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${MONO}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  if (tracking) {
    try { ctx.letterSpacing = `${tracking}px`; } catch (_) { /* older canvas */ }
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

function panel(ctx, x, y, w, h, alpha = 0.55) {
  ctx.save();
  ctx.fillStyle = `rgba(6, 10, 22, ${alpha})`;
  ctx.strokeStyle = "rgba(120, 148, 200, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx, run) {
  const p = run.player;

  text(ctx, "SCORE", 34, 42, { size: 11, color: COLORS.hudDim, tracking: 3 });
  text(ctx, String(run.score).padStart(5, "0"), 34, 72, { size: 26, weight: 700, color: COLORS.text, tracking: 1 });

  if (run.combo > 1) {
    text(ctx, `x${run.combo} COMBO`, 34, 98, {
      size: 13,
      weight: 700,
      color: COLORS.good,
      alpha: Math.min(1, 0.35 + run.comboTimer / RUN.comboWindow),
    });
  }

  text(ctx, "WINDOW", WORLD.w - 34, 42, { size: 11, color: COLORS.hudDim, align: "right", tracking: 3 });
  text(ctx, `${run.wave} / ${RUN.waves}`, WORLD.w - 34, 72, { size: 26, weight: 700, align: "right" });

  for (let i = 0; i < RUN.hullStart; i++) {
    const x = WORLD.w - 34 - (RUN.hullStart - 1 - i) * 20;
    ctx.beginPath();
    ctx.arc(x, 92, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < p.hull ? COLORS.good : "rgba(120, 140, 176, 0.25)";
    ctx.fill();
  }

  // fuel rail
  const barW = 190;
  const barX = 34;
  const barY = WORLD.h - 46;
  ctx.fillStyle = "rgba(12, 18, 34, 0.75)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 12, 6);
  ctx.fill();
  const pct = Math.max(0, Math.min(1, p.fuel / RUN.fuelMax));
  const fuelColor = pct < 0.25 ? COLORS.danger : pct < 0.5 ? COLORS.warn : COLORS.good;
  ctx.beginPath();
  ctx.roundRect(barX, barY, Math.max(6, barW * pct), 12, 6);
  ctx.fillStyle = fuelColor;
  ctx.fill();
  text(ctx, "ORBIT", barX, barY - 10, { size: 10, color: COLORS.hudDim, tracking: 3 });

  const dashReady = p.dashCooldown <= 0;
  text(ctx, dashReady ? "DASH READY  [SHIFT]" : `DASH ${p.dashCooldown.toFixed(1)}s`, barX + barW + 18, barY + 11, {
    size: 11,
    color: dashReady ? COLORS.bullet : COLORS.hudDim,
    tracking: 1,
  });

  const left = Math.max(0, run.need - run.kills);
  text(ctx, `HUNTERS LEFT ${left}`, WORLD.w - 34, WORLD.h - 38, {
    size: 12,
    color: left === 0 ? COLORS.good : COLORS.hud,
    align: "right",
    tracking: 2,
  });
}

export function drawBanner(ctx, run) {
  if (run.banner <= 0) return;
  const k = Math.min(1, run.banner / 2.2);
  const alpha = k > 0.8 ? (1 - k) / 0.2 : k / 0.8;
  const label = run.bannerWave > RUN.waves ? "FINAL WINDOW" : `WINDOW ${run.bannerWave}`;
  text(ctx, label, WORLD.w / 2, 236, {
    size: 34,
    weight: 700,
    align: "center",
    tracking: 8,
    alpha: Math.max(0, Math.min(1, alpha)),
    color: COLORS.text,
  });
}

export function drawTitle(ctx, run, t) {
  ctx.fillStyle = "rgba(4, 6, 14, 0.55)";
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  const glow = 0.5 + 0.5 * Math.sin(t * 1.4);
  text(ctx, "ORBITAL SALVAGE", WORLD.w / 2, 300, {
    size: 84,
    weight: 800,
    align: "center",
    tracking: 8,
    color: "#f2f7ff",
  });
  ctx.beginPath();
  ctx.moveTo(WORLD.w / 2 - 260, 328);
  ctx.lineTo(WORLD.w / 2 + 260, 328);
  ctx.strokeStyle = `rgba(94, 242, 160, ${0.25 + glow * 0.4})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, "a salvage tug, five decaying windows, one way out", WORLD.w / 2, 368, {
    size: 17,
    align: "center",
    color: COLORS.hud,
    tracking: 1,
  });

  panel(ctx, WORLD.w / 2 - 300, 408, 600, 132);
  const rows = [
    ["W / A / D  or arrows", "thrust and turn"],
    ["mouse + click, or space", "aim and fire"],
    ["shift", "dash burst (2.6s cooldown)"],
    ["fly into green cells", "refill orbit, raise the combo"],
  ];
  rows.forEach(([key, what], i) => {
    const y = 442 + i * 30;
    text(ctx, key, WORLD.w / 2 - 272, y, { size: 14, color: COLORS.bullet, weight: 600 });
    text(ctx, what, WORLD.w / 2 + 40, y, { size: 14, color: COLORS.hud });
  });

  const blink = 0.55 + 0.45 * Math.sin(t * 4);
  text(ctx, "PRESS ENTER TO LAUNCH", WORLD.w / 2, 596, {
    size: 20,
    weight: 700,
    align: "center",
    tracking: 6,
    color: COLORS.good,
    alpha: blink,
  });
  text(ctx, `best ${String(run.best).padStart(5, "0")}`, WORLD.w / 2, 636, {
    size: 13,
    align: "center",
    color: COLORS.hudDim,
    tracking: 2,
  });
}

function endingFrame(ctx, title, tint, lines, footer, t) {
  ctx.fillStyle = "rgba(4, 6, 14, 0.72)";
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  panel(ctx, WORLD.w / 2 - 300, 250, 600, 300, 0.72);

  text(ctx, title, WORLD.w / 2, 330, {
    size: 46,
    weight: 800,
    align: "center",
    tracking: 8,
    color: tint,
  });

  lines.forEach((line, i) => {
    const y = 390 + i * 34;
    text(ctx, line[0], WORLD.w / 2 - 150, y, { size: 15, color: COLORS.hudDim, tracking: 2 });
    text(ctx, line[1], WORLD.w / 2 + 150, y, { size: 20, weight: 700, align: "right", color: COLORS.text });
  });

  const blink = 0.5 + 0.5 * Math.sin(t * 3.4);
  text(ctx, footer, WORLD.w / 2, 512, {
    size: 15,
    align: "center",
    tracking: 4,
    color: COLORS.hud,
    alpha: blink,
  });
}

export function drawWin(ctx, run, t) {
  endingFrame(ctx, "YARD SECURED", COLORS.good, [
    ["SCORE", String(run.score)],
    ["CELLS", String(run.cellsCollected)],
    ["HULL LEFT", `${run.player.hull} / ${RUN.hullStart}`],
    ["BEST", String(run.best)],
  ], "PRESS R TO FLY AGAIN", t);
}

export function drawLose(ctx, run, t) {
  endingFrame(ctx, "TUG LOST", COLORS.danger, [
    ["SCORE", String(run.score)],
    ["WINDOW", `${run.wave} / ${RUN.waves}`],
    ["CELLS", String(run.cellsCollected)],
    ["BEST", String(run.best)],
  ], "PRESS R TO RELAUNCH", t);
}
