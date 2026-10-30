// Phase 5 screens: first-pair coach, resume on home, streak/afford nudges, win card with share
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173/';
const out = process.env.OUT || 'previews';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const y = new Date(); y.setDate(y.getDate() - 1);
const vet = { stars: { 0: 3, 1: 2, 2: 3, 3: 2 }, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, outfit: 'paille', owned: ['o:paille'], carrots: 128, ach: ['first'],
  stats: { played: 9, won: 6, pairs: 200, seconds: 1500, bestCombo: 4, perfect: 2, hintsUsed: 1, dailyDone: [dk(y)], dailyStreak: 4, bestStreak: 4, endlessBest: 2, zenWon: 0, legends: 0, carrotsEarned: 300, expertWon: 0, shapes: 0 } };
const fresh = { stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true };
async function ctxFor(tag, vp, mobile, save) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  await pg.addInitScript((s) => { if (!sessionStorage.x) { localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); sessionStorage.x = 1; } }, save);
  return [ctx, pg];
}
const go = async (pg, url) => { for (let i = 0; i < 3; i++) { try { await pg.goto(url); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(900); return; } catch { await pg.waitForTimeout(1500); } } };
for (const [tag, vp, mobile] of [['mobile', { width: 844, height: 390 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  let [ctx, pg] = await ctxFor(tag, vp, mobile, fresh);
  await go(pg, base + '?level=0'); await pg.waitForTimeout(900); await pg.screenshot({ path: `${out}/coach-${tag}.png` }); await ctx.close();
  [ctx, pg] = await ctxFor(tag, vp, mobile, vet);
  await go(pg, base + '?level=4'); await pg.evaluate(() => window.__game.playPairs(9)); await pg.waitForTimeout(300);
  await go(pg, base); await pg.screenshot({ path: `${out}/home-resume-${tag}.png` });
  await go(pg, base + '?mode=daily'); await pg.evaluate(() => window.__game.solveAll()); await pg.waitForTimeout(2600); await pg.screenshot({ path: `${out}/daily-share-${tag}.png` });
  await pg.click('#s-share', { timeout: 1 }).catch(() => {});
  await go(pg, base); await pg.click('#h-settings'); await pg.waitForTimeout(400); await pg.screenshot({ path: `${out}/settings-${tag}.png` });
  await ctx.close();
}
console.log('errors', errors); await b.close();
