import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { generateVAPIDKeys } from 'web-push';

dotenv.config({ path: '.env.local', quiet: true });
const ref = 'elpfuvzfyogogavbmahq';
const linked = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
if (process.env.SUPABASE_PROJECT_REF !== ref || linked.projectName !== 'stevenbmj'
  || linked.projectId !== 'prj_38yP9DMon1MsVA5y1QZpFkfVLFX1') throw new Error('Release target mismatch');
const headers = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
async function management(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Supabase release request refused: ${response.status}`);
  return response.json();
}
const project = await management('');
if (project.id !== ref || project.name !== 'Bmj') throw new Error('Supabase identity mismatch');
const keys = await management('/api-keys?reveal=true');
const replacements: Record<string, string> = {};
for (const [type, variable] of [['publishable', 'SUPABASE_ANON_KEY'], ['secret', 'SUPABASE_SERVICE_ROLE_KEY']]) {
  const name = `stevenbmj_${type}_20261112`;
  const key = keys.find((key: any) => key.type === type && key.name === name)
    || await management('/api-keys?reveal=true', 'POST', { type, name, description: 'StevenBmj coordinated replacement of exposed legacy credentials' });
  if (!key.api_key?.startsWith(`sb_${type}_`)) throw new Error('Replacement key unavailable');
  replacements[variable] = key.api_key;
}
const client = createClient(process.env.SUPABASE_URL!, replacements.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const probe = await client.from('products').select('id', { head: true, count: 'exact' });
if (probe.error || probe.count === null) throw new Error('Replacement key database probe failed');
if (!process.env.AI_ENCRYPTION_KEY) replacements.AI_ENCRYPTION_KEY = randomBytes(32).toString('base64');
if (!process.env.AUTH_CODE_SECRET) replacements.AUTH_CODE_SECRET = randomBytes(48).toString('base64');
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  const vapid = generateVAPIDKeys();
  replacements.VAPID_PUBLIC_KEY = vapid.publicKey;
  replacements.VAPID_PRIVATE_KEY = vapid.privateKey;
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.VITE_GOOGLE_CLIENT_ID) {
  const home = await (await fetch('https://stevenbmj.vercel.app', { signal: AbortSignal.timeout(15000) })).text();
  const { load } = await import('cheerio');
  const $ = load(home);
  const candidates = new Set<string>();
  for (const element of $('script[src]').toArray()) {
    const url = new URL($(element).attr('src')!, 'https://stevenbmj.vercel.app');
    if (url.origin !== 'https://stevenbmj.vercel.app' || !url.pathname.startsWith('/assets/')) continue;
    const script = await (await fetch(url, { signal: AbortSignal.timeout(15000) })).text();
    for (const id of script.matchAll(/\b[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com\b/g)) candidates.add(id[0]);
  }
  if (candidates.size !== 1) throw new Error('Public Google client ID could not be verified from the current production bundle');
  replacements.GOOGLE_CLIENT_ID = replacements.VITE_GOOGLE_CLIENT_ID = [...candidates][0];
}
// Keep the local file private and preserve comments/unrelated application settings.
let source = readFileSync('.env.local', 'utf8');
if (!existsSync('.codex-private/before-key-replacement.env')) writeFileSync('.codex-private/before-key-replacement.env', source, { mode: 0o600, flag: 'wx' });
for (const [name, value] of Object.entries(replacements)) {
  const entry = `${name}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');
  source = pattern.test(source) ? source.replace(pattern, () => entry) : `${source.trimEnd()}\n${entry}\n`;
  process.env[name] = value;
}
writeFileSync('.env.local', source, { mode: 0o600 });
console.log(JSON.stringify({ project: ref, replacementKeysVerified: true, legacyKeysStillEnabled: true, products: probe.count }));
if (process.argv.includes('--vercel')) {
  const cli = resolve(process.env.APPDATA!, 'npm/node_modules/vercel/dist/vc.js');
  if (!existsSync(cli)) throw new Error('Authenticated Vercel CLI not found');
  const values = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'AI_ENCRYPTION_KEY', 'AUTH_CODE_SECRET', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID', 'MAIL_USER', 'MAIL_APP_PASSWORD'];
  if (values.some(name => !process.env[name] || process.env[name] === '...') || process.env.GOOGLE_CLIENT_ID !== process.env.VITE_GOOGLE_CLIENT_ID) throw new Error('Required local environment is incomplete');
  for (const name of values) {
    try {
      const kind = name === 'GOOGLE_CLIENT_ID' || name === 'VITE_GOOGLE_CLIENT_ID' ? '--no-sensitive' : '--sensitive';
      execFileSync(process.execPath, [cli, 'env', 'add', name, 'production,preview', '--project', 'stevenbmj', '--force', kind, '--yes'], { input: process.env[name], stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
    } catch { throw new Error(`Vercel update failed for ${name}; secret output suppressed`); }
    console.log(`Synchronized ${name}: stevenbmj production + preview`);
  }
}
