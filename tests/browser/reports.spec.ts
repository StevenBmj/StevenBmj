import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { salesReport } from '../../src/server/reports';

test('admin reports display real totals and export both comparison periods', async ({ page }, testInfo) => {
  const dates = { from: '2026-11-12', to: '2026-11-12', previousFrom: '2026-11-11', previousTo: '2026-11-11' };
  const report = salesReport([
    { id: 'paid', date: '2026-11-12T10:00:00Z', status: 'delivered', payment_status: 'paid', total_price: 100.25, currency: 'EUR', email: 'client@example.test', customer_name: 'Client Essai',
      items: [{ productId: 'watch', productName: 'Montre Essai', quantity: 1, price: 100.25 }] },
    { id: 'pending', date: '2026-11-12T10:00:00Z', status: 'pending', payment_status: 'pending', total_price: 200, currency: 'EUR' },
    { id: 'previous', date: '2026-11-11T10:00:00Z', status: 'delivered', payment_status: 'paid', total_price: 50, currency: 'EUR' },
  ], dates);
  const queries: string[] = [];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url());
    if (path.pathname === '/api/analytics') { queries.push(path.search); return route.fulfill({ json: report }); }
    return route.fulfill({ json: path.pathname.includes('/auth/session') ? { user: { id: 'admin', name: 'Admin', isAdmin: true, email: 'admin@example.test' } }
      : path.pathname === '/api/settings' ? {} : [] });
  });
  await page.goto('/god');
  const region = page.getByRole('region', { name: 'Rapports des ventes' });
  await expect(region.getByText('Client Essai', { exact: true })).toBeVisible();
  await expect(region.getByText('Montre Essai', { exact: true })).toBeVisible();
  await expect(region).toContainText('100,25');
  await expect(region).toContainText('100.5%');
  await expect(region).toContainText('coûts et charges manquants');
  await expect(region).not.toContainText('1 287 650');
  await region.getByRole('combobox', { name: 'Période', exact: true }).selectOption('custom');
  await expect.poll(() => queries.some(query => query.includes('from=2026-11-12'))).toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await region.getByRole('button', { name: 'CSV', exact: true }).click();
  const download = await downloadPromise;
  const path = testInfo.outputPath('sales.csv'); await download.saveAs(path);
  const csv = await readFile(path, 'utf8');
  expect(csv).toContain('"current";"2026-11-12"');
  expect(csv).toContain('"previous";"2026-11-11"');
  expect(csv).toContain('"100.25";"200"');
});
