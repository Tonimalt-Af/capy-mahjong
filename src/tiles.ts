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

// Capybara palette (warm reddish-brown, research: coarse reddish-brown fur, darker snout and legs)
const C = { fur: '#B67A4A', furL: '#D19A66', furH: '#E7B98A', furD: '#94603A', deep: '#6E4024', muz: '#C48B5C', nose: '#4A2A18', ink: '#33200F', blush: '#F28C82', ear: '#E9957E' };
const blushMarks = (x: number, y: number, rx = 5.5, ry = 3.4) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.blush}" opacity=".78"/><path d="M${x - 2.4} ${y - 1} l1.5 -1.4 M${x + .8} ${y - 1} l1.5 -1.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".85"/>`;

/** A · "Onsen zen": front-facing sitting capybara, brick head, sleepy half-closed eyes (the mascot). */
function capyFront(m: Mode) {
  return [
    p(m, 'M17 103 C15 86 27 74 50 74 C73 74 85 86 83 103 C82 113 70 117 50 117 C30 117 18 113 17 103Z', C.furD),
    det(m, `<path d="M24 104 C24 92 34 84 50 84 C66 84 76 92 76 104 C70 110 30 110 24 104Z" fill="${C.fur}" opacity=".55"/>
      <path d="M20 108 C30 116 70 116 80 108 C78 114 68 117 50 117 C32 117 22 114 20 108Z" fill="${C.deep}" opacity=".35"/>`),
    e(m, 33, 113, 8, 4.2, C.deep), e(m, 67, 113, 8, 4.2, C.deep),
    det(m, `<path d="M30 112.5v2.5M34 112.5v2.5M64 112.5v2.5M68 112.5v2.5" stroke="#4E2B16" stroke-width="1" stroke-linecap="round" opacity=".6"/>`),
    e(m, 31, 38, 5, 4.4, C.furD), e(m, 69, 38, 5, 4.4, C.furD),
    det(m, `<ellipse cx="31.4" cy="38.8" rx="2.4" ry="2" fill="${C.ear}"/><ellipse cx="68.6" cy="38.8" rx="2.4" ry="2" fill="${C.ear}"/>`),
    p(m, 'M26 50 C26 39 36 35 50 35 C64 35 74 39 74 50 L78 72 C80 87 68 95 50 95 C32 95 20 87 22 72 Z', C.fur),
    det(m, `
      <path d="M21.6 72 C21 86 32 94 50 94 C68 94 79 86 78.4 72 C75 84 66 89 50 89 C34 89 25 84 21.6 72Z" fill="${C.furD}" opacity=".6"/>
      <ellipse cx="50" cy="42" rx="17" ry="5.5" fill="${C.furH}" opacity=".55"/>
      <path d="M45 35.5 q2 -4 4 -.5 q2 -4.5 4 0" fill="none" stroke="${C.furD}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M26 58 l-3 1.5 M26 62 l-3.5 .6 M74 58 l3 1.5 M74 62 l3.5 .6" stroke="${C.furD}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
      <path d="M29 69 C29 60 38 57 50 57 C62 57 71 60 71 69 C71.5 82 62 89 50 89 C38 89 28.5 82 29 69Z" fill="${C.muz}"/>
      <path d="M31 75 C33 83 40 87 50 87 C60 87 67 83 69 75 C64 81 58 83 50 83 C42 83 36 81 31 75Z" fill="${C.furD}" opacity=".35"/>
      <path d="M38 61.5 C42 59.5 58 59.5 62 61.5" stroke="${C.furH}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M40 67.5 C42 62.5 58 62.5 60 67.5 C55 69.5 45 69.5 40 67.5Z" fill="${C.furD}" opacity=".45"/>
      <ellipse cx="46.4" cy="66" rx="1.3" ry="2.3" fill="${C.nose}" transform="rotate(35 46.4 66)"/><ellipse cx="53.6" cy="66" rx="1.3" ry="2.3" fill="${C.nose}" transform="rotate(-35 53.6 66)"/>
      <path d="M50 68.5 v5.7 M44.5 75 q2.8 3 5.5 -.6 q2.7 3.6 5.5 .6" stroke="${C.ink}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="36.8" cy="53.8" rx="4.1" ry="3.9" fill="${C.ink}"/>
      <ellipse cx="63.2" cy="53.8" rx="4.1" ry="3.9" fill="${C.ink}"/>
      <circle cx="38.3" cy="52.4" r="1.5" fill="#fff"/><circle cx="64.7" cy="52.4" r="1.5" fill="#fff"/><circle cx="35.2" cy="55.6" r=".7" fill="#fff" opacity=".85"/><circle cx="61.6" cy="55.6" r=".7" fill="#fff" opacity=".85"/>
      ${blushMarks(27, 70)}${blushMarks(73, 70)}`),
  ].join('');
}

/** B · "Profil": side-view capybara facing left — big brick head, tall flat blunt snout, eye and ear set high,
 *  loaf body on four short legs. Drawn in a 0-100 concept grid, fitted by the wrapper transform. */
function capyProfileRaw(m: Mode) {
  return [
    // far legs (darker, behind)
    p(m, 'M37 72 L37.4 84.5 C37.4 86.2 39 86.8 41.6 86.8 C44.2 86.8 45.6 86.2 45.6 84.5 L45.4 72Z', C.deep),
    p(m, 'M67 72 L67.4 84.5 C67.4 86.2 69 86.8 71.6 86.8 C74.2 86.8 75.6 86.2 75.6 84.5 L75.4 72Z', C.deep),
    // loaf body
    p(m, 'M33 57 C31 46 44 38.5 64 38.5 C81 38.5 90 49 89.5 62 C89 73 83 78.5 71 79 L45 79 C37 78.5 34 69 33 57Z', C.furD),
    det(m, `
      <path d="M62 41.6 C73 40.6 82 44 85.6 49" stroke="${C.furL}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>
      <path d="M86 52 C90 62 88 74 79 77.6 C70 80 54 79.6 44 79 C56 77 72 76.6 79 72 C85 68 87 60 86 52Z" fill="${C.deep}" opacity=".45"/>
      <path d="M36 60 C46 63.5 58 63 65 57.5 L65 63 C57 67 45 67 37 64Z" fill="${C.deep}" opacity=".35"/>
      <path d="M71 55 q3 -1.6 6 .2 M66 63 q3 -1.6 6 .2 M76 64 q3 -1.6 6 .2" stroke="${C.deep}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".5"/>`),
    // near legs
    p(m, 'M46.5 73 L47 85 C47 86.8 48.7 87.4 51.4 87.4 C54.1 87.4 55.6 86.8 55.6 85 L55.4 73Z', C.furD),
    p(m, 'M76.5 71 L77 85 C77 86.8 78.7 87.4 81.4 87.4 C84.1 87.4 85.6 86.8 85.6 85 L85.2 70Z', C.furD),
    det(m, `<path d="M47 83.4 C49.6 84.4 53 84.4 55.6 83.4 L55.6 85 C55.6 86.8 54.1 87.4 51.4 87.4 C48.7 87.4 47 86.8 47 85Z" fill="${C.deep}"/>
      <path d="M77 83.4 C79.6 84.4 83 84.4 85.6 83.4 L85.6 85 C85.6 86.8 84.1 87.4 81.4 87.4 C78.7 87.4 77 86.8 77 85Z" fill="${C.deep}"/>
      <path d="M38 83.2 C40 84 43.6 84 45.6 83.2" stroke="#4E2B16" stroke-width="1.6" fill="none" opacity=".6"/><path d="M68 83.2 C70 84 73.6 84 75.6 83.2" stroke="#4E2B16" stroke-width="1.6" fill="none" opacity=".6"/>`),
    // ear (back of the head, high)
    e(m, 56.6, 23.4, 3.9, 3.7, C.furD),
    det(m, `<ellipse cx="56.4" cy="23.8" rx="2.1" ry="1.9" fill="${C.ear}"/>`),
    // head: wide rounded brick, flat front
    p(m, 'M61 27 C54 21.6 36 21 23 24.4 C15.6 26.4 12 30.6 12 37 L12.2 50.5 C12.3 55.6 15.2 58.2 20.4 58.6 C34 59.8 51 60.4 59.6 56.4 C67.4 52.4 68.6 33.4 61 27Z', C.fur),
    det(m, `
      <path d="M13 52 C14 56 16.6 58 20.4 58.4 C34 59.6 51 60.2 59.6 56.2 C63.4 54.2 65.6 49.4 66.4 43.6 C63 51 55 54 44 54.6 C32 55.2 20 54.6 13 52Z" fill="${C.furD}" opacity=".55"/>
      <path d="M22 27.4 C33 24.2 47 23.8 56 26.2" stroke="${C.furH}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>
      <path d="M12.2 37 C12.4 31 16 28.6 21.2 29 C24.6 29.6 26 33 26 38 L26 50 C26 54.4 24 57.4 20.4 58.4 C15.2 58 12.3 55.6 12.2 50.5Z" fill="${C.furD}" opacity=".38"/>
      <path d="M13 34.6 C13.6 30.4 17.6 29 21.6 29.6 C25 30.4 25.6 34 24.6 36.8 C23.6 39.4 19.4 40.4 15.6 39.8 C13.6 39.4 12.8 37.6 13 34.6Z" fill="#86532F"/>
      <ellipse cx="15.4" cy="35.6" rx="1.2" ry="2.1" fill="${C.nose}" transform="rotate(25 15.4 35.6)"/><ellipse cx="20.6" cy="35" rx="1.7" ry="2.4" fill="${C.nose}" transform="rotate(-20 20.6 35)"/>
      <ellipse cx="17.4" cy="31.6" rx="2.6" ry=".9" fill="#fff" opacity=".22"/>
      <path d="M15.4 40.6 L15.4 47.6 Q15.8 52.6 21.2 52.8" stroke="${C.ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="44" cy="34.6" rx="3.7" ry="3.6" fill="${C.ink}"/>
      <circle cx="45.4" cy="33.3" r="1.35" fill="#fff"/><circle cx="42.5" cy="36.3" r=".6" fill="#fff" opacity=".85"/>
      ${blushMarks(42.6, 43.4, 5, 3.1)}
      <path d="M53.4 39.6 l3.6 -.9 M54 44 l3.8 .2 M53.6 48.2 l3.6 1.2" stroke="${C.furD}" stroke-width="1.15" stroke-linecap="round" opacity=".8"/>`),
  ].join('');
}
const PROF_T = 'translate(-10 17) scale(1.15)';
const capyProfile = (m: Mode) => `<g transform="${PROF_T}">${capyProfileRaw(m)}</g>`;

