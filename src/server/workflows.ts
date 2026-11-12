import { randomUUID } from 'node:crypto';
import { authRateLimit, readJson, reply, type requireUser } from './security.js';
import { queuePush, handlePushSubscription } from './push.js';
import { readCashReport } from './cashReports.js';
import { notificationSections } from '../lib/notifications.js';

type Actor = NonNullable<Awaited<ReturnType<typeof requireUser>>>;
const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const text = (value: unknown, limit: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit) : '';
export const workflowResources = new Set(['driver-profile', 'drivers', 'deliveries', 'order-action', 'order-history', 'notifications', 'ledger', 'push-subscription']);

export function workflowOrder(row: any) {
  return { id: row.id, customerName: row.customer_name, email: row.email, whatsapp: row.whatsapp,
    address: row.address, city: row.city, notes: row.notes || '', items: row.items || [], totalPrice: Number(row.total_price),
    currency: row.currency, date: row.date, status: row.status, paymentStatus: row.payment_status,
    pricingSnapshot: row.pricing_snapshot, verificationToken: row.invoice_token,
    fulfilmentStatus: row.fulfilment_status || 'legacy', assignedDriverId: row.assigned_driver_id,
    workflowVersion: row.workflow_version || 0, archivedAt: row.archived_at, recipientRating: row.recipient_rating };
}

