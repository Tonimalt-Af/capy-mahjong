import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
const stars = {}; for (let i = 0; i < 9; i++) stars[i] = [3, 2, 3, 1, 3, 2, 3, 3, 2][i];
const save = { stars, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: true }, seenHowTo: true, carrots: 185, owned: ['o:lunettes'], outfit: 'lunettes', ach: ['first', 'perfect', 'world1'],
  stats: { played: 14, won: 12, pairs: 412, seconds: 2710, bestCombo: 4, perfect: 6, hintsUsed: 3, dailyDone: [], dailyStreak: 0, bestStreak: 2, endlessBest: 3, zenWon: 2, fastest: 71 } };
const out = process.env.OUT || 'previews';
async function run(tag, vp, mobile) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errors.push(tag + ': ' + e.message)); pg.on('console', (m) => m.type() === 'error' && errors.push(tag + ' console: ' + m.text()));
  await pg.addInitScript((s) => { if (!sessionStorage.x) { localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); sessionStorage.x = 1; } }, save);
  await pg.goto(base); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(700);
  const snap = (n) => pg.screenshot({ path: `${out}/${n}-${tag}.png` });
  await snap('home');
  await pg.click('#h-modes'); await pg.waitForTimeout(500); await snap('modes');
  await pg.click('#mo-back'); await pg.click('#h-coll'); await pg.waitForTimeout(500); await snap('outfits');
  await pg.click('.tab[data-t="ach"]'); await pg.waitForTimeout(300); await snap('achievements');
  await pg.click('.tab[data-t="stats"]'); await pg.waitForTimeout(300); await snap('stats');
  await pg.click('#c-back'); await pg.click('#h-modes'); await pg.click('#mo-daily'); await pg.waitForTimeout(1500);
  // combo: play 4 pairs quickly
  await pg.evaluate(() => window.__game.playPairs(4)); await pg.waitForTimeout(150); await snap('combo');
  await pg.evaluate(() => window.__game.solveAll()); await pg.waitForTimeout(2300); await snap('daily-win');
  await pg.click('#w-map'); await pg.click('#mo-zen'); await pg.click('.diff[data-d="moyen"]'); await pg.waitForTimeout(1500); await pg.evaluate(() => window.__game.playPairs(3)); await pg.waitForTimeout(900); await snap('zen');
  await pg.click('#g-pause'); await pg.click('#p-map'); await pg.click('#mo-endless'); await pg.waitForTimeout(1500); await pg.evaluate(() => window.__game.solveAll()); await pg.waitForTimeout(2300); await snap('endless-win');
  await pg.evaluate(() => window.__game.stuck()); await pg.waitForTimeout(400); await snap('endless-lose');
  await ctx.close();
}
await run('mobile', { width: 844, height: 390 }, true);
await run('desktop', { width: 1440, height: 900 }, false);
await b.close(); console.log('errors', errors);
