import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchApi } from '../src/server/apiRouter';
import { fakeSupabase, invoke } from './helpers/api';
import { readdirSync } from 'node:fs';
import deployedApi from '../api/index';

test('Vercel exposes a single API entry rather than one function per internal handler', () => {
  const functions = readdirSync('api', { recursive: true }).map(String).filter(path => path.endsWith('.ts'));
  assert.deepEqual(functions, ['index.ts']);
});

test('local route dispatch uses the same private boundary as production', async () => {
  const db = fakeSupabase();
  try {
    const result = await invoke(dispatchApi, { url: '/api/auth/users' });
    assert.equal(result.status, 401);
    const scoped = await invoke(dispatchApi, { url: '/api/reviews/admin?scope=public&resource=reviews' });
    assert.equal(scoped.status, 401);
    assert.equal((await invoke(dispatchApi, { url: '/api/not-a-route' })).status, 404);
  } finally { db.restore(); }
});

test('rewritten production API preserves private checks and path parameters override the query string', async () => {
  const db = fakeSupabase();
  try {
    const privateRoute = await invoke(deployedApi, { url: '/api?__path=auth/users' });
    assert.equal(privateRoute.status, 401);
    const scope = await invoke(deployedApi, { url: '/api?__path=reviews/admin&scope=public' });
    assert.equal(scope.status, 401);
    const injected = await invoke(deployedApi, { url: '/api?__path=https://attacker.invalid' });
    assert.equal(injected.status, 404);
    const normal = await invoke(deployedApi, { url: '/api/products?__path=auth/users' });
    assert.equal(normal.status, 200);
  } finally { db.restore(); }
});
