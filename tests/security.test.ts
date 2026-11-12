import { test } from 'node:test';
import assert from 'node:assert/strict';
import settings from '../api/settings';
import products from '../api/products';
import users from '../api/auth/users';
import userById from '../api/auth/users/[id]';
import shop from '../api/shop';
import login from '../api/auth/login';
import register from '../api/auth/register';
import activate from '../api/auth/activate';
import resetPassword from '../api/auth/request-reset-code';
import session from '../api/auth/session';
import { hashCode } from '../src/server/security';
import { ADMIN_ID, CLIENT_ID, OTHER_ID, fakeSupabase, invoke, sessionHeaders } from './helpers/api';

test('anonymous requests cannot mutate settings or products or enumerate clients', async () => {
  const db = fakeSupabase();
  try {
    assert.equal((await invoke(settings, { method: 'POST', body: { homepageHeroTitle: 'Changed' } })).status, 401);
    assert.equal((await invoke(products, { method: 'POST', body: { name: 'New', description: 'Valid product', price: 10, images: ['/logo.png'] } })).status, 401);
    assert.equal((await invoke(users)).status, 401);
  } finally { db.restore(); }
});

test('public settings expose only business settings, never secrets or future private keys', async () => {
  const db = fakeSupabase();
  try {
    const result = await invoke(settings);
    assert.equal(result.status, 200);
    assert.equal(result.body.homepageHeroTitle, 'StevenBmj');
    assert.equal(result.body.facebookUrl, 'https://facebook.com/example');
    assert.equal(result.body.adminPassword, undefined);
    assert.equal(result.body.adminResetCode, undefined);
    assert.equal(result.body.futureApiKey, undefined);
  } finally { db.restore(); }
});

test('a client cannot invoke admin capabilities or delete another account', async () => {
  const db = fakeSupabase();
  try {
    const headers = sessionHeaders(CLIENT_ID);
    assert.equal((await invoke(settings, { headers, method: 'POST', body: {} })).status, 403);
    assert.equal((await invoke(shop, { headers, query: { resource: 'security-logs' } })).status, 403);
    assert.equal((await invoke(userById, { headers, method: 'DELETE', query: { id: OTHER_ID } })).status, 403);
  } finally { db.restore(); }
});

test('an administrator can save allowed settings but cannot store a password in public configuration', async () => {
  const db = fakeSupabase();
  try {
    const result = await invoke(settings, { headers: sessionHeaders(ADMIN_ID), method: 'POST', body: { homepageHeroTitle: 'Updated', adminPassword: 'DO_NOT_STORE', futureApiKey: 'DO_NOT_STORE' } });
    assert.equal(result.status, 200);
    assert.equal(result.body.settings.homepageHeroTitle, 'Updated');
    assert.equal(result.body.settings.adminPassword, undefined);
    assert.equal(result.body.settings.futureApiKey, undefined);
  } finally { db.restore(); }
});

