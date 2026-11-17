// Split burials. A stacked foursome only ever needs peak 2: park the top, its mate is
// freed underneath, and the incoming tile uses one more slot. These patterns put the
// mates under different columns, so two or three parks happen before the first fusion.
import type { Pos } from './layout';
import { KINDS } from './tiles';
import { freeTiles, isFree, matches, solve, type Tile } from './engine';

export type KnotId = 'cross2' | 'sandwich' | 'deep4' | 'cross4';

interface Pat {
  /** Top → bottom, one letter-column per stack. Letters name kinds inside one knot. */
  cols: string[][];
  peak: number;
  parks: number;
  forced: number;
}

/** Proven by exhaustive search on the two stacks alone (scripts kept out of the build). */
const PATTERNS: Record<KnotId, Pat> = {
  cross2: { cols: [['A', 'B'], ['B', 'A']], peak: 3, parks: 2, forced: 1 },
  sandwich: { cols: [['A', 'B', 'C'], ['C', 'B', 'A']], peak: 4, parks: 3, forced: 2 },
  deep4: { cols: [['A', 'B', 'C', 'D'], ['D', 'C', 'B', 'A']], peak: 5, parks: 4, forced: 3 },
  cross4: { cols: [['A', 'B', 'A', 'A'], ['B', 'A', 'B', 'B']], peak: 3, parks: 4, forced: 2 },
};

export interface KnotStats { peak: number; parks: number; forced: number; groups: number }

/** Peak is the max across knots played one after another. Parks and forced parks add up. */
export function knotStats(plan: readonly KnotId[]): KnotStats {
  let peak = 0, parks = 0, forced = 0, groups = 0;
  plan.forEach((id, i) => {
    const p = PATTERNS[id];
    peak = Math.max(peak, p.peak); parks += p.parks; forced += p.forced; groups += new Set(p.cols.flat()).size;
    void i;
  });
  return { peak, parks, forced, groups };
}

/** How many second-pairs this plan must drop so the knot kinds have no spare mate on the board. */
export function knotDiscard(plan: readonly KnotId[]): number {
  const n = new Map<string, number>();
  plan.forEach((id, copy) => {
    for (const ch of new Set(PATTERNS[id].cols.flat())) n.set(`${copy}:${ch}`, 1);
  });
  // each letter of each copy is its own kind. copies of 2 discard 1 pair; copies of 4 discard 0.
  let d = 0;
  plan.forEach((id, copy) => {
    const counts = new Map<string, number>();
    for (const col of PATTERNS[id].cols) for (const ch of col) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    for (const c of counts.values()) if (c === 2) d += 1;
    void copy;
  });
  void n;
  return d;
}

/** Largest number of pairs a board of `n` tiles can leave out of the 72-pair deck. */
export const maxDiscard = (n: number) => 72 - n / 2;

/** A generated rack board: one knot, the hardest shape that fits the rack and the deck. */
export function autoPlan(n: number, slots: number, r: () => number): KnotId[] {
  const room = maxDiscard(n);
  const opts: KnotId[] = [];
  if (slots >= 5 && room >= 4) opts.push('deep4');
  if (slots >= 4 && room >= 3) opts.push('sandwich');
  if (room >= 2) opts.push('cross2');
  opts.push('cross4');
  const span = Math.min(opts.length, slots >= 5 ? 2 : slots >= 4 ? 2 : 1);
  return [opts[Math.floor(r() * span)] ?? 'cross2'];
}

interface Col { cells: Pos[]; top: Pos; index: number }

const shuffle = <T>(a: T[], r: () => number) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

function columnsOf(positions: Pos[]): Col[] {
  const m = new Map<string, Pos[]>();
  for (const p of positions) { const k = `${p.x},${p.y}`; (m.get(k) ?? m.set(k, []).get(k)!).push(p); }
  const cols: Col[] = [];
  for (const cells of m.values()) {
    cells.sort((a, b) => a.z - b.z);
    const top = cells[cells.length - 1];
    cols.push({ cells, top, index: positions.indexOf(top) });
  }
  return cols;
}

