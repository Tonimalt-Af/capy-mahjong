// Capybara Mahjong tile art — kawaii sticker style (thick white outline + soft shadow)
export const PALETTE = {
  cream: '#FFF6E6', creamEdge: '#F1DDBB', side: '#E2BF8C', sideDark: '#C99A62',
  fur: '#C58B5A', furDark: '#9E6A40', furDeep: '#7A4E2E', ink: '#3B2416', blush: '#FF9AA2',
  orange: '#FF8A3D', red: '#EF4B5F', green: '#3FAE6A', teal: '#2FA4A9', gold: '#F5B82E',
  sky: '#7CC6E8', bg: '#BFE6D9', bgDeep: '#7FC8B4',
};
const P = PALETTE;

export type Suit = 'agrume' | 'fraise' | 'feuille';
export interface Kind { id: string; name: string; group: string; suit?: Suit; rank?: number; bonus?: boolean; legend?: boolean }

export const SUITS: Suit[] = ['agrume', 'fraise', 'feuille'];
export const HONORS = ['couronne', 'paille', 'serviette', 'bonnet', 'lunettes', 'noeud', 'canard'] as const;
export const SEASONS = ['printemps', 'ete', 'automne', 'hiver'] as const;
export const FLOWERS = ['lotus', 'tournesol', 'tulipe', 'hibiscus'] as const;

const NAMES: Record<string, string> = {
  agrume: 'Agrume', fraise: 'Fraise', feuille: 'Feuille', couronne: 'Couronne', paille: 'Chapeau de paille',
  serviette: 'Serviette onsen', bonnet: 'Bonnet', lunettes: 'Lunettes', noeud: 'Nœud', canard: 'Canard',
  printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver', lotus: 'Lotus', tournesol: 'Tournesol',
  tulipe: 'Tulipe', hibiscus: 'Hibiscus', capydindon: 'Capydindon légendaire',
};

export const KINDS: Kind[] = [
  ...SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => ({ id: `${s}-${i + 1}`, name: `${NAMES[s]} ${i + 1}`, group: `${s}-${i + 1}`, suit: s, rank: i + 1 }))),
  ...HONORS.map((h) => ({ id: h, name: NAMES[h], group: h })),
  ...SEASONS.map((h) => ({ id: h, name: NAMES[h], group: 'saison', bonus: true })),
  ...FLOWERS.map((h) => ({ id: h, name: NAMES[h], group: 'fleur', bonus: true })),
  // rare golden pair, swapped into some deals (never part of the base deck)
  { id: 'capydindon', name: NAMES.capydindon, group: 'capydindon', legend: true },
];
export const KIND_BY_ID = new Map(KINDS.map((k) => [k.id, k]));

