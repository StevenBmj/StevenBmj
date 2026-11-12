import { test, expect } from '@playwright/test';

const product = { id: 'checkout-watch', name: 'Montre Essai', nameEn: 'Test Watch', price: 100, stock: 5,
  images: ['/logo.png'], category: 'watches', specs: [], description: '', descriptionEn: '', rating: 5 };
const user = { id: 'checkout-user', name: 'Client Essai', email: 'client@example.test' };
const order = { id: 'SBMJ-EXISTING', customerName: user.name, email: user.email, whatsapp: '+33612345678',
  address: 'Adresse confidentielle', city: 'Paris', notes: '', date: '2026-11-12T10:00:00Z', status: 'pending', paymentStatus: 'pending',
  currency: 'EUR', totalPrice: 250, items: [{ productId: product.id, productName: product.name, quantity: 1, price: 100 }] };

test('another account cannot restore a previous customer invoice or draft', async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem('sbmj_last_invoice', JSON.stringify(value));
    localStorage.setItem('sbmj_checkout_draft', JSON.stringify({ userId: 'other-user', customerName: 'Autre Client', email: value.email, address: value.address }));
  }, order);
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session')
    ? { user: { id: 'different-user', name: 'Client Actuel', email: 'different@example.test' } }
    : route.request().url().includes('/products') ? [product] : {} }));
  await page.goto('/boutique?panel=commande');
  await expect(page.locator('#checkout-email')).toHaveValue('different@example.test');
  await expect(page.locator('#checkout-address')).toHaveValue('');
  await expect(page.locator('#invoice-card')).toHaveCount(0);
});

test('editing an invoice preserves the order and updates it only on confirmation', async ({ page }) => {
  await page.addInitScript(value => {
    if (!sessionStorage.getItem('checkout-fixture')) {
      localStorage.setItem('sbmj_last_invoice', JSON.stringify(value));
      sessionStorage.setItem('checkout-fixture', '1');
    }
  }, order);
  const mutations: { method: string; path: string; body: any }[] = [];
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/orders') && request.method() !== 'GET') {
      mutations.push({ method: request.method(), path, body: request.postDataJSON() });
      return route.fulfill({ json: { order: { ...order, address: request.postDataJSON()?.address } } });
    }
    return route.fulfill({ json: path.includes('/auth/session') ? { user } : path.includes('/products') ? [product] : {} });
  });
  await page.goto('/boutique?panel=commande');
  await page.getByRole('button', { name: 'Retour modifier les informations' }).click();
  await expect(page.locator('#checkout-address')).toHaveValue(order.address);
  await expect(page.locator('#checkout-phone-country')).toHaveValue('FR');
  expect(mutations).toEqual([]);
  await page.reload();
  await expect(page.locator('#checkout-address')).toHaveValue(order.address);
  await page.locator('#checkout-address').fill('Nouvelle adresse');
  await page.locator('#btn-submit-order-form').click();
  await expect(page.locator('#invoice-card')).toBeVisible();
  expect(mutations).toHaveLength(1);
  expect(mutations[0].method).toBe('PATCH');
  expect(mutations[0].path).toBe('/api/orders/SBMJ-EXISTING');
  expect(mutations[0].body.address).toBe('Nouvelle adresse');
});
