import { test, expect, type Page } from '@playwright/test';

type W = { __game: { playPairs: (n: number) => void } };
const OPEN = { stars: Object.fromEntries(Array.from({ length: 35 }, (_, i) => [i, 1])), seenRack: true, seenUndo: true };
const seed = (p: Page, extra: object = {}) => p.addInitScript((e) => {
  if (!sessionStorage.k) {
    localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false, dim: true, vibrate: false }, seenHowTo: true, ...e }));
    sessionStorage.k = '1';
  }
}, extra);

const settle = (p: Page) => p.evaluate(() => Promise.all([...document.querySelectorAll('.tile')].flatMap((e) => e.getAnimations().filter((a) => (a.effect?.getTiming().iterations ?? 1) !== Infinity).map((a) => a.finished))));
const metrics = (p: Page) => p.evaluate(() => {
  const slots = [...document.querySelectorAll('.rack-slot')].map((e) => e.getBoundingClientRect());
  const tiles = [...document.querySelectorAll('.tile')].map((e) => e.getBoundingClientRect());
  const slotL = Math.min(...slots.map((r) => r.left));
  const slotR = Math.max(...slots.map((r) => r.right));
  const visL = Math.min(...tiles.map((r) => r.left));
  const visR = Math.max(...tiles.map((r) => r.right));
  const visT = Math.min(...tiles.map((r) => r.top));
  const stage = document.getElementById('stage')!.getBoundingClientRect();
  const rack = document.getElementById('g-rack')!.getBoundingClientRect();
  return {
    n: slots.length,
    slotW: slots[0].width,
    slotH: slots[0].height,
    tileW: tiles[0].width,
    slotCx: (slotL + slotR) / 2,
    stageCx: stage.left + stage.width / 2,
    visCx: (visL + visR) / 2,
    tileTop: visT,
    rackBottom: rack.bottom,
    rackCx: rack.left + rack.width / 2,
  };
});

test.beforeEach(async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  (page as unknown as { errs: string[] }).errs = errs;
  await seed(page, OPEN);
});
test.afterEach(async ({ page }) => { expect((page as unknown as { errs: string[] }).errs).toEqual([]); });

test('tablet and desktop: rack is centered on the board and slots match the tiles', async ({ page }) => {
  test.skip(test.info().project.name.startsWith('mobile'), 'tablet sizes');
  test.setTimeout(60_000);
  const views = [
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
    { width: 1280, height: 800 },
    { width: 1366, height: 1024 },
    { width: 1440, height: 900 },
  ];
  for (const vp of views) {
    await page.setViewportSize(vp);
    for (const [level, slots] of [[6, 6], [24, 4]] as const) {
      await page.goto(`/?level=${level}`);
      await expect(page.locator('.rack-slot')).toHaveCount(slots);
      await settle(page);
      const m = await metrics(page);
      const tag = `${vp.width}x${vp.height} L${level}`;
      expect(m.n, tag).toBe(slots);
      expect(Math.abs(m.slotCx - m.stageCx), `${tag} stage`).toBeLessThanOrEqual(4);
      expect(Math.abs(m.slotCx - m.visCx), `${tag} board`).toBeLessThanOrEqual(4);
      expect(Math.abs(m.rackCx - m.stageCx), `${tag} row`).toBeLessThanOrEqual(4);
      expect(Math.abs(m.slotW - m.tileW), `${tag} size`).toBeLessThanOrEqual(2);
      expect(m.slotW, tag).toBeGreaterThanOrEqual(72);
      expect(m.slotW, tag).toBeLessThanOrEqual(83);
      expect(m.tileTop, tag).toBeGreaterThanOrEqual(m.rackBottom - 2);
      const rack = await page.locator('#g-rack').boundingBox();
      for (const sel of ['#g-pause', '#g-lvl', '#g-time', '.bar']) {
        const b = await page.locator(sel).boundingBox();
        const hit = !!rack && !!b && rack.x < b.x + b.width && rack.x + rack.width > b.x && rack.y < b.y + b.height && rack.y + rack.height > b.y;
        expect(hit, `${tag} ${sel}`).toBe(false);
      }
    }
  }
});

test('phone landscape keeps the 40×52 band, centered, with tiles at least 44px', async ({ page }) => {
  for (const vp of [{ width: 844, height: 390 }, { width: 667, height: 375 }]) {
    await page.setViewportSize(vp);
    await page.goto('/?level=6');
    await expect(page.locator('.rack-slot')).toHaveCount(6);
    await settle(page);
    const m = await metrics(page);
    const tag = `${vp.width}x${vp.height}`;
    expect(m.slotW, tag).toBeGreaterThanOrEqual(39.5);
    expect(m.slotW, tag).toBeLessThanOrEqual(40.5);
    expect(m.slotH, tag).toBeGreaterThanOrEqual(51.5);
    expect(m.slotH, tag).toBeLessThanOrEqual(52.5);
    expect(m.tileW, tag).toBeGreaterThanOrEqual(44);
    expect(Math.abs(m.slotCx - m.visCx), tag).toBeLessThanOrEqual(4);
    expect(m.tileTop, tag).toBeGreaterThanOrEqual(m.rackBottom - 2);
  }
});

test('a filled rack slot still accepts a tap, and a fusion after resize lands on that slot', async ({ page }) => {
  test.skip(test.info().project.name.startsWith('mobile'), 'resize on the desktop project');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/?level=6');
  await page.waitForTimeout(500);
  await page.locator('.tile:not(.blocked):not(.gone)').first().dispatchEvent('pointerdown');
  const held = page.locator('.rack-slot:not(.empty)');
  await expect(held).toHaveCount(1);
  await held.click();
  await expect(page.locator('#toast')).toHaveText('Elle attend sa paire. Annuler pour la reposer.');
  await page.goto('/?level=6');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(800);
  const grown = await metrics(page);
  expect(grown.slotW).toBeGreaterThanOrEqual(80);
  expect(Math.abs(grown.slotCx - grown.visCx)).toBeLessThanOrEqual(4);
  await page.evaluate(() => (window as unknown as W).__game.playPairs(1));
  await page.waitForSelector('.flyer');
  await page.waitForTimeout(160);
  const dist = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.rack-slot')].map((e) => {
      const r = e.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    const flyers = [...document.querySelectorAll('.flyer')];
    return Math.min(...flyers.map((f) => {
      const r = f.getBoundingClientRect();
      return Math.min(...slots.map((s) => Math.hypot(r.left + r.width / 2 - s.cx, r.top + r.height / 2 - s.cy)));
    }));
  });
  expect(dist).toBeLessThan(24);
  await expect(page.locator('.pop', { hasText: 'Le haut est libre' })).toBeVisible();
  const [pop, rack] = await Promise.all([
    page.locator('.pop', { hasText: 'Le haut est libre' }).boundingBox(),
    page.locator('#g-rack').boundingBox(),
  ]);
  expect(Math.abs(pop!.x + pop!.width / 2 - (rack!.x + rack!.width / 2))).toBeLessThan(8);
});

test('reduced motion skips the fusion flight and still clears the rack', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('/?level=24');
  await expect(page.locator('.rack-slot')).toHaveCount(4);
  await page.evaluate(() => (window as unknown as W).__game.playPairs(1));
  await page.waitForTimeout(80);
  await expect(page.locator('.flyer')).toHaveCount(0);
  await expect(page.locator('.rack-slot:not(.empty)')).toHaveCount(0);
  await expect(page.locator('.pop', { hasText: 'Le haut est libre' })).toBeVisible();
});
