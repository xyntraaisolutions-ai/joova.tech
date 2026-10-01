-- Country sales tax. United States rates come from the latest Avalara ZIP table.

alter table public.orders add column if not exists tax_percent numeric(9, 4);
alter table public.orders add column if not exists tax_amount numeric(10, 2) not null default 0;

create table if not exists public.country_tax_rates (
  country_code text primary key references public.sell_countries (code),
  rate_percent numeric(7, 4) not null check (rate_percent >= 0 and rate_percent <= 100),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  uploaded_at timestamptz not null default now(),
  row_count integer not null,
  state_codes text not null default ''
);

create table if not exists public.us_zip_tax_rates (
  zip text primary key check (zip ~ '^[0-9]{5}$'),
  state text not null check (state ~ '^[A-Z]{2}$'),
  region_name text not null default '',
  combined_rate numeric(14, 8) not null check (combined_rate >= 0 and combined_rate <= 0.3),
  state_rate numeric(14, 8),
  county_rate numeric(14, 8),
  city_rate numeric(14, 8),
  special_rate numeric(14, 8),
  risk_level integer,
  updated_at timestamptz not null default now()
);

alter table public.country_tax_rates enable row level security;
alter table public.tax_imports enable row level security;
alter table public.us_zip_tax_rates enable row level security;

drop policy if exists country_tax_rates_read on public.country_tax_rates;
create policy country_tax_rates_read on public.country_tax_rates
  for select to anon, authenticated
  using (true);

drop policy if exists country_tax_rates_write on public.country_tax_rates;
create policy country_tax_rates_write on public.country_tax_rates
  for all to authenticated
  using (public.app_role() = 'super_admin')
  with check (public.app_role() = 'super_admin');

drop policy if exists tax_imports_read on public.tax_imports;
create policy tax_imports_read on public.tax_imports
  for select to authenticated
  using (public.app_role() = 'super_admin');

drop policy if exists us_zip_tax_rates_read on public.us_zip_tax_rates;
create policy us_zip_tax_rates_read on public.us_zip_tax_rates
  for select to anon, authenticated
  using (true);

grant select on public.country_tax_rates to anon, authenticated;
grant insert, update, delete on public.country_tax_rates to authenticated;
grant select on public.tax_imports to authenticated;
grant select on public.us_zip_tax_rates to anon, authenticated;

create or replace function public.mark_order_paid(p_session text, p_payment text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object('ok', false, 'error', 'Not allowed.');
  end if;
  select * into v_order from public.orders where checkout_session_id = trim(coalesce(p_session, '')) for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That order was not found.');
  end if;
  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'orderId', v_order.id);
  end if;
  if v_order.status = 'cancelled' or not v_order.stock_held then
    return jsonb_build_object('ok', false, 'error', 'That checkout is no longer open.');
  end if;
  update public.orders
  set payment_status = 'paid',
      payment_provider = 'stripe',
      payment_reference = nullif(trim(coalesce(p_payment, '')), '')
  where id = v_order.id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'quantity', quantity,
    'price', price,
    'color', color,
    'selection', selection
  ) order by name), '[]'::jsonb)
  into v_items
  from public.order_items
  where order_id = v_order.id;
  return jsonb_build_object(
    'ok', true,
    'already', false,
    'orderId', v_order.id,
    'email', v_order.email,
    'subtotal', v_order.subtotal,
    'taxPercent', v_order.tax_percent,
    'taxAmount', v_order.tax_amount,
    'shipping', v_order.shipping,
    'items', v_items
  );
end;
$$;
