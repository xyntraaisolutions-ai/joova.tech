-- Warehouse fulfillment: inventory staff can read orders and move them from placed to delivered.

alter table public.orders add column if not exists stock_committed_at timestamptz;

drop policy if exists orders_staff on public.orders;
create policy orders_staff on public.orders for select to authenticated
  using (public.app_role() in ('csr', 'inventory', 'super_admin'));

drop policy if exists order_items_staff on public.order_items;
create policy order_items_staff on public.order_items for select to authenticated
  using (public.app_role() in ('csr', 'inventory', 'super_admin'));

drop policy if exists shipments_staff on public.shipments;
create policy shipments_staff on public.shipments for select to authenticated
  using (public.app_role() in ('csr', 'inventory', 'super_admin'));

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
  v_committed timestamptz;
  v_deleted timestamptz;
  v_carrier text := nullif(trim(coalesce(p_carrier, '')), '');
  v_tracking text := nullif(trim(coalesce(p_tracking, '')), '');
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
  select status, stock_committed_at, deleted_at
    into v_current, v_committed, v_deleted
  from public.orders
  where id = v_order;
  if not found or v_deleted is not null then
    return jsonb_build_object('ok', false, 'error', 'That order was not found.');
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

    update public.orders set stock_committed_at = now() where id = v_order;
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
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.fulfill_order(text, text, text, text, text) from public;
grant execute on function public.fulfill_order(text, text, text, text, text) to authenticated;
