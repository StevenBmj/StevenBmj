import { createClient } from '@supabase/supabase-js';
import { authRateLimit, hashCode, newCode, readJson, reply } from '../../src/server/security';
import { sendEmail } from '../_supabase';


function isValidPersonName(value: string) {
  return /^[\p{L}' -]{2,80}$/u.test(value.trim()) && !/\d/.test(value);
}

function generateActivationCode() {
  return newCode();
}

const json = reply;

function supabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const readBody = (req: any) => readJson(req, 64_000);

function publicUser(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatar_url || undefined,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    isAdmin: profile.is_admin,
  };
}

async function sendActivationEmail(email: string, activationCode: string) {
  return sendEmail(email, 'Activation de votre compte Maison StevenBmj',
    `<p>Votre code d'activation StevenBmj :</p><h2>${activationCode}</h2><p>Ce code expire dans 5 minutes.</p>`).catch(() => false);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    if (!(await authRateLimit(req, res, 'register', 5, 300))) return;
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (email === (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase()) return json(res, 409, { error: 'Ce compte doit utiliser la connexion ou la recuperation de mot de passe.' });
    const password = String(body.password || '');
    if (!name || !email || !password) return json(res, 400, { error: 'Tous les champs sont requis.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "L'adresse e-mail n'est pas au format valide." });
    if (!isValidPersonName(name)) return json(res, 400, { error: 'Le nom et le prenom ne doivent contenir que des lettres, espaces, apostrophes ou tirets.' });
    if (password.length < 8 || password.length > 1024) return json(res, 400, { error: 'Le mot de passe doit contenir entre 8 et 1024 caracteres.' });

    const supabase = supabaseAdmin();
    const existing = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return json(res, 409, { error: 'Cette adresse e-mail est deja utilisee. Connectez-vous ou utilisez Mot de passe oublie.' });

    const isAdmin = false;
    const activationCode = isAdmin ? '' : generateActivationCode();
    const activationExpiresAt = isAdmin ? null : new Date(Date.now() + 5 * 60_000).toISOString();
    const auth = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (auth.error || !auth.data.user) return json(res, auth.error?.code === 'email_exists' ? 409 : 400, { error: 'Creation impossible : adresse deja utilisee ou donnees invalides.' });

    const profile = {
      id: auth.data.user.id,
      name,
      email,
      google_linked: false,
      vip_points: 100,
      is_admin: isAdmin,
      is_confirmed: isAdmin,
      activation_code: hashCode(email, 'activation', activationCode),
      activation_expires_at: activationExpiresAt,
      reset_code: '',
      reset_expires_at: null,
      date_joined: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').insert(profile);
    if (error) {
      await supabase.auth.admin.deleteUser(auth.data.user.id);
      throw error;
    }

    const emailSent = isAdmin ? true : await sendActivationEmail(email, activationCode);
    if (!emailSent) {
      await supabase.from('profiles').delete().eq('id', auth.data.user.id);
      await supabase.auth.admin.deleteUser(auth.data.user.id);
      return json(res, 500, { error: "Impossible d'envoyer le code d'activation par e-mail. Verifiez la configuration SMTP puis reessayez." });
    }
    return json(res, 200, {
      success: true,
      requiresActivation: !isAdmin,
      email,
      emailSent,
      expiresAt: activationExpiresAt,
      expiresInSeconds: Math.max(0, Math.ceil((Date.parse(activationExpiresAt || '') - Date.now()) / 1000) || 0),
      message: !isAdmin ? "Un code est envoyé à votre adresse mail. Entrez-le dans les 5 minutes pour finaliser votre compte." : undefined,
      user: isAdmin ? publicUser(profile) : null,
    });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API' });
  }
}
