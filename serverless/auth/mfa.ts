import { createClient } from '@supabase/supabase-js';
import { authRateLimit, readCookies, readJson, reply, requireUser, userView, sessionProfile, setSession, recordSecurityEvent } from '../../src/server/security.js';
import QRCode from 'qrcode';

export default async function mfa(req: any, res: any) {
  try {
    const actor = await requireUser(req, res, true, true);
    if (!actor) return;
    if (!['GET', 'POST'].includes(req.method)) return reply(res, 405, { error: 'method_not_allowed' });
    if (!await authRateLimit(req, res, 'admin-mfa', 12, 300, actor.profile.id)) return;
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const current = await client.auth.setSession({ access_token: actor.token, refresh_token: readCookies(req).sbmj_refresh || '' });
    if (current.error || current.data.user?.id !== actor.profile.id) return reply(res, 401, { error: 'session_expired' });
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) throw factors.error;
    if (req.method === 'GET') return reply(res, 200, { required: actor.profile.mfaRequired, factors: factors.data.all.map(factor => ({ id: factor.id, type: factor.factor_type, status: factor.status })) });
    const body = await readJson(req, 2000);
    if (actor.profile.mfaRequired && body.action !== 'verify') return reply(res, 403, { error: 'MFA_REQUIRED' });
    if (body.action === 'enroll') {
      const signedInAt = Date.parse(current.data.user.last_sign_in_at || '');
      if (!Number.isFinite(signedInAt) || Date.now() - signedInAt > 300000) return reply(res, 403, { error: 'recent_login_required' });
      if (factors.data.all.some(factor => factor.status === 'verified')) return reply(res, 409, { error: 'factor_already_enrolled' });
      for (const factor of factors.data.all.filter(factor => factor.status === 'unverified')) {
        const removed = await client.auth.mfa.unenroll({ factorId: factor.id });
        if (removed.error) throw removed.error;
      }
      const enrolled = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'StevenBmj administration' });
      if (enrolled.error) throw enrolled.error;
      return reply(res, 200, { id: enrolled.data.id, qr: await QRCode.toDataURL(enrolled.data.totp.uri), secret: enrolled.data.totp.secret });
    }
    const factor = factors.data.all.find(factor => factor.id === body.factorId && factor.factor_type === 'totp');
    if (!factor || !/^\d{6}$/.test(String(body.code || ''))) return reply(res, 400, { error: 'invalid_factor_or_code' });
    if (body.action !== 'verify') return reply(res, 400, { error: 'invalid_action' });
    const verified = await client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: String(body.code) });
    if (verified.error) { await recordSecurityEvent(req, 'Administrator second factor refused', 'BLOCKED', actor.profile.id); return reply(res, 400, { error: 'invalid_or_expired_code' }); }
    const authenticated = await client.auth.getUser(verified.data.access_token);
    if (authenticated.error || authenticated.data.user?.id !== actor.profile.id) throw new Error('identity_mismatch');
    const profile = sessionProfile(actor.profile, authenticated.data.user, verified.data.access_token);
    if (profile.mfaRequired) throw new Error('assurance_not_updated');
    await setSession(req, res, { ...verified.data, user: authenticated.data.user });
    await recordSecurityEvent(req, 'Administrator second factor verified', 'SECURED', actor.profile.id);
    return reply(res, 200, { user: userView(profile) });
  } catch { return reply(res, 503, { error: 'mfa_unavailable' }); }
}
