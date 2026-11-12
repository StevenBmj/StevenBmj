alter table public.orders add column if not exists pricing_snapshot jsonb;
alter table public.orders add column if not exists invoice_token uuid not null default gen_random_uuid();
alter table public.orders add column if not exists payment_status text not null default 'unknown'
  check (payment_status in ('unknown', 'pending', 'paid', 'refunded'));
alter table public.orders alter column payment_status set default 'pending';
create unique index if not exists orders_invoice_token_unique on public.orders(invoice_token);
comment on column public.orders.pricing_snapshot is 'Server-calculated monetary units and seller details at order creation; never recalculated from the current catalogue.';
