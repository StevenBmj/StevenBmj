import { test } from 'node:test';
import assert from 'node:assert/strict';
import shop from '../serverless/shop';
import { fakeSupabase, invoke, sessionHeaders, ADMIN_ID } from './helpers/api';
import { cashReport, readCashReport } from '../src/server/cashReports';
import { periodRange } from '../src/server/reports';

test('cash journal reads beyond the default database page without silently losing entries', async () => {
  const entries = Array.from({ length: 1203 }, (_, id) => ({ id: String(id), kind: 'payment', currency: 'EUR', amount_minor: 100, created_at: '2026-11-12T10:00:00Z' }));
  const client = { from(table: string) {
    const rows = table === 'payment_events' ? entries : [];
    const query: any = { select() { return this; }, gte() { return this; }, lte() { return this; }, order() { return this; },
      range(from: number, to: number) { return Promise.resolve({ data: rows.slice(from, to + 1) }); },
      limit() { return Promise.resolve({ data: rows.slice(0, 1000) }); } };
    return query;
  } };
  const result = await readCashReport(client, { from: '2026-11-12', to: '2026-11-12' });
  assert.equal(result.payments.length, 1203);
  assert.equal(result.report.current.totals[0].receiptsMinor, 120300);
});

test('cash reports refuse unsafe integer totals rather than publishing inaccurate money', () => {
  const rows = [1, 2].map(id => ({ id, kind: 'payment', currency: 'EUR', amount_minor: Number.MAX_SAFE_INTEGER, created_at: '2026-11-12T10:00:00Z' }));
  assert.throws(() => cashReport(rows, [], periodRange({ from: '2026-11-12', to: '2026-11-12' })), /overflow/i);
});

test('cash reports use payment entries and expenses, compare periods and keep currencies separate', async () => {
  const db = fakeSupabase();
  db.tables.payment_events = [
    { id: 'p1', kind: 'payment', currency: 'EUR', amount_minor: 10000, created_at: '2026-11-12T10:00:00Z' },
    { id: 'p2', kind: 'refund', currency: 'EUR', amount_minor: 2000, created_at: '2026-11-12T11:00:00Z' },
    { id: 'p3', kind: 'payment', currency: 'EUR', amount_minor: 5000, created_at: '2026-11-11T10:00:00Z' },
    { id: 'p4', kind: 'payment', currency: 'XOF', amount_minor: 10000, created_at: '2026-11-12T10:00:00Z' },
  ];
  db.tables.business_expenses = [
    { id: 'e1', currency: 'EUR', amount_minor: 1500, incurred_on: '2026-11-12' },
    { id: 'e2', currency: 'EUR', amount_minor: 500, incurred_on: '2026-11-11' },
  ];
  try {
    const response = await invoke(shop, { headers: sessionHeaders(ADMIN_ID), query: { resource: 'ledger', from: '2026-11-12', to: '2026-11-12' } });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.report.current.totals, [
      { currency: 'EUR', receiptsMinor: 10000, refundsMinor: 2000, expensesMinor: 1500, netCashMinor: 6500 },
      { currency: 'XOF', receiptsMinor: 10000, refundsMinor: 0, expensesMinor: 0, netCashMinor: 10000 },
    ]);
    assert.equal(response.body.report.previous.totals[0].netCashMinor, 4500);
    assert.equal(response.body.report.profitAvailable, false);
  } finally { db.restore(); }
});

test('exchange rates come from a fixed ECB source and are cached without any AI provider', async () => {
  const db = fakeSupabase();
  const rest = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (input: any, init?: any) => {
    if (String(input) === 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml') {
      requests++;
      return new Response('<gesmes:Envelope><Cube><Cube time="2026-11-12"><Cube currency="USD" rate="1.125"/></Cube></Cube></gesmes:Envelope>', { headers: { 'content-type': 'text/xml' } });
    }
    return rest(input, init);
  };
  try {
    const first = await invoke(shop, { query: { resource: 'rates' } });
    assert.equal(first.status, 200);
    assert.equal(first.body.rates.USD, 1.125);
    assert.equal(first.body.rates.XOF, 655.957);
    assert.equal(first.body.asOf, '2026-11-12');
    const second = await invoke(shop, { query: { resource: 'rates' } });
    assert.equal(second.body.rates.USD, 1.125);
    assert.equal(requests, 1);
  } finally { db.restore(); }
});

test('VIP rankings count paid purchases only and do not invent value for manually entered clients', async () => {
  const db = fakeSupabase();
  db.tables.orders = [
    { id: 'paid', date: '2026-11-12T10:00:00Z', customer_name: 'Paid Customer', email: 'paid@example.test', whatsapp: '+2290155468138', total_price: 100, payment_status: 'paid', status: 'delivered', currency: 'EUR', items: [] },
    { id: 'pending', date: '2026-11-12T10:00:00Z', customer_name: 'Unpaid Customer', email: 'pending@example.test', whatsapp: '+2290155468138', total_price: 90000, payment_status: 'pending', status: 'pending', currency: 'EUR', items: [] },
  ];
  try {
    const result = await invoke(shop, { headers: sessionHeaders(ADMIN_ID), query: { resource: 'vip-customers', from: '2026-11-12', to: '2026-11-12' } });
    assert.equal(result.status, 200);
    assert.equal(result.body.customers.length, 1);
    assert.equal(result.body.customers[0].paidCents, 10000);
    assert.equal(result.body.customers[0].whatsapp, '+2290155468138');
  } finally { db.restore(); }
});
