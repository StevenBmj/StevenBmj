import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}' -]{2,80}$/u;
const PHONE_RE = /^\+[1-9]\d{6,18}$/;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: any) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
}

function rateLimit(req: any, res: any, scope: string, limit = 20, windowMs = 60_000) {
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  if (current.count > limit) {
    json(res, 429, { error: 'Trop de requetes. Veuillez patienter quelques instants.' });
    return false;
  }
  return true;
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

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return false;
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
  });
  await transporter.sendMail({
    from: `"Maison StevenBmj" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
  return true;
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

async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > 64_000) throw new Error('Payload trop volumineux.');
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

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
    timestamp: date.toLocaleString('fr-FR'),
    ip: row.ip || '127.0.0.1',
    event: row.event || '',
    status: row.status || 'SECURED',
  };
}

async function addSecurityLog(supabase: any, req: any, event: string, status = 'SECURED') {
  await supabase.from('security_logs').insert({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    ip: clientIp(req),
    event: cleanText(event, 300),
    status,
  }).then(() => null, () => null);
}

function analyticsRows(filter: string) {
  const week = [
    { name: 'Lundi / Mon', ventes: 18000, benefices: 7500, pertes: 0, revenus: 18000, visiteurs: 450, clics: 1200, conversion: 3.8 },
    { name: 'Mardi / Tue', ventes: 29500, benefices: 12100, pertes: 0, revenus: 29500, visiteurs: 520, clics: 1530, conversion: 4.2 },
    { name: 'Mercredi / Wed', ventes: 12500, benefices: 5000, pertes: 200, revenus: 12300, visiteurs: 480, clics: 1100, conversion: 3.1 },
    { name: 'Jeudi / Thu', ventes: 34000, benefices: 15200, pertes: 0, revenus: 34000, visiteurs: 610, clics: 1980, conversion: 4.9 },
    { name: 'Vendredi / Fri', ventes: 45000, benefices: 21000, pertes: 0, revenus: 45000, visiteurs: 750, clics: 2500, conversion: 5.5 },
    { name: 'Samedi / Sat', ventes: 58000, benefices: 25600, pertes: 150, revenus: 57850, visiteurs: 890, clics: 3100, conversion: 6.1 },
    { name: 'Dimanche / Sun', ventes: 39000, benefices: 16900, pertes: 0, revenus: 39000, visiteurs: 700, clics: 2200, conversion: 5.0 },
  ];
  const month = [
    { name: 'Semaine 1', ventes: 110000, benefices: 48000, pertes: 1200, revenus: 108800, visiteurs: 3400, clics: 11200, conversion: 4.1 },
    { name: 'Semaine 2', ventes: 145000, benefices: 65000, pertes: 500, revenus: 144500, visiteurs: 3900, clics: 12800, conversion: 4.6 },
    { name: 'Semaine 3', ventes: 98000, benefices: 41000, pertes: 800, revenus: 97200, visiteurs: 3100, clics: 9500, conversion: 3.9 },
    { name: 'Semaine 4', ventes: 185000, benefices: 83000, pertes: 0, revenus: 185000, visiteurs: 5200, clics: 17200, conversion: 5.2 },
  ];
  const year = [
    { name: 'Jan', ventes: 450000, benefices: 200000, pertes: 3000, revenus: 447000, visiteurs: 12000, clics: 45000, conversion: 4.2 },
    { name: 'Feb', ventes: 520000, benefices: 230000, pertes: 2500, revenus: 517500, visiteurs: 15000, clics: 51000, conversion: 4.5 },
    { name: 'Mar', ventes: 410000, benefices: 180000, pertes: 4000, revenus: 406000, visiteurs: 11800, clics: 39000, conversion: 3.8 },
    { name: 'Apr', ventes: 680000, benefices: 310000, pertes: 1000, revenus: 679000, visiteurs: 18500, clics: 62000, conversion: 5.1 },
    { name: 'May', ventes: 890000, benefices: 405000, pertes: 1500, revenus: 888500, visiteurs: 22000, clics: 85000, conversion: 5.6 },
    { name: 'Jun', ventes: 760000, benefices: 350000, pertes: 2000, revenus: 758000, visiteurs: 20500, clics: 78000, conversion: 5.0 },
  ];
  if (filter === 'month') return month;
  if (filter === 'year') return year;
  return week;
}

async function handlePromos(req: any, res: any, supabase: any) {
  const code = String(req.query?.code || '').trim().toUpperCase();
  const action = String(req.query?.action || '').trim();

  if (req.method === 'GET') {
    const now = new Date().toISOString();
    await supabase.from('promo_codes').update({ active: false }).eq('active', true).lt('expires_at', now);
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

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToOrder));
  }

  if (req.method === 'POST') {
    if (!rateLimit(req, res, 'orders', 8, 60_000)) return;
    const body = await readBody(req);
    const customerName = cleanText(body.customerName, 80);
    const whatsapp = cleanText(body.whatsapp, 24).replace(/\s+/g, '');
    const email = String(body.email || '').trim().toLowerCase();
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

    const orderId = `SBMJ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const row = {
      id: orderId,
      customer_name: customerName,
      whatsapp,
      email,
      address,
      city,
      notes: notes || null,
      items: items.map((item: any) => ({
        productId: cleanText(item.productId, 80),
        productName: cleanText(item.productName, 180),
        quantity: Math.max(1, Math.min(99, Number(item.quantity || 1))),
        price: Math.max(0, Number(item.price || 0)),
        selectedSize: cleanText(item.selectedSize, 40) || undefined,
      })),
      total_price: Math.max(0, Number(body.totalPrice || 0)),
      currency: ['EUR', 'CFA', 'USD'].includes(String(body.currency)) ? body.currency : 'EUR',
      status: 'pending',
      date: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('orders').insert(row).select('*').single();
    if (error) throw error;
    await addSecurityLog(supabase, req, `Nouvelle commande ${orderId} - ${customerName}`, 'SECURED');
    return json(res, 200, { success: true, order: rowToOrder(data) });
  }

  if (req.method === 'DELETE') {
    if (!id) return json(res, 400, { error: 'ID commande requis.' });
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    await addSecurityLog(supabase, req, `Commande supprimee: ${id}`, 'SECURED');
    return json(res, 200, { success: true });
  }

  if (req.method === 'PUT') {
    if (!id) return json(res, 400, { error: 'ID commande requis.' });
    const body = await readBody(req);
    const status = String(body.status || '').trim();
    if (!status) return json(res, 400, { error: 'Statut requis.' });
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select('*').single();
    if (error) throw error;
    await addSecurityLog(supabase, req, `Commande ${id} mise a jour: ${status}`, 'SECURED');
    return json(res, 200, { success: true, order: rowToOrder(data) });
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
    if (!rateLimit(req, res, 'reviews', 5, 60_000)) return;
    const body = await readBody(req);
    const customerName = cleanText(body.customerName || body.name, 80);
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
  if (!rateLimit(req, res, 'messages', 6, 60_000)) return;
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
  if (!rateLimit(req, res, 'newsletter', 4, 60_000)) return;
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

async function handleAnalytics(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  return json(res, 200, analyticsRows(String(req.query?.filter || 'week')));
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
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(150);
    if (error) throw error;
    return json(res, 200, (data || []).map(rowToSecurityLog));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('security_logs').delete().neq('id', '__never__');
    if (error) throw error;
    return json(res, 200, { success: true, logs: [] });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

async function handleVipMessage(req: any, res: any, supabase: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'vip-message', 10, 60_000)) return;
  const body = await readBody(req);
  const customerName = cleanText(body.customerName || body.name || 'Client VIP', 100);
  const email = String(body.email || '').trim().toLowerCase();
  const whatsappDigits = String(body.whatsapp || '').replace(/\D/g, '');
  const message = cleanText(body.message, 1500);

  if (!message || message.length < 3) return json(res, 400, { error: 'Message VIP requis.' });
  if (email && !EMAIL_RE.test(email)) return json(res, 400, { error: 'Adresse e-mail VIP invalide.' });
  if (!email && !whatsappDigits) return json(res, 400, { error: 'Ajoutez un e-mail ou un numero WhatsApp pour ce client.' });

  const whatsappText = `*STEVENBMJ*\n━━━━━━━━━━━━━━━━\nCher(e) *${customerName}*,\n\n${message}\n\nStevenBmj - Conciergerie Royale`;
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappText)}` : '';
  let emailSent = false;
  if (email) {
    emailSent = await sendEmail(
      email,
      'Message prive Maison StevenBmj',
      `
        <div style="font-family:Arial,sans-serif;background:#050505;color:#f5f5f5;padding:24px;border:1px solid #d97706;">
          <p style="color:#d97706;font-weight:bold;letter-spacing:.18em;">STEVENBMJ HAUTE COUTURE</p>
          <p>Cher/Chere ${escapeHtml(customerName)},</p>
          <p>${escapeHtml(message)}</p>
          <p style="color:#999;margin-top:24px;">StevenBmj - Conciergerie Royale</p>
        </div>
      `
    ).catch(() => false);
  }

  await sendEmail(
    conciergeEmail(),
    `Copie message VIP StevenBmj - ${customerName}`,
    `<p><strong>Client :</strong> ${escapeHtml(customerName)}</p><p><strong>Email :</strong> ${escapeHtml(email || 'Non renseigne')}</p><p><strong>WhatsApp :</strong> ${escapeHtml(whatsappDigits || 'Non renseigne')}</p><p>${escapeHtml(message)}</p>`
  ).catch(() => false);
  await addSecurityLog(supabase, req, `Message VIP dual prepare pour ${customerName}`, 'SECURED');

  return json(res, 200, { success: true, emailSent, whatsappUrl });
}

export default async function handler(req: any, res: any) {
  try {
    const resource = String(req.query?.resource || '').trim();
    const supabase = supabaseAdmin();
    if (resource === 'promos') return handlePromos(req, res, supabase);
    if (resource === 'orders') return handleOrders(req, res, supabase);
    if (resource === 'reviews') return handleReviews(req, res, supabase);
    if (resource === 'analytics') return handleAnalytics(req, res);
    if (resource === 'announcements') return handleAnnouncements(req, res, supabase);
    if (resource === 'security-logs') return handleSecurityLogs(req, res, supabase);
    if (resource === 'vip-message') return handleVipMessage(req, res, supabase);
    if (resource === 'message') return handleMessage(req, res, supabase);
    if (resource === 'newsletter') return handleNewsletter(req, res, supabase);
    return json(res, 404, { error: 'Ressource introuvable.' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur boutique', message: error?.message || String(error) });
  }
}
