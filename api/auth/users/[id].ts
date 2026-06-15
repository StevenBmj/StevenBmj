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
    if (req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });
    const id = String(req.query.id || '');
    if (!id) return json(res, 400, { error: 'ID utilisateur requis.' });
    const supabase = supabaseAdmin();
    const profile = await supabase.from('profiles').select('is_admin').eq('id', id).maybeSingle();
    if (profile.error) throw profile.error;
    if (profile.data?.is_admin) return json(res, 403, { error: 'Le compte admin ne peut pas être supprimé ici.' });
    const deleted = await supabase.auth.admin.deleteUser(id);
    if (deleted.error) throw deleted.error;
    return json(res, 200, { success: true, message: 'Le compte client a été supprimé avec succès.' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
