// Audit 2026-10-30 regressions (live repros): shuffle soft-lock, bad deep links, corrupted saves, XSS via save data, CSP.
import { test, expect, type Page } from '@playwright/test';
type W = { __game: { state: () => { level: number; left: number; over: boolean; layout: string } | null; tapPairs: (p: [number, number][]) => void; counters: () => { shuffles: number; history: number; paused: boolean } | null; audio: () => string; solveAll: () => void } };
const KEY = 'capy-mahjong-v1';
const BASE = { best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true };
const put = (p: Page, save: unknown, extra: Record<string, string> = {}) => p.addInitScript(([k, v, x]) => { if (!sessionStorage.k) { if (v !== null) localStorage.setItem(k as string, v as string); for (const [a, b] of Object.entries(x as Record<string, string>)) localStorage.setItem(a, b); sessionStorage.k = '1'; } }, [KEY, typeof save === 'string' ? save : save === null ? null : JSON.stringify(save), extra] as const);
const tap = async (p: Page, sel: string) => { const l = p.locator(sel); if (test.info().project.name.startsWith('mobile')) await l.tap(); else await l.click(); };
const L8: [number, number][] = [[16, 46], [31, 62], [7, 17], [39, 51], [8, 23], [22, 63], [15, 40], [0, 24], [52, 58], [38, 53], [6, 37], [1, 25], [36, 59], [35, 57], [5, 45], [4, 44], [32, 34], [14, 43], [26, 54], [33, 42], [9, 55], [13, 47], [41, 60], [18, 48], [30, 49], [12, 56], [10, 11], [3, 29], [19, 28], [20, 27]];

