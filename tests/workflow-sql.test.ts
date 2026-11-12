import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const admin = '00000000-0000-4000-8000-000000000001';
const client = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';
const driver = '00000000-0000-4000-8000-000000000004';
let db: PGlite;
const signature = { strokes: [{ points: [{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.8 }, { x: 0.9, y: 0.3 }] }] };
const action = async (actor: string, order: string, kind: string, version: number, payload = {}, requestId = crypto.randomUUID()) => {
  const response = await db.query<{ result: any }>('select public.sbmj_order_action($1::uuid,$2,$3,$4::jsonb,$5,$6::uuid) as result', [actor, order, kind, JSON.stringify(payload), version, requestId]);
  return response.rows[0].result;
};

before(async () => {
  db = await PGlite.create();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users (id uuid primary key);');
  await db.exec(readFileSync('supabase/migrations/001_initial_schema.sql', 'utf8').replace(/^create extension if not exists pgcrypto;\r?\n/m, ''));
  await db.exec(readFileSync('supabase/migrations/20261112041430_invoice_snapshots.sql', 'utf8'));
  await db.exec(`insert into orders(id,customer_name,email,whatsapp,address,city,items,total_price,status,payment_status)
    values('legacy-delivered','Historical customer','history@example.test','+2290155468138','Test','Cotonou','[]',100,'delivered','paid')`);
  await db.exec(readFileSync('supabase/migrations/20261112071651_delivery_notifications_and_ledger.sql', 'utf8'));
  for (const [id, name, email, isAdmin] of [[admin, 'Admin Test', 'admin@example.test', true], [client, 'Client Test', 'client@example.test', false], [other, 'Other Client', 'other@example.test', false], [driver, 'Driver Test', 'driver@example.test', false]]) {
    await db.query('insert into auth.users(id) values($1::uuid)', [id]);
    await db.query('insert into profiles(id,name,email,is_admin,is_confirmed) values($1::uuid,$2,$3,$4,true)', [id, name, email, isAdmin]);
  }
});
after(async () => { await db?.close(); });

test('migration preserves historical fulfilment and never invents a payment or stock reservation', async () => {
  const rows = await db.query<any>("select * from orders where id='legacy-delivered'");
  assert.equal(rows.rows[0].fulfilment_status, 'legacy');
  assert.equal(rows.rows[0].status, 'delivered');
  assert.equal(rows.rows[0].payment_status, 'paid');
  assert.equal(rows.rows[0].stock_reserved, false);
  await assert.rejects(action(admin, 'legacy-delivered', 'record_payment', 0, { amountMinor: 10000, currency: 'EUR', reference: 'duplicate', method: 'bank' }), /invalid_transition/);
  assert.equal((await db.query("select * from payment_events where order_id='legacy-delivered'")).rows.length, 0);
});

test('workflow transaction is private to the service role', async () => {
  const result = await db.query<{ exists: boolean }>("select to_regprocedure('public.sbmj_order_action(uuid,text,text,jsonb,integer,uuid)') is not null as exists");
  assert.equal(result.rows[0].exists, true);
  const privileges = await db.query<{ anonymous: boolean; authenticated: boolean; service: boolean }>(`select
    has_function_privilege('anon','public.sbmj_order_action(uuid,text,text,jsonb,integer,uuid)','execute') as anonymous,
    has_function_privilege('authenticated','public.sbmj_order_action(uuid,text,text,jsonb,integer,uuid)','execute') as authenticated,
    has_function_privilege('service_role','public.sbmj_order_action(uuid,text,text,jsonb,integer,uuid)','execute') as service`);
  assert.deepEqual(privileges.rows[0], { anonymous: false, authenticated: false, service: true });
});

