import { test, expect } from '@playwright/test';

test('navigation remains reachable on narrow phones, landscape and tablets', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session')
    ? { user: { id: 'responsive-client', name: 'Un Nom De Client Particulierement Long', email: 'responsive@example.test' } }
    : route.request().url().includes('/settings') ? {} : [] }));
  await page.goto('/boutique');
  for (const width of [320, 360, 375, 390, 412, 430, 768, 820, 1024, 1280]) {
    await page.setViewportSize({ width, height: width > 700 && width < 1100 ? 480 : 850 });
    const menu = page.locator('#btn-mobile-menu-toggle');
    const catalogue = page.locator('#nav-link-boutique');
    if (await menu.isVisible()) {
      const box = await menu.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      await menu.click();
      await expect(page.getByRole('button', { name: 'Catalogue', exact: true }).last()).toBeVisible();
      await menu.click();
    } else {
      await expect(catalogue).toBeVisible();
      const nav = await catalogue.locator('..').boundingBox();
      const brand = await page.locator('.header-brand-link').boundingBox();
      const controls = await page.locator('.header-actions').boundingBox();
      expect(nav!.x + nav!.width).toBeLessThanOrEqual(brand!.x + 1);
      expect(brand!.x + brand!.width).toBeLessThanOrEqual(controls!.x + 1);
      expect(controls!.x + controls!.width).toBeLessThanOrEqual(width);
    }
    if (width === 320 || width === 820) await page.screenshot({ path: testInfo.outputPath(`navigation-${width}.png`), animations: 'disabled' });
  }
});
