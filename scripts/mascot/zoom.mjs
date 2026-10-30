// Renders a few tile faces large (for eye/readability checks).
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: 1040, height: 170 }, deviceScaleFactor: 2 });
await pg.goto('http://localhost:5173/art.html'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(800);
await pg.evaluate(async () => {
  const t = await import('/src/tiles.ts');
  const ids = (window.IDS = ['agrume-1','agrume-2','fraise-1','feuille-7','couronne','paille','serviette','printemps','lotus']);
  document.body.innerHTML = '<div style="display:flex;gap:10px;padding:10px;background:#E8F2EC">' + ids.map((i) => `${t.faceSvg(i,120,156)}`).join('') + '</div>';
});
await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/zoom.png' }); await b.close();
