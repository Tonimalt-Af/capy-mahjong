export interface Pos { x: number; y: number; z: number } // half-tile units
export function turtle(): Pos[] {
  const out: Pos[] = [];
  const row = (y: number, x0: number, x1: number, z = 0) => { for (let x = x0; x <= x1; x += 2) out.push({ x, y, z }); };
  [[0, 2, 24], [2, 6, 20], [4, 4, 22], [6, 2, 24], [8, 2, 24], [10, 4, 22], [12, 6, 20], [14, 2, 24]].forEach(([y, a, b]) => row(y, a, b));
  out.push({ x: 0, y: 7, z: 0 }, { x: 26, y: 7, z: 0 }, { x: 28, y: 7, z: 0 });
  for (let y = 2; y <= 12; y += 2) row(y, 8, 18, 1);
  for (let y = 4; y <= 10; y += 2) row(y, 10, 16, 2);
  for (let y = 6; y <= 8; y += 2) row(y, 12, 14, 3);
  out.push({ x: 13, y: 7, z: 4 });
  return out;
}

type GL = [z: number, dx: number, dy: number, rows: string[]];
/** ASCII layers: '#' = a tile at (dx + col*2, dy + row*2) on layer z (half-tile units). */
export const grid = (...layers: GL[]) => { const o: Pos[] = []; for (const [z, dx, dy, rows] of layers) rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') o.push({ x: dx + i * 2, y: dy + j * 2, z }); })); return o; };
