create table public.ai_credentials (
  id uuid primary key,
  scope text not null check (scope in ('client', 'admin')),
  provider text not null default 'openrouter' check (provider = 'openrouter'),
  label text not null check (length(label) between 1 and 60),
  encrypted_key text not null,
  fingerprint text not null,
  suffix text not null check (length(suffix) = 4),
  model text not null,
  speech_model text,
  speech_voice text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (scope, fingerprint)
);
alter table public.ai_credentials enable row level security;
revoke all on public.ai_credentials from public, anon, authenticated;
grant select, insert, update, delete on public.ai_credentials to service_role;
create index ai_credentials_enabled_scope on public.ai_credentials(scope) where enabled;
