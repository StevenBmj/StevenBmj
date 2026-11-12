import { test } from 'node:test';
import assert from 'node:assert/strict';
import shop from '../serverless/shop';
import { fakeSupabase, invoke, sessionHeaders, ADMIN_ID } from './helpers/api';

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
