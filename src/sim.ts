// Bot playthroughs used to tune the campaign curve (pure; never imported by the game itself).
import { deal, freeTiles, matches, reshuffle, rng, type Tile } from './engine';
import { reshuffleRack } from './rack';
import { KIND_BY_ID } from './tiles';
import type { Pos } from './layout';

/** How many live tiles a tile is holding down (on top of, or the side neighbour it hides). */
const holds = (t: Tile, live: Tile[]) => live.reduce((n, o) => n + (o !== t && Math.abs(o.y - t.y) < 2 && ((o.z === t.z - 1 && Math.abs(o.x - t.x) < 2) || (o.z === t.z && Math.abs(o.x - t.x) === 2)) ? 1 : 0), 0) + t.z * 2;

/**
 * A careful human without the pair highlight: clears a whole group when all its tiles are free,
 * otherwise prefers pairs that unblock the most tiles, but slips to a random legal pair `slip` of the time.
 * Uses the level's shuffles when stuck. Returns true when the board is cleared.
 */
export function smartPlay(positions: Pos[], seed: number, run: number, opts: { legend?: number; shuffles?: number; slip?: number; slots?: number; bury?: boolean } = {}) {
  const slots = opts.slots ?? 0;
  const { tiles } = deal(positions, seed, opts.legend ?? 0, slots, !!opts.bury); const r = rng(run * 7919 + 13); let shuf = opts.shuffles ?? 0; const slip = opts.slip ?? 0.3;
  if (slots > 0) {
    const rack: number[] = [];
    for (let step = 0; step < 800; step++) {
      if (tiles.every((t) => t.removed)) return true;
      const held = new Set(rack);
      const board = tiles.filter((t) => !t.removed && !held.has(t.id));
      const free = freeTiles(board);
      const mate = (kind: string) => rack.find((id) => matches(tiles[id].kind, kind));
      const hits = free.filter((f) => mate(f.kind) !== undefined);
      if (hits.length) { const hit = r() < slip ? hits[Math.floor(r() * hits.length)] : hits[0]; const id = mate(hit.kind)!; hit.removed = true; tiles[id].removed = true; rack.splice(rack.indexOf(id), 1); continue; }
      const pairs: [Tile, Tile][] = [];
      for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) pairs.push([free[i], free[j]]);
      if (pairs.length && rack.length < slots) { const pick = r() < slip ? pairs[Math.floor(r() * pairs.length)] : pairs[0]; rack.push(pick[0].id); continue; }
      if (rack.length < slots && free.length) {
        const good = free.filter((t) => board.some((o) => o.x === t.x && o.y === t.y && o.z === t.z - 1 && matches(o.kind, t.kind)));
        const careful = good[0] ?? free.slice().sort((a, b) => b.z - a.z)[0];
        rack.push((r() < slip && free.length > 1 ? free[Math.floor(r() * free.length)] : careful).id);
        continue;
      }
      if (shuf-- <= 0 || reshuffleRack(tiles, rack, slots, (seed + run * 31 + step) >>> 0) === 'dead') return false;
    }
    return false;
  }
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
export const smartRate = (positions: Pos[], seed: number, runs = 40, opts: { legend?: number; shuffles?: number; slip?: number; slots?: number; bury?: boolean } = {}) => {
  let ok = 0; for (let k = 0; k < runs; k++) if (smartPlay(positions, seed, k, opts)) ok++; return ok / runs;
};
