import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
const save = { stars: { 0: 3, 1: 2, 2: 3, 3: 1 }, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: true }, seenHowTo: true };
async function run(tag, vp, mobile) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errors.push(tag + ': ' + e.message)); pg.on('console', (m) => m.type() === 'error' && errors.push(tag + ' console: ' + m.text()));
  await pg.addInitScript((s) => { if (!sessionStorage.x) { localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); sessionStorage.x = 1; } }, save);
  await pg.goto(base); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(700);
  const snap = (n) => pg.screenshot({ path: `previews/${n}-${tag}.png` });
  await snap('home');
  await pg.click('#h-help'); await pg.waitForTimeout(500); await snap('howto'); await pg.click('#ht-ok');
  await pg.click('#h-settings'); await pg.waitForTimeout(500); await snap('settings'); await pg.click('#s-ok');
  await pg.click('#h-levels'); await pg.waitForTimeout(600); await snap('map');
  await pg.click('.node[data-n="4"]'); await pg.waitForTimeout(1500);
  await pg.evaluate(() => window.__game.playPairs(6)); await pg.evaluate(() => window.__game.select(1)); await pg.waitForTimeout(500); await snap('game');
  await pg.click('#g-hint'); await pg.waitForTimeout(400); await snap('game-hint');
  await pg.click('#g-pause'); await pg.waitForTimeout(500); await snap('pause'); await pg.click('#p-resume');
  await pg.evaluate(() => window.__game.solveAll()); await pg.waitForTimeout(2200); await snap('win');
  await ctx.close();
}
await run('mobile', { width: 844, height: 390 }, true);
await run('desktop', { width: 1440, height: 900 }, false);
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const pg = await ctx.newPage(); await pg.goto(base); await pg.waitForTimeout(800); await pg.screenshot({ path: 'previews/rotate-portrait.png' });
await b.close(); console.log('errors', errors);
