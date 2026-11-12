import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://localhost:3011'
    ? route.continue() : route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === '/api/auth/session' ? { user: null } : path === '/api/settings' ? {} : [] });
  });
});

test('footer links reach the shop, services, contact and FAQ without invented offerings', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('navigation', { name: 'Navigation' })).toBeVisible();
  await expect(footer.getByRole('link', { name: /^(formations|blog)$/i })).toHaveCount(0);
  await footer.getByRole('link', { name: 'Boutique', exact: true }).click();
  await expect(page).toHaveURL('/boutique');
  await footer.getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL('/aide');
  await footer.getByRole('link', { name: 'Formulaire de contact' }).click();
  await expect(page).toHaveURL('/contact');
  await footer.getByRole('link', { name: 'FAQ', exact: true }).click();
  await expect(page).toHaveURL('/aide#faq');
  await expect(page.locator('#faq')).toBeInViewport();
});

test('footer opens the requested account form, including repeated registration', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.getByRole('button', { name: 'Inscription', exact: true }).click();
  await expect(page.locator('#auth-input-fullname')).toBeVisible();
  await page.locator('#btn-close-auth-modal').click();
  await footer.getByRole('button', { name: 'Connexion', exact: true }).click();
  await expect(page.locator('#auth-input-email')).toBeVisible();
  await expect(page.locator('#auth-input-fullname')).toHaveCount(0);
  await page.locator('#btn-close-auth-modal').click();
  await footer.getByRole('button', { name: 'Inscription', exact: true }).click();
  await expect(page.locator('#auth-input-fullname')).toBeVisible();
});

test('signed-in clients get their cart and support rather than registration', async ({ page }) => {
  await page.route('**/api/auth/session', route => route.fulfill({ json: { user: { id: 'footer-client', name: 'Client Footer', email: 'client@example.test' } } }));
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('button', { name: 'Inscription', exact: true })).toHaveCount(0);
  await footer.getByRole('button', { name: 'Mon panier', exact: true }).click();
  await expect(page).toHaveURL('/?panel=panier');
});

test('all five legal documents open, scroll, close with Escape and return focus', async ({ page }) => {
  await page.goto('/');
  const legal = page.getByRole('contentinfo').getByRole('navigation', { name: 'Informations légales' });
  for (const label of ['Mentions légales', 'CGV', 'CGU', 'Politique de confidentialité', 'Politique de cookies']) {
    const opener = legal.getByRole('button', { name: label, exact: true });
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();
    if (label === 'Mentions légales') await expect(dialog).toContainText('AMORIN Steven A . S');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
});

test('English footer and cookie document have English labels and content', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sbmj_lang', 'EN'));
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('navigation', { name: 'Account', exact: true })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Register', exact: true })).toBeVisible();
  await footer.getByRole('navigation', { name: 'Legal Information' }).getByRole('button', { name: 'Cookie Policy', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Browser storage');
  await expect(dialog).not.toContainText('Politique');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test('newsletter only acknowledges a successful request and retains failed email for retry', async ({ page }) => {
  await page.route('**/api/newsletter', route => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.getByRole('textbox', { name: 'Votre adresse e-mail' }).fill('client@example.test');
  await footer.getByRole('button', { name: "S'abonner", exact: true }).click();
  await expect(footer.getByRole('alert')).toBeVisible();
  await expect(footer.getByRole('textbox', { name: 'Votre adresse e-mail' })).toHaveValue('client@example.test');
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/newsletter', async route => {
    requests++;
    await pending;
    await route.fulfill({ json: { success: true } });
  });
  await footer.getByRole('button', { name: "S'abonner", exact: true }).click();
  await expect(footer.locator('#btn-footer-subscribe')).toBeDisabled();
  release();
  await expect(footer.getByRole('status')).toContainText("Votre demande d'inscription a été transmise");
  expect(requests).toBe(1);
});

test('footer fits narrow mobile, tablet and desktop and blocks unsafe social URLs', async ({ page }, testInfo) => {
  await page.route('**/api/settings', route => route.fulfill({ json: { instagramUrl: 'javascript:alert(1)', facebookUrl: 'https://facebook.com/StevenBmj' } }));
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(footer.getByRole('link', { name: 'Facebook StevenBmj' })).toHaveAttribute('href', 'https://facebook.com/StevenBmj');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await footer.scrollIntoViewIfNeeded();
    const clipped = await footer.evaluate(element => [...element.querySelectorAll('a,button,input,h2,h3,p')].filter(item => {
      const box = item.getBoundingClientRect();
      return box.width && (box.left < -1 || box.right > window.innerWidth + 1 || item.scrollWidth > item.clientWidth + 2);
    }).map(item => item.textContent));
    expect(clipped, `footer clipping at ${width}px`).toEqual([]);
    await footer.screenshot({ path: testInfo.outputPath(`footer-${width}.png`), animations: 'disabled' });
    if (width === 320) {
      await footer.getByRole('navigation', { name: 'Informations légales' }).getByRole('button', { name: 'Politique de cookies', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(15);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(305);
      await dialog.screenshot({ path: testInfo.outputPath('cookies-320.png') });
      await page.keyboard.press('Escape');
    }
  }
});
