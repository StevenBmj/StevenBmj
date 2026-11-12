create table if not exists public.web_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists web_sessions_user_id_idx on public.web_sessions(user_id);
create index if not exists web_sessions_expiry_idx on public.web_sessions(expires_at);

create table if not exists public.security_rate_limits (
  key text primary key,
  window_started timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 1 check (attempts > 0)
);
create index if not exists security_rate_limits_expiry_idx on public.security_rate_limits(expires_at);

alter table public.web_sessions enable row level security;
alter table public.security_rate_limits enable row level security;
revoke all on public.web_sessions, public.security_rate_limits from public, anon, authenticated;
grant all on public.web_sessions, public.security_rate_limits to service_role;

create or replace function public.consume_security_limit(p_key text, p_limit integer, p_window_seconds integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  current_window public.security_rate_limits;
  instant timestamptz := clock_timestamp();
begin
  if length(p_key) > 200 or p_limit < 1 or p_limit > 1000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit';
  end if;
  insert into public.security_rate_limits as limits(key, window_started, expires_at, attempts)
  values (p_key, instant, instant + make_interval(secs => p_window_seconds), 1)
  on conflict (key) do update set
    attempts = case when limits.expires_at <= instant then 1 else least(limits.attempts + 1, p_limit + 1) end,
    window_started = case when limits.expires_at <= instant then instant else limits.window_started end,
    expires_at = case when limits.expires_at <= instant then instant + make_interval(secs => p_window_seconds) else limits.expires_at end
  returning * into current_window;
  -- Bounded cleanup avoids an ever-growing table without a long delete on login.
  if random() < 0.02 then
    delete from public.security_rate_limits where key in
      (select key from public.security_rate_limits where expires_at < instant - interval '1 day' limit 500);
    delete from public.web_sessions where id in
      (select id from public.web_sessions where expires_at < instant limit 500);
  end if;
  return jsonb_build_object('allowed', current_window.attempts <= p_limit,
    'retry_after', greatest(1, ceil(extract(epoch from current_window.expires_at - instant))::integer));
end;
$$;
revoke all on function public.consume_security_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_security_limit(text, integer, integer) to service_role;

drop policy if exists "Public can read settings" on public.app_settings;
drop policy if exists "Public can read active promos" on public.promo_codes;
revoke all on public.app_settings, public.promo_codes, public.profiles, public.orders, public.security_logs from public, anon, authenticated;
grant all on public.app_settings, public.promo_codes, public.profiles, public.orders, public.security_logs to service_role;

update public.app_settings set data = data - array['adminPassword', 'adminResetCode', 'adminResetExpiresAt'];

-- Abort instead of merging or deleting existing accounts if duplicate emails exist.
create unique index if not exists profiles_email_lower_unique on public.profiles(lower(email));
