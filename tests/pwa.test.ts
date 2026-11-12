import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function serviceWorker(inbox: any) {
  const listeners: Record<string, (event: any) => void> = {};
  const shown: any[] = [];
  const badge: number[] = [];
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    URL, Promise, Number,
    fetch: async () => ({ ok: true, json: async () => inbox }),
    caches: { open: () => { throw new Error('Private requests must never access caches'); } },
    self: { location: { origin: 'https://stevenbmj.vercel.app' },
      addEventListener: (name: string, handler: any) => { listeners[name] = handler; },
      navigator: { setAppBadge: async (count: number) => { badge.push(count); } },
      registration: { showNotification: async (...args: any[]) => { shown.push(args); } },
      clients: { matchAll: async () => [] },
    },
  });
  return { listeners, shown, badge };
}

test('service worker does not intercept private APIs, PDF files or third-party responses', () => {
  const worker = serviceWorker({});
  for (const [url, method] of [
    ['https://stevenbmj.vercel.app/api/shop?resource=notifications', 'GET'],
    ['https://stevenbmj.vercel.app/private-invoice.pdf', 'GET'],
    ['https://elsewhere.invalid/assets/private.js', 'GET'],
    ['https://stevenbmj.vercel.app/api/orders', 'POST'],
  ]) {
    let intercepted = false;
    worker.listeners.fetch({ request: { url, method }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, url);
  }
});

test('a delayed push for a previous account reveals no notification or app badge', async () => {
  const worker = serviceWorker({ userId: 'current', unreadCount: 7 });
  let task: Promise<void> | undefined;
  worker.listeners.push({ data: { json: () => ({ userId: 'previous', notificationId: 'notice', language: 'FR' }) }, waitUntil: (value: Promise<void>) => { task = value; } });
  await task;
  assert.equal(worker.shown.length, 0);
  assert.equal(worker.badge.length, 0);
});

test('push shows only a generic account notice and an actual unread count', async () => {
  const worker = serviceWorker({ userId: 'current', unreadCount: 2 });
  let task: Promise<void> | undefined;
  worker.listeners.push({ data: { json: () => ({ userId: 'current', notificationId: 'notice', language: 'EN' }) }, waitUntil: (value: Promise<void>) => { task = value; } });
  await task;
  assert.deepEqual(worker.badge, [2]);
  assert.equal(worker.shown[0][1].body, 'A notification is waiting in your account.');
  assert.equal(worker.shown[0][1].data.path, '/compte');
});
