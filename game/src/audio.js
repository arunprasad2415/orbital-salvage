// Synthesised sound: no audio files, every blip is an oscillator envelope. The
// context is created on the first gesture (browsers refuse one before that) and
// every call is a no-op until then, so the game never throws on a silent start.
let ctx = null;
let master = null;
let muted = false;

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

function blip(type, from, to, seconds, gain, detune) {
  const ac = ensure();
  if (!ac || muted || ac.state === "suspended") return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + seconds);
  if (detune) osc.detune.value = detune;
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(env).connect(master);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export const audio = {
  unlock() {
    const ac = ensure();
    if (ac && ac.state === "suspended") ac.resume().catch(() => {});
  },
  shoot() {
    blip("square", 880, 360, 0.09, 0.25, 12);
  },
  hit() {
    blip("triangle", 240, 90, 0.16, 0.4);
  },
  rock() {
    blip("sawtooth", 160, 60, 0.22, 0.3, -8);
  },
  pickup() {
    blip("sine", 620, 1180, 0.14, 0.35);
  },
  hurt() {
    blip("sawtooth", 190, 48, 0.42, 0.5);
  },
  wave() {
    blip("sine", 420, 760, 0.3, 0.3);
  },
  win() {
    blip("sine", 520, 1320, 0.55, 0.35);
  },
  lose() {
    blip("triangle", 300, 70, 0.7, 0.4);
  },
  toggle() {
    muted = !muted;
    return muted;
  },
  get isMuted() {
    return muted;
  },
};
