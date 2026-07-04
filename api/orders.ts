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

export default async function handler(req: any, res: any) {
  try {
    const supabase = supabaseAdmin();

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
      const enrichedItems = items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        selectedSize: item.selectedSize || undefined,
      }));

      const row = {
        id: orderId,
        customer_name: customerName,
        whatsapp,
        email,
        address,
        city,
        notes: body.notes || null,
        items: enrichedItems,
        total_price: Number(body.totalPrice || 0),
        currency: body.currency || 'EUR',
        status: 'pending',
        date: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('orders').insert(row).select('*').single();
      if (error) throw error;
      return json(res, 200, { success: true, order: rowToOrder(data) });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur commandes', message: error?.message || String(error) });
  }
}
