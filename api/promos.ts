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

export default async function handler(req: any, res: any) {
  try {
    const supabase = supabaseAdmin();
    if (req.method === 'GET') {
      const now = new Date().toISOString();
      await supabase.from('promo_codes').update({ active: false }).eq('active', true).lt('expires_at', now);
      const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(rowToPromo));
    }

    if (req.method === 'POST') {
      const promo = await readBody(req);
      const code = String(promo.code || '').trim().toUpperCase();
      const discountPercentage = Number(promo.discountPercentage || promo.discount_percentage || 0);
      if (!code || !discountPercentage) return json(res, 400, { error: 'Code promo et reduction requis.' });
      const row = {
        code,
        discount_percentage: discountPercentage,
        min_amount: promo.minAmount ?? promo.min_amount ?? null,
        active: promo.active !== false,
        expires_at: promo.expiresAt ?? promo.expires_at ?? null,
      };
      const { data, error } = await supabase.from('promo_codes').upsert(row, { onConflict: 'code' }).select('*');
      if (error) throw error;
      return json(res, 200, { success: true, promo: rowToPromo(data?.[0] || row) });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur promos', message: error?.message || String(error) });
  }
}