test('private orders are scoped to the verified account', async () => {
  const db = fakeSupabase();
  try {
    assert.equal((await invoke(shop, { query: { resource: 'orders' } })).status, 401);
    const result = await invoke(shop, { headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders' } });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.map((order: any) => order.id), ['own-order']);
  } finally { db.restore(); }
});

test('foreign-origin writes are refused even with an admin cookie', async () => {
  const db = fakeSupabase();
  try {
    const headers = { ...sessionHeaders(ADMIN_ID), origin: 'https://attacker.invalid' };
    assert.equal((await invoke(settings, { headers, method: 'POST', body: {} })).status, 403);
  } finally { db.restore(); }
});

test('revoked sessions cannot access administrative data', async () => {
  const db = fakeSupabase();
  try {
    db.tables.web_sessions = [];
    assert.equal((await invoke(users, { headers: sessionHeaders(ADMIN_ID) })).status, 401);
  } finally { db.restore(); }
});

test('password login issues HttpOnly cookies and never returns tokens in JSON', async () => {
  const db = fakeSupabase();
  try {
    const result = await invoke(login, { method: 'POST', body: { email: 'client@example.com', password: 'ValidPassword123!' } });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.id, CLIENT_ID);
    assert.equal(result.body.access_token, undefined);
    const cookies = result.headers['set-cookie'];
    assert.ok(Array.isArray(cookies));
    assert.ok(cookies.every((cookie: string) => cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax')));
    assert.ok(cookies.some((cookie: string) => cookie.startsWith('sbmj_refresh=')));
  } finally { db.restore(); }
});

test('database-backed throttling blocks login before checking the password', async () => {
  const db = fakeSupabase();
  try {
    db.denyRateLimit();
    const result = await invoke(login, { method: 'POST', body: { email: 'client@example.com', password: 'ValidPassword123!' } });
    assert.equal(result.status, 429);
    assert.equal(db.requests.some(request => request.path === '/auth/v1/token'), false);
  } finally { db.restore(); }
});

test('bulk client deletion is disabled even for an authenticated administrator', async () => {
  const db = fakeSupabase();
  try {
    assert.equal((await invoke(users, { headers: sessionHeaders(ADMIN_ID), method: 'DELETE' })).status, 405);
    assert.equal(db.tables.profiles.length, 3);
  } finally { db.restore(); }
});

test('public registration never creates the reserved administrative identity', async () => {
  const db = fakeSupabase();
  const oldAdmin = process.env.ADMIN_EMAIL;
  // register.ts reads ADMIN_EMAIL at module load; use its configured fallback.
  try {
    const result = await invoke(register, { method: 'POST', body: { name: 'Pretend Admin', email: oldAdmin || 'stevenamorin202@gmail.com', password: 'ValidPassword123!' } });
    assert.equal(result.status, 409);
    assert.equal(result.body.user, undefined);
  } finally { db.restore(); }
});

test('registration rejects duplicate normalized emails and names containing numbers', async () => {
  const db = fakeSupabase();
  try {
    const duplicate = await invoke(register, { method: 'POST', body: { name: 'Client Essai', email: ' CLIENT@EXAMPLE.COM ', password: 'Letters123!@#' } });
    assert.equal(duplicate.status, 409);
    for (const name of ['Client123', 'Client １２', 'Client ١٢']) {
      const invalid = await invoke(register, { method: 'POST', body: { name, email: 'unused@example.test', password: 'Letters123!@#' } });
      assert.equal(invalid.status, 400);
    }
    assert.equal(db.tables.profiles.length, 3);
    assert.equal(db.requests.filter(request => request.path === '/auth/v1/admin/users' && request.method === 'POST').length, 0);
  } finally { db.restore(); }
});

test('activation consumes the hashed code once and creates a verified session', async () => {
  const db = fakeSupabase();
  try {
    const profile = db.tables.profiles.find(p => p.id === CLIENT_ID)!;
    profile.is_confirmed = false;
    profile.activation_code = hashCode(profile.email, 'activation', 'AB23CD45');
    profile.activation_expires_at = new Date(Date.now() + 300000).toISOString();
    const options = { method: 'POST', body: { email: profile.email, code: 'AB23CD45' } };
    const result = await invoke(activate, options);
    assert.equal(result.status, 200);
    assert.ok(result.headers['set-cookie']);
    assert.equal(profile.activation_code, '');
    assert.notEqual((await invoke(activate, options)).status, 200);
  } finally { db.restore(); }
});

test('password reset accepts a profile-bound hash once and revokes existing sessions', async () => {
  const db = fakeSupabase();
  try {
    const profile = db.tables.profiles.find(p => p.id === CLIENT_ID)!;
    profile.reset_code = hashCode(profile.email, 'reset', 'AB23CD45');
    profile.reset_expires_at = new Date(Date.now() + 300000).toISOString();
    const options = { method: 'POST', body: { email: profile.email, code: 'AB23CD45', newPassword: ' NewPassword!123 ' } };
    const result = await invoke(resetPassword, options);
    assert.equal(result.status, 200);
    assert.equal(profile.reset_code, '');
    assert.equal(db.tables.web_sessions.some(s => s.user_id === CLIENT_ID), false);
    assert.equal(db.requests.find(r => r.method === 'PUT' && r.path.includes('/admin/users/'))?.body.password, ' NewPassword!123 ');
    assert.notEqual((await invoke(resetPassword, options)).status, 200);
  } finally { db.restore(); }
});

test('logout revokes the current session, then its cookie cannot read private data', async () => {
  const db = fakeSupabase();
  try {
    const headers = sessionHeaders(ADMIN_ID);
    assert.equal((await invoke(session, { headers, method: 'POST', body: { action: 'logout' } })).status, 200);
    assert.equal((await invoke(users, { headers })).status, 401);
    assert.equal(db.tables.web_sessions.some(s => s.user_id === CLIENT_ID), true);
  } finally { db.restore(); }
});

test('a refresh token cannot recreate a revoked web session', async () => {
  const db = fakeSupabase();
  try {
    db.tables.web_sessions = [];
    const result = await invoke(session, { headers: sessionHeaders(CLIENT_ID), method: 'POST', body: { action: 'refresh' } });
    assert.equal(result.status, 401);
    assert.equal(db.tables.web_sessions.length, 0);
  } finally { db.restore(); }
});

test('a session with an invalid expiration fails closed', async () => {
  const db = fakeSupabase();
  try {
    db.tables.web_sessions.forEach(s => { s.expires_at = 'invalid'; });
    assert.equal((await invoke(users, { headers: sessionHeaders(ADMIN_ID) })).status, 401);
  } finally { db.restore(); }
});

test('logout also revokes a session after its access token has expired', async () => {
  const db = fakeSupabase();
  try {
    const headers = { ...sessionHeaders(CLIENT_ID), cookie: `sbmj_access=expired; sbmj_refresh=refresh-${CLIENT_ID}` };
    assert.equal((await invoke(session, { headers, method: 'POST', body: { action: 'logout' } })).status, 200);
    assert.equal(db.tables.web_sessions.some(s => s.user_id === CLIENT_ID), false);
  } finally { db.restore(); }
});

test('order prices and discounts come from the catalogue, not browser totals', async () => {
  const db = fakeSupabase();
  try {
    const result = await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders' }, body: {
      customerName: 'Client Test', email: 'client@example.com', whatsapp: '+2290155468138', address: 'Test street', city: 'Cotonou',
      items: [{ productId: 'product-1', productName: 'Tampered name', quantity: 2, price: 0.01 }], totalPrice: 0.02,
    } });
    assert.equal(result.status, 200);
    assert.equal(result.body.order.items[0].price, 100);
    assert.equal(result.body.order.items[0].productName, 'Watch');
    assert.equal(result.body.order.totalPrice, 350);
    assert.equal(result.body.order.currency, 'EUR');
  } finally { db.restore(); }
});

