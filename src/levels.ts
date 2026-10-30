import { turtle, type Pos } from './layout';

const rect = (out: Pos[], x0: number, y0: number, cols: number, rows: number, z: number) => {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ x: x0 + i * 2, y: y0 + j * 2, z });
};
const build = (...parts: [number, number, number, number, number][]) => { const o: Pos[] = []; parts.forEach((p) => rect(o, ...p)); return o; };

type GL = [z: number, dx: number, dy: number, rows: string[]];
/** ASCII layers: '#' = a tile at (dx + col*2, dy + row*2) on layer z (half-tile units). */
export const grid = (...layers: GL[]) => { const o: Pos[] = []; for (const [z, dx, dy, rows] of layers) rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') o.push({ x: dx + i * 2, y: dy + j * 2, z }); })); return o; };

export interface LayoutDef { id: string; name: string; make: () => Pos[]; shape?: boolean }
export const LAYOUTS: Record<string, LayoutDef> = {
  galet: { id: 'galet', name: 'Galet', make: () => build([0, 0, 6, 4, 0], [2, 2, 4, 2, 1], [4, 2, 2, 2, 2]) }, // 36
  pont: { id: 'pont', name: 'Pont', make: () => build([0, 0, 10, 3, 0], [2, 0, 8, 1, 1], [2, 4, 8, 1, 1], [8, 2, 2, 1, 1]) }, // 48
  pyramide: { id: 'pyramide', name: 'Pyramide', make: () => build([0, 0, 8, 5, 0], [2, 2, 6, 3, 1], [4, 4, 4, 1, 2], [6, 4, 2, 1, 3]) }, // 64
  fleur: { id: 'fleur', name: 'Fleur', make: () => build([6, 0, 4, 8, 0], [0, 4, 3, 4, 0], [14, 4, 3, 4, 0], [8, 4, 2, 4, 1], [8, 6, 2, 2, 2], [2, 6, 1, 2, 1], [16, 6, 1, 2, 1]) }, // 72
  papillon: { id: 'papillon', name: 'Papillon', make: () => build([0, 0, 4, 5, 0], [12, 0, 4, 5, 0], [8, 2, 2, 3, 0], [2, 2, 2, 3, 1], [14, 2, 2, 3, 1], [8, 2, 2, 3, 1], [8, 4, 2, 1, 2], [4, 10, 1, 1, 0], [20, 10, 1, 1, 0]) }, // 84
  forteresse: { id: 'forteresse', name: 'Forteresse', make: () => build([0, 0, 10, 6, 0], [0, 0, 2, 2, 1], [16, 0, 2, 2, 1], [0, 8, 2, 2, 1], [16, 8, 2, 2, 1], [0, 0, 1, 2, 2], [18, 0, 1, 2, 2], [0, 8, 1, 2, 2], [18, 8, 1, 2, 2], [6, 4, 4, 2, 1], [8, 4, 2, 2, 2]) }, // 96
  montagne: { id: 'montagne', name: 'Montagne', make: () => build([0, 0, 12, 6, 0], [2, 2, 10, 4, 1], [8, 4, 4, 2, 2]) }, // 120
  tortue: { id: 'tortue', name: 'Tortue', make: turtle }, // 144
  // ---- shaped boards (original patterns)
  coeur: { id: 'coeur', name: 'Cœur', shape: true, make: () => grid(
    [0, 0, 0, ['.###..###.', '##########', '##########', '.########.', '..######..', '...####...', '....##....']],
    [1, 1, 1, ['.##..##.', '########', '.######.', '..####..', '...##...']],
    [2, 2, 2, ['#....#', '.####.', '..##..']],
  ) },
  capy: { id: 'capy', name: 'Capybara', shape: true, make: () => grid( // side view facing right: little ears, blunt head with an eye hole, barrel body, legs
    [0, 0, 0, ['...........#.#.', '...#######.####', '.###########.##', '###############', '##############.', '.############..', '.##.......##...']],
    [1, 1, 1, ['...######.....', '.#########....', '.#########....', '..#######.....']],
    [2, 4, 4, ['#####', '#####']],
  ) },
  chat: { id: 'chat', name: 'Chat', shape: true, make: () => grid( // cat head: two pointy ears
    [0, 0, 0, ['#........#', '##......##', '###.##.###', '##########', '##########', '##########', '.########.', '..######..']],
    [1, 1, 1, ['#.......#', '.........', '.########', '.#######.', '..######.', '...###...']],
    [2, 2, 5, ['.####.', '..##..']],
  ) },
  ours: { id: 'ours', name: 'Ourson', shape: true, make: () => grid( // bear head: round ears
    [0, 0, 0, ['##......##', '##.####.##', '.########.', '##########', '##########', '.########.', '..######..']],
    [1, 1, 1, ['#.......#', '..#####..', '.#######.', '.#######.', '..#####..']],
    [2, 4, 4, ['###', '###']],
  ) },
  etoile: { id: 'etoile', name: 'Étoile', shape: true, make: () => grid(
    [0, 0, 0, ['......##......', '.....####.....', '##############', '.############.', '...########...', '..####..####..', '.###......###.']],
    [1, 1, 1, ['.....###.....', '.###########.', '...#######...', '...##...##...']],
    [2, 10, 2, ['###']],
  ) },
  champignon: { id: 'champignon', name: 'Champignon', shape: true, make: () => grid(
    [0, 0, 0, ['...######...', '.##########.', '############', '############', '....####....', '....####....', '...######...']],
    [1, 1, 1, ['...#####...', '.#########.', '.#########.', '....###....']],
    [2, 2, 2, ['..####..', '.######.']],
  ) },
  carotte: { id: 'carotte', name: 'Carotte', shape: true, make: () => grid( // lying carrot: leafy top on the left, pointy tip on the right
    [0, 0, 0, ['##..........', '.#.#######..', '..##########', '.#.#######..', '##..........']],
    [1, 7, 1, ['######', '######']],
    [2, 9, 2, ['####']],
  ) },
  yuzu: { id: 'yuzu', name: 'Yuzu', shape: true, make: () => grid( // round fruit with a little leaf
    [0, 0, 0, ['....##....', '..######..', '.########.', '##########', '##########', '.########.', '..######..']],
    [1, 3, 3, ['.####.', '######', '.####.']],
    [2, 7, 5, ['##']],
  ) },
  nuage: { id: 'nuage', name: 'Nuage', shape: true, make: () => grid( // puffy cloud (onsen steam, mountain snow)
    [0, 0, 0, ['...###..###...', '..##########..', '##############', '##############', '.############.']],
    [1, 3, 1, ['.###..###.', '##########', '.########.']],
    [2, 7, 3, ['###', '###']],
  ) },
};

export interface World { id: string; name: string; music: number; bg: [string, string]; accent: string; mascot: string }
export const WORLDS: World[] = [
  { id: 'riviere', name: 'Rivière', music: 0, bg: ['#D7F1E8', '#7FC8B4'], accent: '#2FA4A9', mascot: 'agrume' },
  { id: 'onsen', name: 'Onsen', music: 1, bg: ['#FCE8DE', '#E7A98E'], accent: '#D96B4A', mascot: 'serviette' },
  { id: 'foret', name: 'Forêt', music: 2, bg: ['#E3F2D3', '#8DBF6E'], accent: '#3F8F4E', mascot: 'ours' },
  { id: 'montagne', name: 'Montagne enneigée', music: 3, bg: ['#EAF4FF', '#9DBFE3'], accent: '#4B7BC4', mascot: 'bonnet' },
  { id: 'temple', name: 'Temple', music: 4, bg: ['#FFF1CF', '#E8B864'], accent: '#B9822A', mascot: 'chat' },
];

export interface Level { n: number; world: number; index: number; layout: string; /** unique campaign level name */ name?: string; seed: number; par: number; hints: number; shuffles: number; /** undo budget, -1 = unlimited */ undos: number }
// Audit 2026-10-30 (steering): no more "Galet, Pont, Galet, Pont…": every world mixes several boards, no board twice in a row,
// 17 boards over 30 levels (3 new simple shapes: carotte, yuzu, nuage). L8 keeps its board+seed (soft-lock repro test).
const PLAN: string[][] = [
  ['galet', 'carotte', 'pont', 'yuzu', 'papillon', 'coeur'],
  ['fleur', 'pyramide', 'etoile', 'nuage', 'ours', 'chat'],
  ['champignon', 'yuzu', 'forteresse', 'coeur', 'papillon', 'capy'],
  ['etoile', 'montagne', 'ours', 'nuage', 'capy', 'tortue'],
  ['forteresse', 'chat', 'montagne', 'champignon', 'capy', 'tortue'],
];
/** Every level's own name, themed by world (shown on the map, in game, on the win card and in the share text). */
export const LEVEL_NAMES: string[][] = [
  ['Premier plouf', 'La carotte du goûter', 'Le pont de bambou', 'Yuzu au fil de l\'eau', 'Le papillon des roseaux', 'Cœur de nénuphar'],
  ['Fleur de vapeur', 'La pile de serviettes', 'Les étoiles du bassin', 'Petit nuage tiède', 'Ourson en peignoir', 'Le chat du bain chaud'],
  ['Le champignon moussu', 'Le verger aux yuzus', 'La cabane dans les chênes', 'Le cœur de la clairière', 'Papillons de fougère', 'Le grand capybara des bois'],
  ['Flocon étoilé', 'Le col de la Patate', 'Ourson sous la neige', 'Nuage de neige', 'Capybara en bonnet', 'La tortue des glaces'],
  ['Les portes du temple', 'Le chat porte-bonheur', 'Les mille marches', 'Le jardin de mousse', 'Le sage capybara', 'La grande tortue d\'or'],
];
/** Seeds picked by simulation (scripts: random-play win rate ≈ 95% → 35%) for a smooth difficulty curve. */
// Audit 2026-10-30: all levels re-seeded with the smart-bot simulation (src/sim.ts, random shuffles, 8% capydindon) for a
// smooth curve: bot clear rate ≈ 98% (L1) → ≈ 82% (L30), no spikes (L8 kept: soft-lock repro). L5, L14, L23 hide a capydindon.
export const SEEDS = [107922,200006,331685,423769,1047529,607937,707940,70859,1010893,1015868,1195061,1200036,1323796,2240559,1531721,1600048,1700051,2196004,1900057,2071331,2107982,2540583,6260672,2518857,2698050,2600078,3214816,2847598,3034710,3000090];
/** Hints per level: 4 / 3 / 2 in the first worlds, and 2 (not 1) on the big boards of worlds 4–5. */
export const hintBudget = (world: number) => Math.max(2, 4 - world);
/** Undo budget by world: free while learning (Rivière), then 5, then 3 for the last two worlds. */
export const undoBudget = (world: number) => (world === 0 ? -1 : world <= 2 ? 5 : 3);
export const LEVELS: Level[] = PLAN.flatMap((ls, w) => ls.map((layout, i) => {
  const n = w * 6 + i; const tiles = LAYOUTS[layout].make().length;
  return { n, world: w, index: i, layout, name: LEVEL_NAMES[w][i], seed: SEEDS[n], par: Math.round(tiles * (3.2 + w * 0.3)), hints: hintBudget(w), shuffles: Math.max(1, 3 - Math.floor(w / 2)), undos: undoBudget(w) };
}));

/** Stars: 3 = within par and no hint; 2 = within 1.6×par or at most 1 hint; 1 = cleared */
export function stars(time: number, par: number, hintsUsed: number): number {
  if (time <= par && hintsUsed === 0) return 3;
  if (time <= par * 1.6 && hintsUsed <= 1) return 2;
  return 1;
}
export function score(pairs: number, time: number, par: number, hintsUsed: number, shufflesUsed: number) {
  return Math.max(0, pairs * 100 + Math.max(0, par - time) * 10 - hintsUsed * 150 - shufflesUsed * 250);
}
