alter table public.orders add column if not exists shipping_amount numeric(10, 2) not null default 0;
alter table public.orders add column if not exists shipping_code text;
alter table public.orders add column if not exists shipping_name text;
alter table public.orders add column if not exists discount_amount numeric(10, 2) not null default 0;
alter table public.orders add column if not exists promo_code text;

alter table public.orders drop constraint if exists orders_shipping_amount_check;
alter table public.orders
  add constraint orders_shipping_amount_check check (shipping_amount >= 0 and shipping_amount <= 100000);
alter table public.orders drop constraint if exists orders_discount_amount_check;
alter table public.orders
  add constraint orders_discount_amount_check check (discount_amount >= 0 and discount_amount <= 100000);

create table if not exists public.promo_codes (
  code text primary key,
  kind text not null check (kind in ('percent', 'amount')),
  amount numeric(10, 2) not null check (amount > 0 and amount <= 100000),
  starts_on date,
  ends_on date,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  enabled boolean not null default true,
  constraint promo_codes_percent check (kind <> 'percent' or amount <= 100),
  constraint promo_codes_window check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

alter table public.promo_codes enable row level security;

drop policy if exists promo_codes_staff on public.promo_codes;
create policy promo_codes_staff on public.promo_codes
  for all to authenticated
  using (public.app_role() = 'super_admin')
  with check (public.app_role() = 'super_admin');

grant select, insert, update, delete on public.promo_codes to authenticated;

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
  if v_order.promo_code is not null then
    update public.promo_codes
    set used_count = used_count + 1
    where code = v_order.promo_code;
  end if;
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
    'shippingAmount', v_order.shipping_amount,
    'shippingName', v_order.shipping_name,
    'discountAmount', v_order.discount_amount,
    'promoCode', v_order.promo_code,
    'items', v_items
  );
end;
$$;