// --- drawing helpers. mode: 'c' colour, 'o' white outline, 's' shadow
type Mode = 'c' | 'o' | 's';
const OUT = 9;
function f(mode: Mode, fill: string, extra = '') {
  if (mode === 'c') return `fill="${fill}" ${extra}`;
  const col = mode === 'o' ? '#fff' : 'rgba(90,55,25,.28)';
  return `fill="${col}" stroke="${col}" stroke-width="${OUT}" stroke-linejoin="round"`;
}
const e = (m: Mode, cx: number, cy: number, rx: number, ry: number, fill: string, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${f(m, fill)} ${x}/>`;
const c = (m: Mode, cx: number, cy: number, r: number, fill: string) => e(m, cx, cy, r, r, fill);
const p = (m: Mode, d: string, fill: string) => `<path d="${d}" ${f(m, fill)}/>`;
// details only drawn in colour pass
const det = (m: Mode, s: string) => (m === 'c' ? s : '');

function capyBody(m: Mode) {
  return [
    e(m, 50, 96, 30, 17, P.furDark),
    // ears
    e(m, 31, 44, 7, 6, P.furDeep), e(m, 69, 44, 7, 6, P.furDeep),
    // head (big, round = cute)
    p(m, 'M22 70 C20 50 32 40 50 40 C68 40 80 50 78 70 C77 86 66 92 50 92 C34 92 23 86 22 70Z', P.fur),
    det(m, `<ellipse cx="31" cy="44" rx="3.2" ry="2.6" fill="#F3A98E"/><ellipse cx="69" cy="44" rx="3.2" ry="2.6" fill="#F3A98E"/>`),
    // snout
    e(m, 50, 76, 17, 12, P.furDark),
    det(m, `
      <ellipse cx="50" cy="71" rx="8" ry="4.5" fill="${P.furDeep}"/>
      <ellipse cx="46" cy="70.5" rx="1.6" ry="2" fill="${P.ink}"/><ellipse cx="54" cy="70.5" rx="1.6" ry="2" fill="${P.ink}"/>
      <path d="M45 80 Q50 84 55 80" fill="none" stroke="${P.ink}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="37" cy="60" r="5.2" fill="${P.ink}"/><circle cx="63" cy="60" r="5.2" fill="${P.ink}"/>
      <circle cx="38.6" cy="58.3" r="1.7" fill="#fff"/><circle cx="64.6" cy="58.3" r="1.7" fill="#fff"/>
      <ellipse cx="29" cy="70" rx="5" ry="3.2" fill="${P.blush}" opacity=".8"/><ellipse cx="71" cy="70" rx="5" ry="3.2" fill="${P.blush}" opacity=".8"/>
      <ellipse cx="38" cy="103" rx="6" ry="3.5" fill="${P.furDeep}"/><ellipse cx="62" cy="103" rx="6" ry="3.5" fill="${P.furDeep}"/>`),
  ].join('');
}

// ---------- friends: black cat, bear, legendary capydindon (same head frame as the capybara)
const CAT = { fur: '#2E2A3A', light: '#4A4459', eye: '#F7D046' };
function catBody(m: Mode) {
  return [
    p(m, 'M70 104 C92 106 98 84 88 72 C85 68 80 70 82 75 C88 86 84 96 68 96Z', CAT.fur), // tail
    e(m, 50, 97, 26, 16, CAT.fur),
    p(m, 'M24 62 L25 31 L47 45Z', CAT.fur), p(m, 'M76 62 L75 31 L53 45Z', CAT.fur), // pointy ears
    p(m, 'M22 68 C22 50 34 42 50 42 C66 42 78 50 78 68 C78 84 66 92 50 92 C34 92 22 84 22 68Z', CAT.fur),
    det(m, `<path d="M28 52 L28.5 38 L40 46Z" fill="#F49AB8"/><path d="M72 52 L71.5 38 L60 46Z" fill="#F49AB8"/>
      <ellipse cx="37" cy="63" rx="7.5" ry="8.5" fill="${CAT.eye}"/><ellipse cx="63" cy="63" rx="7.5" ry="8.5" fill="${CAT.eye}"/>
      <ellipse cx="37" cy="64" rx="2.8" ry="6.5" fill="#15121C"/><ellipse cx="63" cy="64" rx="2.8" ry="6.5" fill="#15121C"/>
      <circle cx="39.5" cy="59.5" r="2" fill="#fff"/><circle cx="65.5" cy="59.5" r="2" fill="#fff"/>
      <path d="M47 73 L53 73 L50 77Z" fill="#F49AB8"/>
      <path d="M44 79 Q47 82 50 79 Q53 82 56 79" fill="none" stroke="#F3E9FF" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 74 L16 72 M30 78 L17 80 M70 74 L84 72 M70 78 L83 80" stroke="#F3E9FF" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="28" cy="72" rx="4.5" ry="2.8" fill="${P.blush}" opacity=".7"/><ellipse cx="72" cy="72" rx="4.5" ry="2.8" fill="${P.blush}" opacity=".7"/>
      <ellipse cx="39" cy="104" rx="6" ry="3.5" fill="${CAT.light}"/><ellipse cx="61" cy="104" rx="6" ry="3.5" fill="${CAT.light}"/>`),
  ].join('');
}
const BEAR = { fur: '#8B5A3C', deep: '#6B4029', muzzle: '#F2D6B0' };
function bearBody(m: Mode) {
  return [
    e(m, 50, 97, 30, 17, BEAR.deep),
    c(m, 28, 45, 10, BEAR.fur), c(m, 72, 45, 10, BEAR.fur), // big round ears
    p(m, 'M21 69 C21 50 33 41 50 41 C67 41 79 50 79 69 C79 85 67 93 50 93 C33 93 21 85 21 69Z', BEAR.fur),
    e(m, 50, 76, 14, 11, BEAR.muzzle),
    det(m, `<circle cx="28" cy="45" r="5" fill="${BEAR.muzzle}"/><circle cx="72" cy="45" r="5" fill="${BEAR.muzzle}"/>
      <ellipse cx="50" cy="71" rx="6.5" ry="4.6" fill="#2A1A10"/><ellipse cx="48" cy="69.6" rx="2" ry="1.2" fill="#fff" opacity=".7"/>
      <path d="M50 75 V79 M44 80 Q50 85 56 80" fill="none" stroke="#2A1A10" stroke-width="2.3" stroke-linecap="round"/>
      <circle cx="37" cy="60" r="4.6" fill="${P.ink}"/><circle cx="63" cy="60" r="4.6" fill="${P.ink}"/>
      <circle cx="38.4" cy="58.5" r="1.5" fill="#fff"/><circle cx="64.4" cy="58.5" r="1.5" fill="#fff"/>
      <ellipse cx="29" cy="71" rx="5" ry="3.2" fill="${P.blush}" opacity=".75"/><ellipse cx="71" cy="71" rx="5" ry="3.2" fill="${P.blush}" opacity=".75"/>
      <ellipse cx="50" cy="99" rx="14" ry="8" fill="#A9754F"/>
      <ellipse cx="37" cy="104" rx="6.5" ry="3.8" fill="#5A3420"/><ellipse cx="63" cy="104" rx="6.5" ry="3.8" fill="#5A3420"/>`),
  ].join('');
}
const FAN = ['#B5532A', '#F5B82E', '#E8692A', '#7A4E2E', '#EF4B5F', '#F5B82E', '#B5532A', '#E8692A', '#7A4E2E'];
function dindonBody(m: Mode) {
  let fan = '';
  for (let i = -4; i <= 4; i++) { const a = (i * 21 * Math.PI) / 180; const cx = 50 + Math.sin(a) * 33, cy = 74 - Math.cos(a) * 33;
    fan += e(m, cx, cy, 9, 21, FAN[i + 4], `transform="rotate(${i * 21} ${cx} ${cy})"`) + det(m, `<circle cx="${50 + Math.sin(a) * 45}" cy="${74 - Math.cos(a) * 45}" r="3" fill="#FFF3C4"/><circle cx="${50 + Math.sin(a) * 45}" cy="${74 - Math.cos(a) * 45}" r="1.5" fill="#2FA4A9"/>`); }
  return fan + capyBody(m) +
    p(m, 'M40 44 C38 34 44 32 46 38 C46 28 54 28 54 38 C56 32 62 34 60 44Z', '#E8344E') + // comb
    p(m, 'M55 76 C60 80 60 92 55 93 C51 92 51 84 53 78Z', '#E8344E') + // wattle
    det(m, `<path d="M44 72 L50 79 L56 72Z" fill="${P.gold}" stroke="#C9851A" stroke-width="1.2" stroke-linejoin="round"/>`); // beak
}
export const FRIENDS = ['chat', 'ours', 'capydindon'] as const;
const BODY: Record<string, (m: Mode) => string> = { capy: capyBody, chat: catBody, ours: bearBody, capydindon: dindonBody };
/** Tile themes: which animal plays each family. 'menagerie' = one animal per suit. */
export type Theme = 'capy' | 'menagerie' | 'chat' | 'ours';
const THEME_SUIT: Record<Theme, Record<Suit | 'honor', string>> = {
  capy: { agrume: 'capy', fraise: 'capy', feuille: 'capy', honor: 'capy' },
  menagerie: { agrume: 'capy', fraise: 'chat', feuille: 'ours', honor: 'capy' },
  chat: { agrume: 'chat', fraise: 'chat', feuille: 'chat', honor: 'chat' },
  ours: { agrume: 'ours', fraise: 'ours', feuille: 'ours', honor: 'ours' },
};

// Accessories sit on top of head (~y 40)
const ACC: Record<string, (m: Mode) => string> = {
  agrume: (m) => c(m, 50, 31, 12, P.orange) + p(m, 'M50 19 C56 12 63 14 64 18 C58 22 53 21 50 19Z', P.green) + det(m, `<circle cx="45" cy="27" r="3" fill="#FFC08F"/><circle cx="50" cy="20.5" r="1.6" fill="#B65A1A"/>`),
  fraise: (m) => p(m, 'M37 24 C37 18 63 18 63 24 C63 34 55 44 50 44 C45 44 37 34 37 24Z', P.red) + p(m, 'M39 22 L44 15 L50 20 L56 15 L61 22 Z', P.green) + det(m, ['42,28', '50,27', '58,28', '46,35', '54,35', '50,40'].map((q) => `<ellipse cx="${q.split(',')[0]}" cy="${q.split(',')[1]}" rx="1.2" ry="1.8" fill="#FFE08A"/>`).join('')),
  feuille: (m) => p(m, 'M30 36 C34 16 62 12 72 20 C68 36 46 44 30 36Z', P.green) + det(m, `<path d="M33 35 C45 30 58 24 69 21" fill="none" stroke="#2A7F4B" stroke-width="2.2" stroke-linecap="round"/>`),
  couronne: (m) => p(m, 'M33 40 L31 20 L41 29 L50 15 L59 29 L69 20 L67 40 Z', P.gold) + det(m, `<circle cx="50" cy="33" r="3.2" fill="${P.red}"/><circle cx="40" cy="35" r="2.2" fill="${P.teal}"/><circle cx="60" cy="35" r="2.2" fill="${P.teal}"/>`),
  paille: (m) => e(m, 50, 38, 32, 7, '#F2D27A') + p(m, 'M35 38 C35 20 65 20 65 38Z', '#F2D27A') + det(m, `<rect x="35" y="31" width="30" height="5" rx="2" fill="${P.red}"/>`),
  serviette: (m) => p(m, 'M30 38 C30 26 70 26 70 38 L68 42 L32 42Z', '#FFFFFF') + det(m, `<path d="M30 38 C30 26 70 26 70 38 L68 42 L32 42Z" fill="#fff" stroke="${P.sky}" stroke-width="2"/><path d="M38 34 H62" stroke="${P.sky}" stroke-width="2.5" stroke-linecap="round"/>`),
  bonnet: (m) => p(m, 'M30 42 C30 18 70 18 70 42Z', '#5B8DEF') + c(m, 50, 18, 6, '#fff') + det(m, `<rect x="28" y="37" width="44" height="8" rx="4" fill="#fff"/>`),
  lunettes: (m) => det(m, `<rect x="27" y="53" width="20" height="14" rx="6" fill="#2B2B3A"/><rect x="53" y="53" width="20" height="14" rx="6" fill="#2B2B3A"/><path d="M47 58 H53" stroke="#2B2B3A" stroke-width="3"/><path d="M31 57 l5 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M57 57 l5 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`) + c(m, 50, 32, 0.1, '#fff'),
  noeud: (m) => p(m, 'M50 34 L33 24 C29 30 29 38 33 44 Z', '#FF77B0') + p(m, 'M50 34 L67 24 C71 30 71 38 67 44 Z', '#FF77B0') + c(m, 50, 34, 5.5, '#FF4F97'),
  canard: (m) => e(m, 50, 33, 13, 8, '#FFD93B') + c(m, 56, 22, 8, '#FFD93B') + p(m, 'M63 22 L71 24 L63 27Z', P.orange) + det(m, `<circle cx="58" cy="20" r="1.8" fill="${P.ink}"/>`),
  printemps: (m) => flower(m, 50, 28, 11, '#FFB7CF', '#FFE3EC'),
  ete: (m) => c(m, 50, 27, 11, '#FFC93B') + det(m, Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${50 + Math.cos(a) * 14} ${27 + Math.sin(a) * 14} L${50 + Math.cos(a) * 18} ${27 + Math.sin(a) * 18}" stroke="#FFB000" stroke-width="3" stroke-linecap="round"/>`; }).join('')),
  automne: (m) => p(m, 'M50 12 L54 22 L64 18 L60 28 L70 32 L58 36 L60 42 L50 38 L40 42 L42 36 L30 32 L40 28 L36 18 L46 22Z', '#E8692A'),
  hiver: (m) => c(m, 50, 28, 12, '#DDF3FF') + det(m, [0, 60, 120].map((r) => `<path d="M50 18 V38" transform="rotate(${r} 50 28)" stroke="#5BB4E5" stroke-width="2.6" stroke-linecap="round"/>`).join('')),
  lotus: (m) => p(m, 'M50 14 C58 22 58 34 50 40 C42 34 42 22 50 14Z', '#F49AC8') + p(m, 'M34 26 C44 28 50 36 50 40 C40 40 34 34 34 26Z', '#F7B4D6') + p(m, 'M66 26 C56 28 50 36 50 40 C60 40 66 34 66 26Z', '#F7B4D6'),
  tournesol: (m) => flower(m, 50, 28, 12, '#FFCC2E', '#7A4E2E'),
  tulipe: (m) => p(m, 'M40 18 L45 24 L50 16 L55 24 L60 18 C62 32 57 40 50 40 C43 40 38 32 40 18Z', '#E8475F'),
  hibiscus: (m) => flower(m, 50, 28, 12, '#FF6F61', '#FFE08A'),
};
function flower(m: Mode, cx: number, cy: number, r: number, petal: string, heart: string) {
  let s = '';
  for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; s += c(m, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.48, petal); }
  return s + c(m, cx, cy, r * 0.36, heart);
}

