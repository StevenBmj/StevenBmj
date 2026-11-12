import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server authentication is not configured');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Signing in changes a client's Authorization header, even without session persistence.
// Keep user authentication separate from the server's private database client.
export function userAuthClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('User authentication is not configured');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function reply(res: any, status: number, body: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export async function readJson(req: any, limit = 64_000) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > limit) throw new Error('Request body too large');
    const body = JSON.parse(raw || '{}');
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('Invalid JSON object');
    return body;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new Error('Request body too large');
    chunks.push(buffer);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('Invalid JSON object');
  return body;
}

export function assertSameOrigin(req: any, res: any) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || 'GET')) return true;
  const origin = req.headers?.origin;
  if (req.headers?.['sec-fetch-site'] !== 'cross-site') {
    if (!origin) return true;
    try {
      const actual = new URL(origin);
      const configured = process.env.APP_URL ? new URL(process.env.APP_URL).origin : '';
      if (actual.origin === configured || (actual.host === String(req.headers?.host || '') && ['http:', 'https:'].includes(actual.protocol))) return true;
    } catch { /* Opaque or malformed origins are not trusted. */ }
  }
  reply(res, 403, { error: 'Origine de la requete refusee.' });
  return false;
}

export function readCookies(req: any): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    for (const part of String(req.headers?.cookie || '').split(';')) {
      const equal = part.indexOf('=');
      if (equal < 1) continue;
      const name = part.slice(0, equal).trim();
      if (Object.hasOwn(result, name)) return {};
      result[name] = decodeURIComponent(part.slice(equal + 1).trim());
    }
  } catch { return {}; }
  return result;
}

function sessionId(token: string) {
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof claims.session_id === 'string' ? claims.session_id : '';
  } catch { return ''; }
}

function cookieOptions(req: any) {
  const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || req.socket?.encrypted === true;
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function writeSessionCookies(req: any, res: any, session: any) {
  const age = Math.max(1, Math.min(3600, Number(session.expires_in || 3600)));
  res.setHeader('Set-Cookie', [
    `sbmj_access=${encodeURIComponent(session.access_token)}; ${cookieOptions(req)}; Max-Age=${age}`,
    `sbmj_refresh=${encodeURIComponent(session.refresh_token)}; ${cookieOptions(req)}; Max-Age=2592000`,
  ]);
}

export function clearSession(req: any, res: any) {
  res.setHeader('Set-Cookie', ['sbmj_access', 'sbmj_refresh'].map(name => `${name}=; ${cookieOptions(req)}; Max-Age=0`));
}

export function userView(profile: any) {
  return { id: profile.id, name: profile.name, email: profile.email,
    whatsapp: profile.whatsapp || undefined,
    avatarUrl: profile.avatar_url || undefined, googleLinked: Boolean(profile.google_linked),
    vipPoints: Number(profile.vip_points || 0), isAdmin: profile.is_admin === true, mfaRequired: profile.mfaRequired === true };
}

// Call only after Auth has verified the access token; decoded claims alone are not authentication.
export function sessionProfile(profile: any, identity: any, token: string) {
  const enrolled = identity?.factors?.some((factor: any) => factor.status === 'verified') === true;
  let assurance = '';
  try { assurance = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).aal; } catch { /* Missing assurance cannot satisfy MFA. */ }
  return { ...profile, mfaRequired: profile.is_admin === true && enrolled && assurance !== 'aal2' };
}

export async function activeSession(client: any, token: string, userId: string) {
  // Identity is verified by Auth before using this session identifier.
  const id = sessionId(token);
  if (!id) return null;
  const result = await client.from('web_sessions').select('id,user_id,expires_at').eq('id', id).eq('user_id', userId).maybeSingle();
  if (result.error) throw new Error('Session storage unavailable');
  const expires = Date.parse(result.data?.expires_at);
  if (!Number.isFinite(expires) || expires <= Date.now()) return null;
  return result.data;
}

export async function requireUser(req: any, res: any, adminOnly = false, allowMfaChallenge = false) {
  if (!assertSameOrigin(req, res)) return null;
  const token = readCookies(req).sbmj_access;
  if (!token || token.length > 12_000) {
    reply(res, 401, { error: 'Connexion requise.' });
    return null;
  }
  const client = adminClient();
  const auth = await client.auth.getUser(token);
  if (auth.error || !auth.data.user) {
    reply(res, 401, { error: 'Session expiree. Reconnectez-vous.' });
    return null;
  }
  const [session, profile] = await Promise.all([
    activeSession(client, token, auth.data.user.id),
    client.from('profiles').select('*').eq('id', auth.data.user.id).maybeSingle(),
  ]);
  if (profile.error) throw new Error('Profile storage unavailable');
  if (!session || !profile.data || profile.data.is_confirmed !== true) {
    reply(res, 401, { error: 'Session non valide.' });
    return null;
  }
  if (adminOnly && profile.data.is_admin !== true) {
    await recordSecurityEvent(req, 'Administrator access refused', 'BLOCKED', profile.data.id);
    reply(res, 403, { error: 'Acces reserve a un administrateur.' });
    return null;
  }
  const verifiedProfile = sessionProfile(profile.data, auth.data.user, token);
  if (verifiedProfile.mfaRequired && !allowMfaChallenge) {
    reply(res, 403, { error: 'MFA_REQUIRED' }); return null;
  }
  return { client, profile: verifiedProfile, token, session };
}

