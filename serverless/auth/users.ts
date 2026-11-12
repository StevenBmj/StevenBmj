import { createClient } from '@supabase/supabase-js';
import { requireUser, reply } from '../../src/server/security.js';

const json = reply;

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
    avatarUrl: profile.avatar_url || undefined,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    dateJoined: profile.date_joined,
    isAdmin: profile.is_admin,
    isConfirmed: profile.is_confirmed === true,
    whatsapp: profile.whatsapp || '',
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (!(await requireUser(req, res, true))) return;
    const supabase = supabaseAdmin();
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profiles').select('id,name,email,avatar_url,google_linked,vip_points,date_joined,is_admin,is_confirmed,whatsapp').order('date_joined', { ascending: false });
      if (error) throw error;
      return json(res, 200, (data || []).map(publicUser));
    }

    if (req.method === 'DELETE') {
      return json(res, 405, { error: 'La suppression groupee des comptes est desactivee.' });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 503, { error: 'Liste des comptes temporairement indisponible.' });
  }
}
