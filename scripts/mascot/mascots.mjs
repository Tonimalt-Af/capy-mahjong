// Three capybara mascot proposals. Each is drawn in 3 passes like the game's tiles:
// 's' soft shadow, 'o' white sticker outline, 'c' colour. viewBox 0 0 100 120.
export const PAL = { fur: '#B67A4A', furL: '#D19A66', furH: '#E7B98A', furD: '#94603A', deep: '#6E4024', muz: '#C48B5C', nose: '#4A2A18', ink: '#33200F', blush: '#F28C82', pinkEar: '#E9957E' };
const P = PAL;
const OUT = 7;
const sh = (m, fill, extra = '') => m === 'c' ? `fill="${fill}" ${extra}` : m === 'o' ? `fill="#fff" stroke="#fff" stroke-width="${OUT}" stroke-linejoin="round"` : `fill="rgba(80,45,20,.22)" stroke="rgba(80,45,20,.22)" stroke-width="${OUT}" stroke-linejoin="round"`;
const p = (m, d, fill, extra = '') => `<path d="${d}" ${sh(m, fill, extra)}/>`;
const el = (m, cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${sh(m, fill, extra)}/>`;
const det = (m, s) => (m === 'c' ? s : '');
const passes = (fn) => `<g transform="translate(1.8 3.2)">${fn('s')}</g>${fn('o')}${fn('c')}`;

// capybara nose: no dark 'bear' button. A broad darker bridge on top of the blunt muzzle with two comma nostrils.
const nostrils = (x, y, w = 1) => `<path d="M${x - 10 * w} ${y + 1.5} C${x - 8 * w} ${y - 3.5} ${x + 8 * w} ${y - 3.5} ${x + 10 * w} ${y + 1.5} C${x + 5 * w} ${y + 3.5} ${x - 5 * w} ${y + 3.5} ${x - 10 * w} ${y + 1.5}Z" fill="${P.furD}" opacity=".45"/>
  <ellipse cx="${x - 3.6 * w}" cy="${y}" rx="1.3" ry="2.3" fill="${P.nose}" transform="rotate(35 ${x - 3.6 * w} ${y})"/><ellipse cx="${x + 3.6 * w}" cy="${y}" rx="1.3" ry="2.3" fill="${P.nose}" transform="rotate(-35 ${x + 3.6 * w} ${y})"/>`;
// little yuzu (centre x,y, radius r)
const yuzu = (m, x, y, r = 9) => [
  el(m, x, y, r * 1.08, r, '#F7A21B'),
  det(m, `<ellipse cx="${x + r * .35}" cy="${y + r * .35}" rx="${r * .75}" ry="${r * .55}" fill="#E8860C" opacity=".55"/>
    <ellipse cx="${x - r * .4}" cy="${y - r * .38}" rx="${r * .32}" ry="${r * .22}" fill="#FFE2A3" transform="rotate(-25 ${x - r * .4} ${y - r * .38})"/>
    <circle cx="${x + r * .2}" cy="${y - r * .1}" r=".7" fill="#E8860C"/><circle cx="${x - r * .3}" cy="${y + r * .3}" r=".7" fill="#E8860C"/><circle cx="${x + r * .5}" cy="${y + r * .45}" r=".7" fill="#D07006"/>`),
  p(m, `M${x} ${y - r + 1} C${x + 2} ${y - r - 6} ${x + 9} ${y - r - 7} ${x + 12} ${y - r - 4} C${x + 9} ${y - r} ${x + 4} ${y - r + 1} ${x} ${y - r + 1}Z`, '#5FAE57'),
  det(m, `<path d="M${x + 1.5} ${y - r - .2} Q${x + 6} ${y - r - 3.5} ${x + 10.5} ${y - r - 4}" stroke="#3E8A3A" stroke-width=".9" fill="none" stroke-linecap="round"/>
    <path d="M${x} ${y - r + 1.5} l-.6 -2.6" stroke="#5B3A1E" stroke-width="1.4" stroke-linecap="round"/>`),
].join('');

// ---------------- A · "Onsen zen" : front-facing sitting capybara, brick head, sleepy half-closed eyes
export function capyA(yz = true) {
  return passes((m) => [
    // barrel body
    p(m, 'M17 103 C15 86 27 74 50 74 C73 74 85 86 83 103 C82 113 70 117 50 117 C30 117 18 113 17 103Z', P.furD),
    det(m, `<path d="M24 104 C24 92 34 84 50 84 C66 84 76 92 76 104 C70 110 30 110 24 104Z" fill="${P.fur}" opacity=".55"/>
      <path d="M20 108 C30 116 70 116 80 108 C78 114 68 117 50 117 C32 117 22 114 20 108Z" fill="${P.deep}" opacity=".35"/>`),
    // feet
    el(m, 33, 113, 8, 4.2, P.deep), el(m, 67, 113, 8, 4.2, P.deep),
    det(m, `<path d="M30 112.5v2.5M34 112.5v2.5M64 112.5v2.5M68 112.5v2.5" stroke="#4E2B16" stroke-width="1" stroke-linecap="round" opacity=".6"/>`),
    // ears (small, round, high on the head)
    el(m, 31, 38, 5, 4.4, P.furD), el(m, 69, 38, 5, 4.4, P.furD),
    det(m, `<ellipse cx="31.4" cy="38.8" rx="2.4" ry="2" fill="${P.pinkEar}"/><ellipse cx="68.6" cy="38.8" rx="2.4" ry="2" fill="${P.pinkEar}"/>`),
    // head: rounded brick, slightly flared at the cheeks
    p(m, 'M26 50 C26 39 36 35 50 35 C64 35 74 39 74 50 L78 72 C80 87 68 95 50 95 C32 95 20 87 22 72 Z', P.fur),
    det(m, `
      <path d="M21.6 72 C21 86 32 94 50 94 C68 94 79 86 78.4 72 C75 84 66 89 50 89 C34 89 25 84 21.6 72Z" fill="${P.furD}" opacity=".6"/>
      <ellipse cx="50" cy="42" rx="17" ry="5.5" fill="${P.furH}" opacity=".55"/>
      <path d="M45 35.5 q2 -4 4 -.5 q2 -4.5 4 0" fill="none" stroke="${P.furD}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M26 58 l-3 1.5 M26 62 l-3.5 .6 M74 58 l3 1.5 M74 62 l3.5 .6" stroke="${P.furD}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`),
    // muzzle: big, blunt, rectangular
    det(m, `
      <path d="M29 69 C29 60 38 57 50 57 C62 57 71 60 71 69 C71.5 82 62 89 50 89 C38 89 28.5 82 29 69Z" fill="${P.muz}"/>
      <path d="M31 75 C33 83 40 87 50 87 C60 87 67 83 69 75 C64 81 58 83 50 83 C42 83 36 81 31 75Z" fill="${P.furD}" opacity=".35"/>
      <path d="M38 61.5 C42 59.5 58 59.5 62 61.5" stroke="${P.furH}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
      ${nostrils(50, 66)}
      <path d="M50 68.5 v5.7 M44.5 75 q2.8 3 5.5 -.6 q2.7 3.6 5.5 .6" stroke="${P.ink}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    // sleepy half-closed eyes, high and wide apart
    det(m, `
      <path d="M31.5 51.6 Q36.5 49.6 41.5 51.6 Q41 56.6 36.5 56.6 Q32 56.6 31.5 51.6Z" fill="${P.ink}"/>
      <path d="M58.5 51.6 Q63.5 49.6 68.5 51.6 Q68 56.6 63.5 56.6 Q59 56.6 58.5 51.6Z" fill="${P.ink}"/>
      <circle cx="38.6" cy="53.6" r="1.1" fill="#fff"/><circle cx="65.6" cy="53.6" r="1.1" fill="#fff"/>
      <path d="M30.3 51.8 Q36.5 48.8 42.7 51.8 M57.3 51.8 Q63.5 48.8 69.7 51.8" stroke="${P.ink}" stroke-width="1.9" fill="none" stroke-linecap="round"/>
      <path d="M30.6 51.6 l-1.8 -1 M69.4 51.6 l1.8 -1" stroke="${P.ink}" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="27" cy="70" rx="5.5" ry="3.4" fill="${P.blush}" opacity=".75"/><ellipse cx="73" cy="70" rx="5.5" ry="3.4" fill="${P.blush}" opacity=".75"/>
      <path d="M25 68.8 l1.5 -1.4 M28 68.8 l1.5 -1.4 M71 68.8 l1.5 -1.4 M74 68.8 l1.5 -1.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`),
    yz ? yuzu(m, 50, 30, 9) : '',
  ].join(''));
}

