import type { Pos } from './layout';
import { KINDS, KIND_BY_ID } from './tiles';

export interface Tile extends Pos { id: number; kind: string; removed: boolean }

export function rng(seed: number) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffleArr = <T>(a: T[], r: () => number) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const matches = (a: string, b: string) => KIND_BY_ID.get(a)!.group === KIND_BY_ID.get(b)!.group;

/** A tile is free if nothing lies on it and its left or right side is open. */
export function isFree(t: Pos, live: Pos[]): boolean {
  let left = false, right = false;
  for (const o of live) {
    if (o === t) continue;
    const dx = o.x - t.x, dy = Math.abs(o.y - t.y);
    if (dy >= 2) continue;
    if (o.z === t.z + 1 && Math.abs(dx) < 2) return false;
    if (o.z === t.z) { if (dx === -2) left = true; else if (dx === 2) right = true; }
  }
  return !(left && right);
}
export const freeTiles = <T extends Pos>(live: T[]) => live.filter((t) => isFree(t, live));

/** Pairs of kinds for a full 144 deck: each suit/honor kind x4 = 2 pairs; bonus groups give 2 pairs each. */
export function deckPairs(n: number): [string, string][] {
  const pairs: [string, string][] = [];
  for (const k of KINDS) if (!k.bonus && !k.legend) { pairs.push([k.id, k.id], [k.id, k.id]); }
  pairs.push(['printemps', 'ete'], ['automne', 'hiver'], ['lotus', 'tournesol'], ['tulipe', 'hibiscus']);
  if (n / 2 > pairs.length) throw new Error('layout too big');
  return pairs.slice(0, n / 2);
}

/**
 * Guaranteed-solvable assignment: simulate removing random free pairs from the full layout;
 * playing those removals in order is a valid solution. Returns assignment and that solution.
 */
export function assignSolvable(positions: Pos[], pairs: [string, string][], r: () => number) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const live = positions.slice();
    const order: [Pos, Pos][] = [];
    let ok = true;
    while (live.length) {
      const free = freeTiles(live);
      if (free.length < 2) { ok = false; break; }
      // prefer taking higher tiles first to avoid stranding stacks (pure random still valid)
      shuffleArr(free, r);
      const a = free[0];
      let b = free[1];
      // avoid pairing two tiles of the same stack column too often (keeps deals varied)
      const alt = free.find((f, i) => i > 0 && (f.x !== a.x || f.y !== a.y));
      if (alt) b = alt;
      order.push([a, b]);
      live.splice(live.indexOf(a), 1); live.splice(live.indexOf(b), 1);
    }
    if (!ok) continue;
    const ps = shuffleArr(pairs.slice(), r);
    const kind = new Map<Pos, string>();
    order.forEach(([a, b], i) => { const [k1, k2] = r() < 0.5 ? ps[i] : [ps[i][1], ps[i][0]]; kind.set(a, k1); kind.set(b, k2); });
    return { kind, order };
  }
  throw new Error('could not build deal');
}

export function deal(positions: Pos[], seed: number, legendChance = 0) {
  const r = rng(seed);
  const all = shuffleArr(deckPairs(144), r).slice(0, positions.length / 2);
  const { kind, order } = assignSolvable(positions, all, r);
  const tiles: Tile[] = positions.map((p, i) => ({ ...p, id: i, kind: kind.get(p)!, removed: false }));
  const idx = new Map(positions.map((p, i) => [p, i]));
  const solution = order.map(([a, b]) => [idx.get(a)!, idx.get(b)!] as [number, number]);
  // rare golden capydindon: relabel one solution pair from the back half (buried deeper) — solvability unchanged
  const lr = rng(seed ^ 0x9e3779b9);
  if (legendChance > 0 && lr() < legendChance && solution.length > 4) { const [a, b] = solution[Math.floor(solution.length / 2 + lr() * (solution.length / 2 - 1))]; tiles[a].kind = tiles[b].kind = 'capydindon'; }
  return { tiles, solution };
}

