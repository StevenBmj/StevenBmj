import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { sealBackup, openBackup } from '../src/server/backup';

test('business backups are encrypted, project-bound and reject tampering or a different key', () => {
  const key = randomBytes(32).toString('base64');
  const source = '{"private":"SENTINEL_PRIVATE_BUSINESS_DATA"}';
  const sealed = sealBackup(source, key, 'project-a');
  assert.equal(sealed.includes('SENTINEL_PRIVATE_BUSINESS_DATA'), false);
  assert.equal(openBackup(sealed, key, 'project-a'), source);
  assert.throws(() => openBackup(sealed, key, 'project-b'));
  assert.throws(() => openBackup(sealed, randomBytes(32).toString('base64'), 'project-a'));
  const changed = JSON.parse(sealed); changed.tag = randomBytes(16).toString('base64');
  assert.throws(() => openBackup(JSON.stringify(changed), key, 'project-a'));
});