/** The pattern layers are the top of the column, nothing foreign covers them, and each lower layer is free once the pattern tiles above it are gone. */
function usable(col: Col, layers: number, positions: Pos[]): boolean {
  if (col.cells.length < layers) return false;
  if (!isFree(col.top, positions)) return false;
  const slice = col.cells.slice(-layers);
  const gone = new Set<Pos>();
  for (let i = slice.length - 1; i >= 0; i--) {
    const cell = slice[i];
    for (const o of positions) {
      if (o === cell || gone.has(o)) continue;
      if (o.z > cell.z && Math.abs(o.x - cell.x) < 2 && Math.abs(o.y - cell.y) < 2) return false;
    }
    if (i < slice.length - 1) {
      const live = positions.filter((p) => !gone.has(p));
      if (!isFree(cell, live)) return false;
    }
    gone.add(cell);
  }
  return true;
}

interface Instance { cols: string[][]; peak: number; parks: number; forced: number }

function instantiate(plan: readonly KnotId[]): Instance[] {
  let n = 0;
  return plan.map((id) => {
    const p = PATTERNS[id];
    const local = new Map<string, string>();
    const letter = (ch: string) => {
      const hit = local.get(ch);
      if (hit) return hit;
      const fresh = String.fromCharCode(65 + n++);
      local.set(ch, fresh);
      return fresh;
    };
    return { cols: p.cols.map((col) => col.map(letter)), peak: p.peak, parks: p.parks, forced: p.forced };
  });
}

export interface Prepared {
  kind: Map<Pos, string>;
  locked: Set<string>;
  rest: Pos[];
  pairs: [string, string][];
  peak: number;
  parks: number;
  forced: number;
  groups: number;
}

/**
 * One attempt at stamping `plan` onto free column tops.
 * Multiple knots are interleaved in tile order so a highest-first player alternates
 * between them and, on a tight rack, gets stuck. Returns null when the geometry or the
 * deck cannot hold the plan.
 */
export function prepareKnot(positions: Pos[], r: () => number, plan: readonly KnotId[]): Prepared | null {
  if (!plan.length) return null;
  if (knotDiscard(plan) > maxDiscard(positions.length)) return null;
  const inst = instantiate(plan);
  const width = inst[0].cols.length;
  if (inst.some((p) => p.cols.length !== width)) return null;
  const layers = Math.max(...inst.flatMap((p) => p.cols.map((c) => c.length)));
  const need = inst.length * width;
  const sameZ = inst.length > 1;
  let pool = columnsOf(positions).filter((c) => usable(c, layers, positions));
  if (sameZ) {
    const by = new Map<number, Col[]>();
    for (const c of pool) (by.get(c.top.z) ?? by.set(c.top.z, []).get(c.top.z)!).push(c);
    const groups = [...by.values()].filter((g) => g.length >= need).sort((a, b) => b.length - a.length);
    pool = groups[0] ?? [];
  }
  if (pool.length < need) return null;
  const chosen = shuffle(pool.slice(), r).slice(0, need).sort((a, b) => a.index - b.index);
  const kind = new Map<Pos, string>();
  const counts = new Map<string, number>();
  inst.forEach((p, pi) => {
    p.cols.forEach((letters, ci) => {
      const col = chosen[ci * inst.length + pi];
      const slice = col.cells.slice(-letters.length);
      letters.forEach((ch, i) => {
        const pos = slice[slice.length - 1 - i];
        kind.set(pos, ch);
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      });
    });
  });
  const regular = KINDS.filter((k) => !k.bonus && !k.legend).map((k) => k.id);
  const ids = shuffle(regular.slice(), r);
  const kindOf = new Map<string, string>();
  let ki = 0;
  for (const ch of counts.keys()) kindOf.set(ch, ids[ki++]);
  if (ki > ids.length) return null;
  for (const [pos, ch] of kind) kind.set(pos, kindOf.get(ch)!);
  const placed = new Set(kindOf.values());
  // Keep both pairs of a regular kind together. Slicing single pairs would leave a
  // 2-tile kind that looks like a knot and sends the careful line down the wrong park.
  const big: [string, string][][] = [];
  for (const id of regular) if (!placed.has(id)) big.push([[id, id], [id, id]]);
  const small: [string, string][][] = [[['printemps', 'ete']], [['automne', 'hiver']], [['lotus', 'tournesol']], [['tulipe', 'hibiscus']]];
  const usedTiles = [...counts.values()].reduce((a, b) => a + b, 0);
  const needPairs = (positions.length - usedTiles) / 2;
  if (needPairs < 0) return null;
  const pairs: [string, string][] = [];
  let left = needPairs;
  const bonus = shuffle(small, r);
  const full = shuffle(big, r);
  if (left % 2 === 1) {
    const one = bonus.pop();
    if (!one) return null;
    pairs.push(...one); left -= 1;
  }
  for (const g of full) if (left >= 2) { pairs.push(...g); left -= 2; }
  for (const g of bonus) if (left >= 1) { pairs.push(...g); left -= 1; }
  if (left) return null;
  const stats = knotStats(plan);
  return {
    kind, locked: placed, rest: positions.filter((p) => !kind.has(p)), pairs: shuffle(pairs, r),
    peak: stats.peak, parks: stats.parks, forced: stats.forced, groups: stats.groups,
  };
}

