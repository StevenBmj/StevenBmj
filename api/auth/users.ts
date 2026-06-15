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

function publicUser(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    dateJoined: profile.date_joined,
    isAdmin: profile.is_admin,
  };
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = supabaseAdmin();
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profiles').select('*').order('date_joined', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(publicUser));
    }

    if (req.method === 'DELETE') {
      const { data, error } = await supabase.from('profiles').select('id,email,is_admin');
      if (error) throw error;
      for (const profile of data || []) {
        if (!profile.is_admin) {
          await supabase.auth.admin.deleteUser(profile.id);
        }
      }
      return json(res, 200, { success: true, message: 'Tous les comptes clients ont été supprimés avec succès.' });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
