import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  announcementToRow,
  logToRow,
  orderToRow,
  productToRow,
  profileToUser,
  promoToRow,
  reviewToRow,
  rowToAnnouncement,
  rowToLog,
  rowToOrder,
  rowToProduct,
  rowToPromo,
  rowToReview,
} from './supabaseMappings';

export function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null;
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getAllUsers(client: SupabaseClient) {
  const users: any[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data.users || []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

export async function findAuthUserByEmail(client: SupabaseClient, email: string) {
  const emailKey = email.trim().toLowerCase();
  const users = await getAllUsers(client);
  return users.find((user) => String(user.email || '').toLowerCase() === emailKey) || null;
}

export async function ensureAuthUser(client: SupabaseClient, params: {
  email: string;
  password: string;
  name: string;
  emailConfirm?: boolean;
}) {
  const existing = await findAuthUserByEmail(client, params.email);
  if (existing) {
    if (params.password) {
      await client.auth.admin.updateUserById(existing.id, {
        password: params.password,
        user_metadata: { name: params.name },
      });
    }
    return existing;
  }

  const { data, error } = await client.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: params.emailConfirm !== false,
    user_metadata: { name: params.name },
  });
  if (error) throw error;
  return data.user;
}

export async function loadStoreFromSupabase(defaultStore: any) {
  const client = getSupabaseAdmin();
  if (!client) return null;

  const [
    products,
    orders,
    promos,
    settings,
    logs,
    announcements,
    reviews,
    profiles,
  ] = await Promise.all([
    client.from('products').select('*').order('created_at', { ascending: true }),
    client.from('orders').select('*').order('date', { ascending: false }),
    client.from('promo_codes').select('*').order('created_at', { ascending: true }),
    client.from('app_settings').select('*').eq('id', 'default').maybeSingle(),
    client.from('security_logs').select('*').order('timestamp', { ascending: false }).limit(100),
    client.from('announcements').select('*').order('created_at', { ascending: false }),
    client.from('reviews').select('*').order('date', { ascending: false }),
    client.from('profiles').select('*').order('date_joined', { ascending: false }),
  ]);

  for (const result of [products, orders, promos, settings, logs, announcements, reviews, profiles]) {
    if (result.error) throw result.error;
  }

  return {
    products: (products.data || []).map(rowToProduct),
    orders: (orders.data || []).map(rowToOrder),
    promos: (promos.data || []).map(rowToPromo),
    settings: { ...defaultStore.settings, ...(settings.data?.data || {}) },
    logs: (logs.data || []).map(rowToLog),
    announcements: (announcements.data || []).map(rowToAnnouncement),
    users: (profiles.data || []).map(profileToUser),
    reviews: (reviews.data || []).map(rowToReview),
  };
}

export async function saveStoreToSupabase(store: any) {
  const client = getSupabaseAdmin();
  if (!client) return;

  const operations: PromiseLike<any>[] = [];

  if (store.products) {
    operations.push(client.from('products').upsert(store.products.map(productToRow), { onConflict: 'id' }));
  }
  if (store.orders) {
    operations.push(client.from('orders').upsert(store.orders.map(orderToRow), { onConflict: 'id' }));
  }
  if (store.promos) {
    operations.push(client.from('promo_codes').upsert(store.promos.map(promoToRow), { onConflict: 'code' }));
  }
  if (store.settings) {
    operations.push(client.from('app_settings').upsert({ id: 'default', data: store.settings }, { onConflict: 'id' }));
  }
  if (store.announcements) {
    operations.push(client.from('announcements').upsert(store.announcements.map(announcementToRow), { onConflict: 'id' }));
  }
  if (store.logs) {
    operations.push(client.from('security_logs').upsert(store.logs.map(logToRow), { onConflict: 'id' }));
  }
  if (store.reviews) {
    operations.push(client.from('reviews').upsert(store.reviews.map(reviewToRow), { onConflict: 'id' }));
  }

  const results = await Promise.all(operations);
  const failed = results.find((result: any) => result.error);
  if (failed?.error) throw failed.error;
}

export async function upsertProfile(client: SupabaseClient, profile: any) {
  const { error } = await client.from('profiles').upsert({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    google_linked: Boolean(profile.googleLinked),
    vip_points: Number(profile.vipPoints || 0),
    is_admin: Boolean(profile.isAdmin),
    is_confirmed: Boolean(profile.isConfirmed),
    activation_code: profile.activationCode || '',
    reset_code: profile.resetCode || '',
    date_joined: profile.dateJoined || new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) throw error;
}