export interface RackLine { win: boolean; peak: number; forced: number; parks: number }

/**
 * Kinds the deal buried. Regular leftovers come in fours, spread over the board.
 * A knot kind is two copies in two columns, or four copies stacked 3+1 (the full-copy cross).
 */
export function inferLocks(tiles: Tile[]): Set<string> {
  const by = new Map<string, Tile[]>();
  for (const t of tiles) if (!t.removed) (by.get(t.kind) ?? by.set(t.kind, []).get(t.kind)!).push(t);
  const lock = new Set<string>();
  for (const [kind, ts] of by) {
    const cols = new Map<string, number>();
    for (const t of ts) { const k = `${t.x},${t.y}`; cols.set(k, (cols.get(k) ?? 0) + 1); }
    const counts = [...cols.values()];
    const two = ts.length === 2 && cols.size === 2;
    const full = ts.length === 4 && cols.size === 2 && counts.includes(3);
    if (!two && !full) continue;
    const board = tiles.filter((t) => !t.removed);
    if (ts.filter((t) => isFree(t, board)).length >= 2) continue;
    lock.add(kind);
  }
  return lock;
}

function cover(t: Tile, live: Tile[]): number {
  let n = 0;
  for (const o of live) if (o !== t && o.x === t.x && o.y === t.y && o.z > t.z) n++;
  return n;
}

/** Free tiles whose mate is still buried, shallowest mate first. */
export function parkOrder(tiles: Tile[], rack: readonly number[], only?: ReadonlySet<string>): Tile[] {
  const held = new Set(rack);
  const live = tiles.filter((t) => !t.removed && !held.has(t.id));
  const free = freeTiles(live).filter((t) => !only || only.has(t.kind));
  const depth = (t: Tile) => {
    let best = 99;
    for (const o of live) if (o !== t && matches(o.kind, t.kind)) best = Math.min(best, cover(o, live));
    return best;
  };
  return free.slice().sort((a, b) => depth(a) - depth(b) || a.z - b.z || a.id - b.id);
}

/**
 * Careful rack line. Buried knots are cleared first — park the tile whose mate is shallowest,
 * finishing one knot before the next. Whatever is left then has a classic solution.
 * Peak counts the slot the incoming tile needs. Pass `lock` to use the kinds the deal buried.
 */
