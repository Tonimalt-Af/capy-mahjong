import type { Pos } from './layout';
import { KINDS, KIND_BY_ID } from './tiles';
import { autoPlan, clearKnot, greedyRack, inferLocks, knotStats, prepareKnot, type KnotId } from './knots';

export { greedyRack, type KnotId } from './knots';

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
export function assignSolvable(positions: Pos[], pairs: [string, string][], r: () => number, attempts = 500) {
  for (let attempt = 0; attempt < attempts; attempt++) {
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

const FALLBACKS: Record<KnotId, KnotId[]> = {
  deep4: ['sandwich', 'cross4', 'cross2'],
  sandwich: ['cross4', 'cross2'],
  cross4: ['cross2'],
  cross2: ['cross4'],
};

/** Stamp split knots, then fill the rest with a classic solvable deal. Null when nothing fits. */
function assignKnots(positions: Pos[], r: () => number, slots: number, plan: readonly KnotId[]) {
  const softer = FALLBACKS[plan[0]] ?? [];
  const tries: (readonly KnotId[])[] = [plan, ...softer.map((id) => [id])];
  for (const attempt of tries) {
    if (knotStats(attempt).peak > slots) continue;
    for (let k = 0; k < 18; k++) {
      const prep = prepareKnot(positions, r, attempt);
      if (!prep) break;
      let rest: { kind: Map<Pos, string>; order: [Pos, Pos][] };
      try { rest = assignSolvable(prep.rest, prep.pairs, r, 20); } catch { continue; }
      const kind = new Map(prep.kind);
      for (const [p, id] of rest.kind) kind.set(p, id);
      const tiles: Tile[] = positions.map((p, i) => ({ ...p, id: i, kind: kind.get(p)!, removed: false }));
      const trace: number[] = [];
      const play = clearKnot(tiles, slots, prep.locked, trace);
      if (!play.win || play.peak !== prep.peak || play.peak > slots) continue;
      const posId = new Map(positions.map((p, i) => [p, i]));
      const solution: [number, number][] = [];
      for (let i = 0; i < trace.length; i += 2) solution.push([trace[i], trace[i + 1] ?? trace[i]]);
      let restOk = true;
      for (const [a, b] of rest.order) {
        const ia = posId.get(a)!, ib = posId.get(b)!;
        const live = tiles.filter((t) => !t.removed);
        if (!isFree(tiles[ia], live) || !isFree(tiles[ib], live) || !matches(tiles[ia].kind, tiles[ib].kind)) { restOk = false; break; }
        tiles[ia].removed = tiles[ib].removed = true;
        solution.push([ia, ib]);
      }
      if (restOk && tiles.every((t) => t.removed)) return { ...prep, kind, solution };
    }
  }
  return null;
}

export interface Deal {
  tiles: Tile[];
  /** Classic removal order when the deal is classically solvable; otherwise the pairs in kind order. */
  solution: [number, number][];
  /** Mates of a kind sit under different columns, so classic play cannot finish. */
  needsRack: boolean;
  /** Parks in the careful line whose mate was still buried. 0 when classic play can finish. */
  forced: number;
  /** Minimum rack occupancy of a careful winning line, counting the slot the incoming tile needs. */
  peak: number;
  /** Parks while clearing the buried knots (not the ordinary pair-clears). */
  parks: number;
  /** Kind-groups whose mates were split across columns. */
  groups: number;
}

/**
 * `slots` 0 is the classic solvable deal. With `bury`, mates are buried under different
 * columns so clearing them takes real rack space. The geometry itself stays classically clearable.
 * `knots`, when passed, is the campaign plan; generated modes pick one that fits the board.
 */
export function deal(positions: Pos[], seed: number, legendChance = 0, slots = 0, bury = false, knots?: readonly KnotId[]): Deal {
  const r = rng(seed);
  const all = shuffleArr(deckPairs(144), r).slice(0, positions.length / 2);
  const plan = slots > 0 && bury ? (knots?.length ? knots : autoPlan(positions.length, slots, r)) : [];
  const buried = plan.length ? assignKnots(positions, r, slots, plan) : null;
  const classic = buried ? null : assignSolvable(positions, all, r);
  const kind = buried?.kind ?? classic!.kind;
  const tiles: Tile[] = positions.map((p, i) => ({ ...p, id: i, kind: kind.get(p)!, removed: false }));
  const idx = new Map(positions.map((p, i) => [p, i]));
  const pairs: [number, number][] = buried?.solution ?? classic!.order.map(([a, b]) => [idx.get(a)!, idx.get(b)!] as [number, number]);
  const lr = rng(seed ^ 0x9e3779b9);
  if (legendChance > 0 && lr() < legendChance && pairs.length > 4) {
    const open = pairs.filter(([a]) => !buried?.locked.has(tiles[a].kind));
    if (open.length) {
      const [a, b] = open[Math.floor(lr() * open.length)];
      const prevA = tiles[a].kind, prevB = tiles[b].kind;
      tiles[a].kind = tiles[b].kind = 'capydindon';
      if (buried && !playRack(tiles, slots).win) { tiles[a].kind = prevA; tiles[b].kind = prevB; }
    }
  }
  return { tiles, solution: pairs, needsRack: !!buried, forced: buried?.forced ?? 0, peak: buried?.peak ?? 0, parks: buried?.parks ?? 0, groups: buried?.groups ?? 0 };
}

function pairsFromKind(tiles: Tile[]): [number, number][] {
  const by = new Map<string, number[]>();
  for (const t of tiles) { const g = KIND_BY_ID.get(t.kind)!.group; (by.get(g) ?? by.set(g, []).get(g)!).push(t.id); }
  const out: [number, number][] = [];
  for (const ids of by.values()) {
    ids.sort((a, b) => tiles[b].z - tiles[a].z || tiles[a].x - tiles[b].x || tiles[a].y - tiles[b].y);
    for (let i = 0; i + 1 < ids.length; i += 2) out.push([ids[i], ids[i + 1]]);
  }
  return out;
}

/**
 * Rack play under the landing rule: the mate already in the rack keeps its slot, so the
 * incoming tile needs one more. Peak counts that momentary extra tile. A few seeded
 * retries cover lines the single greedy pass misses, without ever fusing into a full rack.
 */
function landLine(tiles: Tile[], slots: number, seed?: number): { win: boolean; peak: number; forced: number } {
  if (slots < 2) return { win: false, peak: 0, forced: 0 };
  const random = seed === undefined ? null : rng(seed);
  const take = <T>(xs: T[]): T => random ? xs[Math.floor(random() * xs.length)] : xs[0];
  const rack: number[] = [];
  let peak = 0, forced = 0;
  const live = tiles.map((t) => ({ ...t }));
  for (let step = 0; step < tiles.length * 4; step++) {
    if (live.every((t) => t.removed)) return { win: true, peak, forced };
    const held = new Set(rack);
    const board = live.filter((t) => !t.removed && !held.has(t.id));
    const free = freeTiles(board);
    const mate = (kind: string) => rack.find((id) => matches(live[id].kind, kind));
    const hits = free.filter((f) => mate(f.kind) !== undefined);
    if (hits.length && rack.length < slots) {
      const hit = take(hits);
      const id = mate(hit.kind)!;
      rack.push(hit.id); peak = Math.max(peak, rack.length);
      hit.removed = true; live[id].removed = true;
      rack.splice(rack.indexOf(id), 1); rack.splice(rack.indexOf(hit.id), 1);
      continue;
    }
    if (!free.length || rack.length >= slots - 1) return { win: false, peak, forced };
    const pairs: Tile[] = [];
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) pairs.push(free[i]);
    const uncover = free.filter((t) => board.some((o) => o.x === t.x && o.y === t.y && o.z === t.z - 1 && matches(o.kind, t.kind)));
    if (uncover.length) { const pick = uncover.slice().sort((a, b) => b.z - a.z)[0]; forced++; rack.push(pick.id); peak = Math.max(peak, rack.length); continue; }
    if (pairs.length) { rack.push(take(pairs).id); peak = Math.max(peak, rack.length); continue; }
    const pick = free.slice().sort((a, b) => b.z - a.z)[0];
    forced++; rack.push(pick.id); peak = Math.max(peak, rack.length);
  }
  return { win: false, peak, forced };
}

/** Careful knot first, then the classic remainder. Greedy retries cover a board with no knot. */
export function playRack(tiles: Tile[], slots: number): { win: boolean; peak: number; forced: number; parks: number } {
  const live = tiles.map((t) => ({ ...t }));
  const locked = inferLocks(live);
  const knot = locked.size ? clearKnot(live, slots, locked) : { win: true, peak: 0, forced: 0, parks: 0 };
  if (knot.win) {
    if (live.every((t) => t.removed)) return knot;
    const finish = (seed?: number) => {
      const line = landLine(live, slots, seed);
      if (!line.win || Math.max(knot.peak, line.peak) > slots) return null;
      return { win: true, peak: Math.max(knot.peak, line.peak), forced: knot.forced, parks: knot.parks };
    };
    const straight = finish();
    if (straight) return straight;
    for (let k = 0; k < 12; k++) { const line = finish(9000 + k * 131); if (line) return line; }
    const solved = solve(live);
    if (solved) return { win: true, peak: Math.max(knot.peak, solved.length ? 2 : 0), forced: knot.forced, parks: knot.parks };
  }
  const straight = landLine(tiles, slots);
  if (straight.win && straight.peak <= slots) return { ...straight, parks: straight.forced };
  for (let k = 0; k < 16; k++) {
    const line = landLine(tiles, slots, 9000 + k * 131);
    if (line.win && line.peak <= slots) return { ...line, parks: line.forced };
  }
  return { ...straight, parks: straight.forced };
}

export function findHint(tiles: Tile[]): [Tile, Tile] | null {
  const live = tiles.filter((t) => !t.removed);
  const free = freeTiles(live);
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) return [free[i], free[j]];
  return null;
}

