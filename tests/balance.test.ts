// Campaign balance, measured by the smart bot (careful player, no pair highlight, uses the level's shuffles).
import { describe, it, expect } from 'vitest';
import { LEVELS, SECRETS, LAYOUTS, hintBudget } from '../src/levels';
import { smartRate } from '../src/sim';
import { LEVEL_LEGEND } from '../src/meta';

describe('difficulty curve (audit 2026-10-30)', () => {
  const rate = LEVELS.map((l) => smartRate(LAYOUTS[l.layout].make(), l.seed, 120, { legend: LEVEL_LEGEND, shuffles: l.shuffles }));
  it('no level is a wall: the bot clears every level at least 75% of the time (shuffles are random: no rescue)', () => { rate.forEach((r, n) => expect(r, `L${n + 1}`).toBeGreaterThanOrEqual(0.75)); });
  it('the curve goes down world by world', () => { const w = [0, 1, 2, 3, 4].map((k) => rate.slice(k * 6, k * 6 + 6).reduce((a, b) => a + b) / 6); for (let k = 1; k < 5; k++) expect(w[k]).toBeLessThanOrEqual(w[k - 1] + 0.02); expect(w[0]).toBeGreaterThanOrEqual(0.93); });
  it('no spike: a level is never more than 12 points harder than its easier neighbour', () => {
    for (let n = 1; n < rate.length - 1; n++) expect(rate[n], `L${n + 1}`).toBeGreaterThanOrEqual(Math.min(rate[n - 1], rate[n + 1]) - 0.12);
  });
  it('former spikes L13 and L26 are now in line with their worlds', () => { expect(rate[12]).toBeGreaterThanOrEqual(0.85); expect(rate[25]).toBeGreaterThanOrEqual(0.8); });
  it('secret levels: a fair bonus, about as hard as their world\'s last level (never a wall)', () => {
    for (const l of SECRETS) { const r = smartRate(LAYOUTS[l.layout].make(), l.seed, 120, { legend: LEVEL_LEGEND, shuffles: l.shuffles }); expect(r, l.name).toBeGreaterThanOrEqual(0.75); expect(r, l.name).toBeGreaterThanOrEqual(rate[l.world * 6 + 5] - 0.1); }
  });
  it('2 hints on the big boards of worlds 4–5', () => { expect([0, 1, 2, 3, 4].map(hintBudget)).toEqual([4, 3, 2, 2, 2]); for (const l of LEVELS.filter((x) => x.world >= 3)) expect(l.hints).toBe(2); });
}, 120_000);
