create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null,
  name_en text,
  description text,
  description_en text,
  category text not null,
  images jsonb not null default '[]'::jsonb,
  price numeric not null default 0,
  promo_price numeric,
  stock integer not null default 0,
  rating numeric not null default 0,
  specs jsonb not null default '[]'::jsonb,
  is_exclu boolean not null default false,
  is_new boolean not null default false,
  badge text,
  badge_en text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  whatsapp text not null,
  email text,
  address text not null,
  city text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total_price numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'pending',
  date timestamptz not null default now(),
  pdf_invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code text primary key,
  discount_percentage numeric not null default 0,
  min_amount numeric,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id text primary key,
  text text not null,
  text_en text,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  ip text not null default '127.0.0.1',
  event text not null,
  status text not null
);

create table if not exists public.reviews (
  id text primary key,
  customer_name text not null,
  rating integer not null default 5,
  text text not null,
  status text not null default 'pending',
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  google_linked boolean not null default false,
  vip_points integer not null default 0,
  is_admin boolean not null default false,
  is_confirmed boolean not null default false,
  activation_code text not null default '',
  reset_code text not null default '',
  date_joined timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_promo_codes_updated_at on public.promo_codes;
create trigger set_promo_codes_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.promo_codes enable row level security;
alter table public.app_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.security_logs enable row level security;
alter table public.reviews enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products
for select using (true);

drop policy if exists "Public can read settings" on public.app_settings;
create policy "Public can read settings" on public.app_settings
for select using (true);

drop policy if exists "Public can read active announcements" on public.announcements;
create policy "Public can read active announcements" on public.announcements
for select using (active = true);

drop policy if exists "Public can read active promos" on public.promo_codes;
create policy "Public can read active promos" on public.promo_codes
for select using (active = true);

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews" on public.reviews
for select using (status = 'approved');
