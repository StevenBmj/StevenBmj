import { createClient } from '@supabase/supabase-js';
import { handleWorkflow, workflowResources, workflowOrder } from '../src/server/workflows';
import { queuePush } from '../src/server/push';
import { exchangeRates } from '../src/server/exchangeRates';
import { randomUUID } from 'node:crypto';
import { periodRange, readReportOrders, salesReport } from '../src/server/reports';
import { assertSameOrigin, authRateLimit, readJson, requireUser, recordSecurityEvent } from '../src/server/security';
import { sendEmail } from './_supabase';
import { handleVipMessage } from '../src/server/vipMessages';

function json(res: any, status: number, body: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}' -]{2,80}$/u;
const PHONE_RE = /^\+[1-9]\d{6,18}$/;
async function rateLimit(req: any, res: any, scope: string, limit = 20, windowMs = 60_000) {
  return authRateLimit(req, res, scope, limit, Math.ceil(windowMs / 1000));
}

function cleanText(value: any, max = 600) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function escapeHtml(value: any) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function conciergeEmail() {
  return process.env.CONTACT_EMAIL || process.env.MAIL_TO || 'stevenbmj202@gmail.com';
}

function supabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const readBody = readJson;
function rowToPromo(row: any) {
  return {
    code: row.code,
    discountPercentage: Number(row.discount_percentage || 0),
    minAmount: row.min_amount == null ? undefined : Number(row.min_amount),
    active: Boolean(row.active),
    expiresAt: row.expires_at || undefined,
  };
}

function rowToOrder(row: any) {
  return {
    ...workflowOrder(row),
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    email: row.email || undefined,
    address: row.address,
    city: row.city,
    notes: row.notes || undefined,
    items: row.items || [],
    totalPrice: Number(row.total_price || 0),
    currency: row.currency || 'EUR',
    status: row.status || 'pending',
    date: row.date,
    pdfInvoiceUrl: row.pdf_invoice_url || undefined,
    pricingSnapshot: row.pricing_snapshot || undefined,
    verificationToken: row.invoice_token || undefined,
    paymentStatus: row.payment_status || 'unknown',
  };
}

function rowToReview(row: any) {
  return {
    id: row.id,
    customerName: row.customer_name,
    rating: Number(row.rating || 5),
    text: row.text,
    status: row.status || 'pending',
    date: row.date,
  };
}

function rowToAnnouncement(row: any) {
  return {
    id: row.id,
    text: row.text,
    textEn: row.text_en || row.text,
    expiresAt: row.expires_at,
    active: Boolean(row.active),
    createdAt: row.created_at || row.expires_at || new Date().toISOString(),
  };
}

function rowToSecurityLog(row: any) {
  const date = row.timestamp ? new Date(row.timestamp) : new Date();
  return {
    id: row.id,
    timestamp: date.toISOString(),
    ip: row.ip || '127.0.0.1',
    event: row.event || '',
    status: row.status || 'SECURED',
    country: row.country || null,
    city: row.city || null,
    archivedAt: row.archived_at || null,
  };
}

async function addSecurityLog(supabase: any, req: any, event: string, status = 'SECURED') {
  await recordSecurityEvent(req, event, status);
}


