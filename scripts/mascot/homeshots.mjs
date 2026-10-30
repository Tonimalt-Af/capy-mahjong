// Home screen self-review at several viewports. Needs dev server on 5173.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h, name] of [[844, 390, 'home-mobile'], [667, 375, 'home-se'], [1440, 900, 'home-desktop'], [1024, 768, 'home-tablet']]) {
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await pg.goto(process.env.URL || 'http://localhost:5173/'); await pg.waitForFunction(() => document.body.classList.contains('home-art'), null, { timeout: 8000 }); await pg.waitForTimeout(900);
  await pg.screenshot({ path: `${process.env.DIR || '/tmp'}/${name}.png` }); await pg.close();
}
await b.close(); console.log('ok');
