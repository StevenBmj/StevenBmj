alter function public.set_updated_at() set search_path = pg_catalog, public;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Supabase's event trigger still runs as its owner; it is not an application RPC.
do $harden$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $harden$;
