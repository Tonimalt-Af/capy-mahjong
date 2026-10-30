// Phase 4 screens: friends, carrots shop, tile sets, backgrounds, legend, zen difficulty, shaped boards
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173/';
const out = process.env.OUT || 'previews';
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
const stars = {}; for (let i = 0; i < 9; i++) stars[i] = [3, 2, 3, 1, 3, 2, 3, 3, 2][i];
const today = new Date(); const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const done = [1, 2, 4, 5, 6, 9, 12, 13, 14].map((k) => dk(new Date(today.getFullYear(), today.getMonth(), today.getDate() - k))).filter((k) => k.slice(0, 7) === dk(today).slice(0, 7) || true);
const save = { stars, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: true, hl: true, autohint: false }, seenHowTo: true, outfit: 'lunettes', ach: ['first', 'perfect', 'world1', 'legend1'],
  carrots: 265, owned: ['o:fraise', 'o:lunettes', 'o:paille', 't:menagerie', 'b:nuit'], theme: 'menagerie', bg: 'monde', diff: 'moyen',
  stats: { played: 24, won: 21, pairs: 812, seconds: 4710, bestCombo: 6, perfect: 6, hintsUsed: 3, dailyDone: done, dailyStreak: 3, bestStreak: 4, endlessBest: 5, zenWon: 4, fastest: 71, legends: 1, carrotsEarned: 640, expertWon: 0, shapes: 2 } };
async function run(tag, vp, mobile) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errors.push(tag + ': ' + e.message)); pg.on('console', (m) => m.type() === 'error' && errors.push(tag + ' console: ' + m.text()));
  await pg.addInitScript((s) => { if (!sessionStorage.x) { localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); sessionStorage.x = 1; } }, save);
  const want = (n) => !only || only.includes(n);
  const snap = (n) => want(n) ? pg.screenshot({ path: `${out}/${n}-${tag}.png` }) : null;
  for (let i = 0; i < 3; i++) { try { await pg.goto(base); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(700); break; } catch { await pg.waitForTimeout(1500); } }
  await snap('home');
  await pg.click('#h-modes'); await pg.waitForTimeout(400); await snap('modes');
  await pg.click('#mo-zen'); await pg.waitForTimeout(400); await snap('zen-picker');
  await pg.click('#z-x'); await pg.click('#mo-back');
  await pg.click('#h-coll'); await pg.waitForTimeout(400); await snap('shop-outfits');
  await pg.click('.item[data-s="o"][data-i="noeud"]'); await pg.waitForTimeout(400); await snap('shop-buy'); await pg.click('#b-no');
  await pg.click('.tab[data-t="decor"]'); await pg.waitForTimeout(300); await snap('shop-decor');
  await pg.click('.tab[data-t="stats"]'); await pg.waitForTimeout(300); await snap('stats-cal');
  await pg.click('#c-back');
  for (const [lay, theme, bg] of [['capy', 'menagerie', 'monde'], ['chat', 'chat', 'nuit'], ['ours', 'ours', 'sakura'], ['coeur', 'capy', 'potiron'], ['etoile', 'menagerie', 'monde'], ['champignon', 'capy', 'monde']]) {
    if (!want(`board-${lay}`)) continue;
    await pg.evaluate(([t, g]) => { const s = JSON.parse(localStorage.getItem('capy-mahjong-v1')); s.theme = t; s.bg = g; localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); }, [theme, bg]);
    await pg.goto(`${base}?mode=zen&seed=3&layout=${lay}&legend=1`); await pg.waitForTimeout(1900); await pg.evaluate(() => window.__game.select(1)); await pg.waitForTimeout(250); await snap(`board-${lay}`);
  }
  if (want('legend-win')) {
    await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('capy-mahjong-v1')); s.theme = 'menagerie'; s.bg = 'monde'; s.stats.legends = 0; s.owned = s.owned.filter((x) => x !== 'o:capydindon'); localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); });
    await pg.goto(`${base}?mode=daily`); await pg.waitForTimeout(1500); await pg.evaluate(() => window.__game.solveAll()); await pg.waitForTimeout(2400); await snap('legend-win');
  }
  await ctx.close();
}
await run('mobile', { width: 844, height: 390 }, true);
await run('desktop', { width: 1440, height: 900 }, false);
await b.close(); console.log('errors', errors);