// ---------- friends: black cat, bear, legendary capydindon — same layered sticker style as the mascot
const CAT = { fur: '#2E2A3A', light: '#4A4459', hi: '#5D5672', eye: '#F7D046' };
function catBody(m: Mode) {
  return [
    p(m, 'M68 106 C90 108 98 86 89 73 C86 69 80.6 70.6 82.4 75.6 C88 86 84 96 67 97Z', CAT.fur),
    p(m, 'M19 104 C17 88 29 77 50 77 C71 77 83 88 81 104 C80 113 69 117 50 117 C31 117 20 113 19 104Z', CAT.fur),
    det(m, `<path d="M28 104 C28 94 37 87 50 87 C63 87 72 94 72 104 C66 110 34 110 28 104Z" fill="${CAT.light}" opacity=".7"/>`),
    e(m, 35, 113, 7.5, 4, CAT.light), e(m, 65, 113, 7.5, 4, CAT.light),
    p(m, 'M23 60 L24.5 30 C25 28 27 27.6 28.6 29 L47 43Z', CAT.fur), p(m, 'M77 60 L75.5 30 C75 28 73 27.6 71.4 29 L53 43Z', CAT.fur),
    p(m, 'M21 66 C21 48 33 40 50 40 C67 40 79 48 79 66 C79 84 67 93 50 93 C33 93 21 84 21 66Z', CAT.fur),
    det(m, `<path d="M28.4 50 L28.8 36 L39.6 44Z" fill="#F49AB8"/><path d="M71.6 50 L71.2 36 L60.4 44Z" fill="#F49AB8"/>
      <path d="M21.6 72 C23 86 34 93 50 93 C66 93 77 86 78.4 72 C74 84 64 88 50 88 C36 88 26 84 21.6 72Z" fill="#1F1C28" opacity=".8"/>
      <ellipse cx="50" cy="46" rx="16" ry="4.6" fill="${CAT.hi}" opacity=".7"/>
      <ellipse cx="37" cy="62" rx="7.4" ry="8.4" fill="${CAT.eye}"/><ellipse cx="63" cy="62" rx="7.4" ry="8.4" fill="${CAT.eye}"/>
      <path d="M29.8 64 C31 69.6 34 70.6 37 70.6 C40 70.6 43 69.6 44.2 64 C42 67 32 67 29.8 64Z" fill="#E0A815"/><path d="M55.8 64 C57 69.6 60 70.6 63 70.6 C66 70.6 69 69.6 70.2 64 C68 67 58 67 55.8 64Z" fill="#E0A815"/>
      <ellipse cx="37" cy="63" rx="2.8" ry="6.4" fill="#15121C"/><ellipse cx="63" cy="63" rx="2.8" ry="6.4" fill="#15121C"/>
      <circle cx="39.4" cy="58.6" r="2" fill="#fff"/><circle cx="65.4" cy="58.6" r="2" fill="#fff"/><circle cx="35.4" cy="66.4" r=".9" fill="#fff" opacity=".8"/><circle cx="61.4" cy="66.4" r=".9" fill="#fff" opacity=".8"/>
      <path d="M47 73 C47 71.6 53 71.6 53 73 L50 76.4Z" fill="#F49AB8"/>
      <path d="M50 76.4 v2 M44.6 79 q2.7 2.8 5.4 -.6 q2.7 3.4 5.4 .6" fill="none" stroke="#F3E9FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M30 73 L16 71 M30 77 L17 79 M70 73 L84 71 M70 77 L83 79" stroke="#F3E9FF" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
      ${blushMarks(28.6, 71.6, 4.6, 2.8)}${blushMarks(71.4, 71.6, 4.6, 2.8)}`),
  ].join('');
}
const BEAR = { fur: '#8B5A3C', deep: '#6B4029', hi: '#A8754F', muzzle: '#F2D6B0' };
function bearBody(m: Mode) {
  return [
    p(m, 'M17 103 C15 86 27 75 50 75 C73 75 85 86 83 103 C82 113 70 117 50 117 C30 117 18 113 17 103Z', BEAR.deep),
    det(m, `<ellipse cx="50" cy="99" rx="17" ry="11" fill="${BEAR.hi}"/>`),
    e(m, 33, 113, 8, 4.2, '#4E2D1B'), e(m, 67, 113, 8, 4.2, '#4E2D1B'),
    c(m, 28, 43, 10, BEAR.fur), c(m, 72, 43, 10, BEAR.fur),
    p(m, 'M21 67 C21 48 33 39 50 39 C67 39 79 48 79 67 C79 84 67 93 50 93 C33 93 21 84 21 67Z', BEAR.fur),
    det(m, `<circle cx="28" cy="43" r="5" fill="${BEAR.muzzle}"/><circle cx="72" cy="43" r="5" fill="${BEAR.muzzle}"/>
      <path d="M21.6 72 C23 86 34 93 50 93 C66 93 77 86 78.4 72 C74 84 64 88 50 88 C36 88 26 84 21.6 72Z" fill="${BEAR.deep}" opacity=".6"/>
      <ellipse cx="50" cy="45.6" rx="16" ry="4.8" fill="${BEAR.hi}" opacity=".75"/>
      <ellipse cx="50" cy="75" rx="14" ry="11" fill="${BEAR.muzzle}"/><path d="M37 78 C39 84 44 86 50 86 C56 86 61 84 63 78 C59 82 41 82 37 78Z" fill="#D9B48A"/>
      <ellipse cx="50" cy="70" rx="6.2" ry="4.4" fill="#2A1A10"/><ellipse cx="48" cy="68.6" rx="2" ry="1.1" fill="#fff" opacity=".7"/>
      <path d="M50 74 V77.6 M44.6 78.6 q2.7 3 5.4 -.6 q2.7 3.6 5.4 .6" fill="none" stroke="#2A1A10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="37" cy="59" rx="4.2" ry="4.8" fill="${C.ink}"/><ellipse cx="63" cy="59" rx="4.2" ry="4.8" fill="${C.ink}"/>
      <circle cx="38.4" cy="57.4" r="1.5" fill="#fff"/><circle cx="64.4" cy="57.4" r="1.5" fill="#fff"/>
      ${blushMarks(28.6, 70)}${blushMarks(71.4, 70)}`),
  ].join('');
}
const FAN = ['#B5532A', '#F5B82E', '#E8692A', '#7A4E2E', '#EF4B5F', '#F5B82E', '#B5532A', '#E8692A', '#7A4E2E'];
function dindonBody(m: Mode) {
  let fan = '';
  for (let i = -4; i <= 4; i++) { const a = (i * 21 * Math.PI) / 180; const cx = 50 + Math.sin(a) * 33, cy = 76 - Math.cos(a) * 33;
    fan += e(m, cx, cy, 9, 21, FAN[i + 4], `transform="rotate(${i * 21} ${cx} ${cy})"`) + det(m, `<ellipse cx="${cx}" cy="${cy}" rx="4" ry="15" fill="#fff" opacity=".14" transform="rotate(${i * 21} ${cx} ${cy})"/><circle cx="${50 + Math.sin(a) * 45}" cy="${76 - Math.cos(a) * 45}" r="3" fill="#FFF3C4"/><circle cx="${50 + Math.sin(a) * 45}" cy="${76 - Math.cos(a) * 45}" r="1.5" fill="#2FA4A9"/>`); }
  return fan + capyFront(m) +
    p(m, 'M41 39 C39 29 45 27 47 33 C47 23 55 23 55 33 C57 27 63 29 61 39Z', '#E8344E') + // comb
    p(m, 'M55.6 74 C60.6 78 60.6 90 55.6 91 C51.6 90 51.6 82 53.6 76Z', '#E8344E') + // wattle
    det(m, `<path d="M44.4 69 L50 76.4 L55.6 69 Q50 66.6 44.4 69Z" fill="${P.gold}" stroke="#C9851A" stroke-width="1.2" stroke-linejoin="round"/>`);
}
export const FRIENDS = ['chat', 'ours', 'capydindon'] as const;
/** Each animal: drawing + where accessories sit (acc art is designed around (50,30), hat brims ~y40) + eye line for glasses. */
interface Spec { draw: (m: Mode) => string; at: [number, number, number]; eyes: [number, number][] }
const BODY: Record<string, Spec> = {
  capy: { draw: capyFront, at: [50, 25, 1.3], eyes: [[36.5, 54], [63.5, 54]] },
  capyP: { draw: capyProfile, at: [37, 31.6, 1.12], eyes: [[40.6, 56.6]] },
  chat: { draw: catBody, at: [50, 30, 1.3], eyes: [[37, 62], [63, 62]] },
  ours: { draw: bearBody, at: [50, 28, 1.3], eyes: [[37, 59], [63, 59]] },
  capydindon: { draw: dindonBody, at: [50, 22, 1.3], eyes: [[36.5, 54], [63.5, 54]] },
};
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
  agrume: (m) => e(m, 50, 31, 10.8, 10, '#F7A21B') + det(m, `<ellipse cx="53.5" cy="34.5" rx="7.5" ry="5.5" fill="#E8860C" opacity=".55"/><ellipse cx="46" cy="27.2" rx="3.2" ry="2.2" fill="#FFE2A3" transform="rotate(-25 46 27.2)"/><circle cx="52" cy="30" r=".8" fill="#E8860C"/><circle cx="47" cy="34" r=".8" fill="#E8860C"/><circle cx="55" cy="35.5" r=".8" fill="#D07006"/>`) + p(m, 'M50 22 C52 15 59 14 62 17 C59 21 54 22 50 22Z', '#5FAE57') + det(m, `<path d="M51.5 20.8 Q56 17.5 60.5 17" stroke="#3E8A3A" stroke-width=".9" fill="none" stroke-linecap="round"/><path d="M50 22.5 l-.6 -2.6" stroke="#5B3A1E" stroke-width="1.4" stroke-linecap="round"/>`),
  fraise: (m) => p(m, 'M37 24 C37 18 63 18 63 24 C63 34 55 44 50 44 C45 44 37 34 37 24Z', P.red) + p(m, 'M39 22 L44 15 L50 20 L56 15 L61 22 Z', P.green) + det(m, ['42,28', '50,27', '58,28', '46,35', '54,35', '50,40'].map((q) => `<ellipse cx="${q.split(',')[0]}" cy="${q.split(',')[1]}" rx="1.2" ry="1.8" fill="#FFE08A"/>`).join('')),
  feuille: (m) => p(m, 'M30 36 C34 16 62 12 72 20 C68 36 46 44 30 36Z', P.green) + det(m, `<path d="M33 35 C45 30 58 24 69 21" fill="none" stroke="#2A7F4B" stroke-width="2.2" stroke-linecap="round"/>`),
  couronne: (m) => p(m, 'M33 40 L31 20 L41 29 L50 15 L59 29 L69 20 L67 40 Z', P.gold) + det(m, `<circle cx="50" cy="33" r="3.2" fill="${P.red}"/><circle cx="40" cy="35" r="2.2" fill="${P.teal}"/><circle cx="60" cy="35" r="2.2" fill="${P.teal}"/>`),
  paille: (m) => e(m, 50, 38, 32, 7, '#F2D27A') + p(m, 'M35 38 C35 20 65 20 65 38Z', '#F2D27A') + det(m, `<rect x="35" y="31" width="30" height="5" rx="2" fill="${P.red}"/>`),
  serviette: (m) => p(m, 'M30 38 C30 26 70 26 70 38 L68 42 L32 42Z', '#FFFFFF') + det(m, `<path d="M30 38 C30 26 70 26 70 38 L68 42 L32 42Z" fill="#fff" stroke="${P.sky}" stroke-width="2"/><path d="M38 34 H62" stroke="${P.sky}" stroke-width="2.5" stroke-linecap="round"/>`),
  bonnet: (m) => p(m, 'M30 42 C30 18 70 18 70 42Z', '#5B8DEF') + c(m, 50, 18, 6, '#fff') + det(m, `<rect x="28" y="37" width="44" height="8" rx="4" fill="#fff"/>`),
  lunettes: () => '', // drawn by glasses() on each animal's eyes
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
  // ---- seasonal shop (one per month)
  galette: (m) => p(m, 'M32 41 L32 24 L39 31 L44 20 L50 29 L56 20 L61 31 L68 24 L68 41 Z', '#FFE07A') + det(m, `<rect x="32" y="35" width="36" height="6" fill="#F5B82E"/><path d="M44 20 l0 0M56 20" /><circle cx="44" cy="19.5" r="2.2" fill="${P.red}"/><circle cx="56" cy="19.5" r="2.2" fill="${P.teal}"/><circle cx="50" cy="38" r="1.6" fill="#fff"/>`),
  crepe: (m) => e(m, 50, 36, 22, 7, '#F2C27B') + e(m, 50, 31, 19, 6, '#F7D59A') + det(m, `<circle cx="42" cy="31" r="2" fill="#D9984A" opacity=".7"/><circle cx="55" cy="29.5" r="1.6" fill="#D9984A" opacity=".7"/><circle cx="60" cy="33" r="1.2" fill="#D9984A" opacity=".7"/><path d="M40 28.5 C45 25 54 25 60 28" stroke="#7A4E2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>`),
  parapluie: (m) => p(m, 'M28 32 C30 16 70 16 72 32 C67 29 63 29 60 32 C56 29 53 29 50 32 C47 29 44 29 40 32 C37 29 33 29 28 32Z', '#5B8DEF') + det(m, `<path d="M50 32 V41 q0 3 3 3" stroke="${P.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M40 32 C42 24 46 19 50 17.5 C54 19 58 24 60 32" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6"/><circle cx="50" cy="16" r="2" fill="${P.ink}"/>`),
  cloche: (m) => p(m, 'M37 40 C37 30 40 20 50 19 C60 20 63 30 63 40 Z', '#8A5530') + det(m, `<path d="M37 40 H63" stroke="#6B3E1F" stroke-width="3" stroke-linecap="round"/><path d="M40 30 C45 32 55 32 60 30" stroke="#F5B82E" stroke-width="3" fill="none"/><path d="M50 19 l-6 -5 M50 19 l6 -5" stroke="#FF77B0" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="44" cy="26" rx="2" ry="4" fill="#fff" opacity=".35"/>`),
  muguet: (m) => p(m, 'M36 41 C34 26 42 16 48 14 C44 22 44 32 46 41Z', P.green) + det(m, `<path d="M52 41 C52 30 56 22 62 18" stroke="#2A7F4B" stroke-width="2.2" fill="none" stroke-linecap="round"/>${[[57, 22], [61, 28], [55, 30], [60, 35]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff" stroke="#CFE8D2" stroke-width="1"/>`).join('')}`) + c(m, 58, 21, 3.4, '#fff') + c(m, 61, 28, 3.4, '#fff'),
  cerises: (m) => c(m, 42, 35, 7, P.red) + c(m, 58, 36, 7, '#D93A4E') + det(m, `<path d="M42 28 C44 20 50 16 54 14 M58 29 C57 22 55 18 54 14" stroke="#4E7A2E" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M54 14 C58 10 64 11 66 13 C62 16 57 16 54 14Z" fill="${P.green}"/><circle cx="39.5" cy="32.5" r="1.8" fill="#fff" opacity=".7"/><circle cx="55.5" cy="33.5" r="1.8" fill="#fff" opacity=".7"/>`),
  glace: (m) => p(m, 'M42 30 L50 44 L58 30 Z', '#E9B46A') + c(m, 50, 26, 9, '#FFB7CF') + c(m, 50, 17, 6.5, '#FFF3D6') + det(m, `<path d="M44 33 L55 33 M46 37 L53 37" stroke="#C98B3E" stroke-width="1.3"/><circle cx="46" cy="25" r="1" fill="${P.red}"/><circle cx="53" cy="28" r="1" fill="${P.teal}"/><circle cx="51" cy="23" r="1" fill="#F5B82E"/><circle cx="52" cy="11.5" r="2.4" fill="${P.red}"/>`),
  pasteque: (m) => p(m, 'M30 30 C30 44 70 44 70 30 Z', '#3FAE6A') + p(m, 'M33 30 C33 40 67 40 67 30 Z', '#FF5B6E') + det(m, `<path d="M33 30 C33 40 67 40 67 30" stroke="#fff" stroke-width="1.6" fill="none"/>${[[42, 33], [50, 35], [58, 33], [46, 31.5], [54, 31.5]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1" ry="1.6" fill="${P.ink}"/>`).join('')}`),
  pomme: (m) => p(m, 'M50 22 C44 17 34 20 35 31 C36 40 44 44 50 41 C56 44 64 40 65 31 C66 20 56 17 50 22Z', P.red) + det(m, `<path d="M50 22 C50 18 51 15 53 13" stroke="#6B3E1F" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M53 17 C57 12 63 13 65 15 C61 19 56 19 53 17Z" fill="${P.green}"/><ellipse cx="42" cy="28" rx="2.4" ry="3.4" fill="#fff" opacity=".45"/>`),
  citrouille: (m) => e(m, 50, 32, 17, 11, '#FF8A3D') + det(m, `<path d="M44 22 C40 28 40 37 44 42 M56 22 C60 28 60 37 56 42 M50 21 V43" stroke="#E0661A" stroke-width="1.8" fill="none"/><path d="M50 21 C50 17 52 14 55 13" stroke="#4E7A2E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 30 l3 -2 l3 2 M52 30 l3 -2 l3 2" stroke="${P.ink}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M45 35 Q50 39 55 35" stroke="${P.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),
  chataigne: (m) => p(m, 'M36 38 C36 26 42 19 50 17 C58 19 64 26 64 38 C58 42 42 42 36 38Z', '#8A4B22') + det(m, `<path d="M36 38 C42 42 58 42 64 38 C60 35 40 35 36 38Z" fill="#E8C990"/><path d="M50 17 l0 -4" stroke="#8A4B22" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="44" cy="26" rx="2.4" ry="5" fill="#fff" opacity=".3" transform="rotate(20 44 26)"/>`),
  noel: (m) => p(m, 'M31 41 C33 26 42 16 56 15 C64 15 69 20 70 26 C66 22 62 22 60 26 C64 30 66 36 69 41Z', P.red) + c(m, 70, 27, 5, '#fff') + det(m, `<rect x="29" y="37" width="42" height="8" rx="4" fill="#fff"/>`),
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

function glasses(m: Mode, eyes: [number, number][]) {
  if (m !== 'c') return '';
  const lens = ([x, y]: [number, number]) => `<rect x="${x - 9}" y="${y - 6.5}" width="18" height="13" rx="6" fill="#2B2B3A"/><path d="M${x - 5} ${y - 2.5} l5 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
  if (eyes.length === 2) return lens(eyes[0]) + lens(eyes[1]) + `<path d="M${eyes[0][0] + 9} ${eyes[0][1] - 1} H${eyes[1][0] - 9}" stroke="#2B2B3A" stroke-width="3"/>`;
  const [x, y] = eyes[0]; return `<path d="M${x + 8} ${y - 2} L${x + 21} ${y - 6}" stroke="#2B2B3A" stroke-width="2.6" stroke-linecap="round"/>` + lens(eyes[0]);
}
/** Layered sticker art: shadow, white outline, colour. `flip` mirrors it (profile capybaras face right on tiles). */
export function capyLayers(accId: string, body = true, animal = 'capy', flip = false) {
  if (BODY[accId] && accId !== 'capy') { animal = accId; accId = ''; } // a friend on its own
  const acc = ACC[accId]; const B = BODY[animal] ?? BODY.capy; const [ax, ay, as] = B.at;
  const layer = (m: Mode) => `${body ? B.draw(m) : ''}${accId === 'lunettes' ? glasses(m, B.eyes) : acc ? `<g transform="translate(${ax} ${ay}) scale(${as}) translate(-50 -30)">${acc(m)}</g>` : ''}`;
  const inner = `<g transform="translate(2.2 3.2)">${layer('s')}</g>${layer('o')}${layer('c')}`;
  return flip ? `<g transform="translate(100 0) scale(-1 1)">${inner}</g>` : inner;
}

