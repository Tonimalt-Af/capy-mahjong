// Phase 3: themed boards per world, one secret level per world (opened with 15 stars), per-world ambience.
import { test, expect, type Page } from '@playwright/test';
type St = { level: number; mode: string; layout: string; seed: number; left: number; over: boolean };
type W = { __game: { state: () => St | null; solveAll: () => void } };
const W_ = (p: Page) => p.evaluate(() => (window as unknown as W).__game.state());
const saveOf = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('capy-mahjong-v1')!));
const tap = async (p: Page, sel: string) => { const l = p.locator(sel); if (test.info().project.name.startsWith('mobile')) await l.tap(); else await l.click(); };
const seed = (p: Page, extra: object = {}) => p.addInitScript((e) => { if (!sessionStorage.k) { localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, ...e })); sessionStorage.k = '1'; } }, extra);
const all = (n: number, v = 3) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, v]));

test.beforeEach(async ({ page }) => { const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message)); (page as unknown as { errs: string[] }).errs = errs; });
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('secret node: locked with the star goal, then opens at 15 stars and plays its own board', async ({ page }) => {
  await seed(page, { stars: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 2 } }); await page.goto('/'); await tap(page, '#h-levels');
  const node = page.locator('.node.secret'); await expect(node).toBeDisabled(); await expect(node.locator('.lname')).toContainText('Secret · 15');
  await expect(node).toHaveAttribute('aria-label', 'Niveau secret : encore 1 étoile dans ce monde');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('capy-mahjong-v1')!); s.stars[5] = 1; localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); });
  await page.reload(); await tap(page, '#h-levels');
  await expect(node).toBeEnabled(); await expect(node.locator('.lname')).toHaveText('La fleur de lotus'); await expect(node.locator('.num')).toHaveText('✦');
  await tap(page, '.node.secret'); const st = (await W_(page))!; expect(st.level).toBe(30); expect(st.layout).toBe('fleur');
  await expect(page.locator('#g-lvl')).toContainText('✦');
  await page.evaluate(() => (window as unknown as W).__game.solveAll());
  await expect(page.locator('.card.win .ribbon')).toContainText('La fleur de lotus');
  const s = await saveOf(page); expect(s.stars[30]).toBeGreaterThan(0); expect(s.ach).toContain('secret1');
  await expect(page.locator('#w-next')).toHaveCount(0); // a secret level leads back to the map, not into the next world
});

test('crossing 15 stars in a world announces its secret level on the win card', async ({ page }) => {
  await seed(page, { stars: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 2 } }); await page.goto('/?level=5');
  expect((await W_(page))!.level).toBe(5);
  await page.evaluate(() => (window as unknown as W).__game.solveAll());
  await expect(page.locator('.card.win .unl.secret')).toContainText('Niveau secret ouvert');
  await expect(page.locator('.card.win .unl.secret')).toContainText('La fleur de lotus');
});

test('a locked secret deep link opens its world map with the goal', async ({ page }) => {
  await seed(page, { stars: all(12, 1) }); await page.goto('/?level=31');
  await expect(page.locator('#v-map .tab.on')).toHaveText('Onsen');
  await expect(page.locator('#toast')).toContainText('15 étoiles dans le monde Onsen');
  expect(await W_(page)).toBeNull();
});

test('every world: 6 different boards + a secret one, nothing shared between worlds, the 7 nodes never overlap', async ({ page }) => {
  await seed(page, { stars: all(35) }); await page.goto('/'); await tap(page, '#h-levels');
  const seen = new Set<string>(); const vp = page.viewportSize()!;
  for (let w = 0; w < 5; w++) {
    await tap(page, `.tab[data-w="${w}"]`);
    const boxes = await page.locator('.node').evaluateAll((els) => els.map((e) => { const r = e.querySelector('.num')!.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    expect(boxes).toHaveLength(7);
    for (const b of boxes) { expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.w).toBeLessThanOrEqual(vp.width); expect(b.y + b.h).toBeLessThanOrEqual(vp.height); }
    for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const a = boxes[i], c = boxes[j]; expect(a.x + a.w <= c.x || c.x + c.w <= a.x || a.y + a.h <= c.y || c.y + c.h <= a.y, `world ${w} nodes ${i}/${j}`).toBe(true); }
    const titles = await page.locator('.node').evaluateAll((els) => els.map((e) => e.getAttribute('title')!.split(' · ')[0]));
    for (const t of titles) { expect(seen.has(t), t).toBe(false); seen.add(t); }
  }
  expect(seen.size).toBe(35);
});

const NEW_BOARDS = ['nenuphar', 'canard', 'lanterne', 'bassin', 'chene', 'cabane', 'feuille', 'sapin', 'bonhomme', 'sommets', 'refuge', 'escalier', 'torii', 'pagode', 'tasse', 'herisson', 'flocon', 'eventail'];
test('all 18 new boards fit the screen with readable tiles (never smaller than the classic turtle)', async ({ page }) => {
  test.setTimeout(90_000); await seed(page); const vp = page.viewportSize()!;
  for (const lay of NEW_BOARDS) {
    await page.goto(`/?mode=zen&seed=2&layout=${lay}`); await page.waitForTimeout(1300);
    const boxes = await page.locator('#board .tile').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, r.width]; }));
    expect(boxes.length, lay).toBeGreaterThan(40);
    for (const [l, t, r, b] of boxes) { expect(l, lay).toBeGreaterThanOrEqual(0); expect(t, lay).toBeGreaterThanOrEqual(0); expect(r, lay).toBeLessThanOrEqual(vp.width); expect(b, lay).toBeLessThanOrEqual(vp.height); }
    expect(Math.min(...boxes.map((b) => b[4])), `${lay} tile width`).toBeGreaterThanOrEqual(30);
  }
});

test('per-world ambience: ripples on the river, leaves in the forest, petals at the temple, snow and steam kept', async ({ page }) => {
  await seed(page, { stars: all(30) }); await page.goto('/'); await tap(page, '#h-levels');
  const vis = (sel: string) => page.locator(sel).evaluate((e) => getComputedStyle(e).display !== 'none');
  await tap(page, '.tab[data-w="0"]'); expect(await vis('.decor .ripple')).toBe(true); expect(await vis('.decor .drift')).toBe(true);
  await tap(page, '.tab[data-w="1"]'); expect(await vis('.decor .steam')).toBe(true); expect(await vis('.decor .drift')).toBe(false);
  await tap(page, '.tab[data-w="2"]'); expect(await vis('.decor .drift')).toBe(true); expect(await vis('.decor .ripple')).toBe(false);
  await tap(page, '.tab[data-w="3"]'); expect(await vis('.decor .snow')).toBe(true);
  await tap(page, '.tab[data-w="4"]'); expect(await vis('.decor .drift')).toBe(true);
  expect(await page.locator('.decor .drift i').first().evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(247, 184, 200)');
});

test('reduced motion: no drifting particles at all', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await seed(page, { stars: all(30) }); await page.goto('/'); await tap(page, '#h-levels'); await tap(page, '.tab[data-w="4"]');
  expect(await page.locator('.decor .drift').evaluate((e) => getComputedStyle(e).display)).toBe('none');
});

test('stars total counts the secret levels (105)', async ({ page }) => {
  await seed(page); await page.goto('/');
  await expect(page.locator('#v-home .total')).toContainText('/ 105');
});
