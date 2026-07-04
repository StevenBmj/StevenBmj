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

export default async function handler(req: any, res: any) {
  try {
    const code = String(req.query?.code || '').trim().toUpperCase();
    if (!code) return json(res, 400, { error: 'Code promo requis.' });
    if (req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });
    const supabase = supabaseAdmin();
    const { error } = await supabase.from('promo_codes').delete().eq('code', code);
    if (error) throw error;
    return json(res, 200, { success: true });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur promo', message: error?.message || String(error) });
  }
}
