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

function supabaseAuthClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return supabaseAdmin();
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
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
    const password = String(body.password || '');
    if (!email || !password) return json(res, 400, { error: "L'adresse email et le mot de passe sont requis." });

    const authClient = supabaseAuthClient();
    const supabase = supabaseAdmin();
    const auth = await authClient.auth.signInWithPassword({ email, password });
    if (auth.error || !auth.data.user) return json(res, 401, { error: 'Identifiants incorrects.', details: auth.error?.message });

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!profile) return json(res, 401, { error: 'Profil client introuvable.' });
    if (!profile.is_confirmed) {
      return json(res, 403, {
        error: 'UNCONFIRMED_ACCOUNT',
        email,
        message: "Votre compte de prestige n'est pas encore activé. Entrez le code d'activation envoyé par courriel.",
      });
    }

    return json(res, 200, { success: true, user: publicUser(profile) });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
