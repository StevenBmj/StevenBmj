import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminEmail = (process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com').toLowerCase();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id,email,is_admin')
    .order('date_joined', { ascending: false });
  if (error) throw error;

  const clients = (profiles || []).filter((profile: any) => {
    const email = String(profile.email || '').toLowerCase();
    return !profile.is_admin && email !== adminEmail;
  });

  console.log(`Client profiles found: ${clients.length}`);
  for (const profile of clients) {
    const deleted = await supabase.auth.admin.deleteUser(profile.id);
    if (deleted.error) {
      console.error(`Failed to delete ${profile.email}: ${deleted.error.message}`);
      continue;
    }
    console.log(`Deleted client: ${profile.email}`);
  }

  const remaining = await supabase
    .from('profiles')
    .select('id,email,is_admin')
    .eq('is_admin', false);
  if (remaining.error) throw remaining.error;
  console.log(`Remaining non-admin profiles: ${remaining.data?.length || 0}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
