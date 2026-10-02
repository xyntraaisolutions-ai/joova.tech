create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  order_id text not null unique references public.orders (id),
  email text not null,
  discount_amount numeric(10, 2) not null default 0,
  redeemed_at timestamptz not null default now()
);

create index if not exists promo_redemptions_code_idx on public.promo_redemptions (code, redeemed_at desc);

alter table public.promo_redemptions enable row level security;

drop policy if exists promo_codes_staff on public.promo_codes;
create policy promo_codes_staff on public.promo_codes
  for all to authenticated
  using (public.app_role() in ('csr', 'super_admin'))
  with check (public.app_role() in ('csr', 'super_admin'));

drop policy if exists promo_redemptions_staff on public.promo_redemptions;
create policy promo_redemptions_staff on public.promo_redemptions
  for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

grant select, insert, update, delete on public.promo_codes to authenticated;
grant select on public.promo_redemptions to authenticated;

insert into public.promo_redemptions (code, order_id, email, discount_amount, redeemed_at)
select promo_code, id, email, coalesce(discount_amount, 0), created_at
from public.orders
where promo_code is not null
  and payment_status = 'paid'
on conflict (order_id) do nothing;

update public.promo_codes
set enabled = false
where max_uses is not null
  and used_count >= max_uses
  and enabled;

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
    set used_count = used_count + 1,
        enabled = case
          when max_uses is not null and used_count + 1 >= max_uses then false
          else enabled
        end
    where code = v_order.promo_code;
    insert into public.promo_redemptions (code, order_id, email, discount_amount)
    values (v_order.promo_code, v_order.id, v_order.email, coalesce(v_order.discount_amount, 0))
    on conflict (order_id) do nothing;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'quantity', quantity,
    'price', price,
    'color', color,
    'selection', selection,
    'coverage', coverage
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
