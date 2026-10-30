import { describe, it, expect } from 'vitest';
import { LAYOUTS, LEVELS, WORLDS, stars, score } from '../src/levels';
import { deal, isFree, matches, winRate, fairSeed } from '../src/engine';

describe('layouts', () => {
  for (const l of Object.values(LAYOUTS)) it(`${l.id}: even, unique, supported`, () => {
    const p = l.make();
    expect(p.length % 2).toBe(0);
    expect(new Set(p.map((q) => `${q.x},${q.y},${q.z}`)).size).toBe(p.length);
    for (const q of p) if (q.z > 0) expect(p.some((o) => o.z === q.z - 1 && Math.abs(o.x - q.x) < 2 && Math.abs(o.y - q.y) < 2)).toBe(true);
    // no two tiles overlap on the same layer
    for (const a of p) for (const b of p) if (a !== b && a.z === b.z) expect(Math.abs(a.x - b.x) >= 2 || Math.abs(a.y - b.y) >= 2).toBe(true);
  });
  it('shaped boards: at least 6 original patterns, ≤144 tiles, fit a phone landscape stage', () => {
    const shapes = Object.values(LAYOUTS).filter((l) => l.shape); expect(shapes.length).toBeGreaterThanOrEqual(6);
    for (const l of Object.values(LAYOUTS)) {
      const p = l.make(); expect(p.length).toBeLessThanOrEqual(144);
      const cols = (Math.max(...p.map((q) => q.x)) + 2) / 2, rows = (Math.max(...p.map((q) => q.y)) + 2) / 2;
      // never larger than the classic turtle (15×8 tiles), which is verified on a 844×390 phone in e2e
      expect(cols, l.id).toBeLessThanOrEqual(15); expect(rows, l.id).toBeLessThanOrEqual(8);
    }
  });
  it('every shaped board is solvable and not a trap for random seeds', () => {
    for (const l of Object.values(LAYOUTS).filter((x) => x.shape)) for (const seed of [1, 2, 3]) {
      const { tiles, solution } = deal(l.make(), seed); expect(solution.length * 2).toBe(tiles.length);
      for (const [a, b] of solution) { const live = tiles.filter((t) => !t.removed); expect(isFree(tiles[a], live) && isFree(tiles[b], live) && matches(tiles[a].kind, tiles[b].kind)).toBe(true); tiles[a].removed = tiles[b].removed = true; }
      expect(winRate(l.make(), fairSeed(l.make(), seed, 0.3), 10)).toBeGreaterThan(0);
    }
  });
  it('tile counts grow across the campaign (difficulty curve)', () => {
    const avg = WORLDS.map((_, w) => LEVELS.filter((l) => l.world === w).reduce((s, l) => s + LAYOUTS[l.layout].make().length, 0));
    for (let i = 1; i < avg.length; i++) expect(avg[i]).toBeGreaterThan(avg[i - 1]);
  });
});
describe('levels', () => {
  it('30 levels in 5 worlds', () => { expect(LEVELS.length).toBe(30); expect(WORLDS.length).toBe(5); });
  it('every level deal is solvable via its built-in solution', () => {
    for (const lv of LEVELS) {
      const { tiles, solution } = deal(LAYOUTS[lv.layout].make(), lv.seed, 0.2);
      expect(solution.length * 2).toBe(tiles.length);
      for (const [a, b] of solution) { const live = tiles.filter((t) => !t.removed); expect(isFree(tiles[a], live) && isFree(tiles[b], live) && matches(tiles[a].kind, tiles[b].kind)).toBe(true); tiles[a].removed = tiles[b].removed = true; }
    }
  });
  it('small layouts still use a variety of tiles', () => { const { tiles } = deal(LAYOUTS.galet.make(), 5); expect(new Set(tiles.map((t) => t.kind)).size).toBeGreaterThan(10); });
  it('stars and score', () => {
    expect(stars(50, 100, 0)).toBe(3); expect(stars(150, 100, 0)).toBe(2); expect(stars(50, 100, 1)).toBe(2); expect(stars(500, 100, 3)).toBe(1);
    expect(score(18, 50, 100, 0, 0)).toBe(2300); expect(score(1, 999, 10, 9, 9)).toBe(0);
  });
});
