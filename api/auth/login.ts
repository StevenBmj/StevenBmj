import { getProfileByEmail, json, publicUser, readBody, supabaseAdmin } from '../_supabase';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return json(res, 400, { error: "L'adresse email et le mot de passe sont requis." });

    const supabase = supabaseAdmin();
    const auth = await supabase.auth.signInWithPassword({ email, password });
    if (auth.error || !auth.data.user) return json(res, 401, { error: 'Identifiants incorrects.' });

    const profile = await getProfileByEmail(supabase, email);
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
