import { adminClient, authRateLimit, readJson, reply, setSession, userView } from '../../src/server/security';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
    if (!(await authRateLimit(req, res, 'login', 15, 300))) return;
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password || password.length > 1024) return reply(res, 400, { error: 'Email et mot de passe requis.' });
    const client = adminClient();
    const auth = await client.auth.signInWithPassword({ email, password });
    if (auth.error || !auth.data.session || !auth.data.user) return reply(res, 401, { error: 'Identifiants incorrects.' });
    const profile = await client.from('profiles').select('*').eq('id', auth.data.user.id).maybeSingle();
    if (profile.error) throw new Error('Unable to read profile');
    if (!profile.data) return reply(res, 401, { error: 'Identifiants incorrects.' });
    if (!profile.data.is_confirmed) return reply(res, 403, { error: 'UNCONFIRMED_ACCOUNT', email, message: 'Activez votre compte avec le code recu par e-mail.' });
    await setSession(req, res, auth.data.session);
    return reply(res, 200, { success: true, user: userView(profile.data) });
  } catch {
    return reply(res, 503, { error: 'Connexion temporairement indisponible. Reessayez.' });
  }
}
