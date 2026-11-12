import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test('password dialog is centred in the viewport and can reveal or hide the password', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === '/api/auth/session' ? { user: { id: 'client', name: 'Client Test', email: 'client@example.test', isAdmin: false } } : path === '/api/settings' ? {} : [] });
  });
  await page.goto('/');
  if (page.viewportSize()!.width < 1280) await page.locator('#btn-mobile-menu-toggle').click();
  else await page.locator('#btn-header-profile').hover();
  await page.getByRole('button', { name: /MODIFIER.*MOT DE PASSE/ }).filter({ visible: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Modifier le mot de passe', exact: true });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(4);
  await dialog.getByLabel('Nouveau mot de passe', { exact: true }).fill('NewPassword123!');
  await dialog.getByRole('button', { name: 'Afficher le mot de passe' }).click();
  await expect(dialog.getByLabel('Nouveau mot de passe', { exact: true })).toHaveAttribute('type', 'text');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
