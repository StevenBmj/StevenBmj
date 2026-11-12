import { adminClient, authRateLimit, hashCode, issueVerifiedSession, matchesCode, newCode, readJson, reply, userView } from '../../src/server/security';
import { sendEmail } from '../_supabase';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(res, 400, { error: 'Email invalide.' });
    const resend = body.resend === true || body.action === 'resend';
    if (!(await authRateLimit(req, res, resend ? 'activation-resend' : 'activation', resend ? 3 : 8, 300, email))) return;
    const client = adminClient();
    const current = await client.from('profiles').select('*').eq('email', email).maybeSingle();
    if (current.error) throw new Error('Profile unavailable');
    if (!current.data || current.data.is_confirmed) return reply(res, 400, { error: 'Activation impossible. Connectez-vous ou demandez un nouveau code.' });
    if (resend) {
      const code = newCode();
      const expiresAt = new Date(Date.now() + 300000).toISOString();
      const updated = await client.from('profiles').update({ activation_code: hashCode(email, 'activation', code), activation_expires_at: expiresAt }).eq('id', current.data.id);
      if (updated.error) throw new Error('Unable to save code');
      const sent = await sendEmail(email, 'Activation de votre compte StevenBmj', `<p>Votre code de validation :</p><h2>${code}</h2><p>Valable cinq minutes. Ne partagez pas ce code.</p>`);
      if (!sent) return reply(res, 503, { error: 'Envoi du code indisponible. Reessayez plus tard.' });
      return reply(res, 200, { success: true, email, expiresAt, expiresInSeconds: Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)), message: 'Un nouveau code est envoye a votre adresse mail. Il est valable cinq minutes.' });
    }
    const code = String(body.code || '').trim().toUpperCase();
    const expiry = Date.parse(current.data.activation_expires_at || '');
    if (!Number.isFinite(expiry) || expiry <= Date.now() || !matchesCode(current.data.activation_code, email, 'activation', code)) {
      return reply(res, 400, { error: 'Code incorrect ou expire. Demandez un nouveau code.' });
    }
    const updated = await client.from('profiles').update({ is_confirmed: true, activation_code: '', activation_expires_at: null })
      .eq('id', current.data.id).eq('activation_code', current.data.activation_code).select('*').maybeSingle();
    if (updated.error) throw new Error('Unable to consume code');
    if (!updated.data) return reply(res, 400, { error: 'Ce code a deja ete utilise.' });
    await issueVerifiedSession(req, res, email, updated.data.id);
    return reply(res, 200, { success: true, user: userView(updated.data) });
  } catch {
    return reply(res, 503, { error: 'Activation temporairement indisponible. Reessayez.' });
  }
}
