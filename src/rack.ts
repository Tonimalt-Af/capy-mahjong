// Top-rack rules (design doc §4). Pure: the UI applies the returned action and owns score, combo and budgets.
// A tile in the rack is not removed — it keeps its cell for undo — and it no longer blocks the board.
import { assignSolvable, clearable, freeTiles, isFree, matches, rng, type Tile } from './engine';
import { parkOrder } from './knots';
import { KIND_BY_ID } from './tiles';

export interface RackAction {
  type: 'take' | 'match';
  rackBefore: number[];
  rackAfter: number[];
  /** Tiles whose `removed` flipped to true. Empty for a take. */
  removed: number[];
  /** Points this action added. The UI fills it in for a match (base + combo + capydindon). */
  gain: number;
}

export type RackTap =
  | { ok: false; reason: 'missing' | 'held' | 'blocked' | 'full' }
  | { ok: true; action: RackAction };

export const boardTiles = (tiles: Tile[], rack: readonly number[]) => {
  const held = new Set(rack);
  return tiles.filter((t) => !t.removed && !held.has(t.id));
};

const mateInRack = (tiles: Tile[], rack: readonly number[], kind: string) => rack.find((id) => matches(tiles[id].kind, kind));

/** One tap on a free board tile: take it, match it against the rack, or refuse it. */
export function applyRackTap(tiles: Tile[], rack: readonly number[], slots: number, id: number): RackTap {
  const tile = tiles[id];
  if (!tile || tile.removed) return { ok: false, reason: 'missing' };
  if (rack.includes(id)) return { ok: false, reason: 'held' };
  const board = boardTiles(tiles, rack);
  if (!isFree(tile, board)) return { ok: false, reason: 'blocked' };
  const rackBefore = rack.slice();
  const mate = mateInRack(tiles, rack, tile.kind);
  // The mate keeps its slot. The incoming tile needs a free one to land in before the pair clears.
  if (mate !== undefined) {
    if (rack.length >= slots) return { ok: false, reason: 'full' };
    const other = tiles[mate];
    tile.removed = true; other.removed = true;
    return { ok: true, action: { type: 'match', rackBefore, rackAfter: rack.filter((i) => i !== mate), removed: [mate, tile.id], gain: 0 } };
  }
  if (rack.length >= slots) return { ok: false, reason: 'full' };
  return { ok: true, action: { type: 'take', rackBefore, rackAfter: [...rack, id], removed: [], gain: 0 } };
}

/** Pop the last tap. Restores `removed`. Caller puts the rack back to `rackBefore` and subtracts `gain`. */
export function undoRack(tiles: Tile[], actions: RackAction[]): RackAction | null {
  const a = actions.pop();
  if (!a) return null;
  for (const id of a.removed) tiles[id].removed = false;
  return a;
}

export const rackWon = (tiles: Tile[]) => tiles.every((t) => t.removed);

/** A legal tap exists only while the rack has a free slot and some board tile is free. A pair needs that slot too. */
export function hasRackMove(tiles: Tile[], rack: readonly number[], slots: number): boolean {
  return rack.length < slots && freeTiles(boardTiles(tiles, rack)).length > 0;
}

/** Arrival order, then the same tiles with the incoming one sitting just after its mate. */
export function fusionOrder(rack: readonly number[], incoming: number, mate: number): { landed: number[]; paired: number[] } {
  const landed = [...rack, incoming];
  const paired = landed.filter((id) => id !== incoming);
  const at = paired.indexOf(mate);
  paired.splice(Math.max(0, at) + 1, 0, incoming);
  return { landed, paired };
}

/** Hint target. Does not play the move.
 * A bare take is the free tile whose mate is buried shallowest — often under another column,
 * so the hint is "park this one", never "store something at random". */
export function rackHint(tiles: Tile[], rack: readonly number[], slots: number):
  | { kind: 'match'; boardId: number; rackId: number }
  | { kind: 'pair'; ids: [number, number] }
  | { kind: 'take'; id: number }
  | null {
  const board = boardTiles(tiles, rack);
  const free = freeTiles(board);
  if (rack.length < slots) {
    for (const t of free) {
      const mate = mateInRack(tiles, rack, t.kind);
      if (mate !== undefined) return { kind: 'match', boardId: t.id, rackId: mate };
    }
  }
  // One free slot can land a mate, not start a new pair: the second tile would have nowhere to sit.
  if (rack.length >= slots - 1) return null;
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) return { kind: 'pair', ids: [free[i].id, free[j].id] };
  const planned = parkOrder(tiles, rack)[0];
  return planned ? { kind: 'take', id: planned.id } : null;
}

function pairsOf(live: Tile[]): [string, string][] | null {
  const byGroup = new Map<string, string[]>();
  for (const t of live) { const g = KIND_BY_ID.get(t.kind)!.group; (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push(t.kind); }
  const pairs: [string, string][] = [];
  for (const ks of byGroup.values()) for (let i = 0; i + 1 < ks.length; i += 2) pairs.push([ks[i], ks[i + 1]]);
  return pairs.length * 2 === live.length ? pairs : null;
}

/**
 * Put every remaining tile back in play — rack tiles included — and deal those faces
 * into an arrangement that can be cleared. Not spent, and not mutated, when no such
 * arrangement exists. The caller empties the rack.
 */
export function reshuffleRack(tiles: Tile[], _rack: readonly number[], _slots: number, seed: number): 'pair' | 'dead' {
  const live = tiles.filter((t) => !t.removed);
  if (live.length < 2) return 'dead';
  const r = rng(seed);
  if (clearable(live, r) === false) return 'dead';
  const pairs = pairsOf(live);
  if (!pairs) return 'dead';
  let next: (string | undefined)[];
  try { const dealt = assignSolvable(live, pairs, r, 80); next = live.map((t) => dealt.kind.get(t)); } catch { return 'dead'; }
  if (next.some((k) => !k)) return 'dead';
  live.forEach((t, i) => { t.kind = next[i]!; });
  return 'pair';
}

/** True when the tiles still in play (rack included, they return on a shuffle) can never be cleared. */
export function rackBoardDead(tiles: Tile[], _rack: readonly number[]): boolean {
  const live = tiles.filter((t) => !t.removed);
  return live.length > 0 && clearable(live) === false;
}

/** Would a shuffle be able to reopen a clearable board, without touching faces? */
export function rackShufflePossible(tiles: Tile[], _rack: readonly number[], _slots: number): boolean {
  const live = tiles.filter((t) => !t.removed);
  return live.length >= 2 && clearable(live) !== false;
}

export const slotLabel = (index: number, slots: number, kind: string | null) =>
  kind ? `Emplacement ${index + 1} sur ${slots} : ${KIND_BY_ID.get(kind)?.name ?? kind}, en attente` : `Emplacement ${index + 1} sur ${slots} : vide`;
