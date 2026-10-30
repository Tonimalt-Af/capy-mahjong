import { chromium } from 'playwright';
const [url, out, w, h, full] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, hasTouch: true, isMobile: +w < 600 });
await pg.goto(url); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(500);
await pg.screenshot({ path: out, fullPage: full === '1' }); await b.close();
