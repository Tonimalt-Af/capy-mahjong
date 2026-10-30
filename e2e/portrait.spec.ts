import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test('portrait phone shows the rotate screen', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-landscape');
  await page.goto('/'); await expect(page.locator('#rotate')).toBeVisible(); await expect(page.locator('#rotate')).toContainText('Tourne ton téléphone');
});
