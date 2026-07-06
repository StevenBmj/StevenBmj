import { createClient } from '@supabase/supabase-js';

export function json(res: any, status: number, body: any) {
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export function supabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

export async function getProfileByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

export function publicUser(profile: any) {
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

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return false;
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: `"Maison StevenBmj" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}
