import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  announcementToRow,
  logToRow,
  orderToRow,
  productToRow,
  promoToRow,
  reviewToRow,
} from '../src/server/supabaseMappings';
import { ensureAuthUser, upsertProfile } from '../src/server/supabaseStore';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const dbPath = path.resolve(process.cwd(), 'db_store.json');
  const store = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const adminEmail = process.env.ADMIN_EMAIL || 'stevenamorin202@gmail.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || store.settings?.adminPassword || 'stevenbmj123';

  if (store.products?.length) {
    const { error } = await supabase.from('products').upsert(store.products.map(productToRow), { onConflict: 'id' });
    if (error) throw error;
  }

  if (store.orders?.length) {
    const { error } = await supabase.from('orders').upsert(store.orders.map(orderToRow), { onConflict: 'id' });
    if (error) throw error;
  }

  if (store.promos?.length) {
    const { error } = await supabase.from('promo_codes').upsert(store.promos.map(promoToRow), { onConflict: 'code' });
    if (error) throw error;
  }

  const { error: settingsError } = await supabase
    .from('app_settings')
    .upsert({ id: 'default', data: store.settings || {} }, { onConflict: 'id' });
  if (settingsError) throw settingsError;

  if (store.announcements?.length) {
    const { error } = await supabase.from('announcements').upsert(store.announcements.map(announcementToRow), { onConflict: 'id' });
    if (error) throw error;
  }

  if (store.logs?.length) {
    const { error } = await supabase.from('security_logs').upsert(store.logs.map(logToRow), { onConflict: 'id' });
    if (error) throw error;
  }

  if (store.reviews?.length) {
    const { error } = await supabase.from('reviews').upsert(store.reviews.map(reviewToRow), { onConflict: 'id' });
    if (error) throw error;
  }

  const adminAuthUser = await ensureAuthUser(supabase, {
    email: adminEmail,
    password: adminPassword,
    name: 'StevenBmj Admin',
    emailConfirm: true,
  });

  await upsertProfile(supabase, {
    id: adminAuthUser.id,
    name: 'StevenBmj Admin',
    email: adminEmail,
    googleLinked: false,
    vipPoints: 99999,
    isAdmin: true,
    isConfirmed: true,
    activationCode: '',
    dateJoined: new Date().toISOString(),
  });

  for (const user of store.users || []) {
    const password = user.password || process.env.ADMIN_INITIAL_PASSWORD || 'stevenbmj123';
    const authUser = await ensureAuthUser(supabase, {
      email: user.email,
      password,
      name: user.name,
      emailConfirm: true,
    });

    await upsertProfile(supabase, {
      ...user,
      id: authUser.id,
      isConfirmed: user.isConfirmed !== false,
    });
  }

  console.log('Supabase seed completed successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
