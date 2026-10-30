// Real in-game board at 844x390 (DPR 3) + zoomed crop of the tiles.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
await pg.addInitScript(() => { if (!sessionStorage.x) { localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: { 0: 3 }, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, seenUndo: true, stats: { won: 5 } })); sessionStorage.x = 1; } });
const lv = process.env.LV || '12';
await pg.goto(`http://localhost:5173/?level=${lv}`); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(1200);
await pg.screenshot({ path: process.env.OUT || 'previews/board-mixed-mobile.png' });
await pg.screenshot({ path: '/tmp/board-zoom.png', clip: { x: 230, y: 90, width: 280, height: 150 } });
console.log(errs); await b.close();
