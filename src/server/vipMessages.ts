import { createHash } from 'node:crypto';
import { sendEmail } from '../../serverless/_supabase.js';
import { authRateLimit, readJson, reply, recordSecurityEvent } from './security.js';

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export async function handleVipMessage(req: any, res: any, client: any) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'method_not_allowed' });
  if (!await authRateLimit(req, res, 'vip-message', 10, 60, req.actor.profile.id)) return;
  const body = await readJson(req);
  const name = clean(body.customerName, 100);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.whatsapp, 25).replace(/\s/g, '');
  const message = clean(body.message, 1500);
  const id = String(body.requestId || '');
  if (body.confirmed !== true || body.consent !== true || name.length < 2 || message.length < 3
    || !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)
    || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (phone && !/^\+?[1-9]\d{7,14}$/.test(phone)) || (!email && !phone)) return reply(res, 400, { error: 'invalid_or_unconfirmed_message' });
  const language = body.language === 'EN' ? 'EN' : 'FR';
  const hash = createHash('sha256').update(JSON.stringify([req.actor.profile.id, name, email, phone, message, language])).digest('hex');
  const answer = (row: any) => reply(res, 200, { emailStatus: row.email_status, emailSent: row.email_status === 'accepted', whatsappStatus: phone ? 'manual' : 'not_requested',
    whatsappUrl: phone ? `https://wa.me/${phone.replace(/^\+/, '')}?text=${encodeURIComponent(`STEVENBMJ\n\n${language === 'FR' ? 'Bonjour' : 'Hello'} ${name},\n\n${message}\n\nStevenBmj`)}` : null });
  const existing = await client.from('outreach_messages').select('*').eq('id', id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.request_hash === hash ? answer(existing.data) : reply(res, 409, { error: 'request_conflict' });
  const entry = { id, actor_id: req.actor.profile.id, request_hash: hash, customer_name: name, recipient_email: email || null, recipient_phone: phone || null, message, email_status: email ? 'sending' : 'not_requested' };
  const inserted = await client.from('outreach_messages').insert(entry);
  if (inserted.error?.code === '23505') return reply(res, 409, { error: 'request_in_progress' });
  if (inserted.error) throw inserted.error;
  let accepted = false;
  if (email) {
    accepted = await sendEmail(email, language === 'FR' ? 'Un message de StevenBmj' : 'A message from StevenBmj', `<div style="font-family:Arial,sans-serif;line-height:1.7"><h2>StevenBmj</h2><p>${language === 'FR' ? 'Bonjour' : 'Hello'} ${escape(name)},</p><p style="white-space:pre-wrap">${escape(message)}</p><p>StevenBmj</p></div>`).catch(() => false);
    entry.email_status = accepted ? 'accepted' : 'not_accepted';
    const saved = await client.from('outreach_messages').update({ email_status: entry.email_status, updated_at: new Date().toISOString() }).eq('id', id);
    if (saved.error) throw saved.error;
  }
  await recordSecurityEvent(req, `Customer message ${id}: email ${entry.email_status}, WhatsApp manual`);
  return answer(entry);
}
