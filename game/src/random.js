// Seeded PRNG (xorshift128) so a seed reproduces a run exactly. No Math.random
// anywhere in the simulation: screenshots and replays stay byte-stable.
export function makeRng(seed) {
  let x = (seed | 0) || 0x9e3779b9;
  let y = (Math.imul(x, 0x85ebca6b) ^ 0x165667b1) | 0;
  let z = (Math.imul(y, 0xc2b2ae35) ^ 0x27d4eb2f) | 0;
  let w = (Math.imul(z, 0x9e3779b1) ^ 0x165667b1) | 0;
  if ((x | y | z | w) === 0) x = 1;

  function next() {
    const t = x ^ (x << 11);
    x = y; y = z; z = w;
    w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) | 0;
    return w >>> 0;
  }

  const rng = () => next() / 4294967296;
  rng.range = (lo, hi) => lo + rng() * (hi - lo);
  rng.int = (lo, hi) => Math.floor(lo + rng() * (hi - lo + 1));
  rng.pick = (list) => list[Math.floor(rng() * list.length) % list.length];
  rng.sign = () => (rng() < 0.5 ? -1 : 1);
  return rng;
}
