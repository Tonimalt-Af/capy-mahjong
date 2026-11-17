import { test, expect, type Page } from '@playwright/test';

type Rack = { ids: number[]; busy: boolean; score: number; actions: number; combo: number; removed: number };
type Api = { __game: { prepFusion: () => number | null; prepFull: () => number | null; prepShuffle: () => { score: number } | null; rack: () => Rack | null; phases: () => string[]; playOut: () => void } };
const OPEN = { stars: Object.fromEntries(Array.from({ length: 35 }, (_, i) => [i, 1])), seenRack: true, seenUndo: true, seenHowTo: true };
const seed = (p: Page) => p.addInitScript((e) => {
  if (!sessionStorage.k) {
    localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false, hl: false }, ...e }));
    sessionStorage.k = '1';
  }
}, OPEN);
const rack = (p: Page) => p.evaluate(() => (window as unknown as Api).__game.rack());
const phases = (p: Page) => p.evaluate(() => (window as unknown as Api).__game.phases());
const down = (p: Page, id: number) => p.locator(`.tile[data-id="${id}"]`).dispatchEvent('pointerdown');

test.beforeEach(async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  (page as unknown as { errs: string[] }).errs = errs;
  await seed(page);
});
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('a pair slides together, wobbles, then merges, and a second tap is ignored', async ({ page }) => {
  await page.goto('/?level=6');
  await expect(page.locator('.rack-slot')).toHaveCount(6);
  const id = await page.evaluate(() => (window as unknown as Api).__game.prepFusion());
  expect(id).toBe(3);
  await down(page, 3);
  await page.waitForFunction(() => document.querySelectorAll('.rack-slot.wobble').length === 2, null, { timeout: 4000, polling: 'raf' });
  await down(page, 4);
  await expect.poll(() => phases(page)).toEqual(expect.arrayContaining(['flight', 'slide', 'wobble', 'fusing']));
  await expect.poll(() => rack(page)).toMatchObject({ ids: [1, 2], busy: false, actions: 1 });
  await expect(page.locator('.tile[data-id="4"]')).not.toHaveClass(/gone/);
  await expect(page.locator('.tile[data-id="3"]')).toHaveClass(/gone/);
  await expect(page.locator('.tile[data-id="0"]')).toHaveClass(/gone/);
  const undo = page.locator('#g-undo');
  if (test.info().project.name.startsWith('mobile')) await undo.tap(); else await undo.click();
  await expect.poll(() => rack(page)).toMatchObject({ ids: [0, 1, 2], actions: 0 });
  await expect(page.locator('.tile[data-id="3"]')).not.toHaveClass(/gone/);
});

test('a full rack refuses the tile whose pair is already waiting', async ({ page }) => {
  await page.goto('/?level=6');
  const id = await page.evaluate(() => (window as unknown as Api).__game.prepFull());
  expect(id).not.toBeNull();
  await down(page, id!);
  await expect(page.locator('#toast')).toContainText('plein');
  await expect(page.locator(`.tile[data-id="${id}"]`)).not.toHaveClass(/gone/);
  const held = await rack(page);
  expect(held!.ids).toHaveLength(6);
  expect(held!.removed).toBe((await page.locator('.tile').count()) - 8);
});

test('shuffle flies the rack back, keeps the score, and leaves a clearable board', async ({ page }) => {
  await page.goto('/?level=6');
  const before = await page.evaluate(() => (window as unknown as Api).__game.prepShuffle());
  expect(before!.score).toBe(480);
  const shuf = page.locator('#g-shuf');
  if (test.info().project.name.startsWith('mobile')) await shuf.tap(); else await shuf.click();
  await expect.poll(() => phases(page)).toContain('flyback');
  await expect.poll(() => rack(page)).toMatchObject({ ids: [], busy: false, score: 480, actions: 0, combo: 2 });
  await expect(page.locator('#g-undo')).toBeDisabled();
  await expect(page.locator('#toast')).toContainText('mélangées');
  await expect(page.locator('.pop', { hasText: 'Le haut est libre' })).toHaveCount(0);
  await page.evaluate(() => (window as unknown as Api).__game.playOut());
  await expect(page.locator('.card.win')).toBeVisible({ timeout: 8000 });
});

test('reduced motion merges at once, with no flight and no wobble', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?level=24');
  await expect(page.locator('.rack-slot')).toHaveCount(4);
  await page.evaluate(() => (window as unknown as Api).__game.prepFusion());
  await down(page, 3);
  await expect.poll(() => rack(page)).toMatchObject({ ids: [1, 2], busy: false });
  await expect.poll(() => phases(page)).toContain('instant');
  expect(await phases(page)).not.toContain('wobble');
  await expect(page.locator('.flyer')).toHaveCount(0);
  await expect(page.locator('.rack-slot.wobble')).toHaveCount(0);
  await expect(page.locator('.pop', { hasText: '+' })).toBeVisible();
});
