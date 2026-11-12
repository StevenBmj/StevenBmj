import test from 'node:test';
import assert from 'node:assert/strict';
import { periodRange, salesReport } from '../src/server/reports';
import shop from '../serverless/shop';
import { ADMIN_ID, CLIENT_ID, fakeSupabase, invoke, sessionHeaders } from './helpers/api';

test('sales periods use Benin dates and compare an equal preceding period', () => {
  const week = periodRange({ filter: 'week' }, new Date('2026-11-12T23:30:00Z'));
  assert.equal(week.from, '2026-11-09');
  assert.equal(week.to, '2026-11-13');
  assert.equal(week.previousFrom, '2026-11-04');
  assert.equal(week.previousTo, '2026-11-08');
  assert.throws(() => periodRange({ from: '2026-02-30', to: '2026-03-05' }));
  assert.throws(() => periodRange({ from: '2026-11-20', to: '2026-11-01' }));
});

test('real order reports separate currencies and payment evidence without inventing profit', () => {
  const rows = [
    { id: 'one', date: '2026-11-12T10:00:00Z', total_price: 100.25, currency: 'EUR', status: 'delivered', payment_status: 'paid', email: 'client@example.test', customer_name: 'Client Essai' },
    { id: 'two', date: '2026-11-12T10:00:00Z', total_price: 200, currency: 'EUR', status: 'pending', payment_status: 'pending' },
    { id: 'three', date: '2026-11-12T10:00:00Z', total_price: 50, currency: 'USD', status: 'delivered' },
    { id: 'four', date: '2026-11-12T10:00:00Z', total_price: 30, currency: 'EUR', status: 'cancelled', payment_status: 'refunded' },
    { id: 'five', date: '2026-11-11T22:59:59Z', total_price: 80, currency: 'EUR', status: 'delivered', payment_status: 'paid' },
  ];
  const report = salesReport(rows, periodRange({ from: '2026-11-12', to: '2026-11-12' }));
  const eur = report.current.totals.find(row => row.currency === 'EUR')!;
  assert.equal(eur.paidCents, 10025);
  assert.equal(eur.pendingCents, 20000);
  assert.equal(eur.refundedCents, 3000);
  assert.equal(eur.orders, 3);
  assert.equal(report.current.totals.find(row => row.currency === 'USD')!.unknownCents, 5000);
  assert.equal(report.previous.totals[0].paidCents, 8000);
  assert.equal(report.current.topCustomers[0].customerName, 'Client Essai');
  assert.equal((report as any).profit, undefined);
  assert.equal((report as any).visitors, undefined);
});

test('analytics API requires admin and returns database orders, never demo revenue', async () => {
  const db = fakeSupabase();
  try {
    assert.equal((await invoke(shop, { headers: sessionHeaders(CLIENT_ID), query: { resource: 'analytics' } })).status, 403);
    const response = await invoke(shop, { headers: sessionHeaders(ADMIN_ID), query: { resource: 'analytics', from: '2026-11-12', to: '2026-11-12' } });
    assert.equal(response.status, 200);
    assert.equal(response.body.current.orders, 0);
    assert.equal(response.body.current.totals[0].paidCents, 0);
    assert.equal(response.body.timeZone, 'Africa/Porto-Novo');
  } finally { db.restore(); }
});