const SUIT_COL: Record<Suit, string> = { agrume: P.orange, fraise: P.red, feuille: P.green };
// Badge shape differs by suit (colour-blind safe): circle / heart / diamond
function badge(k: Kind) {
  if (k.suit) {
    const col = SUIT_COL[k.suit];
    const shape = k.suit === 'agrume' ? `<circle cx="18" cy="18" r="14" fill="${col}" stroke="#fff" stroke-width="3"/>`
      : k.suit === 'fraise' ? `<path d="M18 33 C3 23 2 9 10 5 C15 3 18 7 18 9 C18 7 21 3 26 5 C34 9 33 23 18 33Z" fill="${col}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`
      : `<rect x="7" y="7" width="22" height="22" rx="5" transform="rotate(45 18 18)" fill="${col}" stroke="#fff" stroke-width="3"/>`;
    return shape + `<text x="18" y="${k.suit === 'fraise' ? 23 : 24.5}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="19" fill="#fff">${k.rank}</text>`;
  }
  if (k.legend) return `<circle cx="17" cy="17" r="11" fill="${P.gold}" stroke="#fff" stroke-width="3"/><path d="M10 21 L9 12 L13.5 15.5 L17 9.5 L20.5 15.5 L25 12 L24 21Z" fill="#fff"/>`;
  if (k.bonus) return `<circle cx="17" cy="17" r="10" fill="${P.gold}" stroke="#fff" stroke-width="3"/><path d="M17 10 L19 15 L24 15.5 L20 19 L21.5 24 L17 21 L12.5 24 L14 19 L10 15.5 L15 15Z" fill="#fff"/>`;
  return '';
}