test('payment, assignment, signature and confirmation are atomic, private and replay-safe', async () => {
  await db.exec(`insert into driver_profiles(user_id,phone,zone,status,available) values('${driver}','+2290155468138','Cotonou','approved',true);
    insert into products(id,name,category,price,stock) values('workflow-product','Watch','watches',100,1);
    insert into orders(id,customer_name,email,whatsapp,address,city,items,total_price,payment_status)
    values('workflow-own','Client Test','client@example.test','+2290155468138','Test','Cotonou','[{"productId":"workflow-product","productName":"Watch","price":100,"quantity":1}]',100,'pending'),
    ('workflow-other','Other Client','other@example.test','+2290155468138','Test','Cotonou','[{"productId":"workflow-product","productName":"Watch","price":100,"quantity":1}]',100,'pending');`);
  await assert.rejects(action(client, 'workflow-own', 'record_payment', 0, { reference: 'bank-test', amountMinor: 10000, currency: 'EUR' }), /access_denied/);
  await assert.rejects(action(admin, 'workflow-own', 'assign', 0, { driverId: driver }), /payment_required/);
  const paymentId = crypto.randomUUID();
  const paid = await action(admin, 'workflow-own', 'record_payment', 0, { reference: 'bank-test', amountMinor: 10000, currency: 'EUR', method: 'bank' }, paymentId);
  assert.equal(paid.fulfilment_status, 'preparing');
  await action(admin, 'workflow-own', 'record_payment', 0, { reference: 'bank-test', amountMinor: 10000, currency: 'EUR', method: 'bank' }, paymentId);
  await assert.rejects(action(admin, 'workflow-own', 'record_payment', 0, { reference: 'different-payment', amountMinor: 10000, currency: 'EUR', method: 'bank' }, paymentId), /request_conflict/);
  assert.equal((await db.query('select * from payment_events')).rows.length, 1);
  const second = await action(admin, 'workflow-other', 'record_payment', 0, { reference: 'bank-other', amountMinor: 10000, currency: 'EUR', method: 'bank' });
  assert.equal(second.fulfilment_status, 'stock_issue');
  assert.equal((await db.query<{ stock: number }>("select stock from products where id='workflow-product'")).rows[0].stock, 0);
  await assert.rejects(action(admin, 'workflow-other', 'assign', 1, { driverId: driver }), /stock_required/);
  const assigned = await action(admin, 'workflow-own', 'assign', 1, { driverId: driver });
  assert.equal(assigned.assigned_driver_id, driver);
  await assert.rejects(action(other, 'workflow-own', 'accept', 2), /access_denied/);
  await action(driver, 'workflow-own', 'accept', 2);
  await assert.rejects(action(driver, 'workflow-own', 'pickup', 2), /version_conflict/);
  await action(driver, 'workflow-own', 'pickup', 3);
  await action(driver, 'workflow-own', 'dispatch', 4);
  await assert.rejects(action(driver, 'workflow-own', 'sign', 5, { firstName: 'Client', consent: true, contractVersion: 'receipt-v1', condition: 'good', signature: { strokes: [] } }), /invalid_signature/);
  const signed = await action(driver, 'workflow-own', 'sign', 5, { firstName: 'Client', consent: true, contractVersion: 'receipt-v1', condition: 'issue', note: 'Packaging damaged', signature });
  assert.equal(signed.fulfilment_status, 'signed');
  assert.equal((await db.query('select * from order_delivery_proofs')).rows.length, 1);
  await assert.rejects(action(driver, 'workflow-own', 'sign', 6, { firstName: 'Client', consent: true, signature }), /invalid_transition/);
  await assert.rejects(db.exec("update order_delivery_proofs set first_name='Different'"), /immutable_record/);
  await assert.rejects(action(other, 'workflow-own', 'confirm', 6), /access_denied/);
  const final = await action(client, 'workflow-own', 'dispute', 6, { note: 'Please inspect the damaged packaging.' });
  assert.equal(final.fulfilment_status, 'disputed');
  const recipients = await db.query<{ user_id: string; kind: string }>("select user_id,kind from notifications where order_id='workflow-own'");
  assert.ok(recipients.rows.some(row => row.user_id === client && row.kind === 'signed'));
  assert.ok(recipients.rows.some(row => row.user_id === admin && row.kind === 'disputed'));
  assert.equal(recipients.rows.some(row => row.user_id === other), false);
});
