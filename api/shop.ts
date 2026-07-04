import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: any) {
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
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
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
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
    return json(res, 200, { success: true, promo: rowToPromo(data?.[0] || row) });
  }

  if (req.method === 'DELETE') {
    if (!code) return json(res, 400, { error: 'Code promo requis.' });
    const { error } = await supabase.from('promo_codes').delete().eq('code', code);
    if (error) throw error;
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
    const body = await readBody(req);
    const customerName = String(body.customerName || '').trim();
    const whatsapp = String(body.whatsapp || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const address = String(body.address || '').trim();
    const city = String(body.city || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!customerName || !whatsapp || !email || !address || !city || items.length === 0) {
      return json(res, 400, { error: 'Tous les champs de livraison obligatoires doivent etre remplis.' });
    }

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
      notes: body.notes || null,
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        selectedSize: item.selectedSize || undefined,
      })),
      total_price: Number(body.totalPrice || 0),
      currency: body.currency || 'EUR',
      status: 'pending',
      date: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('orders').insert(row).select('*').single();
    if (error) throw error;
    return json(res, 200, { success: true, order: rowToOrder(data) });
  }

  if (req.method === 'PUT') {
    if (!id) return json(res, 400, { error: 'ID commande requis.' });
    const body = await readBody(req);
    const status = String(body.status || '').trim();
    if (!status) return json(res, 400, { error: 'Statut requis.' });
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select('*').single();
    if (error) throw error;
    return json(res, 200, { success: true, order: rowToOrder(data) });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

export default async function handler(req: any, res: any) {
  try {
    const resource = String(req.query?.resource || '').trim();
    const supabase = supabaseAdmin();
    if (resource === 'promos') return handlePromos(req, res, supabase);
    if (resource === 'orders') return handleOrders(req, res, supabase);
    return json(res, 404, { error: 'Ressource introuvable.' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur boutique', message: error?.message || String(error) });
  }
}
