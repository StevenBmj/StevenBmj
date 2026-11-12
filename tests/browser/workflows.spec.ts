import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
const client = { id: '00000000-0000-4000-8000-000000000002', name: 'Client Test', email: 'client@example.test', isAdmin: false };
const driver = { ...client, id: '00000000-0000-4000-8000-000000000004', name: 'Driver Test', email: 'driver@example.test' };
const admin = { ...client, id: '00000000-0000-4000-8000-000000000001', name: 'Admin Test', email: 'admin@example.test', isAdmin: true };
const signature = { strokes: [{ points: [{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.8 }, { x: 0.9, y: 0.3 }] }] };
const order = { id: 'SBMJ-WORKFLOW', customerName: 'Client Test', email: client.email, whatsapp: '+2290155468138', address: 'Rue de test', city: 'Cotonou',
  items: [{ productId: 'watch', productName: 'Montre Test', quantity: 1, price: 100 }], totalPrice: 250, currency: 'EUR', date: '2026-11-12T10:00:00Z', status: 'pending', paymentStatus: 'paid', fulfilmentStatus: 'assigned', workflowVersion: 2, assignedDriverId: driver.id };

test('approved driver signs a handover and cannot skip the recipient agreement', async ({ page }, testInfo) => {
  let current = { ...order, fulfilmentStatus: 'out_for_delivery', workflowVersion: 5 };
  let proof: any = null;
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://localhost:3011' ? route.continue() : route.abort());
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const resource = url.searchParams.get('resource');
    let response: any = [];
    if (url.pathname === '/api/auth/session') response = { user: driver };
    else if (url.pathname === '/api/settings') response = {};
    else if (resource === 'driver-profile') response = { profile: { user_id: driver.id, status: 'approved', available: false, phone: order.whatsapp, zone: 'Cotonou' } };
    else if (resource === 'deliveries') response = [current];
    else if (resource === 'order-history') response = { order: current, driverName: driver.name, events: [], proof };
    else if (resource === 'notifications') response = { userId: driver.id, items: [], unreadCount: 0 };
    else if (resource === 'order-action') {
      const body = route.request().postDataJSON();
      expect(body.action).toBe('sign'); expect(body.consent).toBe(true); expect(body.contractVersion).toBe('receipt-v1');
      expect(body.signature.strokes.length).toBeGreaterThan(0);
      current = { ...current, fulfilmentStatus: 'signed', workflowVersion: 6 };
      proof = { order_id: order.id, first_name: body.firstName, signature: body.signature, condition: body.condition, note: body.note, signed_at: '2026-11-12T11:00:00Z' };
      response = { order: current };
    }
    await route.fulfill({ json: response });
  });
  await page.goto('/livraisons?order=SBMJ-WORKFLOW', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#receipt-firstname')).toBeVisible();
  await expect(page.locator('#btn-submit-receipt')).toBeDisabled();
  await page.locator('#receipt-firstname').fill('Client');
  const canvas = page.getByRole('img', { name: 'Signature du destinataire', exact: true });
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 40); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 100, { steps: 20 });
  await page.mouse.move(box.x + box.width - 20, box.y + 30, { steps: 20 }); await page.mouse.up();
  await expect(page.locator('#btn-submit-receipt')).toBeDisabled();
  await page.locator('#receipt-consent').check();
  await page.locator('#btn-submit-receipt').click();
  await expect(page.getByRole('heading', { name: 'Accusé de réception signé', exact: true })).toBeVisible();
  await expect(page.locator('#receipt-firstname')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('signed-delivery.png'), animations: 'disabled' });
});

test('client sees the signed receipt and can dispute instead of declaring satisfaction', async ({ page }) => {
  let current = { ...order, fulfilmentStatus: 'signed', workflowVersion: 6 };
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://localhost:3011' ? route.continue() : route.abort());
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()); const resource = url.searchParams.get('resource');
    let data: any = [];
    if (url.pathname === '/api/auth/session') data = { user: client };
    else if (url.pathname === '/api/settings') data = {};
    else if (url.pathname === '/api/orders') data = [current];
    else if (resource === 'notifications') data = { userId: client.id, items: [], unreadCount: 0 };
    else if (resource === 'order-history') data = { order: current, driverName: driver.name, events: [], proof: { order_id: order.id, first_name: 'Client', signature, condition: 'issue', note: 'Emballage endommagé.', signed_at: order.date } };
    else if (resource === 'order-action') {
      expect(route.request().postDataJSON().action).toBe('dispute');
      current = { ...current, fulfilmentStatus: 'disputed', workflowVersion: 7 }; data = { order: current };
    }
    await route.fulfill({ json: data });
  });
  await page.goto('/compte?order=SBMJ-WORKFLOW', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Accusé de réception signé', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Votre avis (facultatif)' }).fill('Je souhaite signaler un problème avec mon colis.');
  await page.getByRole('button', { name: 'Signaler un problème', exact: true }).click();
  await expect(page.getByText('Réclamation ouverte', { exact: true }).last()).toBeVisible();
});

test('notifications display their real unread count and acknowledgement clears the badge', async ({ page }) => {
  let read = false;
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://localhost:3011' ? route.continue() : route.abort());
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const resource = url.searchParams.get('resource');
    let data: any = [];
    if (url.pathname === '/api/auth/session') data = { user: client };
    else if (url.pathname === '/api/settings') data = {};
    else if (resource === 'notifications') {
      if (route.request().method() === 'PATCH') { read = true; data = { success: true }; }
      else data = { userId: client.id, unreadCount: read ? 0 : 1, items: [{ id: '00000000-0000-4000-8000-000000000090', kind: 'signed', order_id: order.id, created_at: order.date, read_at: read ? order.date : null }] };
    }
    await route.fulfill({ json: data });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const bell = page.getByRole('button', { name: 'Notifications, 1 non lue', exact: true });
  await expect(bell).toBeVisible({ timeout: 30000 });
  await bell.click();
  const dialog = page.getByRole('dialog', { name: 'Notifications', exact: true });
  await expect(dialog).toContainText('Remise signée');
  await dialog.getByRole('button', { name: 'Tout marquer comme lu', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Notifications, 0 non lue', exact: true }).locator('[data-notification-count]')).toHaveCount(0);
});
