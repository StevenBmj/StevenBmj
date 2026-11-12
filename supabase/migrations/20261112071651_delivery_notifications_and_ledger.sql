alter table public.profiles add column whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{7,14}$');

create table public.driver_profiles (
  user_id uuid primary key references public.profiles(id),
  phone text not null check (phone ~ '^\+[0-9]{8,15}$'),
  zone text not null check (length(zone) between 2 and 160),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  available boolean not null default false,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Existing orders retain their original statuses; never invent historic receipts or stock movements.
alter table public.orders add column fulfilment_status text not null default 'legacy'
  check (fulfilment_status in ('legacy','awaiting_payment','preparing','stock_issue','assigned','accepted','collected','out_for_delivery','signed','completed','disputed','cancelled','refunded'));
alter table public.orders alter column fulfilment_status set default 'awaiting_payment';
alter table public.orders add column assigned_driver_id uuid references public.driver_profiles(user_id);
alter table public.orders add column workflow_version integer not null default 0;
alter table public.orders add column stock_reserved boolean not null default false;
alter table public.orders add column archived_at timestamptz;
alter table public.orders add column recipient_rating integer check (recipient_rating between 1 and 5);
create index orders_driver on public.orders(assigned_driver_id) where assigned_driver_id is not null;
create unique index driver_one_active_delivery on public.orders(assigned_driver_id)
  where assigned_driver_id is not null and fulfilment_status in ('assigned','accepted','collected','out_for_delivery');

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id),
  actor_id uuid not null references public.profiles(id),
  kind text not null,
  request_id uuid not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(actor_id, request_id)
);
create index order_events_history on public.order_events(order_id,created_at);
create table public.order_delivery_proofs (
  order_id text primary key references public.orders(id),
  driver_id uuid not null references public.driver_profiles(user_id),
  first_name text not null,
  contract_version text not null check (contract_version='receipt-v1'),
  condition text not null check (condition in ('good','issue')),
  note text not null default '',
  signature jsonb not null,
  signed_at timestamptz not null default now()
);
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id),
  actor_id uuid not null references public.profiles(id),
  kind text not null check (kind in ('payment','refund')),
  amount_minor bigint not null check (amount_minor>0),
  currency text not null check (currency in ('EUR','USD','XOF')),
  method text not null check (method in ('cash','mobile_money','bank','other')),
  reference text not null check (length(reference) between 3 and 120),
  created_at timestamptz not null default now(),
  unique(order_id,kind)
);
create table public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  amount_minor bigint not null check (amount_minor>0 and amount_minor<=100000000000),
  currency text not null check (currency in ('EUR','USD','XOF')),
  category text not null check (category in ('inventory','delivery','fees','rent','tax','other')),
  description text not null check (length(description) between 3 and 500),
  incurred_on date not null,
  request_id uuid not null unique,
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_id text references public.orders(id),
  kind text not null,
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id,event_key)
);
create index notifications_inbox on public.notifications(user_id,created_at desc);
create index notifications_unread on public.notifications(user_id) where read_at is null;
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  session_id uuid not null,
  endpoint text not null unique,
  keys jsonb not null,
  language text not null default 'FR' check (language in ('FR','EN')),
  created_at timestamptz not null default now()
);
create table public.push_jobs (
  notification_id uuid primary key references public.notifications(id),
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','unsubscribed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.exchange_rates (
  id text primary key default 'EUR',
  as_of date not null,
  usd numeric not null check (usd>0 and usd<1000),
  source text not null,
  fetched_at timestamptz not null default now()
);
create table public.outreach_messages (
  id uuid primary key,
  actor_id uuid not null references public.profiles(id),
  request_hash text not null,
  recipient_email text,
  recipient_phone text,
  customer_name text not null,
  message text not null,
  email_status text not null check (email_status in ('sending','accepted','not_accepted','not_requested')),
  consent_attested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.security_logs add column archived_at timestamptz;
alter table public.security_logs add column actor_id uuid;
alter table public.security_logs add column country text;
alter table public.security_logs add column city text;
create index security_logs_recent on public.security_logs(timestamp desc);

do $private$ declare name text; begin
  foreach name in array array['driver_profiles','order_events','order_delivery_proofs','payment_events','business_expenses','notifications','push_subscriptions','push_jobs','exchange_rates','outreach_messages'] loop
    execute format('alter table public.%I enable row level security',name);
    execute format('revoke all on public.%I from public,anon,authenticated',name);
    execute format('grant all on public.%I to service_role',name);
  end loop;
end $private$;

create function public.sbmj_immutable_record() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin raise exception 'immutable_record' using errcode='23514'; end;
$$;
revoke all on function public.sbmj_immutable_record() from public,anon,authenticated;
create trigger immutable_delivery_proof before update or delete on public.order_delivery_proofs
for each row execute function public.sbmj_immutable_record();
create trigger immutable_order_event before update or delete on public.order_events
for each row execute function public.sbmj_immutable_record();
create trigger immutable_payment_event before update or delete on public.payment_events
for each row execute function public.sbmj_immutable_record();
create trigger immutable_business_expense before update or delete on public.business_expenses
for each row execute function public.sbmj_immutable_record();

create function public.sbmj_queue_push() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin insert into public.push_jobs(notification_id) values(new.id); return new; end;
$$;
revoke all on function public.sbmj_queue_push() from public,anon,authenticated;
create trigger queue_notification_push after insert on public.notifications
for each row execute function public.sbmj_queue_push();

create function public.sbmj_order_created() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
  insert into public.notifications(user_id,order_id,kind,event_key)
  select id,new.id,'order_created','created:'||new.id from public.profiles
  where is_confirmed and (is_admin or lower(email)=lower(new.email));
  return new;
end;
$$;
revoke all on function public.sbmj_order_created() from public,anon,authenticated;
grant execute on function public.sbmj_order_created(), public.sbmj_queue_push() to service_role;
create trigger notify_new_order after insert on public.orders
for each row execute function public.sbmj_order_created();

create function public.sbmj_review_created() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if new.status='pending' then
    insert into public.notifications(user_id,kind,event_key)
    select id,'review_pending','review:'||new.id from public.profiles where is_admin and is_confirmed;
  end if;
  return new;
end;
$$;
revoke all on function public.sbmj_review_created() from public,anon,authenticated;
grant execute on function public.sbmj_review_created() to service_role;
create trigger notify_pending_review after insert on public.reviews
for each row execute function public.sbmj_review_created();

create function public.sbmj_security_alert() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if new.status='BLOCKED' then
    insert into public.notifications(user_id,kind,event_key)
    select id,'security_alert','security:'||new.id from public.profiles where is_admin and is_confirmed;
  end if;
  return new;
end;
$$;
revoke all on function public.sbmj_security_alert() from public,anon,authenticated;
grant execute on function public.sbmj_security_alert() to service_role;
create trigger notify_security_alert after insert on public.security_logs
for each row execute function public.sbmj_security_alert();

create function public.sbmj_driver_review(p_actor uuid,p_driver uuid,p_status text) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare d public.driver_profiles; begin
  if not exists(select 1 from public.profiles where id=p_actor and is_admin and is_confirmed) then
    raise exception 'access_denied' using errcode='42501'; end if;
  if p_status not in ('approved','rejected','suspended') then raise exception 'invalid_status'; end if;
  select * into d from public.driver_profiles where user_id=p_driver for update;
  if not found then raise exception 'driver_not_found'; end if;
  if d.status=p_status then return to_jsonb(d); end if;
  update public.driver_profiles set status=p_status,available=false,reviewed_by=p_actor,reviewed_at=now()
    where user_id=p_driver returning * into d;
  insert into public.notifications(user_id,kind,event_key) values(p_driver,'driver_'||p_status,'driver:'||p_driver||':'||gen_random_uuid());
  insert into public.security_logs(id,event,status,actor_id)
    values('driver-'||gen_random_uuid(),'Driver review: '||p_driver||' -> '||p_status,'SECURED',p_actor);
  return to_jsonb(d);
end;
$$;
revoke all on function public.sbmj_driver_review(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.sbmj_driver_review(uuid,uuid,text) to service_role;

create function public.sbmj_driver_availability(p_actor uuid,p_available boolean) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare d public.driver_profiles; begin
  select * into d from public.driver_profiles where user_id=p_actor for update;
  if not found or d.status<>'approved' then raise exception 'access_denied' using errcode='42501'; end if;
  if p_available and exists(select 1 from public.orders where assigned_driver_id=p_actor and fulfilment_status in ('assigned','accepted','collected','out_for_delivery')) then
    raise exception 'driver_unavailable'; end if;
  update public.driver_profiles set available=p_available where user_id=p_actor returning * into d;
  return to_jsonb(d);
end;
$$;
revoke all on function public.sbmj_driver_availability(uuid,boolean) from public,anon,authenticated;
grant execute on function public.sbmj_driver_availability(uuid,boolean) to service_role;

create function public.sbmj_order_action(p_actor uuid,p_order_id text,p_action text,p_payload jsonb,p_expected_version integer,p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  o public.orders; actor public.profiles; d public.driver_profiles;
  target_driver uuid; old_driver uuid; state text; available_stock boolean;
  item record; point jsonb; stroke jsonb; points_count integer:=0;
  event_id uuid:=gen_random_uuid(); money bigint; money_currency text; ref text;
begin
  select * into actor from public.profiles where id=p_actor and is_confirmed;
  if not found then raise exception 'access_denied' using errcode='42501'; end if;
  select * into o from public.orders where id=p_order_id and archived_at is null for update;
  if not found then raise exception 'order_not_found' using errcode='P0002'; end if;
  if p_action in ('adopt','record_payment','reserve_stock','assign','refund','cancel','archive') then
    if not actor.is_admin then raise exception 'access_denied' using errcode='42501'; end if;
  elsif p_action in ('accept','decline','pickup','dispatch','sign') then
    if o.assigned_driver_id is distinct from p_actor or not exists(select 1 from public.driver_profiles where user_id=p_actor and status='approved') then
      raise exception 'access_denied' using errcode='42501'; end if;
  elsif p_action in ('confirm','dispute') then
    if lower(o.email) is distinct from lower(actor.email) then raise exception 'access_denied' using errcode='42501'; end if;
  else raise exception 'invalid_action' using errcode='22023'; end if;
  if p_request_id is null then raise exception 'request_id_required' using errcode='22023'; end if;
  if exists(select 1 from public.order_events where actor_id=p_actor and request_id=p_request_id) then
    if exists(select 1 from public.order_events where actor_id=p_actor and request_id=p_request_id and order_id=p_order_id
      and kind=p_action and details->>'requestDigest'=md5(p_payload::text)) then return to_jsonb(o); end if;
    raise exception 'request_conflict' using errcode='23505';
  end if;
  if p_expected_version is distinct from o.workflow_version then raise exception 'version_conflict' using errcode='40001'; end if;
  state:=o.fulfilment_status;
  old_driver:=o.assigned_driver_id;

  if p_action='adopt' then
    if state<>'legacy' or o.status<>'pending' or o.payment_status not in ('pending','unknown')
      or length(trim(coalesce(p_payload->>'note','')))<8 then raise exception 'invalid_transition'; end if;
    state:='awaiting_payment';
  elsif state='legacy' and p_action<>'archive' then raise exception 'invalid_transition';
  end if;

  if p_action='record_payment' then
    if o.payment_status not in ('pending','unknown') or state<>'awaiting_payment' then raise exception 'invalid_transition'; end if;
    money_currency:=case when o.currency='CFA' then 'XOF' else o.currency end;
    money:=round(o.total_price * case when money_currency='XOF' then 1 else 100 end);
    ref:=trim(coalesce(p_payload->>'reference',''));
    if money<=0 or money is distinct from (p_payload->>'amountMinor')::bigint or money_currency is distinct from p_payload->>'currency'
      or length(ref) not between 3 and 120 or coalesce(p_payload->>'method','') not in ('cash','mobile_money','bank','other') then raise exception 'invalid_payment' using errcode='22023'; end if;
    insert into public.payment_events(order_id,actor_id,kind,amount_minor,currency,method,reference)
    values(o.id,p_actor,'payment',money,money_currency,p_payload->>'method',ref);
    o.payment_status:='paid';
  end if;

  if p_action in ('record_payment','reserve_stock') then
    if o.payment_status<>'paid' or (p_action='reserve_stock' and state<>'stock_issue') then raise exception 'invalid_transition'; end if;
    if not o.stock_reserved then
      if jsonb_typeof(o.items)<>'array' or jsonb_array_length(o.items)=0 then raise exception 'invalid_order'; end if;
      perform id from public.products where id in (select x->>'productId' from jsonb_array_elements(o.items) x) order by id for update;
      available_stock:=true;
      for item in select x->>'productId' as product_id,sum((x->>'quantity')::integer) as quantity from jsonb_array_elements(o.items) x group by x->>'productId' loop
        if item.quantity<1 or item.quantity>2970 then raise exception 'invalid_order'; end if;
        if not exists(select 1 from public.products where id=item.product_id and stock>=item.quantity) then available_stock:=false; end if;
      end loop;
      if available_stock then
        for item in select x->>'productId' as product_id,sum((x->>'quantity')::integer) as quantity from jsonb_array_elements(o.items) x group by x->>'productId' loop
          update public.products set stock=stock-item.quantity where id=item.product_id;
        end loop;
        o.stock_reserved:=true;
      end if;
    end if;
    state:=case when o.stock_reserved then 'preparing' else 'stock_issue' end;
  elsif p_action='assign' then
    if o.payment_status<>'paid' then raise exception 'payment_required'; end if;
    if not o.stock_reserved then raise exception 'stock_required'; end if;
    if state<>'preparing' then raise exception 'invalid_transition'; end if;
    target_driver:=(p_payload->>'driverId')::uuid;
    select * into d from public.driver_profiles where user_id=target_driver for update;
    if not found or d.status<>'approved' or not d.available then raise exception 'driver_unavailable'; end if;
    if exists(select 1 from public.orders where assigned_driver_id=target_driver and fulfilment_status in ('assigned','accepted','collected','out_for_delivery')) then raise exception 'driver_unavailable'; end if;
    o.assigned_driver_id:=target_driver;
    update public.driver_profiles set available=false where user_id=target_driver;
    state:='assigned';
  elsif p_action='accept' then
    if state<>'assigned' then raise exception 'invalid_transition'; end if; state:='accepted';
  elsif p_action='decline' then
    if state not in ('assigned','accepted') or length(trim(coalesce(p_payload->>'note','')))<3 then raise exception 'invalid_transition'; end if;
    state:='preparing'; o.assigned_driver_id:=null;
  elsif p_action='pickup' then
    if state<>'accepted' then raise exception 'invalid_transition'; end if; state:='collected';
  elsif p_action='dispatch' then
    if state<>'collected' then raise exception 'invalid_transition'; end if; state:='out_for_delivery'; o.status:='shipped';
  elsif p_action='sign' then
    if state<>'out_for_delivery' then raise exception 'invalid_transition'; end if;
    if p_payload->>'contractVersion' is distinct from 'receipt-v1' or p_payload->>'consent' is distinct from 'true'
      or coalesce(p_payload->>'firstName','') !~ '^[[:alpha:] ''-]{2,80}$' or coalesce(p_payload->>'condition','') not in ('good','issue') then raise exception 'invalid_receipt'; end if;
    if jsonb_typeof(p_payload->'signature'->'strokes') is distinct from 'array'
      or jsonb_array_length(p_payload->'signature'->'strokes') not between 1 and 64 then raise exception 'invalid_signature'; end if;
    for stroke in select value from jsonb_array_elements(p_payload->'signature'->'strokes') loop
      if jsonb_typeof(stroke->'points') is distinct from 'array' then raise exception 'invalid_signature'; end if;
      for point in select value from jsonb_array_elements(stroke->'points') loop
        points_count:=points_count+1;
        if jsonb_typeof(point->'x') is distinct from 'number' or jsonb_typeof(point->'y') is distinct from 'number' then raise exception 'invalid_signature'; end if;
        if (point->>'x')::numeric not between 0 and 1 or (point->>'y')::numeric not between 0 and 1 or points_count>3000 then raise exception 'invalid_signature'; end if;
      end loop;
    end loop;
    if points_count<3 then raise exception 'invalid_signature'; end if;
    insert into public.order_delivery_proofs(order_id,driver_id,first_name,contract_version,condition,note,signature)
    values(o.id,p_actor,trim(p_payload->>'firstName'),'receipt-v1',p_payload->>'condition',left(coalesce(p_payload->>'note',''),1000),p_payload->'signature');
    state:='signed'; o.status:='delivered';
  elsif p_action in ('confirm','dispute') then
    if state<>'signed' then raise exception 'invalid_transition'; end if;
    if p_action='dispute' and length(trim(coalesce(p_payload->>'note','')))<8 then raise exception 'note_required'; end if;
    state:=case when p_action='confirm' then 'completed' else 'disputed' end;
    if p_action='confirm' and p_payload->>'rating' is not null then o.recipient_rating:=(p_payload->>'rating')::integer; end if;
  elsif p_action='refund' then
    if o.payment_status<>'paid' then raise exception 'invalid_transition'; end if;
    select amount_minor,currency into money,money_currency from public.payment_events where order_id=o.id and kind='payment';
    ref:=trim(coalesce(p_payload->>'reference',''));
    if money is null or length(ref) not between 3 and 120 or coalesce(p_payload->>'method','') not in ('cash','mobile_money','bank','other') then raise exception 'invalid_payment'; end if;
    insert into public.payment_events(order_id,actor_id,kind,amount_minor,currency,method,reference)
    values(o.id,p_actor,'refund',money,money_currency,p_payload->>'method',ref);
    if o.stock_reserved and (state in ('preparing','assigned','accepted') or p_payload->>'goodsReturned'='true') then
      for item in select x->>'productId' as product_id,sum((x->>'quantity')::integer) as quantity from jsonb_array_elements(o.items) x group by x->>'productId' loop
        update public.products set stock=stock+item.quantity where id=item.product_id;
      end loop;
      o.stock_reserved:=false;
    end if;
    o.payment_status:='refunded'; state:='refunded'; o.status:='cancelled';
  elsif p_action='cancel' then
    if o.payment_status not in ('pending','unknown') or state<>'awaiting_payment' then raise exception 'invalid_transition'; end if;
    state:='cancelled'; o.status:='cancelled';
  elsif p_action='archive' then
    if state not in ('completed','cancelled','refunded','legacy') then raise exception 'invalid_transition'; end if;
    o.archived_at:=now();
  end if;

  update public.orders set fulfilment_status=state,assigned_driver_id=o.assigned_driver_id,
    workflow_version=o.workflow_version+1,stock_reserved=o.stock_reserved,payment_status=o.payment_status,
    status=o.status,archived_at=o.archived_at,recipient_rating=o.recipient_rating
    where id=o.id returning * into o;
  if old_driver is not null and (p_action='decline' or state in ('signed','refunded','cancelled')) then
    update public.driver_profiles set available=(status='approved') where user_id=old_driver;
  end if;
  insert into public.order_events(id,order_id,actor_id,kind,request_id,details)
    values(event_id,o.id,p_actor,p_action,p_request_id,jsonb_build_object('state',state,'note',left(coalesce(p_payload->>'note',''),1000),'driverId',o.assigned_driver_id,'requestDigest',md5(p_payload::text)));
  insert into public.notifications(user_id,order_id,kind,event_key)
    select id,o.id,case when p_action='sign' then 'signed' when p_action='dispute' then 'disputed' when p_action='confirm' then 'completed' else p_action end,event_id::text
    from public.profiles where is_confirmed and (is_admin or lower(email)=lower(o.email) or id=o.assigned_driver_id)
    on conflict(user_id,event_key) do nothing;
  return to_jsonb(o);
end;
$$;
revoke all on function public.sbmj_order_action(uuid,text,text,jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.sbmj_order_action(uuid,text,text,jsonb,integer,uuid) to service_role;
