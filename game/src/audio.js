// Tiny WebAudio blip synth: every sound in the game is generated, no audio files.
let ctx = null;
let master = null;

function ensure() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return ctx;
}

// A short shaped tone. `type` picks the timbre, `sweep` bends the pitch over the note.
function blip({ freq = 440, to = null, dur = 0.12, type = "square", gain = 0.5, sweep = 0 }) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
  if (sweep) osc.frequency.linearRampToValueAtTime(freq + sweep, t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const Sfx = {
  shoot() { blip({ freq: 880, to: 520, dur: 0.07, type: "square", gain: 0.22 }); },
  pickup() { blip({ freq: 660, to: 990, dur: 0.1, type: "triangle", gain: 0.4 }); },
  rock() { blip({ freq: 180, to: 70, dur: 0.16, type: "sawtooth", gain: 0.3 }); },
  drone() { blip({ freq: 320, to: 90, dur: 0.22, type: "sawtooth", gain: 0.34 }); },
  hurt() { blip({ freq: 240, to: 60, dur: 0.3, type: "square", gain: 0.45 }); },
  wave() { blip({ freq: 520, to: 1040, dur: 0.28, type: "triangle", gain: 0.35 }); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(
      () => blip({ freq: f, dur: 0.24, type: "triangle", gain: 0.4 }), i * 130));
  },
  lose() {
    [400, 300, 200, 120].forEach((f, i) => setTimeout(
      () => blip({ freq: f, dur: 0.3, type: "sawtooth", gain: 0.4 }), i * 150));
  },
  // Called on the first click, since browsers only allow audio after a gesture.
  unlock() { const c = ensure(); if (c && c.state === "suspended") c.resume(); },
};
