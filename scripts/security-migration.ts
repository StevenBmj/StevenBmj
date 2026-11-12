import dotenv from 'dotenv';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

dotenv.config({ path: '.env.local', quiet: true });
const ref = process.env.SUPABASE_PROJECT_REF;
if (ref !== 'elpfuvzfyogogavbmahq') throw new Error('Wrong Supabase project. Stopping.');
const headers = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
const project = await fetch(`https://api.supabase.com/v1/projects/${ref}`, { headers });
const identity = await project.json();
if (!project.ok || identity.id !== ref || identity.name !== 'Bmj') throw new Error('Project identity verification failed.');

async function query(sql: string) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers, body: JSON.stringify({ query: sql }), signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Database operation failed (${response.status}); nothing further applied.`);
  return response.json();
}

const migrations = [
  '20261111220914_server_sessions_and_private_settings.sql',
  '20261112041430_invoice_snapshots.sql',
  '20261112044926_encrypted_assistant_credentials.sql',
].map(name => {
  const sql = readFileSync(resolve('supabase/migrations', name), 'utf8');
  return { name, sql, hash: createHash('sha256').update(sql).digest('hex') };
});
const apply = process.argv.includes('--apply');
if (apply) {
  const folder = resolve('.codex-private');
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  if (process.platform === 'win32') {
    const account = execFileSync('whoami.exe', { encoding: 'utf8' }).trim();
    execFileSync('icacls.exe', [folder, '/inheritance:r', '/grant:r', `${account}:(OI)(CI)F`], { stdio: 'pipe' });
  }
  const metadata = await query(`select (select jsonb_agg(t) from public.app_settings t) as settings,
    (select jsonb_agg(p) from pg_policies p where schemaname='public') as policies,
    (select count(*) from public.profiles) as profiles, (select count(*) from public.orders) as orders,
    (select count(*) from public.products) as products;`);
  writeFileSync(resolve(folder, `before-security-${Date.now()}.json`), JSON.stringify(metadata), { mode: 0o600, flag: 'wx' });
}
const changes = migrations.map((migration, i) => `
  if not exists (select 1 from public.sbmj_schema_releases where name = '${migration.name}') then
    execute $migration_${i}$${migration.sql}$migration_${i}$;
    insert into public.sbmj_schema_releases(name, sha256) values ('${migration.name}', '${migration.hash}');
  elsif (select sha256 from public.sbmj_schema_releases where name = '${migration.name}') <> '${migration.hash}' then
    raise exception 'Previously applied release has changed';
  end if;`).join('\n');
await query(`begin;
  create table if not exists public.sbmj_schema_releases (name text primary key, sha256 text not null, applied_at timestamptz not null default now());
  alter table public.sbmj_schema_releases enable row level security;
  revoke all on public.sbmj_schema_releases from public, anon, authenticated;
  grant all on public.sbmj_schema_releases to service_role;
  do $release$ declare
    profiles_before bigint := (select count(*) from public.profiles);
    orders_before bigint := (select count(*) from public.orders);
  begin
    ${changes}
    if profiles_before <> (select count(*) from public.profiles) or orders_before <> (select count(*) from public.orders) then
      raise exception 'Business data preservation check failed';
    end if;
    if has_table_privilege('anon', 'public.ai_credentials', 'SELECT')
      or has_table_privilege('authenticated', 'public.ai_credentials', 'SELECT')
      or has_table_privilege('anon', 'public.app_settings', 'SELECT')
      or has_function_privilege('anon', 'public.consume_security_limit(text,integer,integer)', 'EXECUTE') then
      raise exception 'Private resource privilege check failed';
    end if;
  end $release$;
  ${apply ? 'commit' : 'rollback'};`);
console.log(JSON.stringify({ project: identity.name, id: ref, migrations: migrations.map(m => m.name), result: apply ? 'applied' : 'validated-and-rolled-back', accountsDeleted: 0 }));
