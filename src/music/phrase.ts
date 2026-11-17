import type { Hit } from './kit';

export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

const PENTA = [0, 2, 4, 7, 9];

function scale(key: number, lo: number, hi: number): number[] {
  const set = new Set(PENTA.map((p) => (p + key + 120) % 12));
  const out: number[] = [];
  for (let m = lo; m <= hi; m++) if (set.has((m % 12 + 12) % 12)) out.push(m);
  return out.length ? out : [lo];
}

/** A nearby pentatonic tone. Beat 0 prefers a chord tone so the loop lands cleanly. */
export function near(hit: Hit, lo: number, hi: number): number {
  const sc = scale(hit.spec.keyPc, lo, hi);
  const dist = (m: number) => Math.abs(m - hit.mem.mel);
  const close = sc.filter((m) => m !== hit.mem.mel && dist(m) <= 5);
  const pool = close.length ? close : sc;
  let m = pool[Math.floor(hit.rng() * pool.length) % pool.length] ?? sc[0];
  if (hit.beat === 0) {
    const tones = pool.filter((n) => hit.chord.notes.some((c) => (c - n) % 12 === 0));
    if (tones.length) m = tones.reduce((a, c) => (dist(c) < dist(a) ? c : a));
  }
  hit.mem.mel = m;
  return m;
}
