import '@fontsource/fredoka/latin-400.css'; import '@fontsource/fredoka/latin-600.css'; import '@fontsource/fredoka/latin-700.css';
import { PALETTE, faceSvg, backSvg, capySvg, type Theme } from './tiles';
const ids = ['agrume-1', 'agrume-5', 'agrume-9', 'fraise-3', 'fraise-7', 'feuille-2', 'feuille-8', 'couronne', 'serviette', 'canard', 'printemps', 'lotus'];
const sw = (n: string, c: string) => `<div class="sw"><i style="background:${c}"></i><b>${n}</b><span>${c}</span></div>`;
document.body.innerHTML = `<style>
body{margin:0;background:${PALETTE.bg};font-family:Fredoka,sans-serif;color:${PALETTE.ink}}
.w{width:1500px;padding:40px;box-sizing:border-box}h1{font-weight:700;font-size:52px;margin:0}h2{font-weight:600;font-size:26px;margin:28px 0 12px}
.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-end}.t{filter:drop-shadow(0 4px 0 ${PALETTE.side}) drop-shadow(0 8px 10px rgba(0,0,0,.18));text-align:center;font-size:15px}
.sw{display:flex;flex-direction:column;width:110px;font-size:14px}.sw i{height:56px;border-radius:14px;border:4px solid #fff;margin-bottom:4px}.sw span{opacity:.6}
.card{background:#fff8;border-radius:24px;padding:20px 26px;margin-top:10px}ul{margin:6px 0;font-size:18px}</style>
<div class="w"><h1>Mahjong Capybaras — Direction artistique</h1><div style="font-size:20px;opacity:.75">Style sticker kawaii · Police Fredoka (Google Fonts, OFL) · Phase 0</div>
<h2>Palette</h2><div class="row">${[['Crème', PALETTE.cream], ['Pelage', PALETTE.fur], ['Pelage foncé', PALETTE.furDark], ['Encre', PALETTE.ink], ['Joues', PALETTE.blush], ['Agrume', PALETTE.orange], ['Fraise', PALETTE.red], ['Feuille', PALETTE.green], ['Onsen', PALETTE.teal], ['Or', PALETTE.gold], ['Fond', PALETTE.bg]].map(([a, b]) => sw(a, b)).join('')}</div>
<h2>Tuiles (taille réelle 100×130 et petite 40×52)</h2><div class="row">${ids.map((i) => `<div class="t">${faceSvg(i, 100, 130)}<div>${i}</div></div>`).join('')}<div class="t">${backSvg(100, 130)}<div>dos</div></div></div>
<div class="row" style="margin-top:14px">${ids.map((i) => `<div class="t">${faceSvg(i, 40, 52)}</div>`).join('')}<div class="t">${backSvg(40, 52)}</div></div>
<h2>Amis : chat noir, ours, et le légendaire capydindon</h2><div class="row">${['capy', 'chat', 'ours', 'capydindon'].map((a) => `<div class="t" style="width:170px">${capySvg(a === 'capy' ? 'agrume' : a)}<div>${a}</div></div>`).join('')}<div class="t">${faceSvg('capydindon', 100, 130)}<div>tuile légendaire</div></div><div class="t">${faceSvg('capydindon', 40, 52)}</div></div>
<h2>Jeux de tuiles</h2>${(['menagerie', 'chat', 'ours'] as Theme[]).map((t) => `<div class="row" style="margin-bottom:10px"><b style="width:110px">${t}</b>${['agrume-3', 'fraise-5', 'feuille-7', 'couronne', 'canard', 'bonnet'].map((i) => `<div class="t">${faceSvg(i, 70, 91, t)}</div>`).join('')}${['agrume-3', 'fraise-5', 'feuille-7', 'lunettes'].map((i) => `<div class="t">${faceSvg(i, 34, 44, t)}</div>`).join('')}</div>`).join('')}
<h2>Règles du style sticker</h2><div class="card"><ul>
<li>Contour blanc épais (9 u.) autour de chaque capybara et accessoire, ombre douce décalée en bas à droite</li>
<li>Tête ronde et grande, yeux noirs brillants, joues roses, museau large : lisible dès 40 px</li>
<li>Familles distinguées par couleur ET forme du badge : rond = agrume, cœur = fraise, losange = feuille</li>
<li>Honneurs : accessoire unique sans badge ; bonus (saisons, fleurs) : badge étoile dorée et cadre pointillé</li>
<li>Tuile : face crème arrondie, tranche caramel en relief, dos turquoise avec patte de capybara</li></ul></div></div>`;
