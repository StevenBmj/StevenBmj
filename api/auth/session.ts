import { activeSession, adminClient, assertSameOrigin, authRateLimit, clearSession, readCookies, readJson, reply, requireUser, userView, writeSessionCookies } from '../../src/server/security';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const actor = await requireUser(req, res);
      if (actor) reply(res, 200, { user: userView(actor.profile) });
      return;
    }
    if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
    if (!assertSameOrigin(req, res)) return;
    const body = await readJson(req);
    const action = body.action || req.query?.action;
    if (action === 'logout') {
      const cookies = readCookies(req);
      if (cookies.sbmj_access || cookies.sbmj_refresh) {
        const client = adminClient();
        let token = cookies.sbmj_access;
        let identity = token ? (await client.auth.getUser(token)).data.user : null;
        if (!identity && cookies.sbmj_refresh) {
          const refreshed = await client.auth.refreshSession({ refresh_token: cookies.sbmj_refresh });
          identity = refreshed.data.user;
          token = refreshed.data.session?.access_token;
        }
        if (identity && token) {
          const session = await activeSession(client, token, identity.id);
          if (session) {
            const deleted = await client.from('web_sessions').delete().eq('id', session.id).eq('user_id', identity.id);
            if (deleted.error) throw new Error('Unable to revoke session');
          }
          await client.auth.admin.signOut(token, 'local');
        }
      }
      clearSession(req, res);
      return reply(res, 200, { success: true });
    }
    if (action !== 'refresh') return reply(res, 400, { error: 'Action invalide.' });
    const refreshToken = readCookies(req).sbmj_refresh;
    if (!refreshToken) return reply(res, 401, { error: 'Connexion requise.' });
    if (!(await authRateLimit(req, res, 'session-refresh', 60, 300))) return;
    const client = adminClient();
    const auth = await client.auth.refreshSession({ refresh_token: refreshToken });
    if (auth.error || !auth.data.session || !auth.data.user || !(await activeSession(client, auth.data.session.access_token, auth.data.user.id))) {
      clearSession(req, res);
      return reply(res, 401, { error: 'Session expiree.' });
    }
    const profile = await client.from('profiles').select('*').eq('id', auth.data.user.id).maybeSingle();
    if (profile.error) throw new Error('Unable to read profile');
    if (!profile.data?.is_confirmed) return reply(res, 401, { error: 'Compte non actif.' });
    writeSessionCookies(req, res, auth.data.session);
    return reply(res, 200, { user: userView(profile.data) });
  } catch {
    return reply(res, 503, { error: 'Session temporairement indisponible.' });
  }
}
