import { describe, expect, test } from 'vitest';
import { dailyLevel, endlessLevel, zenLevel, recordDaily, recordLate, missedDays, canReplay, REPLAY_DAYS, liveStreak, NEW_STATS, dayKey, frDate, OUTFITS, THEMES, BACKS, owns, buy, carrotReward, DIFFS, ACHIEVEMENTS, checkAchievements, hash } from '../src/meta';
import { LAYOUTS, LEVELS, undoBudget } from '../src/levels';
import { deal, solve, winRate, isFree, matches } from '../src/engine';

describe('daily challenge', () => {
  test('same date → same board, different dates vary', () => {
    expect(dailyLevel('2026-10-30')).toEqual(dailyLevel('2026-10-30'));
    const seeds = new Set(Array.from({ length: 30 }, (_, i) => dailyLevel(dayKey(new Date(2026, 0, 1 + i))).seed)); expect(seeds.size).toBe(30);
    const layouts = new Set(Array.from({ length: 30 }, (_, i) => dailyLevel(dayKey(new Date(2026, 0, 1 + i))).layout)); expect(layouts.size).toBeGreaterThan(3);
  });
  test('daily boards are solvable and not traps', () => {
    for (let i = 0; i < 6; i++) { const d = dailyLevel(dayKey(new Date(2026, 5, 1 + i))); const pos = LAYOUTS[d.layout].make(); const { tiles } = deal(pos, d.seed); expect(solve(tiles)).not.toBeNull(); expect(winRate(pos, d.seed, 12)).toBeGreaterThanOrEqual(0.25); }
  });
  test('French date label', () => { expect(frDate('2026-10-30')).toBe('30 octobre'); expect(frDate('2026-03-01')).toBe('1er mars'); expect(dailyLevel('2026-10-30').title).toBe('Défi du 30 octobre'); });
  test('streak counts consecutive days, once per day, and breaks', () => {
    const s = NEW_STATS();
    expect(recordDaily(s, '2026-10-28')).toBe(1); expect(recordDaily(s, '2026-10-29')).toBe(2); expect(recordDaily(s, '2026-10-29')).toBe(2);
    expect(recordDaily(s, '2026-10-31')).toBe(3 - 2); expect(s.bestStreak).toBe(2);
    expect(recordDaily(s, '2026-11-01')).toBe(2); expect(liveStreak(s, '2026-11-02')).toBe(2); expect(liveStreak(s, '2026-11-04')).toBe(0);
    expect(recordDaily(s, '2027-01-01')).toBe(1); // month/year rollover handled by Date
    const t = NEW_STATS(); recordDaily(t, '2026-12-31'); expect(recordDaily(t, '2027-01-01')).toBe(2);
  });
});
describe('endless & zen', () => {
  test('endless boards grow with rounds', () => {
    const sizes = Array.from({ length: 20 }, (_, r) => LAYOUTS[endlessLevel(r, 42).layout].make().length);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
    expect(sizes[0]).toBe(36); expect(sizes[19]).toBe(144); // tiers never overlap in size (phase 3: several boards per tier) expect(endlessLevel(3, 42).title).toBe('Infini · manche 4');
  });
  test('endless runs are deterministic per seed and solvable', () => {
    expect(endlessLevel(2, 7).seed).toBe(endlessLevel(2, 7).seed);
    for (let r = 0; r < 8; r++) { const l = endlessLevel(r, 99); expect(solve(deal(LAYOUTS[l.layout].make(), l.seed).tiles)).not.toBeNull(); }
  });
  test('zen has effectively unlimited help', () => { const z = zenLevel(5); expect(z.mode).toBe('zen'); expect(z.hints).toBeGreaterThan(50); expect(z.shuffles).toBeGreaterThan(50); });
});
describe('carrots shop', () => {
  test('outfits: unique ids, first free, prices rising, capydindon legendary only', () => {
    expect(new Set(OUTFITS.map((o) => o.id)).size).toBe(OUTFITS.length);
    expect(OUTFITS[0].price).toBe(0);
    const acc = OUTFITS.slice(0, 17); acc.forEach((o, i) => i && expect(o.price).toBeGreaterThan(acc[i - 1].price));
    expect(OUTFITS.find((o) => o.id === 'capydindon')!.legend).toBe(true);
    for (const it of [...OUTFITS, ...THEMES, ...BACKS]) expect(it.name.length).toBeGreaterThan(2);
  });
  test('buy spends carrots once, refuses when poor or legendary', () => {
    const w = { carrots: 100, owned: [] as string[] }; const fraise = OUTFITS.find((o) => o.id === 'fraise')!;
    expect(owns(w, 'o', 'agrume')).toBe(true); expect(owns(w, 't', 'capy')).toBe(true); expect(owns(w, 'b', 'monde')).toBe(true);
    expect(buy(w, 'o', fraise)).toBe(true); expect(w.carrots).toBe(80); expect(owns(w, 'o', 'fraise')).toBe(true);
    expect(buy(w, 'o', fraise)).toBe(false); expect(w.carrots).toBe(80);
    expect(buy(w, 't', THEMES.find((t) => t.id === 'chat')!)).toBe(false); expect(w.carrots).toBe(80);
    w.carrots = 9999; expect(buy(w, 'o', OUTFITS.find((o) => o.id === 'capydindon')!)).toBe(false);
    expect(owns(w, 'o', 'capydindon', 1)).toBe(true);
  });
  test('rewards: first clears pay more, daily and expert pay well, legend bonus', () => {
    expect(carrotReward({ mode: 'level', stars: 3, first: true })).toBe(25);
    expect(carrotReward({ mode: 'level', stars: 3, first: false })).toBeLessThan(25);
    expect(carrotReward({ mode: 'daily', streak: 1 })).toBe(53);
    expect(carrotReward({ mode: 'daily', streak: 30 })).toBe(83);
    expect(carrotReward({ mode: 'zen', diff: 'expert' })).toBeGreaterThan(carrotReward({ mode: 'zen', diff: 'facile' }));
    expect(carrotReward({ mode: 'endless', round: 3, legend: true, ach: 2 })).toBe(8 + 6 + 25 + 40);
  });
});
describe('difficulty', () => {
  test('4 tiers, zen picks from the tier pool and is deterministic', () => {
    expect(DIFFS.map((d) => d.id)).toEqual(['facile', 'moyen', 'difficile', 'expert']);
    for (const d of DIFFS) { const z = zenLevel(11, d.id); expect(d.pool).toContain(z.layout); expect(z.diff).toBe(d.id); expect(zenLevel(11, d.id).seed).toBe(z.seed); }
    const avg = (id: string) => { const d = DIFFS.find((x) => x.id === id)!; return d.pool.reduce((a, l) => a + LAYOUTS[l].make().length, 0) / d.pool.length; };
    expect(avg('facile')).toBeLessThan(avg('moyen')); expect(avg('moyen')).toBeLessThan(avg('difficile'));
  });
  test('easy zen boards are friendly', () => { for (let s = 1; s <= 4; s++) { const z = zenLevel(s, 'facile'); expect(winRate(LAYOUTS[z.layout].make(), z.seed, 20)).toBeGreaterThanOrEqual(0.6); } });
});
describe('legendary capydindon', () => {
  test('a daily with the golden pair has exactly one, and the deal stays solvable', () => {
    let seen = 0;
    for (let i = 0; seen < 3 && i < 60; i++) {
      const k = dayKey(new Date(2026, 9, 30 + i)); const d = dailyLevel(k); const { tiles, solution } = deal(LAYOUTS[d.layout].make(), d.seed, d.legend);
      const c = tiles.filter((t) => t.kind === 'capydindon').length; expect([0, 2]).toContain(c); if (!c) continue; seen++;
      for (const [a, b] of solution) { const live = tiles.filter((t) => !t.removed); expect(isFree(tiles[a], live) && isFree(tiles[b], live) && matches(tiles[a].kind, tiles[b].kind)).toBe(true); tiles[a].removed = tiles[b].removed = true; }
    }
    expect(seen).toBe(3);
  });
  test('legend achievements', () => { const c = { stats: { ...NEW_STATS(), legends: 1 }, stars: {}, totalStars: 0 }; expect(checkAchievements(c, [])).toContain('legend1'); });
});
describe('achievements', () => {
  const ctx = (o: Partial<ReturnType<typeof NEW_STATS>> = {}, stars: Record<number, number> = {}, last?: object) => ({ stats: { ...NEW_STATS(), ...o }, stars, totalStars: Object.values(stars).reduce((a, b) => a + b, 0), last: last as never });
  test('ids unique, French copy present', () => { expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length); ACHIEVEMENTS.forEach((a) => { expect(a.name.length).toBeGreaterThan(2); expect(a.desc).toMatch(/\.$/); }); });
  test('nothing unlocked on a fresh save', () => expect(checkAchievements(ctx(), [])).toEqual([]));
  test('first win, combo, world 1, streak', () => {
    expect(checkAchievements(ctx({ won: 1 }), [])).toEqual(['first']);
    expect(checkAchievements(ctx({ won: 1, bestCombo: 5 }), ['first'])).toEqual(['combo5']);
    const w1 = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [i, 1])); expect(checkAchievements(ctx({ won: 6 }, w1), ['first'])).toContain('world1');
    expect(checkAchievements(ctx({ bestStreak: 7, dailyDone: ['a'] }), [])).toEqual(expect.arrayContaining(['daily1', 'streak3', 'streak7']));
  });
  test('speed / no-help / turtle depend on the last game', () => {
    const last = { mode: 'level', seconds: 45, hints: 0, shuffles: 0, undos: 0, combo: 1, tiles: 144, perfect: false };
    expect(checkAchievements(ctx({ won: 1 }, {}, last), [])).toEqual(expect.arrayContaining(['speed', 'nohelp', 'turtle']));
    expect(checkAchievements(ctx({ won: 1 }, {}, { ...last, mode: 'zen', hints: 3, tiles: 36 }), ['first'])).toEqual([]);
  });
  test('already-owned achievements are never re-reported', () => expect(checkAchievements(ctx({ won: 3 }), ['first'])).toEqual([]));
});
test('hash is stable', () => expect(hash('capy')).toBe(hash('capy')));

