import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();

function isValidPersonName(value: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/.test(value.trim()) && !/\d/.test(value);
}

function generateActivationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
}

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

async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

function publicUser(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    isAdmin: profile.is_admin,
  };
}

async function sendActivationEmail(email: string, activationCode: string) {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return false;
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Maison StevenBmj" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Activation de votre compte Maison StevenBmj',
      html: `<p>Votre code d'activation StevenBmj est :</p><h2>${activationCode}</h2><p>Ce code expire dans 3 minutes.</p>`,
    });
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email || !password) return json(res, 400, { error: 'Tous les champs sont requis.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "L'adresse e-mail n'est pas au format valide." });
    if (!isValidPersonName(name)) return json(res, 400, { error: 'Le nom et le prenom ne doivent contenir que des lettres, espaces, apostrophes ou tirets.' });
    if (password.length < 8) return json(res, 400, { error: 'Le mot de passe doit contenir au moins 8 caracteres.' });

    const supabase = supabaseAdmin();
    const existing = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return json(res, 400, { error: 'Cette adresse e-mail est déjà enregistrée.' });

    const isAdmin = email === ADMIN_EMAIL;
    const activationCode = isAdmin ? '' : generateActivationCode();
    const activationExpiresAt = isAdmin ? null : new Date(Date.now() + 3 * 60_000).toISOString();
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
      await supabase.from('profiles').delete().eq('email', email);
      await supabase.auth.admin.deleteUser(auth.data.user.id);
      return json(res, 500, { error: "Impossible d'envoyer le code d'activation par e-mail. Verifiez la configuration SMTP puis reessayez." });
    }
    return json(res, 200, {
      success: true,
      requiresActivation: !isAdmin,
      email,
      emailSent,
      message: !isAdmin ? "Un code est envoyé à votre adresse mail. Entrez-le dans la minute pour finaliser votre compte." : undefined,
      user: isAdmin ? publicUser(profile) : null,
    });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
