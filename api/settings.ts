import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function clientIp(req: any) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
}

function cleanText(value: any, max = 300) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
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
    if (total > 2_000_000) throw new Error('Configuration trop volumineuse.');
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

async function addSecurityLog(supabase: any, req: any, event: string, status = 'SECURED') {
  await supabase.from('security_logs').insert({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    ip: clientIp(req),
    event: cleanText(event),
    status,
  }).then(() => null, () => null);
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
      if (current.error) throw current.error;
      const merged = { ...(current.data?.data || {}), ...body };
      const { error } = await supabase.from('app_settings').upsert({ id: 'default', data: merged }, { onConflict: 'id' });
      if (error) throw error;
      await addSecurityLog(supabase, req, 'Configuration du site mise a jour', 'SECURED');
      return json(res, 200, { success: true, settings: merged });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
