import { test, expect, type Page } from '@playwright/test';

const product = {
  id: 'navigation-watch', name: 'Montre Navigation', nameEn: 'Navigation Watch',
  description: 'Montre de test de navigation.', descriptionEn: 'Navigation test watch.',
  category: 'watches', images: ['/logo.png'], price: 100, stock: 4,
  rating: 5, specs: ['Acier'], isNew: false, isExclu: false,
};
const client = { id: 'navigation-client', name: 'Client Navigation', email: 'navigation@example.test', isAdmin: false, vipPoints: 0 };

async function dismissIntro(page: Page) {
  await expect(page.locator('#intro-screen')).toHaveCount(0, { timeout: 10000 });
}

async function navigate(page: Page, id: string, mobile: boolean) {
  if (mobile) {
    await page.locator('#btn-mobile-menu-toggle').click();
    await page.getByRole('button', { name: id === 'boutique' ? 'Catalogue' : id === 'about' ? 'À Propos' : 'Contact', exact: true }).last().click();
  } else await page.locator(`#nav-link-${id}`).click();
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const body = url.pathname === '/api/products' ? [product]
      : url.pathname === '/api/auth/session' ? { user: client }
      : url.pathname === '/api/settings' ? {} : [];
    await route.fulfill({ status: 200, json: body });
  });
});

test('native back after direct product entry follows shop then home and retains the verified session', async ({ page, isMobile }) => {
  await page.goto('/produit/navigation-watch', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#btn-back-to-boutique')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/boutique');
  await expect(page.locator('#product-card-navigation-watch')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/');
  if (isMobile) {
    await page.locator('#btn-mobile-menu-toggle').click();
    await expect(page.getByText(client.name, { exact: true }).last()).toBeVisible();
    await page.locator('#btn-mobile-menu-toggle').click();
  } else await expect(page.getByRole('button', { name: client.name, exact: true }).first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/');
});

test('native back closes an account dialog before leaving the page', async ({ page, isMobile }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  if (isMobile) await page.locator('#btn-mobile-menu-toggle').click();
  else await page.locator('#btn-header-profile').hover();
  await page.getByRole('button', { name: /MODIFIER.*PASSE/i }).filter({ visible: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL('/contact');
});

test('back and forward visit each page without losing the verified client', async ({ page, isMobile }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissIntro(page);
  await navigate(page, 'boutique', isMobile);
  await expect(page).toHaveURL('/boutique');
  await navigate(page, 'contact', isMobile);
  await expect(page).toHaveURL('/contact');
  await page.goBack();
  await expect(page).toHaveURL('/boutique');
  await expect(page.locator('#product-card-navigation-watch')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await page.goForward();
  await expect(page).toHaveURL('/boutique');
  if (isMobile) {
    await page.locator('#btn-mobile-menu-toggle').click();
    await expect(page.getByText('Client Navigation', { exact: true }).last()).toBeVisible();
    await page.locator('#btn-mobile-menu-toggle').click();
  } else await expect(page.locator('#btn-header-profile')).toContainText('Client Navigation');
  await page.screenshot({ path: testInfo.outputPath('navigation.png'), animations: 'disabled' });
});

test('product, cart and checkout survive back, forward and reload', async ({ page, isMobile }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissIntro(page);
  await navigate(page, 'boutique', isMobile);
  await page.locator('#product-card-navigation-watch').click();
  await expect(page).toHaveURL('/produit/navigation-watch');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await dismissIntro(page);
  await expect(page.locator('#btn-back-to-boutique')).toBeVisible();
  await page.locator('#btn-add-to-cart-detail').click();
  await page.locator('#btn-cart').click();
  await expect(page).toHaveURL('/produit/navigation-watch?panel=panier');
  await page.locator('#btn-checkout-trigger').click();
  await expect(page).toHaveURL('/produit/navigation-watch?panel=commande');
  await page.goBack();
  await expect(page.locator('#cart-drawer-backdrop')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#cart-drawer-backdrop')).toHaveCount(0);
  await expect(page.locator('#btn-back-to-boutique')).toBeVisible();
  await page.goForward();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#intro-screen')).toHaveCount(0);
  await dismissIntro(page);
  await expect(page.locator('#cart-drawer-backdrop')).toContainText('Montre Navigation');
});

test('a directly opened product has a safe in-site back button', async ({ page }) => {
  await page.goto('/produit/navigation-watch', { waitUntil: 'domcontentloaded' });
  await dismissIntro(page);
  await page.locator('#btn-back-to-boutique').click();
  await expect(page).toHaveURL('/boutique');
});

test('the visible back action does not stop on duplicate navigation entries', async ({ page, isMobile }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await dismissIntro(page);
  await navigate(page, 'boutique', isMobile);
  await navigate(page, 'contact', isMobile);
  await navigate(page, 'contact', isMobile);
  await page.locator('#btn-navigation-back').click();
  await expect(page).toHaveURL('/boutique');
  await expect(page.locator('#product-card-navigation-watch')).toBeVisible();
});

test('a saved invoice stays available without reopening checkout on unrelated pages', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sbmj_last_invoice', JSON.stringify({
      id: 'SBMJ-NAVIGATION', customerName: 'Client Navigation', email: 'navigation@example.test',
      whatsapp: '+2290155468138', address: 'Test street', city: 'Cotonou', date: '2026-11-11T12:00:00Z',
      items: [{ productId: 'navigation-watch', productName: 'Montre Navigation', quantity: 1, price: 100 }],
      totalPrice: 250, currency: 'EUR', status: 'pending',
    }));
  });
  await page.goto('/boutique?panel=commande', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#invoice-card')).toBeVisible();
  await expect(page.locator('#invoice-card')).toContainText('SBMJ-NAVIGATION');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL('/boutique?panel=commande');
  await expect(page.locator('#invoice-card')).toBeVisible();
  await expect(page.locator('#invoice-card')).toContainText('SBMJ-NAVIGATION');
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('SBMJ-NAVIGATION', { exact: false })).toHaveCount(0);
  await expect(page.locator('#btn-navigation-back')).toBeVisible();
});

test('returning to administration keeps a server-confirmed administrator session', async ({ page, isMobile }) => {
  await page.route('**/api/auth/session', route => route.fulfill({ json: { user: { ...client, isAdmin: true } } }));
  await page.goto('/god', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#btn-admin-explicit-logout')).toBeVisible();
  await navigate(page, 'boutique', isMobile);
  await expect(page).toHaveURL('/boutique');
  await page.goBack();
  await expect(page).toHaveURL('/god');
  await expect(page.locator('#btn-admin-explicit-logout')).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#btn-admin-explicit-logout')).toBeVisible();
});