/**
 * Can these positions be fully cleared by *some* pairing, whatever the faces? (kinds ignored: any two free tiles
 * may pair). true = yes, false = provably impossible (e.g. a 3-high stack plus one loose tile), null = unknown (search limit).
 */
export function clearable(live: Pos[], r: () => number = rng(1), limit = 200_000): boolean | null {
  if (live.length % 2) return false;
  if (!live.length) return true;
  // a stack of h tiles at one spot is removed top-down, each with a partner from elsewhere: needs h tiles outside it
  const col = new Map<string, number[]>(); for (const p of live) { const k = `${p.x},${p.y}`; (col.get(k) ?? col.set(k, []).get(k)!).push(p.z); }
  for (const zs of col.values()) { const h = zs.length; if (h > live.length - h && Math.max(...zs) - Math.min(...zs) === h - 1) return false; }
  // fast path: random greedy removals (what assignSolvable does) usually find an order immediately
  for (let k = 0; k < 30; k++) {
    const l = live.slice(); let ok = true;
    while (l.length) { const f = shuffleArr(freeTiles(l), r); if (f.length < 2) { ok = false; break; } const a = f[0]; const b = f.find((x, i) => i > 0 && (x.x !== a.x || x.y !== a.y)) ?? f[1]; l.splice(l.indexOf(a), 1); l.splice(l.indexOf(b), 1); }
    if (ok) return true;
  }
  if (live.length > 28) return null; // too big for an exhaustive proof: unknown
  // exact search over removal sets (memoised); free tiles of a state are interchangeable for pairing purposes
  const n = live.length; const gone = new Array<boolean>(n).fill(false); const seen = new Set<string>(); let nodes = 0;
  const rec = (left: number): boolean => {
    if (!left) return true;
    if (++nodes > limit) throw new Error('limit');
    const key = gone.map((b) => (b ? 1 : 0)).join(''); if (seen.has(key)) return false; seen.add(key);
    const cur = live.filter((_, i) => !gone[i]); const free = freeTiles(cur).map((p) => live.indexOf(p));
    if (free.length < 2) return false;
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) { gone[free[i]] = gone[free[j]] = true; if (rec(left - 2)) return true; gone[free[i]] = gone[free[j]] = false; }
    return false;
  };
  try { return rec(n); } catch { return null; }
}

