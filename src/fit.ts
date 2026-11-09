/** Shared board scale. `cols` / `rows` are the half-tile bounding box used by layout(). */
export const RACK_BAND = 48;
export const PHONE_RAIL = 84;

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
