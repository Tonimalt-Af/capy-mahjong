// Steering 2026-10-30: deals solvable at start everywhere, level variety + unique names, rarer capydindon.
import { describe, it, expect } from 'vitest';
import { LEVELS, LAYOUTS, LEVEL_NAMES, WORLDS } from '../src/levels';
import { deal, isFree, matches } from '../src/engine';
import { dailyLevel, endlessLevel, zenLevel, DIFFS, LEVEL_LEGEND, DAILY_LEGEND, dayKey, type PlayLevel } from '../src/meta';

/** Replays the deal's own solution: every step must be a free, matching pair, and the board ends empty. */
function solvableFromStart(l: Pick<PlayLevel, 'layout' | 'seed' | 'legend'>) {
  const pos = LAYOUTS[l.layout].make(); const { tiles, solution } = deal(pos, l.seed, l.legend);
  if (solution.length * 2 !== tiles.length) return false;
  for (const [a, b] of solution) { const live = tiles.filter((t) => !t.removed); if (!(isFree(tiles[a], live) && isFree(tiles[b], live) && matches(tiles[a].kind, tiles[b].kind))) return false; tiles[a].removed = tiles[b].removed = true; }
  return tiles.every((t) => t.removed);
}
const day = (i: number) => dayKey(new Date(2026, 0, 1 + Math.floor(i)));

describe('every deal is solvable from the start (getting stuck is the player\'s doing, never the deal\'s)', () => {
  it('all 30 campaign levels', () => { for (const l of LEVELS) expect(solvableFromStart({ ...l, legend: LEVEL_LEGEND }), `L${l.n + 1}`).toBe(true); });
  it('120 days of dailies (incl. catch-ups)', () => { for (let i = 0; i < 400; i += 3.3) { expect(solvableFromStart(dailyLevel(day(i))), day(i)).toBe(true); expect(solvableFromStart(dailyLevel(day(i), true))).toBe(true); } }, 120_000);
  it('endless rounds 0–24 over 12 runs', () => { for (let s = 1; s <= 12; s++) for (let r = 0; r < 25; r++) expect(solvableFromStart(endlessLevel(r, s * 9973)), `run ${s} round ${r}`).toBe(true); }, 120_000);
  it('zen boards of every difficulty', () => { for (const d of DIFFS) for (let s = 1; s <= 40; s++) expect(solvableFromStart(zenLevel(s * 131, d.id))).toBe(true); }, 120_000);
});

describe('level variety and names', () => {
  it('every level has its own name, shown per world', () => {
    const names = LEVELS.map((l) => l.name!); expect(new Set(names).size).toBe(30); expect(LEVEL_NAMES).toHaveLength(WORLDS.length);
    for (const n of names) { expect(n.length).toBeGreaterThan(4); expect(n.length).toBeLessThanOrEqual(28); expect(n).not.toMatch(/Niveau|\d/); }
  });
  it('no board twice in a row, no board more than twice in a world, at least 15 boards used', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].layout, `L${i + 1}`).not.toBe(LEVELS[i - 1].layout);
    for (let w = 0; w < 5; w++) { const ls = LEVELS.filter((l) => l.world === w).map((l) => l.layout); for (const x of ls) expect(ls.filter((y) => y === x).length).toBeLessThanOrEqual(1); }
    expect(new Set(LEVELS.map((l) => l.layout)).size).toBeGreaterThanOrEqual(15);
  });
  it('new shapes are even, fit a deck and deal', () => { for (const k of ['carotte', 'yuzu', 'nuage']) { const p = LAYOUTS[k].make(); expect(p.length % 2).toBe(0); expect(p.length).toBeLessThanOrEqual(144); expect(() => deal(p, 7)).not.toThrow(); } });
});

describe('rarer capydindon', () => {
  const has = (l: Pick<PlayLevel, 'layout' | 'seed' | 'legend'>) => deal(LAYOUTS[l.layout].make(), l.seed, l.legend).tiles.filter((t) => t.kind === 'capydindon').length;
  it('chances: levels 8%, endless/zen 10%, daily 35% (was 20 / 25 / 100%)', () => {
    expect(LEVEL_LEGEND).toBe(0.08); expect(DAILY_LEGEND).toBe(0.35); expect(endlessLevel(0, 1).legend).toBe(0.1); expect(zenLevel(1).legend).toBe(0.1);
  });
  it('a daily has one about 1 day in 3 — never more than one pair — so "5 capydindons" stays reachable in ~2 weeks', () => {
    let n = 0; for (let i = 0; i < 200; i++) { const c = has(dailyLevel(day(i))); expect([0, 2]).toContain(c); if (c) n++; }
    expect(n / 200).toBeGreaterThan(0.25); expect(n / 200).toBeLessThan(0.45);
  }, 120_000);
  it('campaign: a handful of levels hide one', () => { const n = LEVELS.filter((l) => has({ ...l, legend: LEVEL_LEGEND })).length; expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(5); });
});
