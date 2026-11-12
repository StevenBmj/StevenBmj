import { adminClient, authRateLimit, clearSession, hashCode, matchesCode, newCode, readJson, reply } from '../../src/server/security';
import { sendEmail } from '../_supabase';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(res, 400, { error: 'Email invalide.' });
    const code = String(body.code || '').trim().toUpperCase();
    const password = String(body.newPassword || '');
    const submitting = Boolean(code || password);
    if (!(await authRateLimit(req, res, submitting ? 'reset-verify' : 'reset-send', submitting ? 5 : 3, 300, email))) return;
    const client = adminClient();
    const profile = await client.from('profiles').select('*').eq('email', email).maybeSingle();
    if (profile.error) throw new Error('Profile unavailable');
    if (submitting) {
      if (!code || password.length < 8 || password.length > 1024) return reply(res, 400, { error: 'Code et mot de passe de 8 caracteres minimum requis.' });
      const expiry = Date.parse(profile.data?.reset_expires_at || '');
      if (!profile.data || !Number.isFinite(expiry) || expiry <= Date.now() || !matchesCode(profile.data.reset_code, email, 'reset', code)) {
        return reply(res, 403, { error: 'Code incorrect ou expire.' });
      }
      // Consume atomically before changing credentials: concurrent redemption loses.
      const consumed = await client.from('profiles').update({ reset_code: '', reset_expires_at: null })
        .eq('id', profile.data.id).eq('reset_code', profile.data.reset_code).select('id').maybeSingle();
      if (consumed.error) throw new Error('Code storage unavailable');
      if (!consumed.data) return reply(res, 403, { error: 'Code incorrect ou expire.' });
      const revoked = await client.from('web_sessions').delete().eq('user_id', profile.data.id);
      if (revoked.error) throw new Error('Unable to revoke sessions');
      const changed = await client.auth.admin.updateUserById(profile.data.id, { password });
      if (changed.error) throw new Error('Unable to change password');
      clearSession(req, res);
      return reply(res, 200, { success: true, message: 'Mot de passe modifie. Reconnectez-vous.' });
    }
    if (profile.data) {
      const generated = newCode();
      const stored = await client.from('profiles').update({ reset_code: hashCode(email, 'reset', generated), reset_expires_at: new Date(Date.now() + 300000).toISOString() }).eq('id', profile.data.id);
      if (stored.error) throw new Error('Unable to save code');
      const sent = await sendEmail(email, 'Reinitialisation de votre mot de passe StevenBmj', `<p>Votre code de reinitialisation :</p><h2>${generated}</h2><p>Valable cinq minutes. Si vous n'avez pas demande ce code, ignorez ce message.</p>`);
      if (!sent) throw new Error('Email unavailable');
    }
    return reply(res, 200, { success: true, message: 'Si un compte correspond a cette adresse, un code valable cinq minutes est envoye par e-mail.' });
  } catch {
    return reply(res, 503, { error: 'Recuperation temporairement indisponible. Demandez un nouveau code plus tard.' });
  }
}
