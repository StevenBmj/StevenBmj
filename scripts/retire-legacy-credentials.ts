import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { adminClient } from '../src/server/security';

dotenv.config({ path: '.env.local', quiet: true });
const ref = 'elpfuvzfyogogavbmahq';
if (process.env.SUPABASE_PROJECT_REF !== ref || !process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('sb_secret_')
  || !process.env.SUPABASE_ANON_KEY?.startsWith('sb_publishable_')) throw new Error('Replacement environment is not verified');
if (!process.argv.includes('--apply')) throw new Error('Explicit --apply is required after production verification');
const smoke = JSON.parse(readFileSync('.codex-private/production-smoke.json', 'utf8'));
if (smoke.origin !== 'https://stevenbmj.vercel.app' || smoke.result !== 'passed' || Date.now() - Date.parse(smoke.checkedAt) > 30 * 60000) throw new Error('Fresh production acceptance required');
const headers = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
async function management(path: string, method = 'GET', body?: any) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Credential operation refused: ${response.status}`);
  return response.json();
}
const project = await management('');
if (project.id !== ref || project.name !== 'Bmj') throw new Error('Wrong project identity');
const probe = await adminClient().from('products').select('id', { head: true, count: 'exact' });
if (probe.error || probe.count === null) throw new Error('Replacement key probe failed');
const signing = await management('/config/auth/signing-keys');
const legacy = await management('/config/auth/signing-keys/legacy');
if (!signing.keys.some((key: any) => key.status === 'in_use' && key.algorithm === 'ES256') || legacy.algorithm !== 'HS256'
  || !['previously_used', 'revoked'].includes(legacy.status)) throw new Error('Signing key state needs manual review');
await management('/api-keys/legacy?enabled=false', 'PUT');
if (legacy.status !== 'revoked') await management(`/config/auth/signing-keys/${legacy.id}`, 'PATCH', { status: 'revoked' });
const keys = await management('/config/auth/signing-keys');
if (!keys.keys.some((key: any) => key.id === legacy.id && key.status === 'revoked')) throw new Error('Legacy signature revocation is not confirmed');
const prior = dotenv.parse(readFileSync('.codex-private/before-key-replacement.env'));
const rejected = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
  headers: { apikey: process.env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${prior.SUPABASE_SERVICE_ROLE_KEY}` }, signal: AbortSignal.timeout(15000),
});
await rejected.body?.cancel();
if (![401, 403].includes(rejected.status)) throw new Error('Old service token was not rejected');
const password = randomBytes(36).toString('base64url');
// Save the replacement privately before changing the remote password so recovery remains possible.
writeFileSync('.codex-private/database-password-replacement.json', JSON.stringify({ project: ref, password }), { mode: 0o600 });
await management('/database/password', 'PATCH', { password });
let local = readFileSync('.env.local', 'utf8');
local = local.replace(/^SUPABASE_DB_PASSWORD=.*$/m, () => `SUPABASE_DB_PASSWORD=${JSON.stringify(password)}`);
const current = dotenv.parse(local);
if (current.SUPABASE_DB_URL) {
  const url = new URL(current.SUPABASE_DB_URL); url.password = password;
  local = local.replace(/^SUPABASE_DB_URL=.*$/m, () => `SUPABASE_DB_URL=${JSON.stringify(url.href)}`);
}
writeFileSync('.env.local', local, { mode: 0o600 });
const healthy = await adminClient().from('products').select('id', { head: true, count: 'exact' });
if (healthy.error || healthy.count !== probe.count) throw new Error('Post-rotation database probe failed');
const receipt = { project: ref, legacyApiKeysDisabled: true, legacySigningKeyRevoked: true, oldServiceJwtRejected: true, databasePasswordRotated: true, verifiedAt: new Date().toISOString() };
writeFileSync('.codex-private/credential-revocation-receipt.json', JSON.stringify(receipt), { mode: 0o600 });
console.log(JSON.stringify(receipt));
