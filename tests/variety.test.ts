// Steering 2026-10-30: deals solvable at start everywhere, level variety + unique names, rarer capydindon.
// Phase 3: every level (30 + 5 secrets) has its own board, themed per world; bigger daily / zen / endless pools.
import { describe, it, expect } from 'vitest';
import { LEVELS, LAYOUTS, LEVEL_NAMES, WORLDS, SECRETS, ALL_LEVELS, SECRET_STARS, levelAt } from '../src/levels';
import { BOARDS } from '../src/boards';
import { defaults, sanitize, unlocked, worldStars, type Save } from '../src/storage';
import { deal, isFree, matches } from '../src/engine';
import { dailyLevel, endlessLevel, zenLevel, ENDLESS_TIERS, DIFFS, LEVEL_LEGEND, DAILY_LEGEND, dayKey, type PlayLevel } from '../src/meta';

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
  it('the 5 secret levels', () => { for (const l of SECRETS) expect(solvableFromStart({ ...l, legend: LEVEL_LEGEND }), l.name).toBe(true); });
  it('every board deals solvably for many seeds (zen links can pick any board)', () => { for (const k of Object.keys(LAYOUTS)) for (let s = 1; s <= 6; s++) expect(solvableFromStart({ layout: k, seed: s * 7919, legend: 0.5 }), `${k} ${s}`).toBe(true); }, 120_000);
  it('120 days of dailies after the pool change', () => { for (let i = 0; i < 400; i += 3.3) { const k = dayKey(new Date(2026, 9, 31 + Math.floor(i))); expect(solvableFromStart(dailyLevel(k)), k).toBe(true); } }, 120_000);
  it('120 days of dailies (incl. catch-ups)', () => { for (let i = 0; i < 400; i += 3.3) { expect(solvableFromStart(dailyLevel(day(i))), day(i)).toBe(true); expect(solvableFromStart(dailyLevel(day(i), true))).toBe(true); } }, 120_000);
  it('endless rounds 0–24 over 12 runs', () => { for (let s = 1; s <= 12; s++) for (let r = 0; r < 25; r++) expect(solvableFromStart(endlessLevel(r, s * 9973)), `run ${s} round ${r}`).toBe(true); }, 120_000);
  it('zen boards of every difficulty', () => { for (const d of DIFFS) for (let s = 1; s <= 40; s++) expect(solvableFromStart(zenLevel(s * 131, d.id))).toBe(true); }, 120_000);
});

