alter table public.returns add column if not exists stripe_refund_id text;
alter table public.returns add column if not exists stock_restored boolean not null default false;
alter table public.returns add column if not exists refunded_at timestamptz;

alter table public.contact_messages add column if not exists product_id text;
alter table public.contact_messages add column if not exists notified_at timestamptz;

alter table public.orders add column if not exists review_requested_at timestamptz;

alter table public.reviews add column if not exists order_id text references public.orders (id);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  line1 text not null,
  line2 text not null default '',
  city text not null,
  region text not null,
  postal text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.customer_addresses enable row level security;

drop policy if exists customer_addresses_own on public.customer_addresses;
create policy customer_addresses_own on public.customer_addresses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.customer_addresses to authenticated;

create or replace function public.support_set_return(p_id uuid, p_status text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_status = 'refunded' then
    return jsonb_build_object('ok', false, 'error', 'Refunds are completed from the payment.');
  end if;
  if v_status not in ('requested', 'approved', 'received', 'closed') then
    return jsonb_build_object('ok', false, 'error', 'Choose a return status.');
  end if;
  update public.returns set status = v_status where id = p_id and deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  perform public.record_audit('set_return', 'returns', p_id::text, jsonb_build_object('status', v_status), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_complete_refund(p_id uuid, p_refund text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order text;
  v_committed timestamptz;
  v_restored boolean;
  v_existing text;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if nullif(trim(coalesce(p_refund, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'A Stripe refund is required.');
  end if;
  select order_id, stock_restored, stripe_refund_id
    into v_order, v_restored, v_existing
  from public.returns
  where id = p_id and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  if v_restored then
    update public.returns
    set status = 'refunded',
        stripe_refund_id = coalesce(stripe_refund_id, trim(p_refund)),
        refunded_at = coalesce(refunded_at, now())
    where id = p_id;
    return jsonb_build_object('ok', true, 'already', true, 'orderId', v_order);
  end if;

  select stock_committed_at into v_committed
  from public.orders
  where id = v_order
  for update;

  if v_committed is not null then
    update public.inventory stock
    set on_hand = stock.on_hand + needed.quantity
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order
      group by product_id
    ) needed
    where stock.product_id = needed.product_id
      and stock.variant_id is null
      and stock.warehouse = 'US'
      and stock.deleted_at is null;
  else
    update public.inventory stock
    set reserved = greatest(stock.reserved - needed.quantity, 0)
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order
      group by product_id
    ) needed
    where stock.product_id = needed.product_id
      and stock.variant_id is null
      and stock.warehouse = 'US'
      and stock.deleted_at is null;
    update public.orders set stock_held = false where id = v_order;
  end if;

  update public.returns
  set status = 'refunded',
      stripe_refund_id = trim(p_refund),
      stock_restored = true,
      refunded_at = coalesce(refunded_at, now())
  where id = p_id;
  perform public.record_audit(
    'refund_return',
    'returns',
    p_id::text,
    jsonb_build_object('orderId', v_order, 'refund', trim(p_refund), 'shipped', v_committed is not null),
    p_view_as
  );
  return jsonb_build_object('ok', true, 'orderId', v_order, 'already', v_existing is not null);
end;
$$;

revoke all on function public.support_complete_refund(uuid, text, text) from public;
grant execute on function public.support_complete_refund(uuid, text, text) to authenticated;

drop function if exists public.submit_stock_request(text, text, text);

create or replace function public.submit_stock_request(p_name text, p_email text, p_message text, p_product text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_name, ''))) < 1
    or position('@' in coalesce(p_email, '')) = 0
    or length(trim(coalesce(p_message, ''))) < 3
    or length(trim(coalesce(p_product, ''))) < 1 then
    return jsonb_build_object('ok', false, 'error', 'Enter your name, email, and a note.');
  end if;
  insert into public.contact_messages (name, email, message, kind, product_id)
  values (trim(p_name), lower(trim(p_email)), trim(p_message), 'customer_request', trim(p_product));
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_stock_request(text, text, text, text) from public;
grant execute on function public.submit_stock_request(text, text, text, text) to anon, authenticated;

create or replace function public.fulfill_order(
  p_order text,
  p_carrier text,
  p_tracking text,
  p_status text,
  p_view_as text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order text := upper(trim(coalesce(p_order, '')));
  v_status text := lower(trim(coalesce(p_status, '')));
  v_current text;
  v_paid text;
  v_committed timestamptz;
  v_deleted timestamptz;
  v_carrier text := nullif(trim(coalesce(p_carrier, '')), '');
  v_tracking text := nullif(trim(coalesce(p_tracking, '')), '');
  v_email text;
  v_rank integer;
  v_next integer;
  v_id uuid;
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Inventory access is required.');
  end if;
  if v_status not in ('preparing', 'shipped', 'out_for_delivery', 'delivered') then
    return jsonb_build_object('ok', false, 'error', 'Choose a fulfillment status.');
  end if;
  select status, payment_status, stock_committed_at, deleted_at, email
    into v_current, v_paid, v_committed, v_deleted, v_email
  from public.orders
  where id = v_order;
  if not found or v_deleted is not null then
    return jsonb_build_object('ok', false, 'error', 'That order was not found.');
  end if;
  if v_paid is distinct from 'paid' then
    return jsonb_build_object('ok', false, 'error', 'This order is not paid yet.');
  end if;
  if exists (
    select 1 from public.returns
    where order_id = v_order and status = 'refunded' and deleted_at is null
  ) then
    return jsonb_build_object('ok', false, 'error', 'This order was refunded.');
  end if;

  v_rank := case v_current
    when 'pending_payment' then 0
    when 'preparing' then 1
    when 'shipped' then 2
    when 'out_for_delivery' then 3
    when 'delivered' then 4
    else 0
  end;
  v_next := case v_status
    when 'preparing' then 1
    when 'shipped' then 2
    when 'out_for_delivery' then 3
    when 'delivered' then 4
    else 0
  end;
  if v_next < v_rank or v_next > v_rank + 1 then
    return jsonb_build_object('ok', false, 'error', 'Move the order to the next step.');
  end if;
  if v_status in ('shipped', 'out_for_delivery', 'delivered') and (v_carrier is null or v_tracking is null) then
    return jsonb_build_object('ok', false, 'error', 'Add a carrier and a tracking number before shipping.');
  end if;

  if v_committed is null and v_status in ('shipped', 'out_for_delivery', 'delivered') then
    if exists (
      select 1
      from (
        select product_id, sum(quantity)::integer as quantity
        from public.order_items
        where order_id = v_order
        group by product_id
      ) needed
      where not exists (
        select 1 from public.inventory stock
        where stock.product_id = needed.product_id
          and stock.variant_id is null
          and stock.warehouse = 'US'
          and stock.deleted_at is null
          and stock.on_hand >= needed.quantity
      )
    ) then
      return jsonb_build_object('ok', false, 'error', 'Not enough stock on hand to ship this order.');
    end if;

    update public.inventory stock
    set on_hand = stock.on_hand - needed.quantity,
        reserved = greatest(stock.reserved - needed.quantity, 0)
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order
      group by product_id
    ) needed
    where stock.product_id = needed.product_id
      and stock.variant_id is null
      and stock.warehouse = 'US'
      and stock.deleted_at is null;

    update public.orders set stock_held = false, stock_committed_at = now() where id = v_order;
  end if;

  select id into v_id
  from public.shipments
  where order_id = v_order
  order by shipped_at desc nulls last
  limit 1;

  if v_id is null then
    insert into public.shipments (order_id, carrier, tracking_number, status, shipped_at, delivered_at)
    values (
      v_order,
      v_carrier,
      v_tracking,
      v_status,
      case when v_status in ('shipped', 'out_for_delivery', 'delivered') then now() else null end,
      case when v_status = 'delivered' then now() else null end
    );
  else
    update public.shipments set
      carrier = v_carrier,
      tracking_number = v_tracking,
      status = v_status,
      shipped_at = case
        when v_status in ('shipped', 'out_for_delivery', 'delivered') then coalesce(shipped_at, now())
        else shipped_at
      end,
      delivered_at = case when v_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
    where id = v_id;
  end if;

  update public.orders set status = v_status where id = v_order;
  perform public.record_audit(
    'fulfill_order',
    'orders',
    v_order,
    jsonb_build_object('status', v_status, 'carrier', v_carrier, 'tracking', v_tracking),
    p_view_as
  );
  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'shipped', v_current is distinct from 'shipped' and v_status = 'shipped',
    'delivered', v_current is distinct from 'delivered' and v_status = 'delivered'
  );
end;
$$;
