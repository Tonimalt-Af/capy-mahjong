// Bot playthroughs used to tune the campaign curve (pure; never imported by the game itself).
import { deal, freeTiles, matches, reshuffle, rng, type Tile } from './engine';
import { KIND_BY_ID } from './tiles';
import type { Pos } from './layout';

/** How many live tiles a tile is holding down (on top of, or the side neighbour it hides). */
const holds = (t: Tile, live: Tile[]) => live.reduce((n, o) => n + (o !== t && Math.abs(o.y - t.y) < 2 && ((o.z === t.z - 1 && Math.abs(o.x - t.x) < 2) || (o.z === t.z && Math.abs(o.x - t.x) === 2)) ? 1 : 0), 0) + t.z * 2;

/**
 * A careful human without the pair highlight: clears a whole group when all its tiles are free,
 * otherwise prefers pairs that unblock the most tiles, but slips to a random legal pair `slip` of the time.
 * Uses the level's shuffles when stuck. Returns true when the board is cleared.
 */
export function smartPlay(positions: Pos[], seed: number, run: number, opts: { legend?: number; shuffles?: number; slip?: number } = {}) {
  const { tiles } = deal(positions, seed, opts.legend ?? 0); const r = rng(run * 7919 + 13); let shuf = opts.shuffles ?? 0; const slip = opts.slip ?? 0.3;
  const grp = (t: Tile) => KIND_BY_ID.get(t.kind)!.group;
  for (let step = 0; step < 500; step++) {
    const live = tiles.filter((t) => !t.removed); if (!live.length) return true;
    const f = freeTiles(live); const p: [Tile, Tile][] = [];
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (matches(f[i].kind, f[j].kind)) p.push([f[i], f[j]]);
    if (!p.length) { if (shuf-- <= 0 || reshuffle(tiles, (seed + run * 31 + step) >>> 0) === 'dead') return false; continue; }
    const safe = p.find(([a]) => { const g = grp(a); const all = live.filter((t) => grp(t) === g); return all.every((t) => f.includes(t)); });
    const pick = safe ?? (r() < slip ? p[Math.floor(r() * p.length)] : p.map((x) => [x, holds(x[0], live) + holds(x[1], live) + r()] as const).sort((a, b) => b[1] - a[1])[0][0]);
    pick[0].removed = pick[1].removed = true;
  }
  return false;
}
export const smartRate = (positions: Pos[], seed: number, runs = 40, opts: { legend?: number; shuffles?: number; slip?: number } = {}) => {
  let ok = 0; for (let k = 0; k < runs; k++) if (smartPlay(positions, seed, k, opts)) ok++; return ok / runs;
};
