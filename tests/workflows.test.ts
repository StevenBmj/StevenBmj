import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import shop from '../serverless/shop';
import login from '../serverless/auth/login';
import register from '../serverless/auth/register';
import { fakeSupabase, invoke, sessionHeaders, CLIENT_ID, OTHER_ID, ADMIN_ID } from './helpers/api';

test('delivery, notifications and accounting routes require a verified session', async () => {
  const db = fakeSupabase();
  try {
    for (const resource of ['drivers', 'deliveries', 'notifications', 'ledger']) {
      const response = await invoke(shop, { query: { resource } });
      assert.equal(response.status, 401, resource);
    }
  } finally { db.restore(); }
});

test('a client cannot enumerate drivers or financial entries', async () => {
  const db = fakeSupabase();
  try {
    for (const resource of ['drivers', 'ledger']) {
      const response = await invoke(shop, { headers: sessionHeaders(CLIENT_ID), query: { resource } });
      assert.equal(response.status, 403, resource);
    }
  } finally { db.restore(); }
});

test('notifications are private and only their recipient can acknowledge them', async () => {
  const db = fakeSupabase();
  db.tables.notifications = [
    { id: 'notice-own', user_id: CLIENT_ID, kind: 'order_created', order_id: 'own-order', created_at: '2026-11-12T10:00:00Z', read_at: null },
    { id: 'notice-other', user_id: OTHER_ID, kind: 'order_created', order_id: 'other-order', created_at: '2026-11-12T10:00:00Z', read_at: null },
  ];
  try {
    const list = await invoke(shop, { headers: sessionHeaders(CLIENT_ID), query: { resource: 'notifications' } });
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.items.map((n: any) => n.id), ['notice-own']);
    assert.equal(list.body.unreadCount, 1);
    const foreign = await invoke(shop, { method: 'PATCH', headers: sessionHeaders(CLIENT_ID), query: { resource: 'notifications', id: 'notice-other' }, body: {} });
    assert.equal(foreign.status, 404);
    assert.equal(db.tables.notifications[1].read_at, null);
    const own = await invoke(shop, { method: 'PATCH', headers: sessionHeaders(CLIENT_ID), query: { resource: 'notifications', id: 'notice-own' }, body: {} });
    assert.equal(own.status, 200);
    assert.ok(db.tables.notifications[0].read_at);
  } finally { db.restore(); }
});

test('driver applications do not grant approval and invalid telephone numbers are refused', async () => {
  const db = fakeSupabase();
  db.tables.driver_profiles = [];
  try {
    const invalid = await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'driver-profile' }, body: { phone: '+229abc', zone: 'Cotonou', status: 'approved' } });
    assert.equal(invalid.status, 400);
    const application = await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'driver-profile' }, body: { phone: '+2290155468138', zone: 'Cotonou', status: 'approved', isAdmin: true } });
    assert.equal(application.status, 200);
    assert.equal(db.tables.driver_profiles[0].status, 'pending');
    assert.equal(db.tables.driver_profiles[0].user_id, CLIENT_ID);
    const assignments = await invoke(shop, { headers: sessionHeaders(CLIENT_ID), query: { resource: 'deliveries' } });
    assert.equal(assignments.status, 403);
  } finally { db.restore(); }
});

test('security logs are archived rather than erased, and their archive is admin-only', async () => {
  const db = fakeSupabase();
  db.tables.security_logs = [{ id: 'audit-existing', timestamp: '2026-11-12T10:00:00Z', event: 'Existing security record', archived_at: null }];
  try {
    const result = await invoke(shop, { method: 'DELETE', headers: sessionHeaders(ADMIN_ID), query: { resource: 'security-logs' } });
    assert.equal(result.status, 200);
    assert.equal(db.tables.security_logs.filter(row => row.id === 'audit-existing').length, 1);
    assert.ok(db.tables.security_logs.find(row => row.id === 'audit-existing').archived_at);
    const denied = await invoke(shop, { headers: sessionHeaders(CLIENT_ID), query: { resource: 'security-logs', archived: '1' } });
    assert.equal(denied.status, 403);
  } finally { db.restore(); }
});

test('push subscription endpoints cannot target private networks or arbitrary HTTPS servers', async () => {
  const db = fakeSupabase();
  const ecdh = createECDH('prime256v1');
  const keys = { p256dh: ecdh.generateKeys().toString('base64url'), auth: randomBytes(16).toString('base64url') };
  try {
    for (const endpoint of ['http://127.0.0.1/push', 'https://127.0.0.1/push', 'https://fcm.googleapis.com.attacker.invalid/push', 'https://example.com/push']) {
      const response = await invoke(shop, { method: 'POST', headers: sessionHeaders(CLIENT_ID), query: { resource: 'push-subscription' }, body: { subscription: { endpoint, keys } } });
      assert.equal(response.status, 400, endpoint);
    }
    assert.equal(db.tables.push_subscriptions.length, 0);
  } finally { db.restore(); }
});

