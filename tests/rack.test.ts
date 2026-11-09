import { describe, expect, it } from 'vitest';
import { deal, isFree, type Tile } from '../src/engine';
import { LAYOUTS, LEVELS, SECRETS, rackSlots } from '../src/levels';
import { dailyLevel, endlessLevel, zenLevel } from '../src/meta';
import { applyRackTap, hasRackMove, rackHint, rackShufflePossible, rackWon, reshuffleRack, undoRack, type RackAction } from '../src/rack';
import { runMatchesRules, sanitize, type Run } from '../src/storage';

const P = (x: number, y: number, z = 0) => ({ x, y, z });
const tiles = (rows: { x: number; y: number; z?: number; kind: string }[]): Tile[] =>
  rows.map((p, id) => ({ x: p.x, y: p.y, z: p.z ?? 0, id, kind: p.kind, removed: false }));

describe('rack placement and match', () => {
  it('a free tile leaves the board and stops blocking the one under it', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 0, y: 0, z: 1, kind: 'couronne' }, { x: 6, y: 0, kind: 'lotus' }]);
    expect(isFree(t[0], t)).toBe(false);
    const take = applyRackTap(t, [], 6, 1);
    expect(take.ok).toBe(true);
    if (!take.ok) return;
    expect(take.action.type).toBe('take');
    expect(take.action.rackAfter).toEqual([1]);
    expect(t[1].removed).toBe(false);
    expect(isFree(t[0], t.filter((x) => !take.action.rackAfter.includes(x.id)))).toBe(true);
  });

  it('the second tile of a group clears both, even when the rack is full, as one action', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 4, y: 0, kind: 'couronne' }, { x: 8, y: 0, kind: 'canard' }]);
    const rack = [0];
    const match = applyRackTap(t, rack, 1, 2);
    expect(match.ok).toBe(true);
    if (!match.ok || match.action.type !== 'match') throw new Error('expected a match');
    expect(t[0].removed && t[2].removed).toBe(true);
    expect(match.action.rackAfter).toEqual([]);
    expect(match.action.removed).toEqual([0, 2]);
    expect(rackWon(t)).toBe(false); // couronne still out
  });

  it('seasons match each other inside the rack', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'printemps' }, { x: 4, y: 0, kind: 'hiver' }]);
    const first = applyRackTap(t, [], 6, 0);
    if (!first.ok) throw new Error('take');
    const second = applyRackTap(t, first.action.rackAfter, 6, 1);
    expect(second.ok && second.action.type).toBe('match');
    expect(rackWon(t)).toBe(true);
  });

  it('a full rack refuses a tile that matches nothing and does not change the board', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 4, y: 0, kind: 'couronne' }, { x: 8, y: 0, kind: 'lotus' }]);
    const before = t.map((x) => x.kind);
    const full = applyRackTap(t, [0, 1], 2, 2);
    expect(full).toEqual({ ok: false, reason: 'full' });
    expect(t.map((x) => x.kind)).toEqual(before);
    expect(t.every((x) => !x.removed)).toBe(true);
    expect(hasRackMove(t, [0, 1], 2)).toBe(false);
  });

  it('a blocked tile is refused', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 2, y: 0, kind: 'couronne' }, { x: 4, y: 0, kind: 'lotus' }]);
    expect(applyRackTap(t, [], 6, 1)).toEqual({ ok: false, reason: 'blocked' });
  });
});

describe('rack undo', () => {
  it('one undo restores a match to the rack and the board, and a second undo puts the first tile back', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 4, y: 0, kind: 'canard' }]);
    const actions: RackAction[] = [];
    const a = applyRackTap(t, [], 6, 0); if (!a.ok) throw new Error('take');
    a.action.gain = 0; actions.push(a.action);
    const b = applyRackTap(t, a.action.rackAfter, 6, 1); if (!b.ok) throw new Error('match');
    b.action.gain = 1250; actions.push(b.action);
    expect(rackWon(t)).toBe(true);
    const undone = undoRack(t, actions);
    expect(undone?.type).toBe('match');
    expect(undone?.rackBefore).toEqual([0]);
    expect(t[0].removed).toBe(false); expect(t[1].removed).toBe(false);
    expect(undone?.gain).toBe(1250);
    const back = undoRack(t, actions);
    expect(back?.type).toBe('take');
    expect(back?.rackBefore).toEqual([]);
    expect(back?.gain).toBe(0);
    expect(actions).toHaveLength(0);
  });
});

