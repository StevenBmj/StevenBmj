import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchApi } from '../src/server/apiRouter';
import { fakeSupabase, invoke } from './helpers/api';

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
