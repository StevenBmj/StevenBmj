import { getProfileByEmail, json, publicUser, readBody, supabaseAdmin } from '../_supabase';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) return json(res, 400, { error: 'E-mail de compte Google requis.' });

    const supabase = supabaseAdmin();
    let profile = await getProfileByEmail(supabase, email);
    if (!profile) {
      const auth = await supabase.auth.admin.createUser({
        email,
        password: `google-linked-${Date.now()}`,
        email_confirm: true,
        user_metadata: { name: body.name || email.split('@')[0] },
      });
      if (auth.error || !auth.data.user) return json(res, 400, { error: auth.error?.message || 'Création impossible.' });
      profile = {
        id: auth.data.user.id,
        name: body.name || email.split('@')[0],
        email,
        google_linked: true,
        vip_points: email === ADMIN_EMAIL ? 99999 : 200,
        is_admin: email === ADMIN_EMAIL,
        is_confirmed: true,
        activation_code: '',
        reset_code: '',
        date_joined: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').insert(profile);
      if (error) throw error;
    } else {
      const updated = await supabase
        .from('profiles')
        .update({ google_linked: true, is_confirmed: true })
        .eq('email', email)
        .select('*')
        .single();
      if (updated.error) throw updated.error;
      profile = updated.data;
    }

    return json(res, 200, { success: true, user: publicUser(profile) });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
