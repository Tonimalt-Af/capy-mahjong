// Deliverable previews: B large, B small (real tile sizes), A large. Needs dev server on 5173.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const shot = async (file, w, h, dpr, html) => {
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await pg.goto('http://localhost:5173/art.html'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(800);
  await pg.evaluate(async (h) => { const t = await import('/src/tiles.ts'); document.body.style.margin = '0'; document.body.innerHTML = new Function('t', 'return `' + h + '`')(t); }, html);
  await pg.waitForTimeout(250); await pg.screenshot({ path: file }); await pg.close();
};
const bg = 'background:#E9F3EC;font-family:Fredoka,sans-serif;color:#5a3a22;width:100vw;height:100vh;box-sizing:border-box;padding:20px';
await shot('previews/mascot-B-large.png', 1100, 560, 1, `<div style="${bg};display:flex;gap:24px;align-items:end;justify-content:center">
  <div style="width:520px">\${t.capySvg('', '', 'capyP')}</div><div style="width:480px">\${t.capySvg('agrume', '', 'capyP')}</div></div>`);
await shot('previews/mascot-A-large.png', 1100, 560, 1, `<div style="${bg};display:flex;gap:24px;align-items:end;justify-content:center">
  <div style="width:460px">\${t.capySvg('')}</div><div style="width:440px">\${t.capySvg('agrume')}</div></div>`);
const ids = ['agrume-1', 'agrume-2', 'fraise-1', 'fraise-2', 'feuille-1', 'feuille-2', 'couronne', 'paille', 'serviette', 'bonnet', 'lunettes', 'noeud', 'canard', 'printemps', 'lotus'];
await shot('previews/mascot-B-small.png', 990, 268, 2, `<div style="${bg}">
  <div style="font-size:13px;margin-bottom:6px">Taille réelle en jeu (37×48 px, écran 844×390)</div>
  <div style="display:flex;gap:6px">\${${JSON.stringify(ids)}.map((i) => '<div style="filter:drop-shadow(0 3px 0 #d9b98c)">' + t.faceSvg(i, 37, 48) + '</div>').join('')}</div>
  <div style="font-size:13px;margin:12px 0 6px">Zoom ×2.5</div>
  <div style="display:flex;gap:8px">\${${JSON.stringify(ids.slice(0, 9))}.map((i) => '<div style="filter:drop-shadow(0 4px 0 #d9b98c)">' + t.faceSvg(i, 92, 120) + '</div>').join('')}</div></div>`);
await b.close(); console.log('ok');