describe('level variety and names', () => {
  it('every level has its own name, shown per world', () => {
    const names = ALL_LEVELS.map((l) => l.name!); expect(new Set(names).size).toBe(35); expect(LEVEL_NAMES).toHaveLength(WORLDS.length);
    for (const n of names) { expect(n.length).toBeGreaterThan(4); expect(n.length).toBeLessThanOrEqual(28); expect(n).not.toMatch(/Niveau|\d/); }
  });
  it('no board twice in a row, no board more than twice in a world, at least 15 boards used', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].layout, `L${i + 1}`).not.toBe(LEVELS[i - 1].layout);
    for (let w = 0; w < 5; w++) { const ls = LEVELS.filter((l) => l.world === w).map((l) => l.layout); for (const x of ls) expect(ls.filter((y) => y === x).length).toBeLessThanOrEqual(1); }
    expect(new Set(LEVELS.map((l) => l.layout)).size).toBe(30);
  });
  it('35 levels, 35 different boards: no board is shared between two worlds', () => {
    expect(ALL_LEVELS).toHaveLength(35); expect(new Set(ALL_LEVELS.map((l) => l.layout)).size).toBe(35);
    const worldOf = new Map<string, number>(); for (const l of ALL_LEVELS) { expect(worldOf.has(l.layout), l.layout).toBe(false); worldOf.set(l.layout, l.world); }
  });
  it('boards grow with the worlds (average size per world rises)', () => {
    const avg = WORLDS.map((_, w) => { const ls = LEVELS.filter((l) => l.world === w); return ls.reduce((a, l) => a + LAYOUTS[l.layout].make().length, 0) / ls.length; });
    for (let w = 1; w < avg.length; w++) expect(avg[w], `world ${w + 1}`).toBeGreaterThan(avg[w - 1]);
  });
  it('the 18 new themed boards are well formed: even, ≤144, no overlap, nothing floating', () => {
    expect(Object.keys(BOARDS)).toHaveLength(18);
    for (const [k, b] of Object.entries(BOARDS)) {
      const p = b.make(); expect(p.length % 2, k).toBe(0); expect(p.length, k).toBeLessThanOrEqual(144); expect(b.shape, k).toBe(true);
      const at = new Set(p.map((t) => `${t.x},${t.y},${t.z}`)); expect(at.size, `${k} duplicates`).toBe(p.length);
      for (const a of p) for (const c of p) if (a !== c && a.z === c.z) expect(Math.abs(a.x - c.x) < 2 && Math.abs(a.y - c.y) < 2, `${k} overlap`).toBe(false);
      for (const a of p) if (a.z > 0) expect(p.some((c) => c.z === a.z - 1 && Math.abs(c.x - a.x) < 2 && Math.abs(c.y - a.y) < 2), `${k} floating`).toBe(true);
    }
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

describe('secret levels (one per world, opened with stars)', () => {
  const save = (stars: Record<number, number>): Save => ({ ...defaults(), stars });
  it('one per world, numbered after the campaign, flagged secret', () => {
    expect(SECRETS).toHaveLength(WORLDS.length); SECRETS.forEach((l, w) => { expect(l.n).toBe(30 + w); expect(l.world).toBe(w); expect(l.secret).toBe(true); expect(levelAt(l.n)).toBe(l); });
  });
  it(`opens at ${SECRET_STARS} stars in its own world only`, () => {
    expect(unlocked(save({}), 30)).toBe(false);
    const s = save({ 0: 3, 1: 3, 2: 3, 3: 3, 4: 2 }); expect(worldStars(s, 0)).toBe(14); expect(unlocked(s, 30)).toBe(false);
    s.stars[5] = 1; expect(unlocked(s, 30)).toBe(true); expect(unlocked(s, 31)).toBe(false);
    const t = save({ 6: 3, 7: 3, 8: 3, 9: 3, 10: 3 }); expect(unlocked(t, 31)).toBe(true); expect(unlocked(t, 30)).toBe(false);
  });
  it('secret stars survive a save round-trip; out-of-range levels are still dropped', () => {
    const x = sanitize({ ...defaults(), stars: { 34: 3, 30: 1, 35: 3, 99: 2 } }); expect(x.stars).toEqual({ 34: 3, 30: 1 });
  });
  it('is never easier to reach than the world itself (needs most of the world cleared)', () => { expect(SECRET_STARS).toBeGreaterThan(12); expect(SECRET_STARS).toBeLessThanOrEqual(18); });
});

describe('bigger replay pools', () => {
  it('daily: 30 boards from 31 Oct 2026, old days keep their board', () => {
    const before = new Set(Array.from({ length: 120 }, (_, i) => dailyLevel(dayKey(new Date(2026, 5, 1 + i))).layout));
    const after = new Set(Array.from({ length: 365 }, (_, i) => dailyLevel(dayKey(new Date(2026, 9, 31 + i))).layout));
    expect(before.size).toBeLessThanOrEqual(12); expect(after.size).toBeGreaterThanOrEqual(26);
    expect(dailyLevel('2026-10-30').layout).toBe(dailyLevel('2026-10-30').layout);
  });
  it('zen: each difficulty offers 6+ boards, sorted by size', () => {
    const size = (k: string) => LAYOUTS[k].make().length;
    for (const d of DIFFS) { expect(d.pool.length, d.id).toBeGreaterThanOrEqual(6); for (const k of d.pool) expect(LAYOUTS[k], k).toBeDefined(); }
    const mx = (id: string) => Math.max(...DIFFS.find((d) => d.id === id)!.pool.map(size)); const mn = (id: string) => Math.min(...DIFFS.find((d) => d.id === id)!.pool.map(size));
    expect(mx('facile')).toBeLessThanOrEqual(mn('difficile')); expect(mx('moyen')).toBeLessThanOrEqual(mn('difficile'));
  });
  it('endless: tiers never overlap in size, and different runs see different boards', () => {
    const size = (k: string) => LAYOUTS[k].make().length;
    for (let i = 1; i < ENDLESS_TIERS.length; i++) expect(Math.min(...ENDLESS_TIERS[i].map(size)), `tier ${i}`).toBeGreaterThanOrEqual(Math.max(...ENDLESS_TIERS[i - 1].map(size)));
    const runs = new Set(Array.from({ length: 20 }, (_, s) => Array.from({ length: 18 }, (_, r) => endlessLevel(r, s * 101 + 3).layout).join()));
    expect(runs.size).toBeGreaterThan(10); expect(new Set(ENDLESS_TIERS.flat()).size).toBeGreaterThanOrEqual(30);
  });
});