export function receiptSignature(value: any) {
  if (!value || !Array.isArray(value.strokes) || !value.strokes.length || value.strokes.length > 64) return null;
  let count = 0;
  const strokes = [];
  for (const stroke of value.strokes) {
    if (!Array.isArray(stroke?.points) || !stroke.points.length) return null;
    const points = [];
    for (const point of stroke.points) {
      if (++count > 3000 || typeof point.x !== 'number' || typeof point.y !== 'number'
        || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return null;
      points.push({ x: point.x, y: point.y });
    }
    strokes.push({ points });
  }
  return count >= 3 ? { strokes } : null;
}

function rpcError(res: any, error: any) {
  const known = ['version_conflict', 'order_not_found', 'access_denied', 'invalid_action', 'invalid_transition', 'payment_required',
    'stock_required', 'driver_unavailable', 'invalid_payment', 'invalid_signature', 'invalid_receipt', 'note_required', 'request_conflict'];
  const code = known.find(value => String(error?.message || '').includes(value));
  return reply(res, code === 'access_denied' ? 403 : code === 'order_not_found' ? 404 : code ? 409 : 503, {
    error: code || 'workflow_unavailable',
  });
}

async function authorisedOrder(client: any, actor: Actor, id: string) {
  const result = await client.from('orders').select('*').eq('id', id).maybeSingle();
  if (result.error) throw result.error;
  const row = result.data;
  if (!row) return null;
  if (actor.profile.is_admin || row.email?.toLowerCase() === actor.profile.email.toLowerCase()) return row;
  if (row.assigned_driver_id !== actor.profile.id) return null;
  const driver = await client.from('driver_profiles').select('status').eq('user_id', actor.profile.id).maybeSingle();
  if (driver.error) throw driver.error;
  return driver.data?.status === 'approved' ? row : null;
}

export async function handleWorkflow(req: any, res: any, actor: Actor) {
  const client = actor.client;
  const resource = req.query.resource;
  const id = text(req.query.id, 100);
  if (['drivers', 'ledger'].includes(resource) && !actor.profile.is_admin) return reply(res, 403, { error: 'access_denied' });
  if (req.method !== 'GET' && !await authRateLimit(req, res, `workflow-${resource}`, 30, 60, actor.profile.id)) return;
  if (resource === 'push-subscription') return handlePushSubscription(req, res, actor);

  if (resource === 'notifications') {
    if (req.method === 'GET') {
      const items = await client.from('notifications').select('id,kind,order_id,created_at,read_at').eq('user_id', actor.profile.id).order('created_at', { ascending: false }).limit(100);
      const count = await client.from('notifications').select('id', { head: true, count: 'exact' }).eq('user_id', actor.profile.id).is('read_at', null);
      if (items.error || count.error) throw items.error || count.error;
      const assigned = actor.profile.is_admin ? { data: [], error: null } : await client.from('orders').select('id').eq('assigned_driver_id', actor.profile.id);
      if (assigned.error) throw assigned.error;
      const missionIds = new Set((assigned.data || []).map((order: any) => order.id));
      const inboxItems = (items.data || []).map((item: any) => ({ ...item,
        targetView: actor.profile.is_admin ? 'god' : item.kind.startsWith('driver_') || missionIds.has(item.order_id) ? 'driver' : 'account',
      }));
      const sections: Record<string, number> = {};
      for (const [section, kinds] of Object.entries(notificationSections)) {
        const total = await client.from('notifications').select('id', { head: true, count: 'exact' }).eq('user_id', actor.profile.id).is('read_at', null).in('kind', kinds);
        if (total.error || total.count === null) throw total.error || new Error('notification_count_unavailable');
        sections[section] = total.count;
      }
      await queuePush(client);
      return reply(res, 200, { userId: actor.profile.id, items: inboxItems, defaultPath: actor.profile.is_admin ? '/god' : missionIds.size ? '/livraisons' : '/compte', unreadCount: count.count ?? (items.data || []).filter((n: any) => !n.read_at).length,
        sections,
        pushPublicKey: process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PUBLIC_KEY : null });
    }
    if (req.method === 'PATCH') {
      const body = await readJson(req);
      let query = client.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', actor.profile.id);
      if (id) query = query.eq('id', id);
      else if (typeof body.section === 'string' && notificationSections[body.section]) query = query.in('kind', notificationSections[body.section]);
      else if (body.all !== true) return reply(res, 400, { error: 'notification_required' });
      const result = await query.select('id');
      if (result.error) throw result.error;
      return reply(res, id && !result.data?.length ? 404 : 200, { success: true });
    }
  }

  if (resource === 'driver-profile') {
    const current = await client.from('driver_profiles').select('*').eq('user_id', actor.profile.id).maybeSingle();
    if (current.error) throw current.error;
    if (req.method === 'GET') return reply(res, 200, { profile: current.data });
    if (req.method === 'POST') {
      const body = await readJson(req);
      const phone = text(body.phone, 24).replace(/\s/g, '');
      const zone = text(body.zone, 160);
      if (!/^\+[0-9]{8,15}$/.test(phone) || zone.length < 2) return reply(res, 400, { error: 'invalid_driver_details' });
      if (current.data) return reply(res, 409, { error: 'application_exists' });
      const result = await client.from('driver_profiles').insert({ user_id: actor.profile.id, phone, zone, status: 'pending', available: false }).select('*').single();
      if (result.error) throw result.error;
      const admins = await client.from('profiles').select('id').eq('is_admin', true).eq('is_confirmed', true);
      if (admins.error) throw admins.error;
      if (admins.data?.length) {
        const notices = await client.from('notifications').insert(admins.data.map((admin: any) => ({ user_id: admin.id, kind: 'driver_pending', event_key: `driver:${actor.profile.id}` })));
        if (notices.error) throw notices.error;
      }
      await queuePush(client);
      return reply(res, 200, { profile: result.data });
    }
    if (req.method === 'PATCH') {
      const body = await readJson(req);
      if (typeof body.available !== 'boolean' || current.data?.status !== 'approved') return reply(res, 403, { error: 'driver_approval_required' });
      const result = await client.rpc('sbmj_driver_availability', { p_actor: actor.profile.id, p_available: body.available });
      if (result.error) return rpcError(res, result.error);
      return reply(res, 200, { profile: result.data });
    }
  }

  if (resource === 'drivers') {
    if (req.method === 'GET') {
      const result = await client.from('driver_profiles').select('*').order('created_at', { ascending: false }).limit(500);
      if (result.error) throw result.error;
      const ids = (result.data || []).map((d: any) => d.user_id);
      const profiles = ids.length ? await client.from('profiles').select('id,name,email').in('id', ids) : { data: [], error: null };
      if (profiles.error) throw profiles.error;
      return reply(res, 200, (result.data || []).map((d: any) => ({ ...d, name: profiles.data?.find((p: any) => p.id === d.user_id)?.name || '', email: profiles.data?.find((p: any) => p.id === d.user_id)?.email || '' })));
    }
    if (req.method === 'PATCH' && uuid.test(id)) {
      const body = await readJson(req);
      if (!['approved', 'rejected', 'suspended'].includes(body.status)) return reply(res, 400, { error: 'invalid_status' });
      const result = await client.rpc('sbmj_driver_review', { p_actor: actor.profile.id, p_driver: id, p_status: body.status });
      if (result.error) return rpcError(res, result.error);
      await queuePush(client);
      return reply(res, 200, { profile: result.data });
    }
  }

  if (resource === 'deliveries' && req.method === 'GET') {
    let query = client.from('orders').select('*').order('date', { ascending: false }).limit(500);
    if (!actor.profile.is_admin) {
      const driver = await client.from('driver_profiles').select('status').eq('user_id', actor.profile.id).maybeSingle();
      if (driver.error) throw driver.error;
      if (driver.data?.status !== 'approved') return reply(res, 403, { error: 'driver_approval_required' });
      query = query.eq('assigned_driver_id', actor.profile.id);
    }
    const result = await query;
    if (result.error) throw result.error;
    return reply(res, 200, (result.data || []).map(workflowOrder));
  }

  if (resource === 'order-history' && req.method === 'GET') {
    const order = id && await authorisedOrder(client, actor, id);
    if (!order) return reply(res, 404, { error: 'order_not_found' });
    const events = await client.from('order_events').select('id,kind,created_at,details').eq('order_id', id).order('created_at');
    const proof = await client.from('order_delivery_proofs').select('*').eq('order_id', id).maybeSingle();
    if (events.error || proof.error) throw events.error || proof.error;
    let driverName = '';
    if (order.assigned_driver_id) {
      const driver = await client.from('profiles').select('name').eq('id', order.assigned_driver_id).maybeSingle();
      if (driver.error) throw driver.error;
      driverName = driver.data?.name || '';
    }
    return reply(res, 200, { order: workflowOrder(order), driverName, events: events.data || [], proof: proof.data || null });
  }

  if (resource === 'order-action' && req.method === 'POST') {
    const body = await readJson(req, 160_000);
    if (!id || !uuid.test(String(body.requestId || '')) || !Number.isSafeInteger(body.version) || body.version < 0) return reply(res, 400, { error: 'invalid_request' });
    const payload: any = { note: text(body.note, 1000), reference: text(body.reference, 120), method: text(body.method, 30),
      driverId: text(body.driverId, 36), currency: text(body.currency, 3), amountMinor: body.amountMinor,
      firstName: text(body.firstName, 80), contractVersion: body.contractVersion, consent: body.consent === true,
      condition: body.condition, goodsReturned: body.goodsReturned === true, rating: body.rating };
    if (body.action === 'sign') {
      payload.signature = receiptSignature(body.signature);
      if (!payload.signature || !/^[\p{L}' -]{2,80}$/u.test(payload.firstName) || !payload.consent || payload.contractVersion !== 'receipt-v1'
        || !['good', 'issue'].includes(payload.condition)) return reply(res, 400, { error: 'invalid_receipt' });
    }
    if (body.action === 'record_payment' && (!Number.isSafeInteger(body.amountMinor) || body.amountMinor <= 0)) return reply(res, 400, { error: 'invalid_payment' });
    if (body.rating !== undefined && (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)) return reply(res, 400, { error: 'invalid_rating' });
    const result = await client.rpc('sbmj_order_action', { p_actor: actor.profile.id, p_order_id: id, p_action: text(body.action, 30), p_payload: payload, p_expected_version: body.version, p_request_id: body.requestId });
    if (result.error) return rpcError(res, result.error);
    await queuePush(client);
    return reply(res, 200, { order: workflowOrder(result.data) });
  }

  if (resource === 'ledger') {
    if (req.method === 'GET') {
      try { return reply(res, 200, await readCashReport(client, req.query)); }
      catch { return reply(res, 400, { error: 'ledger_unavailable_or_invalid_dates' }); }
    }
    if (req.method === 'POST') {
      const body = await readJson(req);
      const date = String(body.date || '');
      if (!Number.isSafeInteger(body.amountMinor) || body.amountMinor <= 0 || body.amountMinor > 100000000000
        || !['EUR', 'USD', 'XOF'].includes(body.currency) || !['inventory', 'delivery', 'fees', 'rent', 'tax', 'other'].includes(body.category)
        || text(body.description, 500).length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !uuid.test(body.requestId || '')) return reply(res, 400, { error: 'invalid_expense' });
      const entry = { id: body.requestId, request_id: body.requestId, actor_id: actor.profile.id,
        amount_minor: body.amountMinor, currency: body.currency, category: body.category, description: text(body.description, 500), incurred_on: date };
      const existing = await client.from('business_expenses').select('*').eq('request_id', body.requestId).maybeSingle();
      if (existing.error) throw existing.error;
      const acknowledge = (saved: any) => {
        const identical = Object.entries(entry).every(([key, value]) => String(saved?.[key]) === String(value));
        return reply(res, identical ? 200 : 409, identical ? { success: true, duplicate: true } : { error: 'request_conflict' });
      };
      if (existing.data) return acknowledge(existing.data);
      const result = await client.from('business_expenses').insert(entry).select('*').single();
      if (result.error?.code === '23505') {
        const saved = await client.from('business_expenses').select('*').eq('request_id', body.requestId).single();
        if (saved.error) throw saved.error;
        return acknowledge(saved.data);
      }
      if (result.error) throw result.error;
      return reply(res, 200, { success: true, expense: result.data });
    }
  }
  return reply(res, 405, { error: 'method_not_allowed' });
}
