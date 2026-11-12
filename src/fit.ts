/** Shared board scale. `cols` / `rows` are the half-tile bounding box used by layout(). */
/** Phone rack band. 52px holds a 40×52 slot. 54px drops the pyramid under 44px tiles. */
export const RACK_BAND = 52;
export const PHONE_RAIL = 84;
/** 83px tiles: readable on a large screen, not a poster. */
export const MAX_U = 42;
const TILE_AR = 1.3;

export function fitUnit(cols: number, rows: number, zMax: number, stageW: number, stageH: number): number {
  const pad = stageH < 420 ? 4 : 16;
  const u = Math.min((stageW - 6) / (cols + 0.2), (stageH - pad) / (rows * 1.3 + 0.45 + zMax * 0.24));
  return Math.floor(Math.max(6, u) * 4) / 4;
}

/** Tile width in px for a phone stage: viewport minus the two 84px rails, and the rack band when the level uses one. */
export function phoneTileWidth(cols: number, rows: number, zMax: number, viewW: number, viewH: number, rack: boolean): number {
  const stageW = viewW - PHONE_RAIL * 2;
  const stageH = viewH - (rack ? RACK_BAND : 0);
  return fitUnit(cols, rows, zMax, stageW, stageH) * 2 - 1;
}

/** Board scale after the same width clamp and poster cap layout() applies. */
export function boardScale(cols: number, rows: number, zMax: number, stageW: number, stageH: number): { u: number; depth: number; shift: number } {
  let u = fitUnit(cols, rows, zMax, stageW, stageH);
  let depth = Math.max(2, u * 0.24);
  let shift = zMax * depth;
  if (cols * u + shift + 8 > stageW) {
    u = Math.floor(((stageW - shift - 8) / cols) * 4) / 4;
    depth = Math.max(2, u * 0.24);
    shift = zMax * depth;
  }
  if (u > MAX_U) {
    u = MAX_U;
    depth = Math.max(2, u * 0.24);
    shift = zMax * depth;
  }
  return { u, depth, shift };
}

/**
 * Slot face for a tall screen. The row sits on top of the stage and steals `face + rowPad`
 * from the board, so the face tracks the tile that remains — same poster cap, never wider
 * than the stage. Phone landscape does not use this; it keeps the 40×52 CSS band.
 */
export function rackSlotSize(
  slots: number,
  stageW: number,
  stageH: number,
  cols: number,
  rows: number,
  zMax: number,
  rowPad: number,
  gap: number,
  insetX: number,
): { w: number; h: number } {
  const n = Math.max(1, slots);
  const maxByWidth = (stageW - insetX - gap * (n - 1)) / n;
  const hi = Math.min(MAX_U * 2 - 1, maxByWidth);
  const hiQ = Math.floor(hi * 4 + 1e-6);
  let chosen = Math.min(hiQ, 40 * 4);
  for (let q = chosen; q <= hiQ; q++) {
    const w = q / 4;
    const faceH = Math.round(w * TILE_AR);
    const tileH = stageH - faceH - rowPad;
    if (tileH < 140) break;
    const tileW = boardScale(cols, rows, zMax, stageW, tileH).u * 2 - 1;
    if (w <= tileW + 0.05) chosen = q;
    else break;
  }
  const w = chosen / 4;
  return { w, h: Math.round(w * TILE_AR) };
}
