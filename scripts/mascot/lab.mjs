// Mascot lab: renders mascots large + tiles at real in-game size and zoomed. Needs the dev server on 5173.
import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/lab.png';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
await pg.goto('http://localhost:5173/art.html'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(600);
await pg.evaluate(async () => {
  const t = await import('/src/tiles.ts');
  const ids = ['agrume-1', 'agrume-2', 'fraise-1', 'fraise-2', 'feuille-1', 'feuille-4', 'couronne', 'paille', 'serviette', 'bonnet', 'lunettes', 'noeud', 'canard', 'printemps', 'lotus', 'capydindon'];
  const big = (svg) => `<div style="width:420px">${svg}</div>`;
  document.body.innerHTML = `<div style="background:#E9F3EC;padding:16px;font-family:Fredoka"><div style="display:flex;gap:10px;align-items:end">
   ${big(t.capySvg('agrume', '', 'capyP'))}${big(t.capySvg('agrume'))}${big(t.capySvg('', '', 'capyP'))}
   <div style="display:flex;flex-direction:column;gap:8px">${['chat', 'ours', 'capydindon'].map((a) => `<div style="width:120px">${t.capySvg(a)}</div>`).join('')}</div></div>
   <div style="display:flex;gap:6px;margin-top:8px">${ids.map((i) => `<div style="filter:drop-shadow(0 3px 0 #d9b98c)">${t.faceSvg(i, 37, 48)}</div>`).join('')}</div>
   <div style="display:flex;gap:8px;margin-top:8px">${ids.slice(0, 9).map((i) => `<div style="filter:drop-shadow(0 4px 0 #d9b98c)">${t.faceSvg(i, 100, 130)}</div>`).join('')}</div></div>`;
});
await pg.waitForTimeout(200); await pg.screenshot({ path: out, fullPage: true }); await b.close(); console.log(out);