/** Clear only the buried kinds. Mutates `live`. The rack is empty again when it wins. */
export function clearKnot(live: Tile[], slots: number, locked: ReadonlySet<string>, trace?: number[]): RackLine {
  if (!locked.size) return { win: true, peak: 0, forced: 0, parks: 0 };
  const rack: number[] = [];
  let peak = 0, forced = 0, parks = 0;
  const board = () => live.filter((t) => !t.removed && !rack.includes(t.id));
  for (let step = 0; step < live.length * 4; step++) {
    if (live.every((t) => t.removed || !locked.has(t.kind))) break;
    const free = freeTiles(board()).filter((t) => locked.has(t.kind));
    const mateId = (kind: string) => rack.find((id) => matches(live[id].kind, kind));
    const hits = free.filter((t) => mateId(t.kind) !== undefined);
    if (hits.length) {
      if (rack.length >= slots) return { win: false, peak, forced, parks };
      const hit = hits[0];
      const id = mateId(hit.kind)!;
      peak = Math.max(peak, rack.length + 1);
      hit.removed = true; live[id].removed = true;
      rack.splice(rack.indexOf(id), 1);
      trace?.push(hit.id);
      continue;
    }
    let pair: [Tile, Tile] | null = null;
    for (let i = 0; i < free.length && !pair; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) { pair = [free[i], free[j]]; break; }
    if (pair) {
      if (rack.length + 2 > slots) return { win: false, peak, forced, parks };
        parks++;
        peak = Math.max(peak, rack.length + 2);
        pair[0].removed = pair[1].removed = true;
        trace?.push(pair[0].id, pair[1].id);
        continue;
    }
    if (rack.length >= slots - 1) return { win: false, peak, forced, parks };
    const pick = parkOrder(live, rack, locked)[0];
    if (!pick) return { win: false, peak, forced, parks };
      parks++;
      if (!free.some((o) => o !== pick && matches(o.kind, pick.kind))) forced++;
      rack.push(pick.id);
      peak = Math.max(peak, rack.length);
      trace?.push(pick.id);
  }
  const win = rack.length === 0 && live.every((t) => t.removed || !locked.has(t.kind));
  return { win, peak, forced, parks };
}

/**
 * Careful rack line. Buried knots are cleared first — park the tile whose mate is shallowest,
 * finishing one knot before the next. Whatever is left then has a classic solution.
 * Peak counts the slot the incoming tile needs. Pass `lock` to use the kinds the deal buried.
 */
export function carefulPlay(tiles: Tile[], slots: number, lock?: ReadonlySet<string>): RackLine {
  if (slots < 2) return { win: false, peak: 0, forced: 0, parks: 0 };
  const live = tiles.map((t) => ({ ...t }));
  const locked = lock ?? inferLocks(live);
  const knot = locked.size ? clearKnot(live, slots, locked) : { win: true, peak: 0, forced: 0, parks: 0 };
  if (!knot.win) return knot;
  if (live.every((t) => t.removed)) return knot;
  const rest = solve(live);
  if (!rest) return { win: false, peak: knot.peak, forced: knot.forced, parks: knot.parks };
  for (const [a, b] of rest) { live[a].removed = live[b].removed = true; }
  const peak = Math.max(knot.peak, rest.length ? 2 : 0);
  return { win: live.every((t) => t.removed), peak, forced: knot.forced, parks: knot.parks };
}

/** No lookahead: uncover a mate directly below, else start a free pair, else the highest tile. */
export function greedyRack(tiles: Tile[], slots: number): RackLine {
  if (slots < 2) return { win: false, peak: 0, forced: 0, parks: 0 };
  const live = tiles.map((t) => ({ ...t }));
  const rack: number[] = [];
  let peak = 0, forced = 0, parks = 0;
  for (let step = 0; step < live.length * 4; step++) {
    if (live.every((t) => t.removed)) return { win: true, peak, forced, parks };
    const held = new Set(rack);
    const on = live.filter((t) => !t.removed && !held.has(t.id));
    const free = freeTiles(on);
    const mateId = (kind: string) => rack.find((id) => matches(live[id].kind, kind));
    const hits = free.filter((t) => mateId(t.kind) !== undefined);
    if (hits.length) {
      if (rack.length >= slots) return { win: false, peak, forced, parks };
      const hit = hits[0];
      const id = mateId(hit.kind)!;
      peak = Math.max(peak, rack.length + 1);
      hit.removed = true; live[id].removed = true;
      rack.splice(rack.indexOf(id), 1);
      continue;
    }
    if (!free.length || rack.length >= slots - 1) return { win: false, peak, forced, parks };
    const uncover = free.filter((t) => on.some((o) => o.x === t.x && o.y === t.y && o.z === t.z - 1 && matches(o.kind, t.kind)));
    const pair = free.find((t) => free.some((o) => o !== t && matches(o.kind, t.kind)));
    const pick = uncover.length ? uncover.slice().sort((a, b) => b.z - a.z || a.id - b.id)[0] : pair ?? free.slice().sort((a, b) => b.z - a.z || a.id - b.id)[0];
    const mateFree = free.some((o) => o !== pick && matches(o.kind, pick.kind));
    parks++; if (!mateFree) forced++;
    rack.push(pick.id);
    peak = Math.max(peak, rack.length);
  }
  return { win: false, peak, forced, parks };
}