test('oversold quantities and expired discounts are refused', async () => {
  const db = fakeSupabase();
  try {
    const body = { customerName: 'Client Test', email: 'client@example.com', whatsapp: '+2290155468138', address: 'Test street', city: 'Cotonou',
      items: [{ productId: 'product-1', quantity: 6 }], promoCode: 'EXPIRED' };
    assert.equal((await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders' }, body })).status, 400);
    body.items[0].quantity = 1;
    db.tables.promo_codes.push({ code: 'EXPIRED', active: true, discount_percentage: 99, expires_at: '2020-01-01T00:00:00Z' });
    assert.equal((await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders' }, body })).status, 400);
    assert.equal(db.tables.orders.length, 2);
  } finally { db.restore(); }
});

test('anonymous requests cannot enumerate promo codes', async () => {
  const db = fakeSupabase();
  try {
    db.tables.promo_codes.push({ code: 'PRIVATE', active: true, discount_percentage: 10 });
    assert.equal((await invoke(shop, { query: { resource: 'promos' } })).status, 401);
    const check = await invoke(shop, { query: { resource: 'promos', code: 'PRIVATE', subtotal: '100' } });
    assert.equal(check.status, 200);
    assert.equal(check.body.length, 1);
  } finally { db.restore(); }
});

test('a browser without a refresh cookie is unauthenticated even if the limiter is unavailable', async () => {
  const db = fakeSupabase();
  try {
    db.denyRateLimit();
    const result = await invoke(session, { method: 'POST', body: { action: 'refresh' } });
    assert.equal(result.status, 401);
    assert.equal(db.requests.some(r => r.path.includes('/rpc/')), false);
  } finally { db.restore(); }
});

test('orders freeze server-calculated invoice metadata and never imply payment', async () => {
  const db = fakeSupabase();
  try {
    const body = { customerName: 'Client Test', email: 'client@example.com', whatsapp: '+2290155468138', address: 'Test street', city: 'Cotonou',
      items: [{ productId: 'product-1', quantity: 1 }], seller: { name: 'Tampered Seller' }, paymentStatus: 'paid' };
    const result = await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders' }, body });
    assert.equal(result.status, 200);
    assert.equal(result.body.order.pricingSnapshot.subtotalCents, 10000);
    assert.equal(result.body.order.pricingSnapshot.shippingCents, 15000);
    assert.equal(result.body.order.pricingSnapshot.seller.name, 'StevenBmj');
    assert.equal(result.body.order.paymentStatus, 'pending');
    assert.match(result.body.order.verificationToken, /^[a-f0-9-]{36}$/);
  } finally { db.restore(); }
});

test('public invoice verification exposes totals but no recipient information', async () => {
  const db = fakeSupabase();
  try {
    db.tables.orders[0].invoice_token = '00000000-0000-4000-8000-000000000009';
    const result = await invoke(shop, { query: { resource: 'invoice-verify', token: db.tables.orders[0].invoice_token } });
    assert.equal(result.status, 200);
    assert.equal(result.body.id, 'own-order');
    assert.equal(result.body.totalPrice, 100);
    for (const field of ['customerName', 'email', 'whatsapp', 'address', 'items']) assert.equal(result.body[field], undefined);
  } finally { db.restore(); }
});

test('retrying an order submission with its request ID returns the original order', async () => {
  const db = fakeSupabase();
  try {
    const body = { requestId: '00000000-0000-4000-8000-000000000099', customerName: 'Client Test', email: 'client@example.com', whatsapp: '+2290155468138', address: 'Test street', city: 'Cotonou', items: [{ productId: 'product-1', quantity: 1 }] };
    const options = { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders' }, body };
    const first = await invoke(shop, options);
    const second = await invoke(shop, { ...options, body: { ...body, address: 'A different address' } });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.body.order.id, first.body.order.id);
    assert.equal(second.body.order.address, 'Test street');
    assert.equal(db.tables.orders.length, 3);
  } finally { db.restore(); }
});

test('a client edits only their own unpaid pending order without deleting its reference', async () => {
  const db = fakeSupabase();
  try {
    db.tables.orders[0].payment_status = 'pending';
    const body = { customerName: 'Client Test', email: 'client@example.com', whatsapp: '+2290155468138', address: 'Updated address', city: 'Cotonou', items: [{ productId: 'product-1', quantity: 1 }] };
    const options = { method: 'PATCH', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders', id: 'own-order' }, body };
    const result = await invoke(shop, options);
    assert.equal(result.status, 200);
    assert.equal(result.body.order.id, 'own-order');
    assert.equal(result.body.order.address, 'Updated address');
    assert.equal(db.tables.orders.length, 2);
    assert.equal((await invoke(shop, { ...options, query: { resource: 'orders', id: 'other-order' } })).status, 403);
    db.tables.orders[0].payment_status = 'paid';
    assert.equal((await invoke(shop, options)).status, 403);
  } finally { db.restore(); }
});

test('a client cannot erase a paid order even if delivery is still pending', async () => {
  const db = fakeSupabase();
  try {
    db.tables.orders[0].payment_status = 'paid';
    const result = await invoke(shop, { method: 'DELETE', headers: sessionHeaders(CLIENT_ID), query: { resource: 'orders', id: 'own-order' } });
    assert.equal(result.status, 403);
    assert.ok(db.tables.orders.some(row => row.id === 'own-order'));
  } finally { db.restore(); }
});
