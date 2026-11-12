import dotenv from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';
import { sealBackup, openBackup, snapshotDigest } from '../src/server/backup';

dotenv.config({ path: '.env.local', quiet: true });
const ref = process.env.SUPABASE_PROJECT_REF;
if (ref !== 'elpfuvzfyogogavbmahq') throw new Error('Wrong project');
const headers = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
const project = await fetch(`https://api.supabase.com/v1/projects/${ref}`, { headers });
const identity = await project.json();
if (!project.ok || identity.id !== ref || identity.name !== 'Bmj') throw new Error('Project identity mismatch');
async function query(sql: string) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers, body: JSON.stringify({ query: sql }), signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Snapshot query refused (${response.status})`);
  return response.json();
}
const tables: any[] = await query(`select c.relname as name, (select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod)) order by a.attnum)
  from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) as columns
  from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname;`);
if (!tables.length || tables.some(table => !/^[a-z_][a-z0-9_]*$/.test(table.name))) throw new Error('Unexpected schema');
const selections = tables.map(table => `(select jsonb_build_object('name','${table.name}','rows',coalesce(array_agg(to_jsonb(t)::text order by to_jsonb(t)::text),'{}'::text[])) from public."${table.name}" t)`);
const snapshotRows = await query(`select jsonb_build_array(${selections.join(',')}) as tables,
  (select jsonb_agg(t) from pg_policies t where schemaname='public') as policies,
  (select jsonb_agg(jsonb_build_object('table',cl.relname,'name',con.conname,'definition',pg_get_constraintdef(con.oid))) from pg_constraint con join pg_class cl on cl.oid=con.conrelid join pg_namespace n on n.oid=cl.relnamespace where n.nspname='public') as constraints,
  (select jsonb_agg(t) from pg_indexes t where schemaname='public') as indexes,
  (select jsonb_agg(jsonb_build_object('name',p.proname,'definition',pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f') as functions;`);
const snapshot = { version: 1, project: ref, capturedAt: new Date().toISOString(), schema: tables, ...snapshotRows[0] };
const folder = resolve('.codex-private');
mkdirSync(folder, { recursive: true, mode: 0o700 });
if (process.platform === 'win32') {
  const account = execFileSync('whoami.exe', { encoding: 'utf8' }).trim();
  execFileSync('icacls.exe', [folder, '/inheritance:r', '/grant:r', `${account}:(OI)(CI)F`], { stdio: 'pipe' });
}
const filename = resolve(folder, `business-${Date.now()}.encrypted.json`);
writeFileSync(filename, sealBackup(JSON.stringify(snapshot), process.env.AI_ENCRYPTION_KEY!, ref), { mode: 0o600, flag: 'wx' });
const restored = JSON.parse(openBackup(readFileSync(filename, 'utf8'), process.env.AI_ENCRYPTION_KEY!, ref));
const db = await PGlite.create();
const quoted = (name: string) => `"${name.replaceAll('"', '""')}"`;
const verified: { table: string; count: number; sha256: string }[] = [];
try {
  for (const schema of restored.schema) {
    await db.exec(`create table public.${quoted(schema.name)} (${schema.columns.map((column: any) => `${quoted(column.name)} ${column.type}`).join(',')})`);
    const rows: string[] = restored.tables.find((table: any) => table.name === schema.name).rows;
    for (const row of rows) await db.query(`insert into public.${quoted(schema.name)} select (jsonb_populate_record(null::public.${quoted(schema.name)},$1::jsonb)).*`, [row]);
    const result = await db.query<{ row: string }>(`select to_jsonb(t)::text as row from public.${quoted(schema.name)} t`);
    const digest = snapshotDigest(result.rows.map(row => row.row));
    if (digest !== snapshotDigest(rows)) throw new Error(`Restoration checksum mismatch: ${schema.name}`);
    verified.push({ table: schema.name, count: rows.length, sha256: digest });
  }
} finally { await db.close(); }
writeFileSync(resolve(folder, 'business-backup-verification.json'), JSON.stringify({ project: ref, filename, capturedAt: snapshot.capturedAt, verifiedAt: new Date().toISOString(), scope: 'all-public-table-data', verified }), { mode: 0o600 });
console.log(JSON.stringify({ project: ref, encrypted: true, restoration: 'all-public-table-data-checksums-verified', tables: verified.map(({ table, count }) => ({ table, count })) }));
