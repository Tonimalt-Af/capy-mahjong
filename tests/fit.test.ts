import { describe, expect, it } from 'vitest';
import { LAYOUTS } from '../src/levels';
import { MAX_U, RACK_BAND, boardScale, rackSlotSize } from '../src/fit';

const bounds = (id: string) => {
  const p = LAYOUTS[id].make();
  const xs = p.map((q) => q.x), ys = p.map((q) => q.y);
  return { cols: Math.max(...xs) - Math.min(...xs) + 2, rows: Math.max(...ys) - Math.min(...ys) + 2, z: Math.max(...p.map((q) => q.z)) };
};

/** Stage box under a 60px chrome row (pause / level / time), the rack not yet subtracted. */
const stageOf = (viewW: number, viewH: number, barW: number) => ({ w: viewW - barW, h: viewH - 60 });

describe('rack slot size on a tall screen', () => {
  const pad = 16, gap = 8, inset = 16;
  const onsen = bounds('lanterne');
  const temple = bounds('forteresse');

  it('keeps the phone band at 52px', () => {
    expect(RACK_BAND).toBe(52);
    expect(MAX_U).toBe(42);
  });

  it('matches board tiles and stays centered-capable on tablet and desktop stages', () => {
    const views: [string, number, number, number][] = [
      ['1024x768', 1024, 768, 102],
      ['1180x820', 1180, 820, 118],
      ['1280x800', 1280, 800, 118],
      ['1366x1024', 1366, 1024, 118],
      ['1440x900', 1440, 900, 118],
    ];
    for (const [name, vw, vh, bar] of views) {
      const stage = stageOf(vw, vh, bar);
      for (const [slots, b] of [[6, onsen], [4, temple]] as const) {
        const slot = rackSlotSize(slots, stage.w, stage.h, b.cols, b.rows, b.z, pad, gap, inset);
        const tileW = boardScale(b.cols, b.rows, b.z, stage.w, stage.h - slot.h - pad).u * 2 - 1;
        expect(Math.abs(slot.w - tileW), `${name} ${slots}`).toBeLessThanOrEqual(1);
        expect(slot.w, `${name} ${slots}`).toBeGreaterThanOrEqual(72);
        expect(slot.w, `${name} ${slots}`).toBeLessThanOrEqual(MAX_U * 2 - 1);
        expect(slot.h / slot.w, `${name} ${slots}`).toBeCloseTo(1.3, 1);
        expect(slots * slot.w + (slots - 1) * gap, `${name} ${slots}`).toBeLessThanOrEqual(stage.w - inset);
      }
    }
  });

  it('gives 4 and 6 slots the same face when the stage is wide enough', () => {
    const stage = stageOf(1440, 900, 118);
    const a = rackSlotSize(6, stage.w, stage.h, onsen.cols, onsen.rows, onsen.z, pad, gap, inset);
    const b = rackSlotSize(4, stage.w, stage.h, temple.cols, temple.rows, temple.z, pad, gap, inset);
    expect(a).toEqual(b);
    expect(a.w).toBe(MAX_U * 2 - 1);
  });

  it('shrinks with the board on a short desktop window instead of covering it', () => {
    const stage = stageOf(1024, 640, 102);
    const slot = rackSlotSize(6, stage.w, stage.h, onsen.cols, onsen.rows, onsen.z, pad, gap, inset);
    const tileW = boardScale(onsen.cols, onsen.rows, onsen.z, stage.w, stage.h - slot.h - pad).u * 2 - 1;
    expect(Math.abs(slot.w - tileW)).toBeLessThanOrEqual(1);
    expect(slot.w).toBeGreaterThan(46);
    expect(slot.w).toBeLessThan(76);
    expect(tileW).toBeGreaterThanOrEqual(44);
  });
});
