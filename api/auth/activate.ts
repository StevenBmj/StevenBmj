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

function publicUser(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    isAdmin: profile.is_admin,
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim().toUpperCase();
    if (!email || !code) return json(res, 400, { error: "Tous les champs d'activation sont requis." });

    const supabase = supabaseAdmin();
    const current = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data) return json(res, 404, { error: 'Compte client introuvable.' });

    const expiresAt = current.data.activation_expires_at ? new Date(current.data.activation_expires_at).getTime() : 0;
    if (!current.data.activation_code || !expiresAt || Date.now() > expiresAt) {
      return json(res, 400, { error: 'Le code a expire. Veuillez creer le compte a nouveau pour recevoir un nouveau code.' });
    }
    if (String(current.data.activation_code).toUpperCase() !== code) {
      return json(res, 400, { error: 'Le code de confirmation saisi est errone.' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_confirmed: true, activation_code: '', activation_expires_at: null })
      .eq('email', email)
      .select('*')
      .single();
    if (error) throw error;

    return json(res, 200, { success: true, message: 'Votre compte a ete active avec succes !', user: publicUser(data) });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