test.beforeEach(async ({ page }) => {
  const errs: string[] = []; const csp: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (/Content.Security.Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
  Object.assign(page, { errs, csp });
});
test.afterEach(async ({ page }) => { const p = page as unknown as { errs: string[]; csp: string[] }; expect(p.errs).toEqual([]); expect(p.csp).toEqual([]); });

test('shuffle soft-lock (level 8 repro): stuck stacked tiles get a clear card with a way out; no shuffle is spent', async ({ page }) => {
  await put(page, { ...BASE, stars: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } }); await page.goto('./?level=7');
  await expect(page.locator('.tile')).toHaveCount(64);
  await page.evaluate((ps) => (window as unknown as W).__game.tapPairs(ps), L8);
  expect((await page.evaluate(() => (window as unknown as W).__game.state()))!.left).toBe(4);
  const card = page.locator('.card.lose'); await expect(card).toBeVisible();
  await expect(card).toContainText(/Tuiles coincées|Plus de coups/);
  await expect(page.locator('#n-retry')).toBeVisible(); await expect(page.locator('#n-map')).toBeVisible();
  const c = await page.evaluate(() => (window as unknown as W).__game.counters()); expect(c).toMatchObject({ shuffles: 0, history: 30, paused: true }); // clock stopped
  await expect(page.locator('#g-shuf-n')).toHaveText('3');
  // undo is still possible (history kept), then the stuck card comes back; Recommencer gives a fresh board
  await tap(page, '#n-undo'); await expect(page.locator('#ov')).toBeHidden();
  expect((await page.evaluate(() => (window as unknown as W).__game.counters()))!.paused).toBe(false);
  await page.evaluate(() => (window as unknown as W).__game.tapPairs([[20, 27]]));
  await expect(page.locator('.card.lose')).toBeVisible(); await tap(page, '#n-retry');
  await expect(page.locator('#ov')).toBeHidden(); expect((await page.evaluate(() => (window as unknown as W).__game.state()))!.left).toBe(64);
});
test('malformed deep links never crash: home (or map) with a notice', async ({ page }) => {
  await put(page, { ...BASE, stars: {} });
  for (const q of ['?level=abc', '?level=-1', '?mode=zen&seed=abc', '?mode=zen&layout=constructor', '?mode=zen&layout=__proto__', '?mode=zen&diff=lol']) {
    await page.goto('./' + q); await expect(page.locator('#v-home')).toBeVisible(); await expect(page.locator('#toast')).toContainText('Lien invalide');
  }
  await page.goto('./?mode=endless&round=40'); expect((await page.evaluate(() => (window as unknown as W).__game.state()))!.layout).toBe('galet'); // always round 1
  await page.goto('./?level=12'); await expect(page.locator('#v-map')).toBeVisible(); await expect(page.locator('#toast')).toContainText('pas encore débloqué');
  expect(new URL(page.url()).search).toBe(''); // link consumed: a reload goes home
});
test('corrupted saves: wrong types are repaired per field, nothing is blank', async ({ page }) => {
  await put(page, { stars: null, theme: 'nope', bg: '"><img src=x onerror=window.__x=1>', carrots: '<img src=x onerror=window.__x=1>', outfit: '<svg onload=window.__x=1>', settings: 7, stats: { won: 'x' }, run: { level: { layout: '__proto__' } } });
  await page.goto('./'); await expect(page.locator('.logo')).toBeVisible(); await expect(page.locator('#h-wallet b')).toHaveText('0');
  expect(await page.locator('#tiledefs symbol').count()).toBeGreaterThan(30);
  await tap(page, '#h-coll'); await expect(page.locator('#v-coll')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
});
test('unreadable save: the backup copy is restored and the broken text kept aside', async ({ page }) => {
  await put(page, '{"carrots": 12, "stars": {', { 'capy-mahjong-v1.bak': JSON.stringify({ ...BASE, carrots: 321, stars: { 0: 3 } }) });
  await page.goto('./'); await expect(page.locator('#h-wallet b')).toHaveText('321'); await expect(page.locator('#toast')).toContainText('copie de secours');
  expect(await page.evaluate(() => localStorage.getItem('capy-mahjong-v1.corrupt'))).toBe('{"carrots": 12, "stars": {');
});
test('XSS: a tampered run title / save strings are shown as text, never executed', async ({ page }) => {
  await put(page, { ...BASE, stars: {}, run: { level: { mode: 'zen', layout: 'galet', n: -1, world: 0, index: 0, seed: 5, par: 100, hints: 99, shuffles: 99, undos: -1, legend: 0, diff: 'facile', title: '<img src=x onerror=window.__x=1>' }, kinds: [], removed: [], history: [], t: 0, hints: 0, shuffles: 0, undos: 0, score: 0, legends: 0, maxCombo: 0 } });
  await page.goto('./'); await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('capy-mahjong-v1')!); return s; });
  expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
});
test('CSP: meta policy present; fonts, home art, audio, service worker and a full game work without violations', async ({ page }) => {
  await put(page, { ...BASE, stars: {} }); await page.goto('./');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'self'"); expect(csp).not.toContain('unsafe-eval'); expect(csp).toContain("object-src 'none'");
  await expect(page.locator('body')).toHaveClass(/home-art/, { timeout: 8000 });
  await tap(page, '#h-play'); await expect(page.locator('#v-game')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as W).__game.audio())).not.toBe('none');
  expect(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('600 16px Fredoka'); })).toBe(true);
  await page.evaluate(() => (window as unknown as W).__game.solveAll()); await expect(page.locator('.card.win')).toBeVisible({ timeout: 5000 });
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 10000 });
  const keys = await page.evaluate(() => caches.keys()); expect(keys.length).toBeGreaterThan(0); for (const k of keys) expect(k).toMatch(/^capy-mahjong-/);
});
test('boot failure shows a recovery screen (copy save / start over), never a blank page', async ({ page }) => {
  await put(page, { ...BASE, carrots: 9 });
  await page.addInitScript(() => { if (sessionStorage.boom) return; sessionStorage.boom = '1'; const o = Element.prototype.insertAdjacentHTML; Element.prototype.insertAdjacentHTML = function (...a) { Element.prototype.insertAdjacentHTML = o; throw new Error('boom'); }; });
  page.removeAllListeners('pageerror');
  await page.goto('./'); await expect(page.locator('.rescue')).toBeVisible(); await expect(page.locator('.rescue')).toContainText('Copier ma sauvegarde');
  await tap(page, '.rescue .danger'); await tap(page, '.rescue .danger'); // confirm
  await expect(page.locator('.logo')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('capy-mahjong-v1.corrupt'))).toContain('"carrots":9');
});
