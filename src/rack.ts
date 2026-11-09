// Top-rack rules (design doc §4). Pure: the UI applies the returned action and owns score, combo and budgets.
// A tile in the rack is not removed — it keeps its cell for undo — and it no longer blocks the board.
import { clearable, freeTiles, isFree, matches, reshuffle, rng, type Tile } from './engine';
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
  if (mate !== undefined) {
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

/** A legal tap exists: a free board tile matches the rack, or the rack has room and some board tile is free. */
export function hasRackMove(tiles: Tile[], rack: readonly number[], slots: number): boolean {
  const free = freeTiles(boardTiles(tiles, rack));
  if (free.some((t) => mateInRack(tiles, rack, t.kind) !== undefined)) return true;
  return rack.length < slots && free.length > 0;
}

/** Hint target. Does not play the move. Null when nothing legal is worth pointing at (a bare take is not hinted). */
export function rackHint(tiles: Tile[], rack: readonly number[], slots: number):
  | { kind: 'match'; boardId: number; rackId: number }
  | { kind: 'pair'; ids: [number, number] }
  | null {
  const free = freeTiles(boardTiles(tiles, rack));
  for (const t of free) {
    const mate = mateInRack(tiles, rack, t.kind);
    if (mate !== undefined) return { kind: 'match', boardId: t.id, rackId: mate };
  }
  if (rack.length >= slots) return null;
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (matches(free[i].kind, free[j].kind)) return { kind: 'pair', ids: [free[i].id, free[j].id] };
  return null;
}

const shuffleArr = <T>(a: T[], r: () => number) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/**
 * Board geometry that can never be cleared, counting tiles already in the rack as partners.
 * An odd board is normal: its mates may be waiting in the rack. `clearable` would call that dead.
 */
function rackGeometryDead(board: Tile[], rackCount: number): boolean {
  if ((board.length + rackCount) % 2) return true;
  if (!board.length) return rackCount > 0;
  const col = new Map<string, number[]>();
  for (const p of board) { const k = `${p.x},${p.y}`; (col.get(k) ?? col.set(k, []).get(k)!).push(p.z); }
  for (const zs of col.values()) {
    const h = zs.length;
    if (h > board.length - h + rackCount && Math.max(...zs) - Math.min(...zs) === h - 1) return true;
  }
  return freeTiles(board).length < 1;
}

/**
 * Reshuffle faces that are still on the board. Rack faces, order and membership stay.
 * Not spent (and not mutated) when it cannot create a legal move.
 * With a non-empty rack and a compatible face somewhere on the board, a free tile ends up wearing that face.
 */
export function reshuffleRack(tiles: Tile[], rack: readonly number[], slots: number, seed: number): 'pair' | 'dead' {
  if (rack.length === 0) return reshuffle(tiles, seed);
  const board = boardTiles(tiles, rack);
  const r = rng(seed);
  if (rackGeometryDead(board, rack.length)) return 'dead';
  const free = freeTiles(board);
  if (free.length < 1) return 'dead';
  const matchesHeld = (kind: string) => rack.some((id) => matches(tiles[id].kind, kind));
  const kinds = board.map((t) => t.kind);
  const compatible = kinds.some(matchesHeld);
  if (rack.length >= slots && !compatible) return 'dead';
  const before = kinds.slice();
  const next = shuffleArr(kinds.slice(), r);
  board.forEach((t, i) => { t.kind = next[i]; });
  if (compatible) {
    const freeNow = freeTiles(board);
    if (!freeNow.some((t) => matchesHeld(t.kind))) {
      const donor = board.find((t) => matchesHeld(t.kind) && !freeNow.includes(t));
      const dest = freeNow[0];
      if (!donor || !dest) { board.forEach((t, i) => { t.kind = before[i]; }); return 'dead'; }
      const k = donor.kind; donor.kind = dest.kind; dest.kind = k;
    }
  }
  return 'pair';
}

/** True when no arrangement of the remaining faces can clear the board, rack tiles counted as partners. */
export function rackBoardDead(tiles: Tile[], rack: readonly number[]): boolean {
  const board = boardTiles(tiles, rack);
  if (rack.length === 0) return clearable(board) === false;
  return rackGeometryDead(board, rack.length);
}

/** Would a shuffle be able to open a move, without touching faces? Used to show or hide the button. */
export function rackShufflePossible(tiles: Tile[], rack: readonly number[], slots: number): boolean {
  const board = boardTiles(tiles, rack);
  if (rack.length === 0) return clearable(board) !== false && freeTiles(board).length >= 2;
  if (rackGeometryDead(board, rack.length)) return false;
  if (rack.length >= slots && !board.some((t) => mateInRack(tiles, rack, t.kind) !== undefined)) return false;
  return freeTiles(board).length > 0;
}

export const slotLabel = (index: number, slots: number, kind: string | null) =>
  kind ? `Emplacement ${index + 1} sur ${slots} : ${KIND_BY_ID.get(kind)?.name ?? kind}, en attente` : `Emplacement ${index + 1} sur ${slots} : vide`;
