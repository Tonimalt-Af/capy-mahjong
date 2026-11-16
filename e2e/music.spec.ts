import { test, expect, type Page } from '@playwright/test';

type Snap = { state: string; theme: string | null; pending: string | null; out: string | null; phase: string; on: boolean; audible: string[] };
type W = { __game: { music: () => Snap; setTheme: (id: string) => void; sfx: (n: string) => void; audio: () => string } };
const OPEN = { stars: Object.fromEntries(Array.from({ length: 29 }, (_, i) => [i, 1])), seenRack: true, seenHowTo: true, seenUndo: true };
const tap = async (p: Page, sel: string) => { const l = p.locator(sel); if (test.info().project.name.startsWith('mobile')) await l.tap(); else await l.click(); };
const music = (p: Page) => p.evaluate(() => (window as unknown as W).__game.music());
const aimed = (s: Snap) => s.pending ?? s.theme;

test.beforeEach(async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  (page as unknown as { errs: string[] }).errs = errs;
  await page.addInitScript((extra) => {
    if (sessionStorage.k) return;
    localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: true, music: true, musicVol: 0.4, sfxVol: 0.55, dim: true, vibrate: false }, ...extra }));
    sessionStorage.k = '1';
  }, OPEN);
  await page.goto('/');
});
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('themes follow worlds and modes, and switching does not throw', async ({ page }) => {
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('riviere');

  await tap(page, '#h-levels');
  await tap(page, '.tab[data-w="2"]');
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('foret');
  await tap(page, '.tab[data-w="4"]');
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('temple');
  await tap(page, '.node[data-n="24"]');
  await expect(page.locator('#v-game')).toBeVisible();
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('temple');

  await tap(page, '#g-pause');
  await expect(page.locator('.card.pause')).toBeVisible();
  const paused = await music(page);
  expect(aimed(paused)).toBe('temple');
  expect(paused.audible.length).toBeLessThanOrEqual(2);
  await tap(page, '#p-resume');

  await tap(page, '#g-pause');
  await tap(page, '#p-map');
  await tap(page, '#m-back');
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('riviere');

  await tap(page, '#h-modes');
  await tap(page, '#mo-daily');
  await expect(page.locator('#v-game')).toBeVisible();
  await expect.poll(async () => aimed(await music(page))).toBeTruthy();
  const daily = aimed(await music(page));
  expect(['riviere', 'onsen', 'foret', 'montagne', 'temple']).toContain(daily);

  await tap(page, '#g-pause');
  await tap(page, '#p-map');
  await tap(page, '#mo-zen');
  await tap(page, '.diff[data-d="facile"]');
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('brume');

  await tap(page, '#g-pause');
  await tap(page, '#p-map');
  await tap(page, '#mo-endless');
  await expect.poll(async () => aimed(await music(page)), { timeout: 4000 }).toBe('riviere');

  const burst = await page.evaluate(async () => {
    const api = (window as unknown as W).__game;
    for (const id of ['onsen', 'foret', 'montagne', 'temple', 'brume', 'montagne']) api.setTheme(id);
    await new Promise((r) => setTimeout(r, 1200));
    return api.music();
  });
  expect(burst.audible.length).toBeLessThanOrEqual(2);
  expect([burst.theme, burst.pending]).toContain('montagne');

  await page.evaluate(() => {
    const api = (window as unknown as W).__game;
    api.sfx('fuse'); api.sfx('match'); api.sfx('click');
  });
  expect(await page.evaluate(() => (window as unknown as W).__game.audio())).not.toBe('none');

  await tap(page, '#g-music');
  await tap(page, '#g-music');
  const back = await music(page);
  expect(back.on).toBe(true);
  expect(back.audible.length).toBeLessThanOrEqual(2);

  await page.evaluate(() => {
    let hidden = true;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  if (await page.locator('.card.pause').count()) await tap(page, '#p-resume');
  expect((await music(page)).audible.length).toBeLessThanOrEqual(2);
});
