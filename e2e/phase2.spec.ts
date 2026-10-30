// Audit 2026-10-30, phase 2: save code, shop shelves (seasonal, tile backs, onsen decor), zen links, daily after midnight,
// update toast, keyboard play, rotate gate, French plurals.
import { test, expect, type Page } from '@playwright/test';
type St = { level: number; mode: string; layout: string; seed: number; left: number; over: boolean };
type W = { __game: { state: () => St | null; solveAll: () => void; counters: () => { paused: boolean } }; __upd: (w: unknown) => void };
const W_ = (p: Page) => p.evaluate(() => (window as unknown as W).__game.state());
const saveOf = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('capy-mahjong-v1')!));
const tap = async (p: Page, sel: string) => { const l = p.locator(sel); if (test.info().project.name.startsWith('mobile')) await l.tap(); else await l.click(); };
const seed = (p: Page, extra: object = {}) => p.addInitScript((e) => { if (!sessionStorage.k) { localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, ...e })); sessionStorage.k = '1'; } }, extra);
const OCT = new Date('2026-10-30T12:00:00');

test.beforeEach(async ({ page }) => { const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message)); (page as unknown as { errs: string[] }).errs = errs; });
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('save code: export, then import on another device (validated, confirmed, previous save kept aside)', async ({ page, browser }) => {
  await seed(page, { carrots: 321, stars: { 0: 3, 1: 2 }, owned: ['o:fraise'], outfit: 'fraise' }); await page.goto('/');
  await tap(page, '#h-settings'); await tap(page, '#s-code');
  await expect(page.locator('.card.savecode h2')).toHaveText('Code de sauvegarde');
  const code = await page.locator('#sc-out').inputValue(); expect(code).toMatch(/^CAPY1-[A-Za-z0-9+/=]+-[0-9a-z]+$/);
  // another device with a different save
  const ctx = await browser.newContext(test.info().project.use); const p2 = await ctx.newPage();
  await seed(p2, { carrots: 7 }); await p2.goto('/'); await tap(p2, '#h-settings'); await tap(p2, '#s-code');
  await p2.locator('#sc-in').fill('pas un code'); await tap(p2, '#sc-imp'); await expect(p2.locator('#sc-msg')).toContainText('n\'est pas un code');
  await p2.locator('#sc-in').fill(code.slice(0, -3)); await tap(p2, '#sc-imp'); await expect(p2.locator('#sc-msg')).toContainText(/abîmé|incomplet/);
  await p2.locator('#sc-in').fill(code); await tap(p2, '#sc-imp');
  await expect(p2.locator('#sc-msg')).toContainText('Code valide : 5 étoiles, 321 carottes');
  await Promise.all([p2.waitForEvent('load'), tap(p2, '#sc-imp')]);
  await expect(p2.locator('#h-wallet b')).toHaveText('321');
  const s = await saveOf(p2); expect(s.carrots).toBe(321); expect(s.stars).toEqual({ 0: 3, 1: 2 }); expect(s.outfit).toBe('fraise');
  const kept = await p2.evaluate(() => JSON.parse(localStorage.getItem('capy-mahjong-v1.avant-import')!)); expect(kept.carrots).toBe(7);
  await ctx.close();
});

test('shop: seasonal outfits rotate by month (October: citrouille + pomme), off-season ones are hidden', async ({ page }) => {
  await page.clock.setFixedTime(OCT); await seed(page, { carrots: 1000 }); await page.goto('/');
  await tap(page, '#h-coll');
  await expect(page.locator('#v-coll .shelf.season')).toContainText('De saison');
  const sea = page.locator('#v-coll .shelf.season + .items .item'); await expect(sea).toHaveCount(2);
  await expect(sea.nth(0)).toHaveAttribute('data-i', 'citrouille'); await expect(sea.nth(1)).toHaveAttribute('data-i', 'pomme');
  await expect(sea.nth(0)).toContainText('jusqu\'à fin novembre');
  await expect(page.locator('#v-coll .item[data-i="noel"]')).toHaveCount(0);
  await tap(page, '#v-coll .item[data-i="citrouille"]'); await tap(page, '#b-yes');
  expect((await saveOf(page)).owned).toContain('o:citrouille'); expect((await saveOf(page)).outfit).toBe('citrouille');
});