async function handlePromos(req: any, res: any, supabase: any) {
  const code = String(req.query?.code || '').trim().toUpperCase();
  const action = String(req.query?.action || '').trim();

  if (req.method === 'GET') {
    if (code) {
      if (!await authRateLimit(req, res, 'promo-check', 30, 300)) return;
      const result = await supabase.from('promo_codes').select('*').eq('code', code).maybeSingle();
      if (result.error) throw result.error;
      const promo = result.data;
      const valid = promo && promo.active && (!promo.expires_at || Date.parse(promo.expires_at) > Date.now());
      return json(res, 200, valid ? [rowToPromo(promo)] : []);
    }
    const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToPromo));
  }

  if (req.method === 'POST' && action === 'toggle') {
    if (!code) return json(res, 400, { error: 'Code promo requis.' });
    const current = await supabase.from('promo_codes').select('*').eq('code', code).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data) return json(res, 404, { error: 'Code promo introuvable.' });
    const { data, error } = await supabase
      .from('promo_codes')
      .update({ active: !current.data.active })
      .eq('code', code)
      .select('*')
      .single();
    if (error) throw error;
    await addSecurityLog(supabase, req, `Code promo ${code} ${data.active ? 'active' : 'desactive'}`, 'SECURED');
    return json(res, 200, { success: true, promo: rowToPromo(data) });
  }

  if (req.method === 'POST') {
    const promo = await readBody(req);
    const promoCode = String(promo.code || '').trim().toUpperCase();
    const discountPercentage = Number(promo.discountPercentage || promo.discount_percentage || 0);
    if (!promoCode || !discountPercentage) return json(res, 400, { error: 'Code promo et reduction requis.' });
    const row = {
      code: promoCode,
      discount_percentage: discountPercentage,
      min_amount: promo.minAmount ?? promo.min_amount ?? null,
      active: promo.active !== false,
      expires_at: promo.expiresAt ?? promo.expires_at ?? null,
    };
    const { data, error } = await supabase.from('promo_codes').upsert(row, { onConflict: 'code' }).select('*');
    if (error) throw error;
    await addSecurityLog(supabase, req, `Code promo sauvegarde: ${promoCode}`, 'SECURED');
    return json(res, 200, { success: true, promo: rowToPromo(data?.[0] || row) });
  }

  if (req.method === 'DELETE') {
    if (!code) return json(res, 400, { error: 'Code promo requis.' });
    const { error } = await supabase.from('promo_codes').delete().eq('code', code);
    if (error) throw error;
    await addSecurityLog(supabase, req, `Code promo supprime: ${code}`, 'SECURED');
    return json(res, 200, { success: true });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

async function handleOrders(req: any, res: any, supabase: any) {
  const id = String(req.query?.id || '').trim();
  const actor = req.actor;

  if (req.method === 'GET') {
    let query = supabase.from('orders').select('*').order('date', { ascending: false });
    if (!actor.profile.is_admin) query = query.eq('email', actor.profile.email);
    if (id) query = query.eq('id', id);
    const { data, error } = await query;
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToOrder));
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    if (!await rateLimit(req, res, 'orders', 8, 60_000)) return;
    const body = await readBody(req);
    const editing = req.method === 'PATCH';
    const requestId = String(body.requestId || '');
    if (requestId && !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(requestId)) return json(res, 400, { error: 'Identifiant de demande invalide.' });
    if (editing && !id) return json(res, 400, { error: 'Reference de commande requise.' });
    const orderId = editing ? id : `SBMJ-${requestId || randomUUID()}`;
    let existing: any = null;
    if (editing || requestId) {
      const previous = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      if (previous.error) throw previous.error;
      existing = previous.data;
      if (existing && existing.email !== actor.profile.email) return json(res, 403, { error: 'Acces a cette commande refuse.' });
      if (!editing && existing) return json(res, 200, { success: true, order: rowToOrder(existing) });
      if (editing && (!existing || existing.status !== 'pending' || existing.payment_status !== 'pending')) return json(res, 403, { error: 'Cette commande ne peut plus etre modifiee.' });
    }
    const customerName = cleanText(body.customerName, 80);
    const whatsapp = cleanText(body.whatsapp, 24).replace(/\s+/g, '');
    const email = String(body.email || '').trim().toLowerCase();
    if (email !== actor.profile.email.toLowerCase()) return json(res, 403, { error: 'Utilisez votre adresse de connexion.' });
    const address = cleanText(body.address, 220);
    const city = cleanText(body.city, 100);
    const notes = cleanText(body.notes, 800);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!customerName || !whatsapp || !email || !address || !city || items.length === 0) {
      return json(res, 400, { error: 'Tous les champs de livraison obligatoires doivent etre remplis.' });
    }
    if (!NAME_RE.test(customerName) || /\d/.test(customerName)) {
      return json(res, 400, { error: 'Le nom complet ne doit pas contenir de chiffres.' });
    }
    if (!EMAIL_RE.test(email)) return json(res, 400, { error: 'Adresse e-mail invalide.' });
    if (!PHONE_RE.test(whatsapp)) return json(res, 400, { error: 'Numero WhatsApp invalide. Choisissez un pays puis saisissez les chiffres.' });
    if (items.length > 30) return json(res, 400, { error: 'Panier trop volumineux.' });

    const profile = await supabase.from('profiles').select('is_confirmed').eq('email', email).maybeSingle();
    if (profile.error) throw profile.error;
    if (profile.data && profile.data.is_confirmed === false) {
      return json(res, 403, { error: "Votre compte n'est pas encore active. Veuillez l'activer avec le code recu par e-mail." });
    }

    const ids = [...new Set(items.map((item: any) => String(item.productId || '')))];
    const catalogue = await supabase.from('products').select('id,name,price,promo_price,stock,specs').in('id', ids);
    if (catalogue.error) throw catalogue.error;
    const quantities = new Map<string, number>();
    const canonicalItems: any[] = [];
    let subtotalCents = 0;
    for (const item of items) {
      const product = catalogue.data?.find((p: any) => p.id === item.productId);
      const quantity = Number(item.quantity);
      const accumulated = (quantities.get(item.productId) || 0) + quantity;
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || accumulated > Number(product.stock)) {
        return json(res, 400, { error: 'Produit indisponible ou quantite invalide. Actualisez votre panier.' });
      }
      quantities.set(item.productId, accumulated);
      const price = Number(product.promo_price ?? product.price);
      const priceCents = Math.round(price * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error('Invalid catalogue price');
      canonicalItems.push({ productId: product.id, productName: product.name, quantity, price: priceCents / 100,
        selectedSize: cleanText(item.selectedSize, 40) || undefined });
      subtotalCents += priceCents * quantity;
    }
    let discount = 0;
    const promoCode = String(body.promoCode || '').trim().toUpperCase();
    if (promoCode) {
      const promoResult = await supabase.from('promo_codes').select('*').eq('code', promoCode).maybeSingle();
      if (promoResult.error) throw promoResult.error;
      const promo = promoResult.data;
      discount = Number(promo?.discount_percentage || 0);
      if (!promo?.active || !Number.isFinite(discount) || discount <= 0 || discount > 100
        || (promo.expires_at && !(Date.parse(promo.expires_at) > Date.now()))
        || subtotalCents < Number(promo.min_amount || 0) * 100) {
        return json(res, 400, { error: 'Code promo invalide, expire ou minimum non atteint.' });
      }
    }
    const netCents = subtotalCents - Math.round(subtotalCents * discount / 100);
    const shippingCents = netCents >= 300000 ? 0 : 15000;
    const config = await supabase.from('app_settings').select('data').eq('id', 'default').maybeSingle();
    if (config.error) throw config.error;
    const settings = config.data?.data || {};
    const pricingSnapshot = {
      version: 1, currency: 'EUR', subtotalCents, discountCents: subtotalCents - netCents,
      discountPercent: discount, promoCode, shippingCents, totalCents: netCents + shippingCents,
      seller: existing?.pricing_snapshot?.seller || { name: 'StevenBmj', address: cleanText(settings.contactAddress || 'Cotonou, Benin', 400),
        phone: cleanText(settings.whatsappContact || '+22955468138', 30), email: conciergeEmail() },
    };
    const row = {
      id: orderId,
      ...(editing ? { workflow_version: Number(existing?.workflow_version || 0) + 1 } : {}),
      customer_name: customerName,
      whatsapp,
      email,
      address,
      city,
      notes: notes || null,
      items: canonicalItems,
      total_price: (netCents + shippingCents) / 100,
      currency: 'EUR',
      pricing_snapshot: pricingSnapshot,
      invoice_token: existing?.invoice_token || randomUUID(),
      payment_status: 'pending',
      status: 'pending',
      date: existing?.date || new Date().toISOString(),
    };
    const mutation = editing ? supabase.from('orders').update(row).eq('id', orderId).eq('email', actor.profile.email).eq('status', 'pending').eq('payment_status', 'pending')
      : supabase.from('orders').insert(row);
    const { data, error } = await mutation.select('*').maybeSingle();
    if (error?.code === '23505' && !editing && requestId) {
      const duplicate = await supabase.from('orders').select('*').eq('id', orderId).eq('email', actor.profile.email).maybeSingle();
      if (duplicate.data) return json(res, 200, { success: true, order: rowToOrder(duplicate.data) });
    }
    if (error) throw error;
    if (!data) return json(res, 409, { error: 'La commande a change. Actualisez avant de reessayer.' });
    await addSecurityLog(supabase, req, `Nouvelle commande ${orderId} - ${customerName}`, 'SECURED');
    await queuePush(supabase);
    return json(res, 200, { success: true, order: rowToOrder(data) });
  }

  if (req.method === 'DELETE') {
    if (!id) return json(res, 400, { error: 'ID commande requis.' });
    return json(res, 403, { error: 'Les commandes ne sont pas effacees. Utilisez l’annulation ou l’archivage du suivi de commande.' });
  }

  if (req.method === 'PUT') {
    if (!id) return json(res, 400, { error: 'ID commande requis.' });
    if (!actor.profile.is_admin) return json(res, 403, { error: 'Acces refuse.' });
    return json(res, 409, { error: 'Utilisez le parcours de livraison pour conserver les validations et la preuve de remise.' });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

async function handleReviews(req: any, res: any, supabase: any) {
  const id = String(req.query?.id || '').trim();
  const action = String(req.query?.action || '').trim();
  const scope = String(req.query?.scope || '').trim();

  if (req.method === 'GET') {
    let query = supabase.from('reviews').select('*').order('date', { ascending: false });
    if (scope !== 'admin') query = query.eq('status', 'approved');
    const { data, error } = await query;
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToReview));
  }

  if (req.method === 'POST') {
    if (!await rateLimit(req, res, 'reviews', 5, 60_000)) return;
    const body = await readBody(req);
    const customerName = cleanText(req.actor.profile.name, 80);
    const text = cleanText(body.text || body.comment, 1000);
    const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
    if (!NAME_RE.test(customerName) || /\d/.test(customerName)) {
      return json(res, 400, { error: 'Le nom ne doit pas contenir de chiffres.' });
    }
    if (text.length < 8) return json(res, 400, { error: 'Votre avis est trop court.' });

    const row = {
      id: `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      customer_name: customerName,
      rating,
      text,
      status: 'pending',
      date: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('reviews').insert(row).select('*').single();
    if (error) throw error;
    await sendEmail(
      conciergeEmail(),
      'Nouvel avis client StevenBmj en attente',
      `<p>Un nouvel avis client est en attente de moderation.</p><p><strong>${escapeHtml(customerName)}</strong> - ${rating}/5</p><p>${escapeHtml(text)}</p>`
    ).catch(() => false);
    await addSecurityLog(supabase, req, `Nouvel avis client en attente: ${customerName}`, 'SECURED');
    return json(res, 200, { success: true, review: rowToReview(data) });
  }

  if ((req.method === 'PUT' || req.method === 'POST') && action === 'approve') {
    if (!id) return json(res, 400, { error: 'ID avis requis.' });
    const { data, error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', id).select('*').single();
    if (error) throw error;
    await addSecurityLog(supabase, req, `Avis approuve: ${id}`, 'SECURED');
    return json(res, 200, { success: true, review: rowToReview(data) });
  }

  if (req.method === 'DELETE') {
    if (!id) return json(res, 400, { error: 'ID avis requis.' });
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    await addSecurityLog(supabase, req, `Avis supprime: ${id}`, 'SECURED');
    return json(res, 200, { success: true });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

async function handleMessage(req: any, res: any, supabase: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!await rateLimit(req, res, 'messages', 6, 60_000)) return;
  const body = await readBody(req);
  const kind = cleanText(req.query?.kind || body.kind || 'contact', 24);
  const name = cleanText(body.name || body.customerName || 'Client StevenBmj', 80);
  const email = String(body.email || '').trim().toLowerCase();
  const topic = cleanText(body.topic || kind, 120);
  const message = cleanText(body.message, 1500);

  if (!EMAIL_RE.test(email)) return json(res, 400, { error: 'Adresse e-mail invalide.' });
  if (name !== 'Client StevenBmj' && (!NAME_RE.test(name) || /\d/.test(name))) {
    return json(res, 400, { error: 'Le nom ne doit pas contenir de chiffres.' });
  }
  if (message.length < 8) return json(res, 400, { error: 'Le message est trop court.' });

  const label = kind === 'care' ? "Ordre d'Information Prive" : 'Dossier de Prestige';
  const sent = await sendEmail(
    conciergeEmail(),
    `${label} StevenBmj - ${email}`,
    `
      <p style="font-size:15px;color:#cca43b;font-weight:bold;">${escapeHtml(label)}</p>
      <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p><strong>Theme :</strong> ${escapeHtml(topic)}</p>
      <div style="margin-top:16px;padding:16px;border:1px solid #cca43b;background:#050505;color:#fff;">
        ${escapeHtml(message)}
      </div>
    `
  );
  if (!sent) return json(res, 500, { error: "Impossible d'envoyer le message par e-mail." });
  await addSecurityLog(supabase, req, `${label} envoye par ${email}`, 'SECURED');
  return json(res, 200, { success: true, message: 'Message transmis au concierge StevenBmj.' });
}

async function handleNewsletter(req: any, res: any, supabase: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!await rateLimit(req, res, 'newsletter', 4, 60_000)) return;
  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json(res, 400, { error: 'Adresse e-mail invalide.' });
  const sent = await sendEmail(
    conciergeEmail(),
    'Nouvelle inscription Salon Prive StevenBmj',
    `<p>Nouvelle inscription newsletter / salon prive :</p><p><strong>${escapeHtml(email)}</strong></p>`
  );
  if (!sent) return json(res, 500, { error: "Impossible d'enregistrer l'inscription par e-mail." });
  await addSecurityLog(supabase, req, `Inscription newsletter: ${email}`, 'SECURED');
  return json(res, 200, { success: true });
}

async function handleAnalytics(req: any, res: any, supabase: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  let period;
  try { period = periodRange(req.query || {}); }
  catch { return json(res, 400, { error: 'Periode invalide.' }); }
  const { rows, truncated } = await readReportOrders(supabase, period);
  return json(res, 200, salesReport(rows, period, truncated));
}

async function handleAnnouncements(req: any, res: any, supabase: any) {
  const id = cleanText(req.query?.id, 100);

  if (req.method === 'GET') {
    const now = new Date().toISOString();
    await supabase.from('announcements').delete().lt('expires_at', now).then(() => null, () => null);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToAnnouncement));
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const text = cleanText(body.text, 400);
    const textEn = cleanText(body.textEn || body.text_en || body.text, 400);
    const duration = Math.max(1, Number(body.durationMinutes || 1440));
    if (!text) return json(res, 400, { error: "Le texte de l'annonce est requis." });
    const row = {
      id: `ann-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      text,
      text_en: textEn,
      expires_at: new Date(Date.now() + duration * 60_000).toISOString(),
      active: true,
    };
    const { data, error } = await supabase.from('announcements').insert(row).select('*').single();
    if (error) throw error;
    await addSecurityLog(supabase, req, `Nouvelle annonce publiee: ${text.slice(0, 80)}`, 'SECURED');
    return json(res, 200, { success: true, announcement: rowToAnnouncement(data) });
  }

  if (req.method === 'DELETE') {
    if (!id) return json(res, 400, { error: 'ID annonce requis.' });
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    await addSecurityLog(supabase, req, `Annonce archivee: ${id}`, 'SECURED');
    return json(res, 200, { success: true });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

async function handleSecurityLogs(req: any, res: any, supabase: any) {
  if (req.method === 'GET') {
    let query = supabase
      .from('security_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);
    if (req.query?.archived !== '1') query = query.is('archived_at', null);
    const { data, error } = await query;
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToSecurityLog));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('security_logs').update({ archived_at: new Date().toISOString() }).is('archived_at', null);
    if (error) throw error;
    await addSecurityLog(supabase, req, 'Security history archived by administrator', 'SECURED');
    return json(res, 200, { success: true, logs: [] });
  }

  return json(res, 405, { error: 'Method not allowed' });
}


