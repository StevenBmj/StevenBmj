import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import entry from '../api/index';
import { fakeSupabase } from './helpers/api';
import { invoke, sessionHeaders, ADMIN_ID } from './helpers/api';
import settings from '../serverless/settings';
import { invalidateSeoIndexingCache } from '../src/server/seo';

beforeEach(invalidateSeoIndexingCache);

async function request(url: string) {
  let status = 200; let body = ''; const headers: Record<string, string> = {};
  const response: any = { setHeader(name: string, value: string) { headers[name.toLowerCase()] = value; return this; }, status(value: number) { status = value; return this; }, end(value: string) { body = value; } };
  await entry({ url, method: 'GET', headers: { host: 'localhost' } }, response);
  return { status, body, headers };
}

test('product deep links have server-rendered public metadata with a real canonical and safe JSON-LD', async () => {
  const db = fakeSupabase();
  db.tables.products[0].name = 'Watch </script><script>alert(1)</script>';
  try {
    const response = await request('/api?__page=produit/product-1');
    assert.equal(response.status, 200);
    const $ = load(response.body);
    assert.match($('title').text(), /Watch/);
    assert.equal($('link[rel=canonical]').attr('href'), 'https://stevenbmj.vercel.app/produit/product-1');
    assert.equal($('script').filter((_, script) => $(script).text() === 'alert(1)').length, 0);
    const structured = JSON.parse($('script[type="application/ld+json"]').last().text());
    assert.equal(structured['@type'], 'Product');
    assert.equal(structured.offers.priceCurrency, 'EUR');
    assert.equal(structured.offers.price, 100);
    assert.equal(response.body.includes('client@example.com'), false);
  } finally { db.restore(); }
});

test('sitemap contains real public product URLs, not fragments or private account links', async () => {
  const db = fakeSupabase();
  try {
    const response = await request('/api?__page=sitemap.xml');
    assert.equal(response.status, 200);
    assert.match(response.body, /https:\/\/stevenbmj.vercel.app\/produit\/product-1/);
    assert.equal(/#boutique|\/god|\/compte|\/verification/.test(response.body), false);
  } finally { db.restore(); }
});

test('the administrators indexing setting applies to actual server responses', async () => {
  const db = fakeSupabase();
  db.tables.app_settings[0].data.seoIndexable = false;
  try {
    const response = await request('/api?__page=about');
    assert.equal(response.headers['x-robots-tag'], 'noindex, nofollow');
    assert.equal(load(response.body)('meta[name=robots]').attr('content'), 'noindex,nofollow');
  } finally { db.restore(); }
});

test('a public metadata outage still serves the application shell without indexing incomplete content', async () => {
  const db = fakeSupabase();
  const previous = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"message":"temporarily unavailable"}', { status: 503 });
  try {
    const response = await request('/api?__page=about');
    assert.equal(response.status, 200);
    const $ = load(response.body);
    assert.equal($('#root').length, 1);
    assert.match($('meta[name=robots]').attr('content') || '', /noindex/);
  } finally { globalThis.fetch = previous; db.restore(); }
});

test('warm public pages share their indexing lookup instead of waiting for the database on every request', async () => {
  const db = fakeSupabase();
  try {
    await request('/api?__page=contact');
    const afterFirst = db.requests.filter(row => row.path === '/rest/v1/app_settings').length;
    await request('/api?__page=aide');
    assert.equal(db.requests.filter(row => row.path === '/rest/v1/app_settings').length, afterFirst);
  } finally { db.restore(); }
});

test('saving the indexing setting invalidates the public metadata cache', async () => {
  const db = fakeSupabase();
  try {
    assert.equal((await request('/api?__page=about')).headers['x-robots-tag'], 'index, follow');
    assert.equal((await invoke(settings, { method: 'POST', headers: sessionHeaders(ADMIN_ID), body: { seoIndexable: false } })).status, 200);
    assert.equal((await request('/api?__page=contact')).headers['x-robots-tag'], 'noindex, nofollow');
  } finally { db.restore(); }
});
