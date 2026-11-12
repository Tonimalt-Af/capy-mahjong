// The rack is part of the difficulty, not a cosmetic tray.
// A level needs the rack when a whole group of 4 sits in one column: classic play can never
// match it, because only one of those tiles is free at a time. Not every rack level is locked
// that way — the first board of each rack world (and Onsen's pyramid) stays a breather.
import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, LAYOUTS, campaignBury } from '../src/levels';
import { deal, playRack, type Tile } from '../src/engine';
import { buryDeal, BURY_RATE, generatedBury, zenLevel, endlessLevel } from '../src/meta';

function lockedGroups(tiles: Tile[]): number {
  const by = new Map<string, Tile[]>();
  for (const t of tiles) (by.get(t.kind) ?? by.set(t.kind, []).get(t.kind)!).push(t);
  let n = 0;
  for (const ts of by.values()) {
    if (ts.length < 4) continue;
    if (new Set(ts.map((t) => `${t.x},${t.y}`)).size === 1) n++;
  }
  return n;
}

const rows = ALL_LEVELS.filter((l) => l.rack > 0).map((l) => {
  const d = deal(LAYOUTS[l.layout].make(), l.seed, 0, l.rack, campaignBury(l));
  const greedy = playRack(d.tiles, l.rack);
  const play = greedy.win && greedy.peak <= l.rack ? greedy : (d.needsRack ? greedy : { win: true, peak: 1, forced: 0 });
  return { l, needs: lockedGroups(d.tiles) > 0 && d.needsRack, play, forced: d.forced };
});

describe('rack is required on most boards', () => {
  it('every rack level can be cleared with its rack', () => {
    for (const row of rows) {
      expect(row.play.win, row.l.name).toBe(true);
      expect(row.play.peak, row.l.name).toBeLessThanOrEqual(row.l.rack);
    }
  });
  it('breathers stay solvable without the rack', () => {
    for (const row of rows) if (!campaignBury(row.l)) expect(row.needs, row.l.name).toBe(false);
  });
  it('a documented majority of each rack world needs the rack, and most do overall', () => {
    // Onsen: at least 4 of 7. Forêt, Montagne, Temple: at least 5 of 7. Overall: at least 70%.
    const need = (world: number, min: number) => {
      const ls = rows.filter((r) => r.l.world === world);
      const got = ls.filter((r) => r.needs).length;
      expect(got, `world ${world + 1}: ${got}/${ls.length}`).toBeGreaterThanOrEqual(min);
    };
    need(1, 4); need(2, 5); need(3, 5); need(4, 5);
    expect(rows.filter((r) => r.needs).length / rows.length).toBeGreaterThanOrEqual(0.7);
  });
  it('the temple forces at least as much storage as the onsen, on a smaller rack', () => {
    const avg = (world: number) => { const ls = rows.filter((r) => r.l.world === world && r.needs); return ls.reduce((a, r) => a + r.forced, 0) / ls.length; };
    expect(avg(4)).toBeGreaterThanOrEqual(avg(1));
    expect(rows.find((r) => r.l.world === 4)!.l.rack).toBeLessThan(rows.find((r) => r.l.world === 1)!.l.rack);
  });
});

describe('generated rack boards usually need the rack, without rejecting the rest', () => {
  it('zen moyen / difficile / expert stay inside a majority band', () => {
    for (const [diff, rate] of [['moyen', BURY_RATE.moyen], ['difficile', BURY_RATE.difficile], ['expert', BURY_RATE.expert]] as const) {
      let buried = 0; const N = 40;
      for (let s = 1; s <= N; s++) {
        const z = zenLevel(s * 17, diff);
        const d = deal(LAYOUTS[z.layout].make(), z.seed, 0, z.rack, buryDeal(z));
        const play = playRack(d.tiles, z.rack);
        expect((play.win && play.peak <= z.rack) || !d.needsRack, `${diff} ${s}`).toBe(true);
        if (lockedGroups(d.tiles) > 0) buried++;
      }
      expect(buried / N, diff).toBeGreaterThan(0.5);
      expect(buried / N, diff).toBeLessThan(0.98);
      void rate;
    }
  });
  it('endless from manche 3 follows the same band', () => {
    let buried = 0; const N = 24;
    for (let r = 2; r < 2 + N; r++) {
      const l = endlessLevel(r, 42);
      expect(l.rack).toBeGreaterThan(0);
      const d = deal(LAYOUTS[l.layout].make(), l.seed, 0, l.rack, buryDeal(l));
      const play = playRack(d.tiles, l.rack);
      expect((play.win && play.peak <= l.rack) || !d.needsRack, `round ${r}`).toBe(true);
      if (lockedGroups(d.tiles) > 0) buried++;
    }
    expect(buried / N).toBeGreaterThan(0.45);
    expect(buried / N).toBeLessThan(0.98);
  });
  it('the coin flip is not a reject loop', () => {
    const draws = Array.from({ length: 200 }, (_, i) => generatedBury(i + 1, 0.7));
    const p = draws.filter(Boolean).length / draws.length;
    expect(p).toBeGreaterThan(0.55); expect(p).toBeLessThan(0.85);
  });
});
