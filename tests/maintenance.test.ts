import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('legacy seeding refuses to restore plaintext credentials or overwrite business data', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/seed-supabase.ts'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Legacy data import is disabled.*No data was changed/);
});

test('legacy schema command cannot recreate obsolete public policies', () => {
  const source = readFileSync('scripts/apply-supabase-schema.ts', 'utf8');
  assert.doesNotMatch(source, /001_initial_schema\.sql/);
  assert.match(source, /Legacy schema initialization is disabled/);
});
