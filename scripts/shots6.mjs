// Phase 6 screens: modes with calendar button, calendar overlay (missed days), late-daily win, HUD undo badge, stats calendar
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:5173/';
const out = process.env.OUT || 'previews';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const errors = [];
const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dk(d); };
const vet = { stars: { 0: 3, 1: 2, 2: 3, 3: 2, 4: 3, 5: 3, 6: 2, 7: 2 }, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, outfit: 'paille', owned: ['o:paille'], carrots: 128, ach: ['first'],
  stats: { played: 19, won: 16, pairs: 400, seconds: 2500, bestCombo: 4, perfect: 2, hintsUsed: 1, dailyDone: [ago(1), ago(2), ago(5), ago(6), ago(7), ago(9), ago(12)], dailyLate: [ago(3), ago(10)], dailyStreak: 2, bestStreak: 3, endlessBest: 2, zenWon: 0, legends: 0, carrotsEarned: 300, expertWon: 0, shapes: 0 } };
async function ctxFor(tag, vp, mobile, save) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errors.push(tag + ': ' + e.message));
  await pg.addInitScript((s) => { if (!sessionStorage.x) { localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); sessionStorage.x = 1; } }, save);
  return [ctx, pg];
}
const go = async (pg, url) => { for (let i = 0; i < 3; i++) { try { await pg.goto(url); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(900); return; } catch { await pg.waitForTimeout(1500); } } };
for (const [tag, vp, mobile] of [['mobile', { width: 844, height: 390 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  const [ctx, pg] = await ctxFor(tag, vp, mobile, vet);
  await go(pg, base); await pg.click('#h-modes'); await pg.waitForTimeout(500); await pg.screenshot({ path: `${out}/modes-cal-${tag}.png` });
  await pg.click('#mo-cal'); await pg.waitForTimeout(500); await pg.screenshot({ path: `${out}/calendar-${tag}.png` });
  await pg.click('.cal .day.miss'); await pg.waitForTimeout(900);
  await pg.evaluate(() => window.__game.playPairs(3)); await pg.click('#g-undo'); await pg.waitForTimeout(400); await pg.screenshot({ path: `${out}/undo-badge-${tag}.png` });
  await pg.evaluate(() => window.__game.solveAll()); await pg.waitForTimeout(2600); await pg.screenshot({ path: `${out}/late-win-${tag}.png` });
  await go(pg, base + '?level=20'); await pg.waitForTimeout(300); await pg.screenshot({ path: `${out}/undo-hard-${tag}.png` });
  await ctx.close();
}
console.log('errors', errors); await b.close();
