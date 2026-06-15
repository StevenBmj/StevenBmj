import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();

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

async function sendCode(email: string, code: string) {
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
    subject: 'Code de sécurité StevenBmj',
    html: `<p>Votre code de validation StevenBmj est :</p><h2>${code}</h2>`,
  });
  return true;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) return json(res, 400, { error: "L'adresse email est requise." });

    const supabase = supabaseAdmin();
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (email === ADMIN_EMAIL) {
      const current = await supabase.from('app_settings').select('*').eq('id', 'default').maybeSingle();
      const data = { ...(current.data?.data || {}), adminResetCode: code };
      const { error } = await supabase.from('app_settings').upsert({ id: 'default', data }, { onConflict: 'id' });
      if (error) throw error;
      await sendCode(email, code);
      return json(res, 200, { success: true, message: `Un code de validation administrative a été envoyé sur ${ADMIN_EMAIL}.` });
    }

    const profile = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (profile.error) throw profile.error;
    if (!profile.data) return json(res, 404, { error: "Aucun compte client n'existe sous cet identifiant." });

    const { error } = await supabase.from('profiles').update({ reset_code: code }).eq('email', email);
    if (error) throw error;
    await sendCode(email, code);
    return json(res, 200, { success: true, message: 'Un code de modification a été transmis à votre adresse e-mail.' });
  } catch (error: any) {
    return json(res, 500, { error: 'Erreur serveur API', message: error?.message || String(error) });
  }
}
