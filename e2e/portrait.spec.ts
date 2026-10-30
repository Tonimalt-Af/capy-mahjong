import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test('portrait phone shows the rotate screen', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-landscape');
  await page.goto('/'); await expect(page.locator('#rotate')).toBeVisible(); await expect(page.locator('#rotate')).toContainText('Tourne ton téléphone');
});
test('turning the phone to portrait mid-game pauses the clock', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-landscape');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: {}, best: {}, settings: { sfx: false, music: false }, seenHowTo: true, stars: { 0: 1, 1: 1 } })));
  await page.goto('/?level=2'); await expect(page.locator('#rotate')).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __game: { counters: () => { paused: boolean } } }).__game.counters().paused)).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 }); await expect(page.locator('#rotate')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __game: { counters: () => { paused: boolean } } }).__game.counters().paused)).toBe(true);
});
test('rotating portrait ↔ landscape many times: same landscape size → same tile size (iPhone Safari bug)', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-landscape');
  const L = { width: 844, height: 390 };
  await page.setViewportSize(L);
  await page.addInitScript(() => localStorage.setItem('capy-mahjong-v1', JSON.stringify({ stars: { 0: 1, 1: 1 }, best: {}, settings: { sfx: false, music: false }, seenHowTo: true })));
  await page.goto('/?level=2'); await page.waitForTimeout(1200); // deal animation
  const size = () => page.locator('#board .tile').first().evaluate((e) => { const el = e as HTMLElement; return `${el.style.width}×${el.style.height}|${(document.getElementById('board') as HTMLElement).style.width}`; });
  const ref = await size();
  const odd = [{ width: 390, height: 844 }, { width: 600, height: 500 }, { width: 390, height: 664 }, { width: 700, height: 330 }, { width: 844, height: 340 }, { width: 430, height: 932 }];
  for (let i = 0; i < 6; i++) {
    await page.setViewportSize(odd[i]); await page.waitForTimeout(i % 2 ? 30 : 120); // sometimes faster than a frame settle
    await page.setViewportSize(odd[(i + 3) % odd.length]); await page.waitForTimeout(20);
    await page.setViewportSize(L); await page.waitForTimeout(600);
    expect(await size()).toBe(ref);
  }
});
