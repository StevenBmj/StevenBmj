import { createClient } from '@supabase/supabase-js';
import { publicSettings, requireUser, readJson, reply, recordSecurityEvent } from '../src/server/security.js';
import { invalidateSeoIndexingCache } from '../src/server/seo.js';

const json = reply;

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

const readBody = (req: any) => readJson(req, 2_000_000);

async function addSecurityLog(supabase: any, req: any, event: string, status = 'SECURED') {
  await recordSecurityEvent(req, event, status);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') { req.actor = await requireUser(req, res, true); if (!req.actor) return; }
    const supabase = supabaseAdmin();
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      if (error) throw error;
      return json(res, 200, publicSettings(data?.data));
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      if (body.seoIndexable !== undefined && typeof body.seoIndexable !== 'boolean') return json(res, 400, { error: 'Reglage SEO invalide.' });
      const current = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      if (current.error) throw current.error;
      const merged = { ...publicSettings(current.data?.data), ...publicSettings(body) };
      const { error } = await supabase.from('app_settings').upsert({ id: 'default', data: merged }, { onConflict: 'id' });
      if (error) throw error;
      invalidateSeoIndexingCache();
      await addSecurityLog(supabase, req, 'Configuration du site mise a jour', 'SECURED');
      return json(res, 200, { success: true, settings: merged });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API' });
  }
}
