import { getProfileByEmail, json, publicUser, readBody, supabaseAdmin } from '../_supabase';
import { randomBytes } from 'crypto';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();

async function verifyGoogleCredential(credential: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Auth doit etre configure avec GOOGLE_CLIENT_ID.');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) throw new Error('Identite Google invalide.');
  const payload: any = await response.json();

  if (payload.aud !== clientId) throw new Error('Client Google non autorise.');
  if (!payload.email || payload.email_verified !== 'true') throw new Error('Adresse Google non verifiee.');

  return {
    email: String(payload.email).trim().toLowerCase(),
    name: String(payload.name || payload.email.split('@')[0]).trim(),
  };
}

function googlePasswordSeed() {
  return `google-linked-${randomBytes(18).toString('hex')}`;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const credential = String(body.credential || '').trim();
    if (!credential) return json(res, 400, { error: 'Authentification Google reelle requise.' });

    const googleUser = await verifyGoogleCredential(credential);
    const email = googleUser.email;

    const supabase = supabaseAdmin();
    let profile = await getProfileByEmail(supabase, email);
    if (!profile) {
      const auth = await supabase.auth.admin.createUser({
        email,
        password: googlePasswordSeed(),
        email_confirm: true,
        user_metadata: { name: googleUser.name },
      });
      if (auth.error || !auth.data.user) return json(res, 400, { error: auth.error?.message || 'Creation impossible.' });
      profile = {
        id: auth.data.user.id,
        name: googleUser.name,
        email,
        google_linked: true,
        vip_points: email === ADMIN_EMAIL ? 99999 : 200,
        is_admin: email === ADMIN_EMAIL,
        is_confirmed: true,
        activation_code: '',
        activation_expires_at: null,
        reset_code: '',
        reset_expires_at: null,
        date_joined: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').insert(profile);
      if (error) {
        await supabase.auth.admin.deleteUser(auth.data.user.id);
        throw error;
      }
    } else {
      const updated = await supabase
        .from('profiles')
        .update({ google_linked: true, is_confirmed: true, activation_code: '', activation_expires_at: null })
        .eq('email', email)
        .select('*')
        .single();
      if (updated.error) throw updated.error;
      profile = updated.data;
    }

    return json(res, 200, { success: true, user: publicUser(profile) });
  } catch (error: any) {
    return json(res, 500, { error: error?.message || 'Erreur serveur Google Auth' });
  }
}
