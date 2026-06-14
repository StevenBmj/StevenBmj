import { getProfileByEmail, json, publicUser, readBody, supabaseAdmin } from '../_supabase';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    if (!email || !code) return json(res, 400, { error: "Tous les champs d'activation sont requis." });

    const supabase = supabaseAdmin();
    const profile = await getProfileByEmail(supabase, email);
    if (!profile) return json(res, 404, { error: 'Compte client introuvable.' });
    if (profile.activation_code !== code) return json(res, 400, { error: 'Le code de confirmation saisi est erroné.' });

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_confirmed: true, activation_code: '' })
      .eq('email', email)
      .select('*')
      .single();
    if (error) throw error;

    return json(res, 200, { success: true, message: 'Votre compte a été activé avec succès !', user: publicUser(data) });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
