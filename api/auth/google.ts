import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { authRateLimit, issueVerifiedSession, readJson, reply } from '../../src/server/security';


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

async function getProfileByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

async function verifyGoogleCredential(credential: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Auth doit etre configure avec GOOGLE_CLIENT_ID.');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Identite Google invalide.');
  const payload: any = await response.json();

  if (payload.aud !== clientId) throw new Error('Client Google non autorise.');
  if (!payload.email || payload.email_verified !== 'true') throw new Error('Adresse Google non verifiee.');

  return {
    email: String(payload.email).trim().toLowerCase(),
    name: String(payload.name || payload.email.split('@')[0]).trim(),
    picture: String(payload.picture || '').trim(),
  };
}

function googlePasswordSeed() {
  return `google-linked-${randomBytes(18).toString('hex')}`;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    if (!(await authRateLimit(req, res, 'google-login', 15, 300))) return;
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
        avatar_url: googleUser.picture || null,
        google_linked: true,
        vip_points: 200,
        is_admin: false,
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
        .update({ google_linked: true, is_confirmed: true, avatar_url: googleUser.picture || null, activation_code: '', activation_expires_at: null })
        .eq('email', email)
        .select('*')
        .single();
      if (updated.error) throw updated.error;
      profile = updated.data;
    }

    await issueVerifiedSession(req, res, email, profile.id);
    return json(res, 200, { success: true, user: publicUser(profile) });
  } catch (error: any) {
    return json(res, 400, { error: 'Authentification Google impossible. Verifiez la configuration puis reessayez.' });
  }
}
