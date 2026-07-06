import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

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

function generateActivationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
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
      html: `<p>Votre code d'activation StevenBmj est :</p><h2>${activationCode}</h2><p>Ce code expire dans 5 minutes.</p>`,
    });
    return true;
  } catch {
    return false;
  }
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
    avatarUrl: profile.avatar_url || undefined,
    googleLinked: profile.google_linked,
    vipPoints: profile.vip_points,
    isAdmin: profile.is_admin,
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim().toUpperCase();
    const shouldResend = body.resend === true || body.action === 'resend';
    if (!email || (!shouldResend && !code)) return json(res, 400, { error: "Tous les champs d'activation sont requis." });

    const supabase = supabaseAdmin();
    const current = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (current.error) throw current.error;
    if (!current.data) return json(res, 404, { error: 'Compte client introuvable.' });
    if (current.data.is_confirmed) return json(res, 400, { error: 'Ce compte est deja active.' });

    if (shouldResend) {
      const activationCode = generateActivationCode();
      const activationExpiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
      const update = await supabase
        .from('profiles')
        .update({ activation_code: activationCode, activation_expires_at: activationExpiresAt })
        .eq('email', email);
      if (update.error) throw update.error;

      const emailSent = await sendActivationEmail(email, activationCode);
      if (!emailSent) {
        return json(res, 500, { error: "Impossible d'envoyer le code d'activation par e-mail. Verifiez la configuration SMTP puis reessayez." });
      }
      return json(res, 200, {
        success: true,
        email,
        message: "Un nouveau code est envoyé à votre adresse mail. Entrez-le dans les 5 minutes."
      });
    }

    const expiresAt = current.data.activation_expires_at ? new Date(current.data.activation_expires_at).getTime() : 0;
    if (!current.data.activation_code || !expiresAt || Date.now() > expiresAt) {
      return json(res, 400, { error: 'Le code a expire. Cliquez sur "Renvoyer le code" pour recevoir un nouveau code.' });
    }
    if (String(current.data.activation_code).toUpperCase() !== code) {
      return json(res, 400, { error: 'Le code de confirmation saisi est errone.' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_confirmed: true, activation_code: '', activation_expires_at: null })
      .eq('email', email)
      .select('*')
      .single();
    if (error) throw error;

    return json(res, 200, { success: true, message: 'Votre compte a ete active avec succes !', user: publicUser(data) });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