// ---------------- B · "Profil" : the iconic side-view loaf, brick head with a flat blunt snout
export function capyB(yz = true) {
  return passes((m) => [
    // body loaf (facing left)
    p(m, 'M36 72 C46 60 72 58 85 67 C96 75 97 99 88 108 C80 116 52 117 38 112 C28 108 26 84 36 72Z', P.furD),
    det(m, `<path d="M44 70 C56 63 74 63 84 70 C76 67 58 67 46 74Z" fill="${P.furH}" opacity=".6"/>
      <path d="M86 78 C93 88 92 102 86 108 C80 113 62 115 48 113 C64 112 80 108 84 98 C87 92 87 84 86 78Z" fill="${P.deep}" opacity=".45"/>
      <path d="M62 80 q3 -2 6 0 M70 88 q3 -2 6 0 M58 92 q3 -2 6 0" stroke="${P.deep}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/>`),
    // legs (short coffee-table legs)
    p(m, 'M37 104 C37 111 38 116 42 116 C46 116 47 111 47 104Z', P.deep), p(m, 'M48 106 C48 112 49 116 53 116 C57 116 58 112 58 106Z', P.deep), p(m, 'M74 105 C74 111 75 116 79 116 C83 116 84 111 84 104Z', P.deep),
    // head: big brick, blunt flat front
    p(m, 'M62 47 C55 39 36 39 22 44 C12 47.5 7 53 6.5 62 L6.5 76 C6.5 85 12 90 22 91 C36 93 54 94 64 85 C72 77 70 56 62 47Z', P.fur),
    det(m, `
      <path d="M8 79 C10 87 16 90 24 90.5 C38 92.5 54 93 63 85.5 C55 88 40 88 26 86 C16 85 10 83 8 79Z" fill="${P.furD}" opacity=".7"/>
      <path d="M18 47 C30 42 48 41 58 46" stroke="${P.furH}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M7.2 58 C7 53 11 49 15 48 C11 52 9.5 56 9.5 62 L9.5 76 C9.5 80 10.5 83 12.5 85 C9 84 7 80 7 76Z" fill="${P.furL}" opacity=".7"/>
      <path d="M50 70 l5 -1 M51 75 l5 .5 M49 64 l4.5 -2" stroke="${P.furD}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`),
    // ear (tiny, high, at the back of the head)
    el(m, 58, 42, 5.5, 5, P.furD),
    det(m, `<ellipse cx="57.5" cy="43" rx="2.6" ry="2.3" fill="${P.pinkEar}"/>`),
    // face
    det(m, `
      <path d="M6.8 53.5 C10 51 17 51 20 55 C16 58.5 10 59 6.8 57.5Z" fill="${P.furD}" opacity=".45"/>
      <ellipse cx="11.5" cy="55.2" rx="1.4" ry="2.6" fill="${P.nose}" transform="rotate(60 11.5 55.2)"/>
      <path d="M8 74 C11 76 15 76 18 73.5" stroke="${P.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M7 70 v4" stroke="${P.ink}" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="38" cy="54.5" rx="3.6" ry="4.2" fill="${P.ink}"/><circle cx="39.3" cy="53" r="1.4" fill="#fff"/><circle cx="37" cy="56.4" r=".6" fill="#fff" opacity=".8"/>
      <path d="M33.5 49.6 Q38 47.6 42.5 49.8" stroke="${P.deep}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="36" cy="69" rx="6.5" ry="4" fill="${P.blush}" opacity=".75"/>
      <path d="M33 67.6 l1.5 -1.4 M36.5 67.6 l1.5 -1.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`),
    yz ? yuzu(m, 40, 37, 8.5) : '',
  ].join(''));
}