// Small pip icon per suit (shows the rank as a count, like real mahjong)
function pip(m: Mode, suit: Suit, x: number, y: number) {
  const r = 5.2;
  if (suit === 'agrume') return c(m, x, y + 0.5, r, P.orange) + det(m, `<path d="M${x} ${y - r + 0.5} q3 -3 5 -1.5 q-3 2 -5 1.5z" fill="${P.green}"/><circle cx="${x - 1.8}" cy="${y - 1.2}" r="1.3" fill="#FFC08F"/>`);
  if (suit === 'fraise') return p(m, `M${x - r} ${y - 2} C${x - r} ${y - 6} ${x + r} ${y - 6} ${x + r} ${y - 2} C${x + r} ${y + 3} ${x + 1.5} ${y + 6.5} ${x} ${y + 6.5} C${x - 1.5} ${y + 6.5} ${x - r} ${y + 3} ${x - r} ${y - 2}Z`, P.red) + det(m, `<path d="M${x - 3} ${y - 4.5} L${x} ${y - 2.5} L${x + 3} ${y - 4.5}" fill="none" stroke="${P.green}" stroke-width="2" stroke-linecap="round"/>`);
  return p(m, `M${x - 5.5} ${y + 4} C${x - 5} ${y - 4} ${x + 2} ${y - 7} ${x + 6} ${y - 5.5} C${x + 5} ${y + 2} ${x - 1} ${y + 6} ${x - 5.5} ${y + 4}Z`, P.green) + det(m, `<path d="M${x - 4} ${y + 3} L${x + 4} ${y - 4}" stroke="#2A7F4B" stroke-width="1.4" stroke-linecap="round"/>`);
}
const PIP_ROWS: Record<number, number[]> = { 1: [1], 2: [2], 3: [3], 4: [4], 5: [3, 2], 6: [3, 3], 7: [4, 3], 8: [4, 4], 9: [5, 4] };
function pips(suit: Suit, n: number) {
  const rows = PIP_ROWS[n]; const ys = rows.length === 1 ? [111] : [103, 118];
  const pts: [number, number][] = [];
  rows.forEach((cnt, ri) => { const gap = 16; const x0 = 50 - ((cnt - 1) * gap) / 2; for (let i = 0; i < cnt; i++) pts.push([x0 + i * gap, ys[ri]]); });
  return (['s', 'o', 'c'] as Mode[]).map((m) => `<g ${m === 's' ? 'transform="translate(1 1.5)"' : ''}>${pts.map(([x, y]) => pip(m, suit, x, y)).join('')}</g>`).join('');
}

