import { turtle, type Pos } from './layout';
import { BOARDS } from './boards';

const rect = (out: Pos[], x0: number, y0: number, cols: number, rows: number, z: number) => {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ x: x0 + i * 2, y: y0 + j * 2, z });
};
const build = (...parts: [number, number, number, number, number][]) => { const o: Pos[] = []; parts.forEach((p) => rect(o, ...p)); return o; };

export { grid } from './layout';
import { grid } from './layout';

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
  ...BOARDS,
};

export interface World { id: string; name: string; music: number; bg: [string, string]; accent: string; mascot: string }
export const WORLDS: World[] = [
  { id: 'riviere', name: 'Rivière', music: 0, bg: ['#D7F1E8', '#7FC8B4'], accent: '#2FA4A9', mascot: 'agrume' },
  { id: 'onsen', name: 'Onsen', music: 1, bg: ['#FCE8DE', '#E7A98E'], accent: '#D96B4A', mascot: 'serviette' },
  { id: 'foret', name: 'Forêt', music: 2, bg: ['#E3F2D3', '#8DBF6E'], accent: '#3F8F4E', mascot: 'ours' },
  { id: 'montagne', name: 'Montagne enneigée', music: 3, bg: ['#EAF4FF', '#9DBFE3'], accent: '#4B7BC4', mascot: 'bonnet' },
  { id: 'temple', name: 'Temple', music: 4, bg: ['#FFF1CF', '#E8B864'], accent: '#B9822A', mascot: 'chat' },
];

export interface Level { n: number; world: number; index: number; layout: string; /** unique campaign level name */ name?: string; seed: number; par: number; hints: number; shuffles: number; /** undo budget, -1 = unlimited */ undos: number; /** secret level of its world */ secret?: boolean }
// Phase 3 (content & variety): every level has its own board, themed by its world (river, onsen, forest, snowy peaks,
// temple), and no board is shared between worlds. 35 boards: 30 levels + 5 secret levels (one per world).
// L8 keeps its board+seed (soft-lock repro test).
const PLAN: string[][] = [
  ['galet', 'carotte', 'pont', 'nenuphar', 'canard', 'coeur'],
  ['lanterne', 'pyramide', 'yuzu', 'nuage', 'ours', 'bassin'],
  ['champignon', 'chene', 'cabane', 'feuille', 'papillon', 'capy'],
  ['sapin', 'etoile', 'bonhomme', 'montagne', 'sommets', 'refuge'],
  ['forteresse', 'chat', 'escalier', 'torii', 'pagode', 'tortue'],
];
/** Every level's own name, themed by world and matching its board (map, HUD, pause, win card, share text). */
export const LEVEL_NAMES: string[][] = [
  ['Premier plouf', 'La carotte du goûter', 'Le pont de bambou', 'La grande feuille ronde', 'Le canard des roseaux', 'Cœur de nénuphar'],
  ['Les lanternes du soir', 'La pile de serviettes', 'Les yuzus du bain', 'Petit nuage tiède', 'Ourson en peignoir', 'Le bain fumant'],
  ['Le champignon moussu', 'Le vieil arbre', 'La cabane dans les chênes', 'L\'érable rouge', 'Papillons de fougère', 'Le grand capybara des bois'],
  ['Le sapin enneigé', 'Flocon étoilé', 'Le bonhomme de neige', 'Le col de la Patate', 'Les trois sommets', 'Le refuge douillet'],
  ['Les portes du temple', 'Le chat porte-bonheur', 'Les mille marches', 'Le portique vermillon', 'La pagode aux cinq toits', 'La grande tortue d\'or'],
];
/** One secret level per world: opens with SECRET_STARS stars in that world (replaying for stars is optional, never required). */
export const SECRET_PLAN = ['fleur', 'tasse', 'herisson', 'flocon', 'eventail'];
export const SECRET_NAMES = ['La fleur de lotus', 'La tasse de thé', 'Le hérisson du sous-bois', 'Le cristal de givre', 'L\'éventail doré'];
export const SECRET_STARS = 15;
/** Seeds picked by simulation (scripts: random-play win rate ≈ 95% → 35%) for a smooth difficulty curve. */
// Audit 2026-10-30: all levels re-seeded with the smart-bot simulation (src/sim.ts, random shuffles, 8% capydindon) for a
// smooth curve: bot clear rate ≈ 98% (L1) → ≈ 82% (L30), no spikes (L8 kept: soft-lock repro). Phase 3: re-seeded for the new
// boards (L11 and L15 hide a capydindon); seeds 31–35 are the secret levels, each as hard as its world's last level.
export const SEEDS: number[] = [9100003,9295034,9300009,9423769,9595043,9607937,9707940,70859,9923784,10079220,10187142,10936503,10307958,10431718,10816805,21769291,10747565,11243518,10947571,11055493,11385147,11239661,12020698,11748508,11563427,11607997,11723838,12124763,23005978,12213903,12108012,12223853,12387208,12400102,13355357];
/** Hints per level: 4 / 3 / 2 in the first worlds, and 2 (not 1) on the big boards of worlds 4–5. */
export const hintBudget = (world: number) => Math.max(2, 4 - world);
/** Undo budget by world: free while learning (Rivière), then 5, then 3 for the last two worlds. */
export const undoBudget = (world: number) => (world === 0 ? -1 : world <= 2 ? 5 : 3);
const mkLevel = (layout: string, w: number, i: number, n: number, name: string): Level => {
  const tiles = LAYOUTS[layout].make().length;
  return { n, world: w, index: i, layout, name, seed: SEEDS[n], par: Math.round(tiles * (3.2 + w * 0.3)), hints: hintBudget(w), shuffles: Math.max(1, 3 - Math.floor(w / 2)), undos: undoBudget(w) };
};
/** The 30-level campaign (n = 0…29). */
export const LEVELS: Level[] = PLAN.flatMap((ls, w) => ls.map((layout, i) => mkLevel(layout, w, i, w * 6 + i, LEVEL_NAMES[w][i])));
/** Secret levels: n = 30 + world, shown as a 7th node on the world's map. */
export const SECRETS: Level[] = SECRET_PLAN.map((layout, w) => ({ ...mkLevel(layout, w, 6, 30 + w, SECRET_NAMES[w]), secret: true }));
export const ALL_LEVELS: Level[] = [...LEVELS, ...SECRETS];
export const levelAt = (n: number) => ALL_LEVELS[n];

/** Stars: 3 = within par and no hint; 2 = within 1.6×par or at most 1 hint; 1 = cleared */
export function stars(time: number, par: number, hintsUsed: number): number {
  if (time <= par && hintsUsed === 0) return 3;
  if (time <= par * 1.6 && hintsUsed <= 1) return 2;
  return 1;
}
export function score(pairs: number, time: number, par: number, hintsUsed: number, shufflesUsed: number) {
  return Math.max(0, pairs * 100 + Math.max(0, par - time) * 10 - hintsUsed * 150 - shufflesUsed * 250);
}
