// Audit 2026-10-30 P1: carrot farming, catch-up dailies, shop length, seasonal rotation, shared zen boards.
import { describe, it, expect } from 'vitest';
import { carrotReward, missedDays, canReplay, firstDayOf, NEW_STATS, OUTFITS, THEMES, BACKS, EDGES, DECOR, SHELF_ITEMS, onSale, seasonal, buy, owns, zenLevel, zenShared, zenLink, DIFFS, REPLAY_DAYS, ACHIEVEMENTS } from '../src/meta';
import { parseDeep } from '../src/deeplink';
import { addDays } from '../src/dates';
import { deal } from '../src/engine';
import { LAYOUTS } from '../src/levels';

const T = '2026-10-30';
describe('catch-up dailies', () => {
  it('a brand-new player has nothing to catch up (no 30-day windfall)', () => { expect(missedDays(NEW_STATS(), T, T)).toEqual([]); expect(canReplay(NEW_STATS(), '2026-10-29', T, T)).toBe(false); });
  it('at most the last 7 days, and never before the first day of play', () => {
    expect(REPLAY_DAYS).toBe(7); expect(missedDays(NEW_STATS(), T, '2026-01-01')).toHaveLength(7);
    expect(missedDays(NEW_STATS(), T, '2026-10-27')).toEqual(['2026-10-29', '2026-10-28', '2026-10-27']);
    expect(canReplay(NEW_STATS(), '2026-10-26', T, '2026-10-27')).toBe(false); expect(canReplay(NEW_STATS(), '2001-01-01', T, '2000-01-01')).toBe(false);
  });
  it('first day of existing saves: earliest daily, else a week back if they played, else today', () => {
    expect(firstDayOf({ ...NEW_STATS(), dailyDone: ['2026-10-20', '2026-10-01'] }, T)).toBe('2026-10-01');
    expect(firstDayOf({ ...NEW_STATS(), played: 4 }, T)).toBe(addDays(T, -7)); expect(firstDayOf(NEW_STATS(), T)).toBe(T);
    expect(firstDayOf({ ...NEW_STATS(), played: 2, dailyDone: [addDays(T, -1)] }, T)).toBe(addDays(T, -7)); expect(firstDayOf({ ...NEW_STATS(), dailyDone: [addDays(T, -1)] }, T)).toBe(addDays(T, -1));
  });
  it('the audit exploit (3 forged past-day links = 235 carrots) is worth nothing now; a full week of catch-up is ≤ 105', () => {
    expect(canReplay(NEW_STATS(), '2001-01-01', T, T)).toBe(false);
    expect(7 * carrotReward({ mode: 'daily', late: true, legend: true })).toBeLessThanOrEqual(105);
  });
  it('the capydindon bonus is paid once per board, not on replays', () => {
    expect(carrotReward({ mode: 'level', first: false, stars: 1, legend: true })).toBe(carrotReward({ mode: 'level', first: false, stars: 1 }));
    expect(carrotReward({ mode: 'level', first: true, stars: 1, legend: true })).toBe(carrotReward({ mode: 'level', first: true, stars: 1 }) + 25);
    expect(carrotReward({ mode: 'daily', again: true, legend: true })).toBe(5);
  });
});
describe('shop length and seasonal rotation', () => {
  const permanent = (Object.keys(SHELF_ITEMS) as (keyof typeof SHELF_ITEMS)[]).flatMap((k) => SHELF_ITEMS[k]).filter((i) => !i.legend && !i.month).reduce((a, i) => a + i.price, 0);
  /** A regular player: today's daily every day, 2 levels a day (first clears, then replays), achievements over the month. */
  const regularDay = (d: number) => carrotReward({ mode: 'daily', streak: d + 1, legend: d % 3 === 0 }) + 2 * (d < 15 ? carrotReward({ mode: 'level', first: true, stars: 2 }) : carrotReward({ mode: 'level', stars: 2 })) + (d < 30 ? Math.round((ACHIEVEMENTS.length * 0.75 * 20) / 30) : 0);
  const daysToEmpty = (total: number) => { let c = 0, d = 0; while (c < total) c += regularDay(d++); return d; };
  it('the permanent shop lasts about a month for a regular player (was ~24 days)', () => {
    expect(permanent).toBeGreaterThan(4000); const d = daysToEmpty(permanent + 400); // + the 2 seasonal items on sale
    expect(d).toBeGreaterThanOrEqual(28); expect(d).toBeLessThanOrEqual(40);
  });
  it('new shelves: 6 tile backs (1 free) and 6 onsen decorations', () => { expect(EDGES).toHaveLength(6); expect(EDGES.filter((e) => !e.price)).toHaveLength(1); expect(DECOR).toHaveLength(6); });
  it('12 seasonal items, one per month; each month sells 2 (its own + last month’s), back every year', () => {
    const s = OUTFITS.filter((o) => o.month); expect(s.map((o) => o.month).sort((a, b) => a! - b!)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (let m = 1; m <= 12; m++) { const day = `2026-${String(m).padStart(2, '0')}-15`; const on = seasonal(day); expect(on).toHaveLength(2); expect(on[0].month).toBe(m); }
    const cit = s.find((o) => o.id === 'citrouille')!; expect(onSale(cit, '2026-10-30')).toBe(true); expect(onSale(cit, '2026-11-30')).toBe(true); expect(onSale(cit, '2026-12-01')).toBe(false); expect(onSale(cit, '2027-10-01')).toBe(true);
    expect(onSale(s.find((o) => o.id === 'noel')!, '2027-01-10')).toBe(true); // December item rolls into January
  });
  it('off-season items cannot be bought; owned ones stay owned', () => {
    const w = { carrots: 9999, owned: [] as string[] }; const noel = OUTFITS.find((o) => o.id === 'noel')!;
    expect(buy(w, 'o', noel, '2026-10-30')).toBe(false); expect(w.carrots).toBe(9999);
    expect(buy(w, 'o', noel, '2026-12-02')).toBe(true); expect(owns(w, 'o', 'noel')).toBe(true);
  });
  it('no streak-saver item exists (user decision)', () => { for (const i of Object.values(SHELF_ITEMS).flat()) expect(i.id + i.name).not.toMatch(/bouillotte|gel|freeze|série/i); });
  it('everything is sold for carrots only, never for real money', () => { for (const i of [...OUTFITS, ...THEMES, ...BACKS, ...EDGES, ...DECOR]) expect(Number.isInteger(i.price)).toBe(true); });
});
describe('zen share links are deterministic', () => {
  it('240 links (60 per difficulty): the receiver gets exactly the sender’s board', () => {
    let n = 0;
    for (const d of DIFFS) for (let k = 0; k < 60; k++) {
      const sent = zenLevel(1000 + k * 7777, d.id); const { deep } = parseDeep(zenLink(sent));
      expect(deep?.kind).toBe('zen'); if (deep?.kind !== 'zen') continue;
      const got = zenShared(deep.seed, deep.diff, deep.layout!);
      expect([got.layout, got.seed, got.diff]).toEqual([sent.layout, sent.seed, sent.diff]);
      if (k % 10 === 0) { const a = deal(LAYOUTS[sent.layout].make(), sent.seed, sent.legend).tiles.map((t) => t.kind); const b = deal(LAYOUTS[got.layout].make(), got.seed, got.legend).tiles.map((t) => t.kind); expect(b).toEqual(a); }
      n++;
    }
    expect(n).toBe(240);
  });
});
