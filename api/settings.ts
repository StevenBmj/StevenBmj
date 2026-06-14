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

export default async function handler(req: any, res: any) {
  try {
    const supabase = supabaseAdmin();
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      if (error) throw error;
      return json(res, 200, data?.data || {});
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const current = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      const merged = { ...(current.data?.data || {}), ...body };
      const { error } = await supabase.from('app_settings').upsert({ id: 'default', data: merged }, { onConflict: 'id' });
      if (error) throw error;
      return json(res, 200, { success: true, settings: merged });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