export type ShuffleResult = 'pair' | 'dead';
/**
 * Reshuffle the remaining faces (positions kept). Never throws and only mutates on success:
 *  - 'pair': random new faces, with at least one free matching pair (a full clear is NOT guaranteed, by design);
 *  - 'dead': mathematically impossible to clear the remaining positions (whatever the faces) → caller shows the end screen.
 */
export function reshuffle(tiles: Tile[], seed: number): ShuffleResult {
  const live = tiles.filter((t) => !t.removed);
  const byGroup = new Map<string, string[]>();
  for (const t of live) { const g = KIND_BY_ID.get(t.kind)!.group; (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push(t.kind); }
  const pairs: [string, string][] = [];
  for (const ks of byGroup.values()) for (let i = 0; i + 1 < ks.length; i += 2) pairs.push([ks[i], ks[i + 1]]);
  if (pairs.length * 2 !== live.length) return 'dead'; // inconsistent faces: should never happen
  const r = rng(seed);
  // Design: a shuffle is a plain random re-deal of the remaining faces (with one free matching pair forced so there is a move).
  // It does NOT search for a solvable arrangement: getting stuck after mistakes is part of the game. It only reports 'dead'
  // (and changes nothing) when no arrangement could ever clear the stacks, so the caller doesn't spend the shuffle.
  if (clearable(live, r) === false) return 'dead';
  const free = freeTiles(live); if (free.length < 2) return 'dead';
  const flat = shuffleArr(pairs.slice(), r); const [a, b] = shuffleArr(free.slice(), r);
  const rest = live.filter((t) => t !== a && t !== b); const kinds = shuffleArr(flat.slice(1).flat(), r);
  a.kind = flat[0][0]; b.kind = flat[0][1]; rest.forEach((t, i) => { t.kind = kinds[i]; });
  return 'pair';
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