describe('missed dailies (calendar replay)', () => {
  const T = '2026-10-30';
  test('missed days are the past REPLAY_DAYS days not won on the day nor replayed, newest first', () => {
    const s = { ...NEW_STATS(), dailyDone: ['2026-10-29', '2026-10-27'], dailyLate: ['2026-10-26'] };
    const m = missedDays(s, T); expect(m.length).toBe(REPLAY_DAYS - 3); expect(m[0]).toBe('2026-10-28'); expect(m).not.toContain(T);
    expect(m).not.toContain('2026-10-26'); expect(m.at(-1)).toBe('2026-10-23');
    expect(canReplay(s, '2026-10-28', T)).toBe(true); expect(canReplay(s, '2026-10-29', T)).toBe(false); expect(canReplay(s, '2026-10-31', T)).toBe(false); expect(canReplay(s, '2026-10-22', T)).toBe(false); expect(canReplay(s, '2026-09-29', T)).toBe(false);
  });
  test('a replayed day is the very same board, flagged late, and never touches the streak', () => {
    const late = dailyLevel('2026-10-28', true); const orig = dailyLevel('2026-10-28');
    expect([late.layout, late.seed, late.late]).toEqual([orig.layout, orig.seed, true]); expect(late.title).toContain('Rattrapage');
    const s = NEW_STATS(); recordDaily(s, '2026-10-29'); recordDaily(s, '2026-10-30'); expect(s.dailyStreak).toBe(2);
    recordLate(s, '2026-10-28'); expect(s.dailyLate).toEqual(['2026-10-28']); expect(s.dailyStreak).toBe(2); expect(s.dailyDone).not.toContain('2026-10-28');
    recordLate(s, '2026-10-28'); recordLate(s, '2026-10-30'); expect(s.dailyLate).toEqual(['2026-10-28']);
  });
  test('rewards: late daily pays 15 (no legend bonus), no streak bonus; a day already cleared pays 5', () => {
    expect(carrotReward({ mode: 'daily', late: true, streak: 7 })).toBe(15);
    expect(carrotReward({ mode: 'daily', late: true, legend: true })).toBe(15);
    expect(carrotReward({ mode: 'daily', streak: 1 })).toBe(53);
    expect(carrotReward({ mode: 'daily', again: true, streak: 7 })).toBe(5);
    expect(carrotReward({ mode: 'daily', late: true, again: true })).toBe(5);
  });
  test('Rattrapage achievement unlocks on the first replayed day', () => {
    const s = NEW_STATS(); expect(checkAchievements({ stats: s, stars: {}, totalStars: 0 }, [])).not.toContain('late1');
    recordLate(s, '2026-10-01'); expect(checkAchievements({ stats: s, stars: {}, totalStars: 0 }, [])).toContain('late1');
  });
});
describe('undo budget', () => {
  test('free in the first world and zen, 5 in worlds 2-3, 3 in worlds 4-5, 5 for daily and endless', () => {
    expect(LEVELS.slice(0, 6).every((l) => l.undos === -1)).toBe(true);
    expect(LEVELS.slice(6, 18).every((l) => l.undos === 5)).toBe(true);
    expect(LEVELS.slice(18).every((l) => l.undos === 3)).toBe(true);
    expect([undoBudget(0), undoBudget(1), undoBudget(2), undoBudget(3), undoBudget(4)]).toEqual([-1, 5, 5, 3, 3]);
    for (const d of DIFFS) expect(zenLevel(1, d.id).undos).toBe(-1);
    expect(dailyLevel('2026-10-30').undos).toBe(5); expect(dailyLevel('2026-10-01', true).undos).toBe(5);
    for (const r of [0, 3, 9]) expect(endlessLevel(r, 7).undos).toBe(5);
  });
});
