import { getProfileByEmail, json, publicUser, readBody, sendEmail, supabaseAdmin } from '../_supabase';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email || !password) return json(res, 400, { error: 'Tous les champs sont requis.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "L'adresse e-mail n'est pas au format valide." });

    const supabase = supabaseAdmin();
    if (await getProfileByEmail(supabase, email)) return json(res, 400, { error: 'Cette adresse e-mail est déjà enregistrée.' });

    const isAdmin = email === ADMIN_EMAIL;
    const activationCode = isAdmin ? '' : Math.floor(100000 + Math.random() * 900000).toString();
    const auth = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (auth.error || !auth.data.user) return json(res, 400, { error: auth.error?.message || 'Création impossible.' });

    const profile = {
      id: auth.data.user.id,
      name,
      email,
      google_linked: false,
      vip_points: 100,
      is_admin: isAdmin,
      is_confirmed: isAdmin,
      activation_code: activationCode,
      reset_code: '',
      date_joined: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').insert(profile);
    if (error) throw error;

    if (!isAdmin) {
      await sendEmail(email, 'Activation de votre compte Maison StevenBmj', `<p>Votre code d'activation StevenBmj est :</p><h2>${activationCode}</h2>`);
    }

    return json(res, 200, { success: true, requiresActivation: !isAdmin, email, user: isAdmin ? publicUser(profile) : null });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