export function capyLayers(accId: string, body = true, animal = 'capy') {
  if (BODY[accId] && accId !== 'capy') { animal = accId; accId = ''; } // a friend on its own
  const acc = ACC[accId]; const B = BODY[animal] ?? capyBody;
  const layer = (m: Mode) => `${body ? `<g transform="translate(0 6)">${B(m)}</g>` : ''}${acc ? `<g transform="translate(50 36) scale(1.35) translate(-50 -30)">${acc(m)}</g>` : ''}`;
  return `<g transform="translate(2.5 3.5)">${layer('s')}</g>${layer('o')}${layer('c')}`;
}

/** Inner art for a tile face, viewBox 0 0 100 130 */
export function tileArt(id: string, theme: Theme = 'capy'): string {
  const k = KIND_BY_ID.get(id)!; const T = THEME_SUIT[theme];
  if (k.legend) return `<g transform="translate(6 10) scale(.88)">${capyLayers('capydindon')}</g>${badge(k)}`;
  if (k.suit) return `<g transform="translate(13 1) scale(.74)">${capyLayers(k.suit, true, T[k.suit])}</g>${pips(k.suit, k.rank!)}${badge(k)}`;
  return `<g transform="translate(1 -2) scale(.98)">${capyLayers(k.id, true, T.honor)}</g>${badge(k)}`;
}