/** Pose of a tile kind: front (A) or profile (B). Alternates by rank and family so the board feels varied;
 *  both tiles of a pair are the same kind, so they always share a pose. */
export function poseOf(id: string): 'capy' | 'capyP' {
  const k = KIND_BY_ID.get(id)!;
  if (k.suit) return (k.rank! + SUITS.indexOf(k.suit)) % 2 ? 'capyP' : 'capy';
  if (k.group === 'saison') return 'capy';
  if (k.group === 'fleur') return 'capyP';
  return HONORS.indexOf(k.id as typeof HONORS[number]) % 2 ? 'capyP' : 'capy';
}

/** Inner art for a tile face, viewBox 0 0 100 130 */
export function tileArt(id: string, theme: Theme = 'capy'): string {
  const k = KIND_BY_ID.get(id)!; const T = THEME_SUIT[theme];
  if (k.legend) return `<g transform="translate(6 10) scale(.88)">${capyLayers('capydindon')}</g>${badge(k)}`;
  const animal = k.suit ? T[k.suit] : T.honor; const prof = animal === 'capy' && poseOf(id) === 'capyP'; const an = prof ? 'capyP' : animal;
  if (k.suit) return `<g transform="${prof ? 'translate(14 1) scale(.72)' : 'translate(13 1) scale(.74)'}">${capyLayers(k.suit, true, an, prof)}</g>${pips(k.suit, k.rank!)}${badge(k)}`;
  return `<g transform="${prof ? 'translate(2 6) scale(.98)' : 'translate(1 -2) scale(.98)'}">${capyLayers(k.id, true, an, prof)}</g>${badge(k)}`;
}

/** Standalone capybara illustration (viewBox 0 0 100 120) */
export function capySvg(accId: string, extra = '', animal = 'capy') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 112 126">${extra}${capyLayers(accId, true, animal)}</svg>`;
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

export function backSvg(w = 100, h = 130, col: string = P.teal) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" width="${w}" height="${h}"><rect width="100" height="130" rx="16" fill="${col}"/><rect x="7" y="7" width="86" height="116" rx="11" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
  <g fill="#fff" opacity=".9"><ellipse cx="50" cy="72" rx="16" ry="13"/><circle cx="34" cy="52" r="6"/><circle cx="46" cy="45" r="6"/><circle cx="58" cy="45" r="6"/><circle cx="68" cy="53" r="6"/></g></svg>`;
}
