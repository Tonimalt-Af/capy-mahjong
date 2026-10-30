import { test, expect, type Page } from '@playwright/test';
type W = { __game: { state: () => { level: number; left: number; over: boolean } | null; solveAll: () => void; playPairs: (n: number) => void } };
const mute = (p: Page) => p.addInitScript(() => { if (!sessionStorage.k) { localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: false })); sessionStorage.k = '1'; } });
const tap = async (p: Page, sel: string) => { const l = p.locator(sel); if (test.info().project.name.startsWith('mobile')) await l.tap(); else await l.click(); };

test.beforeEach(async ({ page }) => { const errs: string[] = []; page.on('pageerror', (e) => errs.push(e.message)); (page as unknown as { errs: string[] }).errs = errs; await mute(page); await page.goto('/'); });
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('home shows logo and the four menu entries', async ({ page }) => {
  await expect(page.locator('.logo')).toContainText('Capybaras');
  for (const t of ['Jouer', 'Niveaux', 'Modes', 'Collection']) await expect(page.locator('#v-home')).toContainText(t);
  await expect(page.getByRole('button', { name: 'Réglages' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Comment jouer' })).toBeVisible();
});
test('first play shows tutorial, then level 1 starts', async ({ page }) => {
  await tap(page, '#h-play'); await expect(page.locator('.card.howto')).toBeVisible();
  await tap(page, '#ht-ok'); await expect(page.locator('#v-game')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as W).__game.state()?.level)).toBe(0);
  await expect(page.locator('.tile')).toHaveCount(36);
});
test('tapping tiles: blocked tile shakes, matching pair is removed', async ({ page }) => {
  await page.goto('/?level=0');
  const blocked = page.locator('.tile.blocked').first(); await blocked.dispatchEvent('pointerdown');
  await expect(page.locator('.toast')).toContainText('Tuile bloquée : il lui faut un côté libre');
  await page.evaluate(() => (window as unknown as W).__game.playPairs(1));
  await expect(page.locator('.tile.gone')).toHaveCount(2); await expect(page.locator('#g-pairs')).toHaveText('17 paires');
  await tap(page, '#g-undo'); await expect(page.locator('.tile.gone')).toHaveCount(0);
});
test('hint highlights a pair and decrements the counter', async ({ page }) => {
  await page.goto('/?level=0'); const n = Number(await page.locator('#g-hint-n').textContent());
  await tap(page, '#g-hint'); await expect(page.locator('.tile.hint')).toHaveCount(2); await expect(page.locator('#g-hint-n')).toHaveText(String(n - 1));
});
test('shuffle keeps tile count and a playable board', async ({ page }) => {
  await page.goto('/?level=0'); await tap(page, '#g-shuf'); await expect(page.locator('.tile:not(.gone)')).toHaveCount(36);
  await page.evaluate(() => (window as unknown as W).__game.playPairs(1)); await expect(page.locator('#g-pairs')).toHaveText('17 paires');
});
test('pause stops play and resumes', async ({ page }) => {
  await page.goto('/?level=0'); await tap(page, '#g-pause'); await expect(page.locator('.card.pause')).toBeVisible();
  await tap(page, '#p-resume'); await expect(page.locator('#ov')).toBeHidden();
});
test('winning shows stars, saves progress and unlocks the next level after reload', async ({ page }) => {
  await page.goto('/?level=0'); await page.evaluate(() => (window as unknown as W).__game.solveAll());
  await expect(page.locator('.card.win')).toBeVisible({ timeout: 5000 }); await expect(page.locator('.bigstars .star.on')).not.toHaveCount(0);
  await page.goto('/'); await tap(page, '#h-levels');
  await expect(page.locator('.node[data-n="1"]')).not.toHaveClass(/locked/); await expect(page.locator('.node[data-n="2"]')).toHaveClass(/locked/);
});
test('settings: dimming toggle persists', async ({ page }) => {
  await tap(page, '#h-settings'); await tap(page, '#s-dim'); await tap(page, '#s-ok');
  await page.reload(); expect(await page.evaluate(() => JSON.parse(localStorage.getItem('capy-mahjong-v1')!).settings.dim)).toBe(false);
  await page.goto('/?level=0'); await expect(page.locator('body')).not.toHaveClass(/dim/);
});
test('settings: volume sliders start at the soft defaults and persist', async ({ page }) => {
  await tap(page, '#h-settings');
  await expect(page.locator('#v-music')).toHaveValue('45'); await expect(page.locator('#v-sfx')).toHaveValue('60');
  await expect(page.locator('#v-music')).toBeInViewport(); await expect(page.locator('#v-sfx')).toBeInViewport(); await expect(page.locator('#s-ok')).toBeInViewport();
  await page.locator('#v-music').fill('20'); await page.locator('#v-sfx').fill('80'); await tap(page, '#s-ok');
  await page.reload(); const st = await page.evaluate(() => JSON.parse(localStorage.getItem('capy-mahjong-v1')!).settings);
  expect(st.musicVol).toBeCloseTo(0.2); expect(st.sfxVol).toBeCloseTo(0.8);
  await tap(page, '#h-settings'); await expect(page.locator('#v-music')).toHaveValue('20');
});
test('world map: locked world tabs are disabled', async ({ page }) => {
  await tap(page, '#h-levels'); await expect(page.locator('.tab[data-w="1"]')).toBeDisabled(); await expect(page.locator('.node')).toHaveCount(6);
});
test('board fits inside the stage', async ({ page }) => {
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('capy-mahjong-v1')!); s.stars = Object.fromEntries(Array.from({ length: 29 }, (_, i) => [i, 1])); localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); });
  for (const lv of [0, 10, 29]) {
    await page.goto(`/?level=${lv}`); await page.waitForTimeout(1200);
    const ok = await page.evaluate(() => { const s = document.getElementById('stage')!.getBoundingClientRect(); return [...document.querySelectorAll('.tile')].every((t) => { const r = t.getBoundingClientRect(); return r.left >= s.left - 12 && r.right <= s.right + 12 && r.top >= s.top - 12 && r.bottom <= s.bottom + 12; }); });
    expect(ok, `level ${lv}`).toBe(true);
  }
});
test('PWA: manifest and service worker', async ({ page }) => {
  const m = await (await page.request.get('/manifest.webmanifest')).json(); expect(m.orientation).toBe('landscape'); expect(m.icons.length).toBeGreaterThan(1);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.getRegistration().then((r) => !!r?.active), null, { timeout: 10000 });
});
test('offline: game still loads after first visit', async ({ page, context }) => {
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 10000 });
  await expect(async () => { await page.reload(); expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true); }).toPass({ timeout: 20000 }); await context.setOffline(true); await page.reload(); await expect(page.locator('.logo')).toBeVisible(); await expect(page.locator('body')).toHaveClass(/home-art/); await context.setOffline(false);
});
test('home illustration lazy-loads and share/icon assets exist', async ({ page }) => {
  await expect(page.locator('body')).toHaveClass(/home-art/, { timeout: 8000 });
  const bg = await page.evaluate(() => getComputedStyle(document.getElementById('v-home')!, '::before').backgroundImage); expect(bg).toContain('home-bg.webp');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content'); expect(og).toBe('https://tonimalt-af.github.io/capy-mahjong/og-image.jpg');
  for (const u of ['/og-image.jpg', '/home-bg.webp', '/icons/favicon-32.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']) expect((await page.request.get(u)).status(), u).toBe(200);
  expect(await (await page.request.get('/sw.js')).text()).toContain('home-bg.webp');
});
