import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { load } from 'cheerio';

const origin = new URL(process.argv[2] || 'https://stevenbmj.vercel.app').origin;
if (!/^https:\/\/stevenbmj(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) throw new Error('Wrong deployment target');
const cli = resolve(process.env.APPDATA!, 'npm/node_modules/vercel/dist/vc.js');
const records: any[] = [];
let bypass = '';
if (origin !== 'https://stevenbmj.vercel.app') {
  const auth = JSON.parse(readFileSync(resolve(process.env.APPDATA!, 'com.vercel.cli/Data/auth.json'), 'utf8'));
  const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
  const response = await fetch(`https://api.vercel.com/v9/projects/${project.projectId}?teamId=${project.orgId}`, { headers: { Authorization: `Bearer ${auth.token}` }, signal: AbortSignal.timeout(15000) });
  const settings = await response.json();
  if (!response.ok || settings.name !== 'stevenbmj' || settings.id !== 'prj_38yP9DMon1MsVA5y1QZpFkfVLFX1') throw new Error('Preview project verification failed');
  bypass = Object.keys(settings.protectionBypass || {}).find(key => settings.protectionBypass[key].scope === 'automation-bypass') || '';
}
async function request(path: string, method = 'GET') {
  let response = await fetch(origin + path, { method, headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {}, redirect: 'manual', signal: AbortSignal.timeout(30000) });
  if (response.status === 302 && response.headers.get('location')?.startsWith('https://vercel.com/sso-api') || response.status === 401 && response.headers.get('content-type')?.includes('text/html')) {
    const marker = '\nSBMJ_STATUS:';
    let output: string;
    try { output = execFileSync(process.execPath, [cli, 'curl', path, '--deployment', origin, '--', '--silent', '--show-error', '--max-time', '30', '--request', method, '--write-out', `${marker}%{http_code}`], { encoding: 'utf8', maxBuffer: 5e6, timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error: any) { throw new Error(`Protected deployment request failed: ${path}; status=${error.status}, signal=${error.signal}, outputBytes=${error.stdout?.length || 0}`); }
    const position = output.lastIndexOf(marker);
    if (position < 0) throw new Error('Missing deployment status');
    response = new Response(output.slice(0, position), { status: Number(output.slice(position + marker.length).trim()) });
  }
  const body = await response.text();
  records.push({ path, method, status: response.status });
  console.log(`${method} ${path}: ${response.status}`);
  return { status: response.status, body, headers: response.headers };
}
const home = await request('/'); assert.equal(home.status, 200);
assert.match(load(home.body)('title').text(), /StevenBmj/);
assert.equal(load(home.body)('#boot-screen img').attr('src'), '/brand/logo-512.webp');
const en = await request('/?lang=en'); assert.equal(load(en.body)('html').attr('lang'), 'en');
const products = await request('/api/products'); assert.equal(products.status, 200);
const catalogue = JSON.parse(products.body); assert.ok(Array.isArray(catalogue) && catalogue.length > 0);
const product = await request(`/produit/${encodeURIComponent(catalogue[0].id)}`);
assert.equal(product.status, 200); assert.ok(load(product.body)('title').text().includes(catalogue[0].name));
for (const path of ['/compte', '/god', '/livraisons']) {
  const response = await request(path); assert.equal(response.status, 200);
  assert.match(load(response.body)('meta[name="robots"]').attr('content') || '', /noindex/);
}
for (const path of ['/api/auth/session', '/api/auth/users', '/api/security-logs', '/api/shop?resource=ledger', '/api/assistant/keys']) {
  assert.equal((await request(path)).status, 401, path);
}
assert.equal((await request('/api/products', 'POST')).status, 401);
const settings = await request('/api/settings'); assert.equal(settings.status, 200);
for (const key of Object.keys(JSON.parse(settings.body))) assert.ok(!/password|secret|resetCode|apiKey/i.test(key), key);
const sitemap = await request('/sitemap.xml'); assert.equal(sitemap.status, 200);
assert.match(sitemap.body, /<urlset/); assert.ok(!/\/god|\/compte|#/i.test(sitemap.body));
for (const path of ['/.env.local', '/server.cjs', '/server.cjs.map', '/.server-build/server.cjs', '/.server-build/server.cjs.map']) {
  const response = await request(path); assert.equal(response.status, 404, path);
  assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|MAIL_APP_PASSWORD/.test(response.body));
}
for (const path of ['/sw.js', '/site.webmanifest', '/logo.png']) assert.equal((await request(path)).status, 200, path);
for (const path of ['/brand/logo-512.webp', '/brand/logo-192.png', '/brand/logo-512.png']) {
  const asset = await request(path); assert.equal(asset.status, 200, path);
  assert.match(asset.headers.get('content-type') || '', /^image\//, path);
}
const receipt = { origin, checkedAt: new Date().toISOString(), records, result: 'passed' };
writeFileSync(resolve('.codex-private', origin === 'https://stevenbmj.vercel.app' ? 'production-smoke.json' : 'preview-smoke.json'), JSON.stringify(receipt), { mode: 0o600 });
console.log(JSON.stringify(receipt));
