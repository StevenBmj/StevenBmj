import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const order = {
  id: 'SBMJ-INVOICE-REGRESSION', customerName: 'Client au nom long avec des accents Andre Rene',
  email: 'client.facture@example.test', whatsapp: '+2290155468138',
  address: 'Une adresse complete avec immeuble, appartement et indications de livraison '.repeat(3), city: 'Cotonou',
  notes: 'Instructions de livraison a conserver integralement, sans aucune troncature. '.repeat(9),
  date: '2026-11-12T10:15:00Z', status: 'pending', paymentStatus: 'pending', currency: 'EUR', totalPrice: 3150,
  verificationToken: '00000000-0000-4000-8000-000000000009',
  items: Array.from({ length: 30 }, (_, i) => ({ productId: `item-${i}`, productName: `Creation numero ${i + 1} avec une description longue de tissu et de finitions de qualite `.repeat(2), quantity: 1, price: 100, selectedSize: 'XL' })),
  pricingSnapshot: { version: 1, currency: 'EUR', subtotalCents: 300000, discountCents: 0, discountPercent: 0, promoCode: '', shippingCents: 15000, totalCents: 315000,
    seller: { name: 'StevenBmj', address: 'Cotonou, Benin', phone: '+22955468138', email: 'boutique@example.test' } },
};

test('the preview and downloaded multi-page invoice are the exact same PDF', async ({ page }, testInfo) => {
  page.on('pageerror', error => console.error(error.message));
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
  await page.addInitScript(value => localStorage.setItem('sbmj_last_invoice', JSON.stringify(value)), order);
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('/auth/session')
    ? { user: { id: 'invoice-client', name: order.customerName, email: order.email } } : [] }));
  await page.route('https://wa.me/**', route => route.fulfill({ body: 'WhatsApp test: no message sent.' }));
  await page.goto('/boutique?panel=commande', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('canvas[data-invoice-page][data-rendered="true"]').first()).toBeVisible({ timeout: 20000 });
  expect(await page.locator('canvas[data-invoice-page]').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('canvas[data-invoice-page][data-rendered="true"]').count()).toBe(await page.locator('canvas[data-invoice-page]').count());
  const pixels = await page.locator('canvas[data-invoice-page]').first().evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let light = 0; let gold = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 150 && data[i + 1] > 150 && data[i + 2] > 150) light++;
      if (data[i] > 120 && data[i + 1] > 70 && data[i + 2] < 120) gold++;
    }
    return { light, gold };
  });
  expect(pixels.light).toBeGreaterThan(200);
  expect(pixels.gold).toBeGreaterThan(200);
  const bounds = await page.locator('#invoice-card').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const previewHash = await page.locator('#invoice-card').getAttribute('data-pdf-sha256');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-print-invoice-complete').click();
  const download = await downloadPromise;
  const path = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(path);
  const bytes = await readFile(path);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(previewHash);
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) text += (await (await pdf.getPage(i)).getTextContent()).items.map((item: any) => item.str || '').join(' ');
  expect(text).toContain('client.facture@example.test');
  expect(text).toContain('Creation numero 30');
  expect(text).toContain('SBMJ-INVOICE-REGRESSION');
  expect(text).not.toContain('TOTAL PAYE');
  await loadingTask.destroy();
  await page.screenshot({ path: testInfo.outputPath('invoice-preview.png'), animations: 'disabled' });
});