test('shop: tile backs recolour the tiles; onsen decor shows on the home screen and can be put away', async ({ page }) => {
  await seed(page, { carrots: 500 }); await page.goto('/');
  await tap(page, '#h-coll'); await tap(page, '.tab[data-t="decor"]');
  for (const t of ['Onsen', 'Dos des tuiles', 'Jeux de tuiles', 'Fonds de plateau']) await expect(page.locator('#v-coll')).toContainText(t);
  await tap(page, '#v-coll .item[data-s="k"][data-i="jade"]'); await tap(page, '#b-yes');
  await expect(page.locator('body')).toHaveAttribute('data-edge', 'jade');
  await tap(page, '#v-coll .item[data-s="d"][data-i="lanterne"]'); await tap(page, '#b-yes');
  await expect(page.locator('#v-coll .item[data-s="d"][data-i="lanterne"]')).toContainText('Affiché');
  await tap(page, '#c-back'); await expect(page.locator('#v-home .hdec.dec-lanterne')).toHaveCount(1);
  await page.goto('/?level=0');
  const side = await page.locator('.tile').first().evaluate((e) => getComputedStyle(e).getPropertyValue('--side').trim()); expect(side.toLowerCase()).toBe('#8fd3b5');
  const btn = await page.locator('#g-hint').evaluate((e) => getComputedStyle(e).getPropertyValue('--side2').trim()); expect(btn.toLowerCase()).toBe('#c99a62'); // buttons keep the wood edge
  await page.goto('/'); await tap(page, '#h-coll'); await tap(page, '.tab[data-t="decor"]'); await tap(page, '#v-coll .item[data-s="d"][data-i="lanterne"]');
  expect((await saveOf(page)).decor).toEqual([]); await tap(page, '#c-back'); await expect(page.locator('#v-home .hdec')).toHaveCount(0);
});

test('French plurals: "Il te manque 1 carotte"', async ({ page }) => {
  await seed(page, { carrots: 79 }); await page.goto('/'); await tap(page, '#h-coll'); await tap(page, '.tab[data-t="decor"]');
  await tap(page, '#v-coll .item[data-s="d"][data-i="lanterne"]'); await expect(page.locator('#toast')).toHaveText('Il te manque 1 carotte');
});

test('zen share links open exactly the same board, every time', async ({ page }) => {
  await seed(page); const faces = () => page.locator('#board .tile').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.kind).join());
  await page.goto('/?mode=zen&seed=987654&diff=difficile&layout=tortue'); const a = await W_(page); const fa = await faces();
  await page.goto('/?mode=zen&seed=987654&diff=difficile&layout=tortue'); const b = await W_(page);
  expect([b?.seed, b?.layout]).toEqual([987654, 'tortue']); expect(a?.seed).toBe(987654); expect(await faces()).toBe(fa);
});

test('a daily started before midnight and won after it is a catch-up, never a streak day', async ({ page }) => {
  const y = new Date('2026-10-29T23:58:00');
  await page.clock.setFixedTime(y); await seed(page, { stats: { played: 3 } }); await page.goto('/?mode=daily');
  expect((await W_(page))?.mode).toBe('daily');
  await page.clock.setFixedTime(new Date('2026-10-30T00:03:00'));
  await page.evaluate(() => (window as unknown as W).__game.solveAll());
  await expect(page.locator('.card.win .ribbon')).toContainText('rattrapé');
  const s = await saveOf(page); expect(s.stats.dailyDone).toEqual([]); expect(s.stats.dailyLate).toEqual(['2026-10-29']); expect(s.stats.dailyStreak).toBe(0);
});

test('update toast: "Nouvelle version disponible — Recharger" asks the waiting worker to take over', async ({ page }) => {
  await seed(page); await page.goto('/');
  await page.evaluate(() => { (window as unknown as { sent: unknown[] }).sent = []; (window as unknown as W).__upd({ postMessage: (m: unknown) => (window as unknown as { sent: unknown[] }).sent.push(m) }); });
  await expect(page.locator('#upd')).toContainText('Nouvelle version disponible'); await expect(page.locator('#upd .btn')).toHaveText('Recharger');
  await tap(page, '#upd .btn'); expect(await page.evaluate(() => (window as unknown as { sent: unknown[] }).sent)).toEqual(['skip']);
});

test('keyboard: free tiles are focusable, Enter selects, P pauses', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop');
  await seed(page, { stars: { 0: 1, 1: 1, 2: 1 } }); await page.goto('/?level=3');
  const free = page.locator('#board .tile:not(.blocked)').first(); await expect(free).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#board .tile.blocked').first()).toHaveAttribute('tabindex', '-1');
  await free.focus(); await page.keyboard.press('Enter'); await expect(free).toHaveClass(/sel/); await expect(free).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('p'); await expect(page.locator('.card.pause')).toBeVisible();
});

test('pinch zoom is allowed (no user-scalable=no) and double-tap zoom stays off', async ({ page }) => {
  await seed(page); await page.goto('/');
  expect(await page.locator('meta[name=viewport]').getAttribute('content')).not.toContain('user-scalable');
  expect(await page.evaluate(() => getComputedStyle(document.body).touchAction)).toBe('manipulation');
});
test('every level has its own name: on the map and in game', async ({ page }) => {
  await seed(page, { stars: { 0: 3, 1: 2, 2: 1 } }); await page.goto('/?level=1');
  await expect(page.locator('#g-lvl')).toContainText(/La carotte du goûter|Rivière/);
  await page.goto('/'); await tap(page, '#h-levels');
  await expect(page.locator('.node[data-n="0"] .lname')).toHaveText('Premier plouf');
  await expect(page.locator('.node[data-n="3"] .lname')).toHaveText('Yuzu au fil de l\'eau');
  const names = await page.locator('.node .lname').allTextContents(); expect(new Set(names).size).toBe(names.length);
});
