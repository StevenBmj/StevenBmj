import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch } from '../src/lib/api';

test('concurrent expired API requests share one refresh and retry once', async () => {
  const original = globalThis.fetch;
  let refreshes = 0;
  let refreshed = false;
  globalThis.fetch = async (url, init) => {
    assert.equal(init?.credentials, 'same-origin');
    if (url === '/api/auth/session') {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      refreshed = true;
      return new Response('{}');
    }
    return new Response('{}', { status: refreshed ? 200 : 401 });
  };
  try {
    const results = await Promise.all([apiFetch('/api/orders'), apiFetch('/api/auth/users')]);
    assert.deepEqual(results.map(r => r.status), [200, 200]);
    assert.equal(refreshes, 1);
  } finally { globalThis.fetch = original; }
});

test('failed refresh does not retry mutations or authentication submissions', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async url => { calls.push(String(url)); return new Response('{}', { status: 401 }); };
  try {
    assert.equal((await apiFetch('/api/orders', { method: 'POST' })).status, 401);
    assert.deepEqual(calls, ['/api/orders', '/api/auth/session']);
    calls.length = 0;
    await apiFetch('/api/auth/login', { method: 'POST' });
    assert.deepEqual(calls, ['/api/auth/login']);
  } finally { globalThis.fetch = original; }
});
