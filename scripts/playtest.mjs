// Real-input playtest: taps every pair with touch/mouse, measures FPS under 4x CPU throttle, tile sizes, long tasks.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4173/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const save = { stars: {}, best: {}, settings: { sfx: true, music: true, dim: true, vibrate: false }, seenHowTo: true };
for (const [tag, vp, mobile] of [['mobile', { width: 844, height: 390 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  for (const lv of [0, 14, 29]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1 });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    await pg.addInitScript((s) => localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)), save);
    const cdp = await ctx.newCDPSession(pg); if (mobile) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await pg.goto(base + '?level=' + lv); await pg.waitForTimeout(1500);
    const tileW = await pg.evaluate(() => document.querySelector('.tile').getBoundingClientRect().width);
    await pg.evaluate(() => { window.__f = []; let l = performance.now(); const f = (t) => { window.__f.push(t - l); l = t; requestAnimationFrame(f); }; requestAnimationFrame(f); window.__lt = 0; new PerformanceObserver((o) => o.getEntries().forEach((e) => (window.__lt = Math.max(window.__lt, e.duration)))).observe({ entryTypes: ['longtask'] }); });
    const t0 = Date.now(); let n = 0;
    for (;;) {
      const p = await pg.evaluate(() => window.__game.next()); if (!p) break;
      for (const id of p) { const r = await pg.locator(`.tile[data-id="${id}"]`).boundingBox(); const x = r.x + r.width * 0.6, y = r.y + r.height * 0.6; if (mobile) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); }
      n++; await pg.waitForTimeout(120);
    }
    await pg.waitForTimeout(1200);
    const res = await pg.evaluate(() => { const f = window.__f.slice(5).sort((a, b) => a - b); const avg = f.reduce((a, b) => a + b, 0) / f.length; return { fps: Math.round(1000 / avg), p95ms: Math.round(f[Math.floor(f.length * 0.95)]), maxLongTask: Math.round(window.__lt), win: !!document.querySelector('.card.win'), left: window.__game.state().left }; });
    console.log(tag, 'L' + (lv + 1), `tileW=${tileW.toFixed(0)}px`, `pairs=${n}`, `${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(res), errs.length ? errs : '');
    await ctx.close();
  }
}
// mode boot cost (fairSeed)
const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const pg = await ctx.newPage(); const cdp = await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await pg.goto(base); for (const m of ['daily', 'endless&round=15', 'zen&seed=7']) { const t = await pg.evaluate(async (m) => { const s = performance.now(); history.replaceState(null, '', '?mode=' + m); return s; }, m); await pg.goto(base + '?mode=' + m); const ms = await pg.evaluate(() => performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd); console.log('boot', m, Math.round(ms) + 'ms (4x throttle)'); }
await b.close();