test('an unconfirmed login reports the real remaining code lifetime instead of a new five minutes', async () => {
  const db = fakeSupabase();
  const profile = db.tables.profiles.find(profile => profile.id === CLIENT_ID)!;
  profile.is_confirmed = false;
  profile.activation_expires_at = new Date(Date.now() + 45000).toISOString();
  try {
    const response = await invoke(login, { method: 'POST', body: { email: profile.email, password: 'ValidPassword123!' } });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'UNCONFIRMED_ACCOUNT');
    assert.ok(response.body.expiresInSeconds > 0 && response.body.expiresInSeconds <= 45);
  } finally { db.restore(); }
});

test('an expense retry cannot acknowledge a different entry with the same request id', async () => {
  const db = fakeSupabase();
  const id = '00000000-0000-4000-8000-000000000099';
  db.tables.business_expenses = [{ id, request_id: id, actor_id: ADMIN_ID, amount_minor: 1000, currency: 'EUR', category: 'other', description: 'Existing expense', incurred_on: '2026-11-12' }];
  try {
    const response = await invoke(shop, { method: 'POST', headers: sessionHeaders(ADMIN_ID), query: { resource: 'ledger' }, body: { requestId: id, amountMinor: 2000, currency: 'EUR', category: 'other', description: 'Different expense', date: '2026-11-12' } });
    assert.equal(response.status, 409);
    assert.equal(db.tables.business_expenses[0].amount_minor, 1000);
  } finally { db.restore(); }
});

test('section badges and acknowledgements use only that recipients real unread events', async () => {
  const db = fakeSupabase();
  db.tables.notifications = [
    { id: 'order-notice', user_id: ADMIN_ID, kind: 'order_created', read_at: null },
    { id: 'driver-notice', user_id: ADMIN_ID, kind: 'driver_pending', read_at: null },
    { id: 'old-notice', user_id: ADMIN_ID, kind: 'signed', read_at: '2026-11-12T10:00:00Z' },
    { id: 'foreign-notice', user_id: CLIENT_ID, kind: 'order_created', read_at: null },
  ];
  try {
    const list = await invoke(shop, { headers: sessionHeaders(ADMIN_ID), query: { resource: 'notifications' } });
    assert.equal(list.body.sections.orders, 1);
    assert.equal(list.body.sections.drivers, 1);
    const ack = await invoke(shop, { method: 'PATCH', headers: sessionHeaders(ADMIN_ID), query: { resource: 'notifications' }, body: { section: 'orders' } });
    assert.equal(ack.status, 200);
    assert.ok(db.tables.notifications[0].read_at);
    assert.equal(db.tables.notifications[1].read_at, null);
    assert.equal(db.tables.notifications[3].read_at, null);
  } finally { db.restore(); }
});

test('submitting a review requires a verified account instead of accepting a forged name', async () => {
  const db = fakeSupabase();
  try {
    const response = await invoke(shop, { method: 'POST', query: { resource: 'reviews' }, body: { customerName: 'Invented Customer', text: 'An invented review', rating: 5 } });
    assert.equal(response.status, 401);
    assert.equal(db.tables.reviews.length, 0);
  } finally { db.restore(); }
});

test('denied admin access records a bounded security event using trusted hosting metadata', async () => {
  const db = fakeSupabase();
  try {
    const response = await invoke(shop, { headers: { ...sessionHeaders(CLIENT_ID), 'x-forwarded-for': '8.8.8.8', 'x-vercel-ip-country': 'XX' }, query: { resource: 'security-logs' } });
    assert.equal(response.status, 403);
    const event = db.tables.security_logs.find(row => row.status === 'BLOCKED');
    assert.ok(event);
    assert.equal(event.ip, '127.0.0.1');
    assert.equal(event.country, null);
    assert.equal(event.actor_id, CLIENT_ID);
  } finally { db.restore(); }
});

test('VIP outreach cannot send before explicit confirmation and recipient permission', async () => {
  const db = fakeSupabase();
  try {
    const response = await invoke(shop, { method: 'POST', headers: sessionHeaders(ADMIN_ID), query: { resource: 'vip-message' }, body: { customerName: 'Customer', email: 'client@example.test', message: 'Thank you for your order.' } });
    assert.equal(response.status, 400);
  } finally { db.restore(); }
});

test('registration refuses missing, alphabetic or impossible international telephone numbers before creating Auth users', async () => {
  const db = fakeSupabase();
  try {
    for (const whatsapp of ['', '+229abc123', '+2291']) {
      const response = await invoke(register, { method: 'POST', body: { name: 'Client Essai', email: 'unused@example.test', password: 'Letters123!@#', whatsapp } });
      assert.equal(response.status, 400);
    }
    assert.equal(db.requests.some(request => request.path === '/auth/v1/admin/users' && request.method === 'POST'), false);
  } finally { db.restore(); }
});

test('an administrator with a verified second factor cannot use privileged routes with an aal1 session', async () => {
  const db = fakeSupabase();
  const admin = db.tables.profiles.find(profile => profile.id === ADMIN_ID)!;
  admin.factors = [{ id: '00000000-0000-4000-8000-000000000088', factor_type: 'totp', status: 'verified' }];
  try {
    const response = await invoke(shop, { headers: sessionHeaders(ADMIN_ID), query: { resource: 'security-logs' } });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'MFA_REQUIRED');
  } finally { db.restore(); }
});
