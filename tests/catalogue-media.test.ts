import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { rasterData, storeCatalogueImage } from '../src/server/catalogueMedia';

test('catalogue uploads preserve the original image bytes and use content-addressed names', async () => {
  const bytes = readFileSync('public/logo.png');
  const image = `data:image/png;base64,${bytes.toString('base64')}`;
  assert.equal(rasterData(image).hash, createHash('sha256').update(bytes).digest('hex'));
  let stored: Buffer | null = null;
  const client = { storage: { from() { return { upload: async (_path: string, value: Buffer) => { stored = value; return {}; }, getPublicUrl: (key: string) => ({ data: { publicUrl: `https://media.example.test/${key}` } }) }; } } };
  const url = await storeCatalogueImage(client, image);
  assert.deepEqual(stored, bytes);
  assert.match(url, /[a-f0-9]{64}\.png$/);
  assert.throws(() => rasterData('data:image/svg+xml;base64,PHN2Zz4='));
  assert.throws(() => rasterData('data:image/png;base64,PHN2Zz4='));
});
