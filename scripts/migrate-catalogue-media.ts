import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { adminClient } from '../src/server/security';
import { CATALOGUE_BUCKET, rasterData, storeCatalogueImage } from '../src/server/catalogueMedia';

dotenv.config({ path: '.env.local', quiet: true });
if (process.env.SUPABASE_PROJECT_REF !== 'elpfuvzfyogogavbmahq') throw new Error('Wrong Supabase target');
const verification = JSON.parse(readFileSync('.codex-private/business-backup-verification.json', 'utf8'));
if (verification.project !== process.env.SUPABASE_PROJECT_REF || Date.now() - Date.parse(verification.verifiedAt) > 30 * 60000) throw new Error('Fresh verified business backup required');
const client = adminClient();
const buckets = await client.storage.listBuckets();
if (buckets.error) throw new Error('Storage inventory unavailable');
const current = buckets.data.find(bucket => bucket.id === CATALOGUE_BUCKET);
if (current && !current.public) throw new Error('Existing bucket is private; do not change its visibility');
if (!current) {
  const created = await client.storage.createBucket(CATALOGUE_BUCKET, { public: true, fileSizeLimit: 3000000, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] });
  if (created.error) throw new Error('Catalogue bucket could not be created');
}
const products = await client.from('products').select('id,images');
if (products.error) throw new Error('Catalogue unavailable');
console.log('Catalogue snapshot read; only inline public product photos will be moved.');
let converted = 0;
for (const product of products.data) {
  if (!Array.isArray(product.images) || !product.images.some(value => typeof value === 'string' && value.startsWith('data:'))) continue;
  const images: string[] = [];
  for (const value of product.images) {
    const url = await storeCatalogueImage(client, value);
    if (value.startsWith('data:')) {
      const original = rasterData(value);
      console.log('Verifying stored image bytes.');
      const stored = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!stored.ok || createHash('sha256').update(Buffer.from(await stored.arrayBuffer())).digest('hex') !== original.hash) throw new Error('Public image integrity verification failed');
    }
    images.push(url);
  }
  const response = await fetch(`https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'update public.products set images=$1::jsonb where id=$2 and images=$3::jsonb returning id', parameters: [JSON.stringify(images), product.id, JSON.stringify(product.images)] }), signal: AbortSignal.timeout(120000),
  });
  if (!response.ok || (await response.json()).length !== 1) throw new Error('Product changed concurrently or update refused; original preserved');
  converted++;
}
writeFileSync('.codex-private/catalogue-media-receipt.json', JSON.stringify({ project: process.env.SUPABASE_PROJECT_REF, convertedProducts: converted, originalImageBytesVerified: true, completedAt: new Date().toISOString() }), { mode: 0o600 });
console.log(JSON.stringify({ convertedProducts: converted, originalImageBytesVerified: true, accountsDeleted: 0 }));