export function findHint(tiles: Tile[]): [Tile, Tile] | null {
  const live = tiles.filter((t) => !t.removed);
  const free = freeTiles(live);
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) return [free[i], free[j]];
  return null;
}

/** Reshuffle remaining tiles into a solvable arrangement (keeps positions, re-pairs kinds). */
export function reshuffle(tiles: Tile[], seed: number) {
  const live = tiles.filter((t) => !t.removed);
  // group remaining kinds into matching pairs
  const byGroup = new Map<string, string[]>();
  for (const t of live) { const g = KIND_BY_ID.get(t.kind)!.group; (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push(t.kind); }
  const pairs: [string, string][] = [];
  for (const ks of byGroup.values()) for (let i = 0; i + 1 < ks.length; i += 2) pairs.push([ks[i], ks[i + 1]]);
  const { kind } = assignSolvable(live, pairs, rng(seed));
  for (const t of live) t.kind = kind.get(t)!;
}

/** Exact DFS solver with memo; returns a solution or null. Limit nodes for safety. */
export function solve(tiles: Tile[], limit = 2_000_000): [number, number][] | null {
  const n = tiles.length; const removed = tiles.map((t) => t.removed);
  const seen = new Set<string>(); let nodes = 0; const path: [number, number][] = [];
  const key = () => removed.map((b) => (b ? 1 : 0)).join('');
  const rec = (left: number): boolean => {
    if (left === 0) return true;
    if (++nodes > limit) throw new Error('limit');
    const k = key(); if (seen.has(k)) return false; seen.add(k);
    const live = tiles.filter((_, i) => !removed[i]);
    const free = freeTiles(live);
    const blocks = (t: Tile) => live.reduce((n, o) => n + (o !== t && Math.abs(o.y - t.y) < 2 && ((o.z === t.z - 1 && Math.abs(o.x - t.x) < 2) || (o.z === t.z && Math.abs(o.x - t.x) === 2)) ? 1 : 0), 0) + t.z * 2;
    const cand: [Tile, Tile, number][] = [];
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) cand.push([free[i], free[j], blocks(free[i]) + blocks(free[j])]);
    // safe move: a group whose 4 remaining tiles are all free -> only try it
    const grp = (t: Tile) => KIND_BY_ID.get(t.kind)!.group;
    const safe = cand.find(([a]) => { const g = grp(a); const all = live.filter((t) => grp(t) === g); return all.length % 2 === 0 && all.every((t) => free.includes(t)); });
    const list = safe ? [safe] : cand.sort((p, q) => q[2] - p[2]);
    for (const [a, b] of list) {
      removed[a.id] = removed[b.id] = true; path.push([a.id, b.id]);
      if (rec(left - 2)) return true;
      removed[a.id] = removed[b.id] = false; path.pop();
    }
    return false;
  };
  try { return rec(removed.filter((b) => !b).length) ? path.slice() : null; } catch { return null; } finally { void n; }
}

/** Share of random-but-legal playthroughs that clear the board: a cheap difficulty estimate (1 = trivial). */
export function winRate(positions: Pos[], seed: number, runs = 20) {
  let ok = 0;
  for (let k = 0; k < runs; k++) {
    const { tiles } = deal(positions, seed); const r = rng(k * 31 + 7);
    for (;;) {
      const live = tiles.filter((t) => !t.removed); if (!live.length) { ok++; break; }
      const f = freeTiles(live); const p: [Tile, Tile][] = [];
      for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (matches(f[i].kind, f[j].kind)) p.push([f[i], f[j]]);
      if (!p.length) break; const [a, b] = p[Math.floor(r() * p.length)]; a.removed = b.removed = true;
    }
  }
  return ok / runs;
}
/** First seed (from `seed`) whose deal isn't a trap: random play clears it at least `min` of the time. */
export function fairSeed(positions: Pos[], seed: number, min = 0.4, tries = 6) {
  let best = seed, bestR = -1;
  for (let i = 0; i < tries; i++) { const s = (seed + i * 7919) >>> 0; const r = winRate(positions, s, 10); if (r >= min) return s; if (r > bestR) { bestR = r; best = s; } }
  return best;
}
