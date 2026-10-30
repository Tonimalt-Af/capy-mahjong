import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
async function shot(name, w, h, mobile, moves) {
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: mobile, isMobile: mobile });
  pg.on('pageerror', (e) => errors.push(e.message));
  await pg.goto('http://localhost:5173/?seed=2026'); await pg.evaluate(() => document.fonts.ready);
  for (let i = 0; i < moves; i++) { const h = await pg.evaluate(() => window.__game.hint()); if (!h) break; for (const id of h) await pg.locator(`.tile[data-id="${id}"]`).dispatchEvent('pointerdown'); }
  if (moves) { const h = await pg.evaluate(() => window.__game.hint()); await pg.locator(`.tile[data-id="${h[0]}"]`).dispatchEvent('pointerdown'); }
  await pg.waitForTimeout(400); await pg.screenshot({ path: `previews/${name}.png` }); await pg.close();
}
await shot('game-mobile-390x844', 390, 844, true, 12);
await shot('game-mobile-landscape-844x390', 844, 390, true, 12);
await shot('game-desktop-1440x900', 1440, 900, false, 20);
await b.close(); console.log('errors', errors);