/** Standalone capybara illustration (viewBox 0 0 100 120) */
export function capySvg(accId: string, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 112 124">${extra}${capyLayers(accId)}</svg>`;
}

/** Face plate: rounded cream face, used under the art */
/** Full <symbol> body for a tile face (plate + ring + art). Legend tiles get a golden plate. */
export function tileFace(id: string, theme: Theme = 'capy') {
  const k = KIND_BY_ID.get(id)!;
  const plate = k.legend ? `<defs><linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".55" stop-color="#FFD45C"/><stop offset="1" stop-color="#F2A81D"/></linearGradient></defs><rect width="100" height="130" rx="16" fill="url(#lg-gold)"/><rect x="4" y="4" width="92" height="122" rx="13" fill="none" stroke="#fff" stroke-width="3"/>${[[80, 20], [86, 46], [14, 110], [84, 112]].map(([x, y]) => `<path d="M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y} L${x + 1.8} ${y + 1.8} L${x} ${y + 6} L${x - 1.8} ${y + 1.8} L${x - 6} ${y} L${x - 1.8} ${y - 1.8}Z" fill="#fff"/>`).join('')}`
    : `<rect width="100" height="130" rx="16" fill="${P.cream}"/>${k.bonus ? `<rect x="3" y="3" width="94" height="124" rx="14" fill="none" stroke="${P.gold}" stroke-width="3" stroke-dasharray="6 5"/>` : ''}`;
  return plate + tileArt(id, theme);
}
export function faceSvg(id: string, w = 100, h = 130, theme: Theme = 'capy') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" width="${w}" height="${h}">${tileFace(id, theme)}</svg>`;
}

export function backSvg(w = 100, h = 130) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" width="${w}" height="${h}"><rect width="100" height="130" rx="16" fill="${P.teal}"/><rect x="7" y="7" width="86" height="116" rx="11" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
  <g fill="#fff" opacity=".9"><ellipse cx="50" cy="72" rx="16" ry="13"/><circle cx="34" cy="52" r="6"/><circle cx="46" cy="45" r="6"/><circle cx="58" cy="45" r="6"/><circle cx="68" cy="53" r="6"/></g></svg>`;
}
