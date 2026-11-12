import { Buffer } from 'node:buffer';

export const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
export const CLIENT_ID = '00000000-0000-4000-8000-000000000002';
export const OTHER_ID = '00000000-0000-4000-8000-000000000003';
const testTokenExpiry = Math.floor(Date.now() / 1000) + 3600;

export function tokenFor(id: string) {
  const payload = Buffer.from(JSON.stringify({ sub: id, session_id: `session-${id}`, exp: testTokenExpiry })).toString('base64url');
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.test-signature`;
}

export async function invoke(handler: any, options: any = {}) {
  let statusCode = 200;
  let body: any;
  const headers: Record<string, any> = {};
  const req: any = {
    method: 'GET', query: {}, headers: { host: 'localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' }, ...options,
  };
  const res: any = {
    setHeader(key: string, value: any) { headers[key.toLowerCase()] = value; return this; },
    getHeader(key: string) { return headers[key.toLowerCase()]; },
    status(code: number) { statusCode = code; return this; },
    end(value: string) { body = value ? JSON.parse(value) : undefined; return this; },
  };
  await handler(req, res);
  return { status: statusCode, body, headers };
}

export function sessionHeaders(id: string) {
  return { host: 'localhost:3000', origin: 'http://localhost:3000', cookie: `sbmj_access=${tokenFor(id)}; sbmj_refresh=refresh-${id}` };
}

// Only the external Supabase HTTP boundary is simulated; the real handlers run.
export function fakeSupabase() {
  const originalFetch = globalThis.fetch;
  process.env.SUPABASE_URL = 'https://security-tests.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-only';
  process.env.SUPABASE_ANON_KEY = 'test-anon';
  process.env.APP_URL = 'http://localhost:3000';
  const profiles = [
    { id: ADMIN_ID, email: 'admin@example.com', name: 'Admin Test', is_admin: true, is_confirmed: true },
    { id: CLIENT_ID, email: 'client@example.com', name: 'Client Test', is_admin: false, is_confirmed: true },
    { id: OTHER_ID, email: 'other@example.com', name: 'Other Client', is_admin: false, is_confirmed: true },
  ];
  const tables: Record<string, any[]> = {
    profiles,
    web_sessions: profiles.map(p => ({ id: `session-${p.id}`, user_id: p.id, expires_at: new Date(Date.now() + 86400000).toISOString() })),
    app_settings: [{ id: 'default', data: { homepageHeroTitle: 'StevenBmj', adminPassword: 'SENTINEL_PASSWORD', adminResetCode: 'SENTINEL_RESET', futureApiKey: 'SENTINEL_KEY', facebookUrl: 'https://facebook.com/example' } }],
    orders: [
      { id: 'own-order', customer_name: 'Client Test', email: 'client@example.com', items: [], total_price: 100, status: 'pending' },
      { id: 'other-order', customer_name: 'Other Client', email: 'other@example.com', items: [], total_price: 100, status: 'delivered' },
    ],
    products: [{ id: 'product-1', name: 'Watch', description: 'A real catalogue item', category: 'watches', price: 100, stock: 5, images: ['/logo.png'], specs: [] }],
    reviews: [], promo_codes: [], security_logs: [], announcements: [],
    driver_profiles: [], notifications: [], order_events: [], order_delivery_proofs: [],
    payment_events: [], business_expenses: [], push_subscriptions: [], push_jobs: [], exchange_rates: [], outreach_messages: [],
  };
  const requests: { method: string; path: string; body: any }[] = [];
  let limitAllowed = true;
  globalThis.fetch = async (input: any, init: any = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin !== 'https://security-tests.invalid') throw new Error('Live network disabled in security tests');
    const method = init.method || 'GET';
    const headers = new Headers(init.headers || {});
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, path: url.pathname, body });
    const json = (value: any, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
    if (url.pathname === '/auth/v1/user') {
      const profile = profiles.find(p => headers.get('authorization') === `Bearer ${tokenFor(p.id)}`);
      return profile ? json({ ...profile, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} }) : json({ msg: 'Invalid JWT', code: 'bad_jwt' }, 401);
    }
    if (url.pathname === '/auth/v1/token') {
      const profile = profiles.find(p => p.email === body.email || body.refresh_token === `refresh-${p.id}`);
      if (!profile || (body.password && body.password !== 'ValidPassword123!')) return json({ msg: 'Invalid login credentials', code: 'invalid_credentials' }, 400);
      return json({ access_token: tokenFor(profile.id), refresh_token: `refresh-${profile.id}`, token_type: 'bearer', expires_in: 3600, user: { ...profile, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
    }
    if (url.pathname === '/rest/v1/rpc/consume_security_limit') return json({ allowed: limitAllowed, retry_after: 60 });
    if (url.pathname === '/auth/v1/admin/users') {
      if (method === 'GET') return json({ users: profiles, next_page: null, last_page: 1, total: profiles.length });
      return json({ id: '00000000-0000-4000-8000-000000000004', email: body.email, user_metadata: body.user_metadata || {} });
    }
    if (url.pathname === '/auth/v1/admin/generate_link') {
      const profile = profiles.find(p => p.email === body.email)!;
      return json({ ...profile, hashed_token: `magic-${profile.id}`, verification_type: 'magiclink', action_link: 'https://security-tests.invalid/verify' });
    }
    if (url.pathname === '/auth/v1/verify') {
      const profile = profiles.find(p => `magic-${p.id}` === body.token_hash)!;
      return json({ access_token: tokenFor(profile.id), refresh_token: `refresh-${profile.id}`, token_type: 'bearer', expires_in: 3600, user: { ...profile, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } });
    }
    if (url.pathname.startsWith('/auth/v1/admin/users/')) return json({ user: { id: url.pathname.split('/').pop() } });
    if (url.pathname === '/auth/v1/logout') return json({});
    const table = url.pathname.split('/').pop()!;
    if (!(table in tables)) throw new Error(`Unmodelled Supabase request: ${url.pathname}`);
    const matching = (row: any) => [...url.searchParams].every(([key, value]) => {
      if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
      if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(row[key]));
      if (value === 'is.null') return row[key] == null;
      return true;
    });
    let rows = tables[table].filter(matching);
    if (method === 'POST') {
      const inputs = Array.isArray(body) ? body : [body];
      rows = inputs.map(item => {
        const existing = item.id === undefined ? undefined : tables[table].find(row => row.id === item.id);
        if (existing) return Object.assign(existing, item);
        tables[table].push(item);
        return item;
      });
    } else if (method === 'PATCH') {
      rows.forEach(row => Object.assign(row, body));
    } else if (method === 'DELETE') {
      tables[table] = tables[table].filter(row => !matching(row));
    }
    if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` } });
    return json(headers.get('accept')?.includes('vnd.pgrst.object') ? (rows[0] || null) : rows);
  };
  return { tables, requests, denyRateLimit() { limitAllowed = false; }, restore() { globalThis.fetch = originalFetch; } };
}