export async function setSession(req: any, res: any, session: any) {
  if (!session?.access_token || !session?.refresh_token || !session?.user?.id) throw new Error('Invalid authentication session');
  const id = sessionId(session.access_token);
  if (!id) throw new Error('Missing authentication session ID');
  const result = await adminClient().from('web_sessions').upsert({ id, user_id: session.user.id, expires_at: new Date(Date.now() + 30 * 86400000).toISOString() });
  if (result.error) throw new Error('Unable to persist authentication session');
  writeSessionCookies(req, res, session);
}

export async function issueVerifiedSession(req: any, res: any, email: string, expectedUserId: string) {
  const client = adminClient();
  const link = await client.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error || !link.data.properties?.hashed_token) throw new Error('Unable to issue authentication session');
  const auth = await userAuthClient().auth.verifyOtp({ type: 'email', token_hash: link.data.properties.hashed_token });
  if (auth.error || !auth.data.session || auth.data.user?.id !== expectedUserId) throw new Error('Invalid authentication identity');
  await setSession(req, res, auth.data.session);
  return auth.data.session;
}

export function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(8), value => alphabet[value % 32]).join('');
}

export function hashCode(email: string, purpose: 'activation' | 'reset', code: string) {
  const secret = process.env.AUTH_CODE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Authentication code protection unavailable');
  return `v1:${createHmac('sha256', secret).update(`${purpose}:${email.trim().toLowerCase()}:${code.trim().toUpperCase()}`).digest('hex')}`;
}

export function matchesCode(stored: string, email: string, purpose: 'activation' | 'reset', code: string) {
  const actual = Buffer.from(String(stored || ''));
  const expected = Buffer.from(hashCode(email, purpose, code));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function authRateLimit(req: any, res: any, scope: string, limit = 10, windowSeconds = 300, identity = '') {
  if (!assertSameOrigin(req, res)) return false;
  const ip = process.env.VERCEL === '1'
    ? String(req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown').split(',')[0].trim()
    : String(req.socket?.remoteAddress || 'unknown');
  const key = hashCode(`${scope}:${identity}:${ip}`, 'reset', 'rate-limit');
  const result = await adminClient().rpc('consume_security_limit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (result.error) {
    reply(res, 503, { error: 'Protection de connexion indisponible. Reessayez plus tard.' });
    return false;
  }
  if (result.data?.allowed !== true) {
    await recordSecurityEvent(req, `Request quota exceeded: ${scope}`, 'BLOCKED');
    res.setHeader('Retry-After', String(result.data?.retry_after || windowSeconds));
    reply(res, 429, { error: 'Trop de tentatives. Patientez avant de reessayer.' });
    return false;
  }
  return true;
}

export function requestLocation(req: any) {
  const hosted = process.env.VERCEL === '1';
  const candidate = String(hosted ? req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-real-ip'] || '' : req.socket?.remoteAddress || '').split(',')[0].trim();
  const country = hosted && /^[A-Z]{2}$/.test(req.headers?.['x-vercel-ip-country'] || '') ? req.headers['x-vercel-ip-country'] : null;
  let city: string | null = null;
  if (hosted && typeof req.headers?.['x-vercel-ip-city'] === 'string') {
    try { city = decodeURIComponent(req.headers['x-vercel-ip-city']).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120) || null; } catch { /* Ignore invalid provider metadata. */ }
  }
  return { ip: isIP(candidate) ? candidate : 'unknown', country, city };
}

export async function recordSecurityEvent(req: any, event: string, status = 'SECURED', actorId?: string) {
  try {
    const client = adminClient();
    const location = requestLocation(req);
    if (status === 'BLOCKED') {
      const key = hashCode(`audit:${location.ip}:${event}`, 'reset', 'rate-limit');
      const allowance = await client.rpc('consume_security_limit', { p_key: key, p_limit: 1, p_window_seconds: 60 });
      if (allowance.error || allowance.data?.allowed !== true) return;
    }
    const result = await client.from('security_logs').insert({ id: `audit-${randomUUID()}`, timestamp: new Date().toISOString(), ...location,
      actor_id: actorId || req.actor?.profile?.id || null, event: event.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 300), status });
    if (result.error) console.warn('Security event could not be persisted');
  } catch { console.warn('Security event storage unavailable'); }
}

const settingNames = new Set([
  'homepageHeroTitle', 'homepageHeroTitleEn', 'homepageHeroSubtitle', 'homepageHeroSubtitleEn',
  'homepageHeroImage1', 'homepageHeroImage2', 'homepageHeroImage3', 'storyTitleFr', 'storyTitleEn',
  'storyDescFr', 'storyDescEn', 'storyImage', 'announcementText', 'announcementTextEn',
  'whatsappContact', 'taxRate', 'seoIndexable', 'aboutTitle', 'aboutTitleEn', 'aboutContent', 'aboutContentEn',
  'contactTitle', 'contactTitleEn', 'contactAddress', 'contactAddressEn', 'googleMapEmbedUrl',
  'careTitle', 'careTitleEn', 'careContent', 'careContentEn', 'footerText', 'footerTextEn',
  'footerCredits', 'footerCreditsEn', 'instagramUrl', 'facebookUrl', 'whatsappUrl', 'faqsJson',
]);

export function publicSettings(data: any) {
  return Object.fromEntries(Object.entries(data || {}).filter(([key, value]) =>
    (settingNames.has(key) || /^(fabric[1-3]|bento[1-4])(TitleFr|TitleEn|DescFr|DescEn|Image)$/.test(key))
      && ['string', 'number', 'boolean'].includes(typeof value)));
}
