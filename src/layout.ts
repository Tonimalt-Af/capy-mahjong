export interface Pos { x: number; y: number; z: number } // half-tile units

/** Centered rectangular layers, each a subset of the one below. `layers[z] = [cols, rows]`. */
export function stack(layers: [number, number][]): Pos[] {
  const [C, R] = layers[0];
  const out: Pos[] = [];
  layers.forEach(([c, r], z) => {
    const x0 = Math.floor((C - c) / 2) * 2;
    const y0 = Math.floor((R - r) / 2) * 2;
    for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) out.push({ x: x0 + i * 2, y: y0 + j * 2, z });
  });
  return out;
}

/** Two lantern stacks with a gap between them (90 tiles, 7×5, 3 layers). */
export function lanterns(): Pos[] {
  const out: Pos[] = [];
  for (const x0 of [0, 8]) for (let z = 0; z < 3; z++) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) out.push({ x: x0 + i * 2, y: j * 2, z });
  return out;
}
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
