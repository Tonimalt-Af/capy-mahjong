// The rack is part of the difficulty, not a cosmetic tray.
// A buried level splits a kind's mates across columns, so the shortest win holds two or three
// tiles before the first fusion. The first board of each rack world (and Onsen's pyramid) stays a breather.
import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, LAYOUTS, campaignBury, campaignKnots } from '../src/levels';
import { deal, greedyRack, playRack, type Tile } from '../src/engine';
import { buryDeal, BURY_RATE, generatedBury, zenLevel, endlessLevel } from '../src/meta';

const rows = ALL_LEVELS.filter((l) => l.rack > 0).map((l) => {
  const d = deal(LAYOUTS[l.layout].make(), l.seed, 0, l.rack, campaignBury(l), campaignKnots(l));
  const play = playRack(d.tiles, l.rack);
  const greedy = d.needsRack ? greedyRack(d.tiles, l.rack) : { win: true, peak: play.peak, forced: 0, parks: 0 };
  return { l, d, needs: d.needsRack, play, greedy };
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
    // Onsen: at least 4 of 7. Forêt and Temple: at least 5 of 7. Montagne: 6 of 7
    // (the frost crystal is a real rack level, not a classic fallback). Overall: at least 70%.
    const need = (world: number, min: number) => {
      const ls = rows.filter((r) => r.l.world === world);
      const got = ls.filter((r) => r.needs).length;
      expect(got, `world ${world + 1}: ${got}/${ls.length}`).toBeGreaterThanOrEqual(min);
    };
    need(1, 4); need(2, 5); need(3, 6); need(4, 5);
    expect(rows.find((r) => r.l.name === 'Le cristal de givre')!.needs).toBe(true);
    expect(rows.filter((r) => r.needs).length / rows.length).toBeGreaterThanOrEqual(0.7);
  });
  it('the temple forces at least as much storage as the onsen, on a smaller rack', () => {
    const avg = (world: number) => { const ls = rows.filter((r) => r.l.world === world && r.needs); return ls.reduce((a, r) => a + r.d.forced, 0) / ls.length; };
    expect(avg(4)).toBeGreaterThanOrEqual(avg(1));
    expect(rows.find((r) => r.l.world === 4)!.l.rack).toBeLessThan(rows.find((r) => r.l.world === 1)!.l.rack);
  });
  it('most rack-required levels need a careful peak of at least 3, and several fill the rack', () => {
    const buried = rows.filter((r) => r.needs);
    for (const row of buried) {
      expect(row.d.peak, row.l.name).toBeGreaterThanOrEqual(3);
      expect(row.play.peak, row.l.name).toBeGreaterThanOrEqual(row.d.peak);
      expect(row.d.peak, row.l.name).toBeLessThanOrEqual(row.l.rack);
    }
    expect(buried.filter((r) => r.d.peak >= 3).length).toBeGreaterThanOrEqual(15);
    const nearFull = buried.filter((r) => r.d.peak >= r.l.rack - 1);
    expect(nearFull.length).toBeGreaterThanOrEqual(8);
    // Onsen keeps slack (peak 3–4 on 6 slots). Temple reaches a full rack of 4. Forêt and Montagne sit in between.
    expect(nearFull.some((r) => r.l.world === 2 || r.l.world === 3)).toBe(true);
    expect(nearFull.some((r) => r.l.world === 4 && r.d.peak === r.l.rack)).toBe(true);
    const onsen = buried.filter((r) => r.l.world === 1 && !r.l.secret).map((r) => r.d.peak);
    expect(Math.min(...onsen)).toBeLessThanOrEqual(3);
    expect(Math.max(...onsen)).toBeLessThan(6);
    expect(Math.max(...buried.filter((r) => r.l.world === 4).map((r) => r.d.peak))).toBe(4);
  });
  it('a no-lookahead line gets stuck on several boards a careful line clears', () => {
    const buried = rows.filter((r) => r.needs);
    const stuck = buried.filter((r) => !r.greedy.win);
    expect(stuck.length).toBeGreaterThanOrEqual(5);
    for (const row of stuck) expect(row.play.win, row.l.name).toBe(true);
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
        if (d.needsRack) buried++;
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
      if (d.needsRack) buried++;
    }
    expect(buried / N).toBeGreaterThan(0.45);
    expect(buried / N).toBeLessThan(0.98);
  });
  it('the guided line finishes an endless round, including a buried cabin', () => {
    const guided = (tiles: Tile[], slots: number) => playRack(tiles, slots).win;
    const cabin = deal(LAYOUTS.cabane.make(), 1007154594, 0.1, 5, true);
    expect(cabin.needsRack).toBe(true);
    expect(guided(cabin.tiles, 5), 'cabane').toBe(true);
    for (const seed of [1, 42]) for (let round = 2; round < 16; round++) {
      const l = endlessLevel(round, seed);
      const d = deal(LAYOUTS[l.layout].make(), l.seed, l.legend, l.rack, buryDeal(l));
      if (!d.needsRack) continue;
      expect(guided(d.tiles, l.rack), `${l.title} ${l.layout}`).toBe(true);
    }
  });
  it('the coin flip is not a reject loop', () => {
    const draws = Array.from({ length: 200 }, (_, i) => generatedBury(i + 1, 0.7));
    const p = draws.filter(Boolean).length / draws.length;
    expect(p).toBeGreaterThan(0.55); expect(p).toBeLessThan(0.85);
  });
});
