import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function buildDatabaseUrl() {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  const ref = requireEnv('SUPABASE_PROJECT_REF');
  const password = requireEnv('SUPABASE_DB_PASSWORD');
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
}

async function main() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    const ref = requireEnv('SUPABASE_PROJECT_REF');
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      throw new Error(`Supabase Management API error ${response.status}: ${await response.text()}`);
    }

    console.log('Supabase schema applied successfully via Management API.');
    return;
  }

  const client = new Client({
    connectionString: buildDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('Supabase schema applied successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