export default async function handler(req: any, res: any) {
  try {
    if (!assertSameOrigin(req, res)) return;
    const resource = String(req.query?.resource || '').trim();
    const adminOnly = ['analytics', 'security-logs', 'vip-message', 'drivers', 'ledger'].includes(resource)
      || (['promos', 'announcements'].includes(resource) && req.method !== 'GET')
      || (resource === 'promos' && req.method === 'GET' && !req.query?.code)
      || (resource === 'reviews' && (req.query?.scope === 'admin' || ['PUT', 'DELETE'].includes(req.method) || req.query?.action === 'approve'));
    if (adminOnly || resource === 'orders' || (resource === 'reviews' && req.method === 'POST') || workflowResources.has(resource)) {
      req.actor = await requireUser(req, res, adminOnly);
      if (!req.actor) return;
    }
    const supabase = supabaseAdmin();
    if (resource === 'rates') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
      if (!await authRateLimit(req, res, 'exchange-rates', 30, 300)) return;
      return json(res, 200, await exchangeRates(supabase));
    }
    if (workflowResources.has(resource)) return await handleWorkflow(req, res, req.actor);
    if (resource === 'invoice-verify') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
      if (!await authRateLimit(req, res, 'invoice-verify', 30, 300)) return;
      const token = String(req.query?.token || '');
      if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(token)) return json(res, 400, { error: 'Reference invalide.' });
      const result = await supabase.from('orders').select('id,total_price,currency,date,status,payment_status').eq('invoice_token', token).maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return json(res, 404, { error: 'Facture introuvable.' });
      const order = result.data;
      return json(res, 200, { id: order.id, totalPrice: Number(order.total_price), currency: order.currency,
        date: order.date, status: order.status, paymentStatus: order.payment_status || 'unknown' });
    }
    if (resource === 'promos') return await handlePromos(req, res, supabase);
    if (resource === 'orders') return await handleOrders(req, res, supabase);
    if (resource === 'reviews') return await handleReviews(req, res, supabase);
    if (resource === 'analytics') return await handleAnalytics(req, res, supabase);
    if (resource === 'announcements') return await handleAnnouncements(req, res, supabase);
    if (resource === 'security-logs') return await handleSecurityLogs(req, res, supabase);
    if (resource === 'vip-message') return await handleVipMessage(req, res, supabase);
    if (resource === 'message') return await handleMessage(req, res, supabase);
    if (resource === 'newsletter') return await handleNewsletter(req, res, supabase);
    return json(res, 404, { error: 'Ressource introuvable.' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur boutique' });
  }
}