describe('rack shuffle, hint, win and loss', () => {
  it('shuffle keeps rack faces and moves a buried mate onto a free tile', () => {
    const t = tiles([
      { x: 0, y: 0, kind: 'canard' },
      { x: 0, y: 0, z: 1, kind: 'couronne' },
      { x: 6, y: 0, kind: 'lotus' },
      { x: 10, y: 0, kind: 'canard' },
    ]);
    const rack = [3];
    const rackKinds = [t[3].kind];
    expect(reshuffleRack(t, rack, 6, 7)).toBe('pair');
    expect(t[3].kind).toBe(rackKinds[0]);
    const free = [t[1], t[2]].filter((x) => isFree(x, [t[0], t[1], t[2]]));
    expect(free.some((x) => x.kind === 'canard')).toBe(true);
    expect(rackHint(t, rack, 6)?.kind).toBe('match');
  });

  it('a full rack whose groups are absent from the board is dead and unchanged', () => {
    const t = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 4, y: 0, kind: 'canard' }, { x: 8, y: 0, kind: 'couronne' }]);
    const before = t.map((x) => x.kind);
    expect(reshuffleRack(t, [2], 1, 3)).toBe('dead');
    expect(t.map((x) => x.kind)).toEqual(before);
    expect(rackShufflePossible(t, [2], 1)).toBe(false);
  });

  it('an empty rack still forces a free pair', () => {
    const { tiles: dealt, solution } = deal(LAYOUTS.galet.make(), 4);
    const [a, b] = solution[0]; dealt[a].removed = dealt[b].removed = true;
    expect(reshuffleRack(dealt, [], 6, 11)).toBe('pair');
    expect(rackHint(dealt, [], 6)?.kind).toBe('pair');
  });

  it('clearing the last pair wins; three different free tiles fill a rack of 2 and lose', () => {
    const win = tiles([{ x: 0, y: 0, kind: 'lotus' }, { x: 4, y: 0, kind: 'tournesol' }]);
    const a = applyRackTap(win, [], 6, 0); if (!a.ok) throw new Error('take');
    const b = applyRackTap(win, a.action.rackAfter, 6, 1); if (!b.ok) throw new Error('match');
    expect(rackWon(win)).toBe(true);
    const lose = tiles([{ x: 0, y: 0, kind: 'canard' }, { x: 4, y: 0, kind: 'couronne' }, { x: 8, y: 0, kind: 'lotus' }]);
    const t1 = applyRackTap(lose, [], 2, 0); if (!t1.ok) throw new Error('t1');
    const t2 = applyRackTap(lose, t1.action.rackAfter, 2, 1); if (!t2.ok) throw new Error('t2');
    expect(hasRackMove(lose, t2.action.rackAfter, 2)).toBe(false);
    expect(rackWon(lose)).toBe(false);
  });
});

describe('level 8 leftovers under the rack', () => {
  const L8: [number, number][] = [[16, 46], [31, 62], [7, 17], [39, 51], [8, 23], [22, 63], [15, 40], [0, 24], [52, 58], [38, 53], [6, 37], [1, 25], [36, 59], [35, 57], [5, 45], [4, 44], [32, 34], [14, 43], [26, 54], [33, 42], [9, 55], [13, 47], [41, 60], [18, 48], [30, 49], [12, 56], [10, 11], [3, 29], [19, 28], [20, 27]];
  it('the old level-8 soft-lock stack clears once tiles can wait in the rack', () => {
    const { tiles: t } = deal(LAYOUTS.pyramide.make(), 70859, 0.2);
    for (const [a, b] of L8) { t[a].removed = t[b].removed = true; }
    expect(t.filter((x) => !x.removed)).toHaveLength(4);
    let rack: number[] = [];
    for (let i = 0; i < 8 && hasRackMove(t, rack, 6); i++) {
      const hint = rackHint(t, rack, 6);
      const onBoard = t.filter((x) => !x.removed && !rack.includes(x.id));
      const id = hint?.kind === 'match' ? hint.boardId : hint?.kind === 'pair' ? hint.ids[0] : onBoard.find((x) => isFree(x, onBoard))?.id;
      if (id === undefined) break;
      const res = applyRackTap(t, rack, 6, id);
      expect(res.ok, String(id)).toBe(true);
      if (!res.ok) return;
      rack = res.action.rackAfter;
    }
    expect(rackWon(t)).toBe(true);
  });
});

describe('which levels use the rack', () => {
  it('only world 2 (campaign and its secret) has 6 slots; everything else stays classic', () => {
    expect(rackSlots(0)).toBe(0); expect(rackSlots(1)).toBe(6); expect([2, 3, 4].map(rackSlots)).toEqual([0, 0, 0]);
    expect(LEVELS.filter((l) => l.world === 1).every((l) => l.rack === 6)).toBe(true);
    expect(LEVELS.filter((l) => l.world !== 1).every((l) => l.rack === 0)).toBe(true);
    expect(SECRETS.map((l) => l.rack)).toEqual([0, 6, 0, 0, 0]);
    expect(dailyLevel('2026-11-09').rack).toBe(0);
    for (const d of ['facile', 'moyen', 'difficile', 'expert'] as const) expect(zenLevel(3, d).rack).toBe(0);
    for (const r of [0, 2, 8, 14]) expect(endlessLevel(r, 5).rack).toBe(0);
  });

  it('a classic in-progress run on a world-2 level is rejected; stars are not part of that check', () => {
    const { tiles: dealt } = deal(LAYOUTS[LEVELS[6].layout].make(), LEVELS[6].seed);
    const classic: Run = { level: { ...LEVELS[6], mode: 'level', title: 'Niveau 7', legend: 0 }, kinds: dealt.map((t) => t.kind), removed: [], history: [], t: 3, hints: 0, shuffles: 0, undos: 0, score: 40, legends: 0, maxCombo: 0 };
    expect(runMatchesRules(classic)).toBe(false);
    const kept = sanitize({ stars: { 6: 3 }, carrots: 80, run: classic });
    expect(kept.stars[6]).toBe(3); expect(kept.carrots).toBe(80);
    expect(runMatchesRules(kept.run!)).toBe(false);
    const rackRun: Run = { ...classic, rules: 'rack', rackSlots: 6, rack: [], actions: [] };
    expect(runMatchesRules(rackRun)).toBe(true);
    const river: Run = { ...classic, level: { ...LEVELS[0], mode: 'level', title: 'Niveau 1', legend: 0 } };
    expect(runMatchesRules(river)).toBe(true);
  });
});
