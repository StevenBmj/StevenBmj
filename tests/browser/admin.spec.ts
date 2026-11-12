import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test('English administration translates product and settings labels', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === '/api/auth/session' ? { user: { id: 'admin', name: 'Administrator', email: 'admin@example.test', isAdmin: true } } : path === '/api/settings' ? {} : [] });
  });
  await page.goto('/god?lang=en');
  await page.locator('#btn-admin-tab-products').click();
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByText('Name (French) *', { exact: true })).toBeVisible();
  await expect(page.getByText('Nom Français *', { exact: true })).toHaveCount(0);
  await page.locator('#btn-admin-tab-settings').click();
  await expect(page.getByText('Facebook URL', { exact: true })).toBeVisible();
  await expect(page.getByText('Public page indexing *', { exact: true })).toBeVisible();
});
