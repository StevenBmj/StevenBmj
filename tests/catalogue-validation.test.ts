import { test } from 'node:test';
import assert from 'node:assert/strict';
import products from '../serverless/products';
import uploadImage from '../serverless/product-images';
import { ADMIN_ID, fakeSupabase, invoke, sessionHeaders } from './helpers/api';

const product = { id: 'new-product', name: 'Sac', nameEn: 'Bag', description: 'Sac du catalogue', descriptionEn: 'Catalogue bag', price: 40, stock: 2, images: ['/logo.png'] };

test('image imports require administrator authorization and reject non-raster data', async () => {
  const db = fakeSupabase();
  try {
    assert.equal((await invoke(uploadImage, { method: 'POST', body: {} })).status, 401);
    assert.equal((await invoke(uploadImage, { method: 'POST', headers: sessionHeaders(ADMIN_ID), body: { image: 'data:image/svg+xml;base64,PHN2Zz4=' } })).status, 400);
  } finally { db.restore(); }
});

test('product saves reject invalid money, fractional stock and unsafe images before database writes', async () => {
  const db = fakeSupabase();
  try {
    for (const invalid of [{ price: 'NaN' }, { price: 1.001 }, { stock: 1.2 }, { stock: -1 }, { promoPrice: 50 }, { images: ['javascript:alert(1)'] }]) {
      const result = await invoke(products, { method: 'POST', headers: sessionHeaders(ADMIN_ID), body: { ...product, ...invalid } });
      assert.equal(result.status, 400, JSON.stringify(invalid));
    }
    assert.equal(db.tables.products.length, 1);
  } finally { db.restore(); }
});

test('new products have no invented rating or specifications and updates persist', async () => {
  const db = fakeSupabase();
  try {
    const saved = await invoke(products, { method: 'POST', headers: sessionHeaders(ADMIN_ID), body: product });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.product.rating, 0);
    assert.deepEqual(saved.body.product.specs, []);
    const edited = await invoke(products, { method: 'POST', headers: sessionHeaders(ADMIN_ID), body: { ...product, name: 'Sac modifié', price: 45 } });
    assert.equal(edited.status, 200);
    const visible = await invoke(products, { query: { id: product.id } });
    assert.equal(visible.body.name, 'Sac modifié');
    assert.equal(visible.body.price, 45);
  } finally { db.restore(); }
});