// ---------------- C · "Mochi" : chibi, almost all head, shiny open eyes, paws hugging a yuzu, onsen water line
export function capyC(yz = true) {
  return passes((m) => [
    // ears
    el(m, 28, 31, 5.2, 4.6, P.furD), el(m, 72, 31, 5.2, 4.6, P.furD),
    det(m, `<ellipse cx="28.4" cy="31.8" rx="2.5" ry="2" fill="${P.pinkEar}"/><ellipse cx="71.6" cy="31.8" rx="2.5" ry="2" fill="${P.pinkEar}"/>`),
    // one soft "mochi brick" shape: head + body merged, wide and squat
    p(m, 'M16 52 C15 36 30 28 50 28 C70 28 85 36 84 52 L86 92 C87 108 72 116 50 116 C28 116 13 108 14 92 Z', P.fur),
    det(m, `
      <path d="M14.2 90 C13 107 28 116 50 116 C72 116 87 107 85.8 90 C83 104 70 110 50 110 C30 110 17 104 14.2 90Z" fill="${P.furD}" opacity=".65"/>
      <path d="M22 40 C30 32 44 31 50 31" stroke="${P.furH}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M44 29.5 q2.5 -5 5 -.5 q2.5 -5.5 5 0" fill="none" stroke="${P.furD}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M17 64 l-3 1 M17 69 l-3 .2 M83 64 l3 1 M83 69 l3 .2" stroke="${P.furD}" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`),
    // muzzle: tall blunt block
    det(m, `
      <path d="M29 59 C29 50 38 47 50 47 C62 47 71 50 71 59 C71.5 72 62 79 50 79 C38 79 28.5 72 29 59Z" fill="${P.muz}"/>
      <path d="M32 65 C34 73 41 77 50 77 C59 77 66 73 68 65 C63 71 57 73 50 73 C43 73 37 71 32 65Z" fill="${P.furD}" opacity=".35"/>
      ${nostrils(50, 56)}
      <path d="M50 58.5 v3.6 M45 63 q2.5 3 5 -.4 q2.5 3.4 5 .4" stroke="${P.ink}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M47.2 64.4 q2.8 4.6 5.6 0" fill="#E86F6F"/>`),
    // shiny open eyes, small, set high
    det(m, `
      <ellipse cx="32" cy="43" rx="3.6" ry="4.2" fill="${P.ink}"/><ellipse cx="68" cy="43" rx="3.6" ry="4.2" fill="${P.ink}"/>
      <circle cx="33.3" cy="41.5" r="1.4" fill="#fff"/><circle cx="69.3" cy="41.5" r="1.4" fill="#fff"/>
      <circle cx="31" cy="45" r=".7" fill="#fff" opacity=".8"/><circle cx="67" cy="45" r=".7" fill="#fff" opacity=".8"/>
      <ellipse cx="24" cy="60" rx="6" ry="3.6" fill="${P.blush}" opacity=".75"/><ellipse cx="76" cy="60" rx="6" ry="3.6" fill="${P.blush}" opacity=".75"/>
      <path d="M21.5 58.6 l1.5 -1.4 M25 58.6 l1.5 -1.4 M73.5 58.6 l1.5 -1.4 M77 58.6 l1.5 -1.4" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`),
    // onsen water line across the belly
    det(m, `<path d="M14.5 96 C22 92 28 99 36 95 C44 91 50 99 58 95 C66 91 72 99 80 95 C83 94 85 94 85.6 95 L86 100 C87 109 72 116 50 116 C28 116 13 109 14 99Z" fill="#8FD3E8" opacity=".85"/>
      <path d="M22 99 q5 -2 10 0 M58 99 q5 -2 10 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>`),
    // yuzu held in two paws
    yz ? yuzu(m, 50, 88, 9.5) : '',
    el(m, 37, 90, 6, 5, P.furL), el(m, 63, 90, 6, 5, P.furL),
    det(m, `<path d="M34 88.5v3 M37.5 88v3.4 M66 88.5v3 M62.5 88v3.4" stroke="${P.furD}" stroke-width="1" stroke-linecap="round" opacity=".7"/>`),
  ].join(''));
}
