import { describe, it, expect } from 'vitest';
import { turtle } from '../src/layout';
import { isFree, deal, matches, findHint, reshuffle, solve, type Tile } from '../src/engine';

const P = (x: number, y: number, z = 0) => ({ x, y, z });
describe('layout', () => {
  it('turtle has 144 unique positions', () => {
    const t = turtle(); expect(t.length).toBe(144);
    expect(new Set(t.map((p) => `${p.x},${p.y},${p.z}`)).size).toBe(144);
  });
});
describe('free-tile logic', () => {
  it('lone tile is free', () => { const a = P(0, 0); expect(isFree(a, [a])).toBe(true); });
  it('blocked both sides is not free, one side is', () => {
    const a = P(0, 0), b = P(2, 0), c = P(4, 0);
    expect(isFree(b, [a, b, c])).toBe(false); expect(isFree(a, [a, b, c])).toBe(true); expect(isFree(c, [a, b, c])).toBe(true);
  });
  it('half-offset neighbours block', () => { const a = P(0, 0), b = P(2, 1), c = P(-2, -1); expect(isFree(a, [a, b, c])).toBe(false); });
  it('tile on top blocks, even half offset', () => { const a = P(0, 0), top = P(1, 1, 1); expect(isFree(a, [a, top])).toBe(false); });
  it('non-overlapping upper tile does not block', () => { const a = P(0, 0), top = P(2, 0, 1); expect(isFree(a, [a, top])).toBe(true); });
  it('turtle start: summit + ends free, covered not', () => {
    const t = turtle(); const f = t.filter((p) => isFree(p, t));
    expect(f).toContainEqual(P(13, 7, 4)); expect(f).toContainEqual(P(28, 7)); expect(f).toContainEqual(P(0, 7));
    expect(f).not.toContainEqual(P(12, 6, 3));
  });
});
describe('deal generator', () => {
  it('500 seeds: deck correct and embedded solution replays legally', () => {
    const pos = turtle();
    for (let s = 1; s <= 500; s++) {
      const { tiles, solution } = deal(pos, s);
      expect(solution.length).toBe(72);
      for (const [a, b] of solution) {
        const live = tiles.filter((t) => !t.removed);
        expect(isFree(tiles[a], live) && isFree(tiles[b], live)).toBe(true);
        expect(matches(tiles[a].kind, tiles[b].kind)).toBe(true);
        tiles[a].removed = tiles[b].removed = true;
      }
    }
  });
  it('deterministic per seed, different across seeds', () => {
    const k = (s: number) => deal(turtle(), s).tiles.map((t) => t.kind).join();
    expect(k(7)).toBe(k(7)); expect(k(7)).not.toBe(k(8));
  });
  it('a hint always exists at start', () => { for (let s = 1; s < 50; s++) expect(findHint(deal(turtle(), s).tiles)).not.toBeNull(); });
  it('reshuffle mid-game keeps the same faces and always leaves a free pair', () => {
    for (let s = 1; s <= 50; s++) {
      const { tiles, solution } = deal(turtle(), s);
      for (const [a, b] of solution.slice(0, 30)) tiles[a].removed = tiles[b].removed = true;
      const before = tiles.filter((t) => !t.removed).map((t) => t.kind).sort().join();
      reshuffle(tiles, s * 13);
      expect(tiles.filter((t) => !t.removed).map((t) => t.kind).sort().join()).toBe(before);
      expect(findHint(tiles)).not.toBeNull();
    }
  });
});
describe('solver', () => {
  const mk = (ps: { x: number; y: number; z: number }[], ks: string[]): Tile[] => ps.map((p, i) => ({ ...p, id: i, kind: ks[i], removed: false }));
  it('solves a simple row', () => { expect(solve(mk([P(0, 0), P(2, 0), P(4, 0), P(6, 0)], ['canard', 'couronne', 'couronne', 'canard']))).not.toBeNull(); });
  it('detects an unsolvable stack', () => { expect(solve(mk([P(0, 0), P(0, 0, 1), P(0, 0, 2), P(0, 0, 3)], ['canard', 'couronne', 'canard', 'couronne']))).toBeNull(); });
  it('bonus tiles match within group', () => { expect(matches('printemps', 'hiver')).toBe(true); expect(matches('lotus', 'hiver')).toBe(false); });
  it('solves a full generated turtle', () => { const { tiles } = deal(turtle(), 42); expect(solve(tiles)?.length).toBe(72); });
});
