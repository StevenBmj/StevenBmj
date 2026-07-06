import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();

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

async function findAuthUserByEmail(supabase: any, email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user: any) => String(user.email || '').toLowerCase() === email);
    if (found || data.users.length < 1000) return found || null;
    page += 1;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const newPassword = String(body.newPassword || '').trim();

    if (email !== ADMIN_EMAIL) return json(res, 403, { error: 'Souveraineté refusée.' });
    if (!code || !newPassword) return json(res, 400, { error: 'Le code et le nouveau mot de passe sont requis.' });

    const supabase = supabaseAdmin();
    const settings = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
    if (settings.error) throw settings.error;
    const currentSettings = settings.data?.data || {};
    if (currentSettings.adminResetCode !== code) return json(res, 403, { error: 'Le code de sécurité administrateur est invalide.' });
    const expiresAt = currentSettings.adminResetExpiresAt ? new Date(currentSettings.adminResetExpiresAt).getTime() : 0;
    if (!expiresAt || Date.now() > expiresAt) return json(res, 403, { error: 'Le code administrateur est expire. Demandez un nouveau code.' });

    const authUser = await findAuthUserByEmail(supabase, ADMIN_EMAIL);
    if (!authUser) return json(res, 404, { error: 'Compte administrateur introuvable.' });
    const update = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
    if (update.error) throw update.error;

    const nextSettings = { ...currentSettings, adminPassword: '', adminResetCode: '', adminResetExpiresAt: '' };
    await supabase.from('app_settings').upsert({ id: 'default', data: nextSettings }, { onConflict: 'id' });
    await supabase.from('profiles').upsert({
      id: authUser.id,
      name: 'StevenBmj Admin',
      email: ADMIN_EMAIL,
      google_linked: false,
      vip_points: 99999,
      is_admin: true,
      is_confirmed: true,
      activation_code: '',
      reset_code: '',
      date_joined: new Date().toISOString(),
    }, { onConflict: 'id' });

    return json(res, 200, { success: true, message: "Mot de passe d'administration réinitialisé avec succès." });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
