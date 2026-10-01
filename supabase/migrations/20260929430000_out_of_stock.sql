-- Mark a product out of stock when nothing is left to sell, and put it back
-- in stock only when available rises from zero.

create or replace function public.sync_product_availability(p_product_id text, p_previous integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
begin
  select greatest(0, coalesce(on_hand, 0) - coalesce(reserved, 0))
    into v_available
  from public.inventory
  where product_id = p_product_id
    and variant_id is null
    and warehouse = 'US'
    and deleted_at is null
  limit 1;
  v_available := coalesce(v_available, 0);

  if v_available <= 0 then
    update public.products
      set commerce = jsonb_set(coalesce(commerce, '{}'::jsonb), '{availability}', '"out_of_stock"')
    where id = p_product_id
      and coalesce(commerce->>'availability', '') is distinct from 'out_of_stock';
  elsif coalesce(p_previous, 1) <= 0 then
    update public.products
      set commerce = jsonb_set(coalesce(commerce, '{}'::jsonb), '{availability}', '"in_stock"')
    where id = p_product_id
      and coalesce(commerce->>'availability', '') = 'out_of_stock';
  end if;
end;
$$;

create or replace function public.add_inventory_batch(
  p_product_id text,
  p_batch_date date,
  p_reference text,
  p_quantity integer,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_before integer;
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Inventory access is required.');
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100000 then
    return jsonb_build_object('ok', false, 'error', 'Enter a count of at least 1.');
  end if;
  if not exists (select 1 from public.products where id = p_product_id and deleted_at is null) then
    return jsonb_build_object('ok', false, 'error', 'That product was not found.');
  end if;
  select greatest(0, coalesce(on_hand, 0) - coalesce(reserved, 0))
    into v_before
  from public.inventory
  where product_id = p_product_id
    and variant_id is null
    and warehouse = 'US'
    and deleted_at is null;
  v_before := coalesce(v_before, 0);
  perform set_config('joova.audit_reason', 'Stock received', true);
  insert into public.inventory_batches (product_id, batch_date, reference, quantity, note, created_by)
  values (
    p_product_id,
    coalesce(p_batch_date, current_date),
    left(trim(coalesce(p_reference, '')), 80),
    p_quantity,
    left(trim(coalesce(p_note, '')), 200),
    auth.uid()
  )
  returning id into v_id;
  update public.inventory
    set on_hand = on_hand + p_quantity
    where product_id = p_product_id
      and variant_id is null
      and warehouse = 'US'
      and deleted_at is null;
  if not found then
    insert into public.inventory (product_id, variant_id, warehouse, on_hand, reserved)
    values (p_product_id, null, 'US', p_quantity, 0);
  end if;
  perform public.sync_product_availability(p_product_id, v_before);
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.adjust_inventory_count(
  p_product_id text,
  p_metric text,
  p_next integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := trim(coalesce(p_reason, ''));
  v_on integer;
  v_reserved integer;
  v_current integer;
  v_base integer;
  v_stock uuid;
  v_before integer;
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Inventory access is required.');
  end if;
  if p_metric not in ('lifetime', 'on_hand', 'orders_received', 'shipping', 'delivery', 'delivered', 'available', 'returns', 'warranty_sent') then
    return jsonb_build_object('ok', false, 'error', 'Choose a count to update.');
  end if;
  if p_next is null or p_next < 0 or p_next > 1000000 then
    return jsonb_build_object('ok', false, 'error', 'Enter a count of 0 or more.');
  end if;
  if char_length(v_reason) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Add a reason of at least 3 characters.');
  end if;
  if not exists (select 1 from public.products where id = p_product_id and deleted_at is null) then
    return jsonb_build_object('ok', false, 'error', 'That product was not found.');
  end if;

  select id, on_hand, reserved into v_stock, v_on, v_reserved
  from public.inventory
  where product_id = p_product_id and variant_id is null and warehouse = 'US' and deleted_at is null;
  v_on := coalesce(v_on, 0);
  v_reserved := coalesce(v_reserved, 0);
  v_before := greatest(0, v_on - v_reserved);

  if p_metric = 'on_hand' then
    v_current := v_on;
    if p_next < v_reserved then
      return jsonb_build_object('ok', false, 'error', 'Current stock cannot be lower than the units already held for orders.');
    end if;
  elsif p_metric = 'available' then
    v_current := v_before;
    if p_next > v_on then
      return jsonb_build_object('ok', false, 'error', 'Available cannot be higher than current stock.');
    end if;
  elsif p_metric = 'lifetime' then
    select coalesce(sum(quantity), 0) into v_base from public.inventory_batches where product_id = p_product_id and deleted_at is null;
    select v_base + coalesce(amount, 0) into v_current from public.inventory_count_offsets where product_id = p_product_id and metric = 'lifetime';
    v_current := coalesce(v_current, v_base);
  else
    v_base := 0;
    v_current := 0;
  end if;

  perform set_config('joova.audit_reason', v_reason, true);

  if p_metric = 'on_hand' then
    if v_stock is null then
      insert into public.inventory (product_id, variant_id, warehouse, on_hand, reserved)
      values (p_product_id, null, 'US', p_next, 0);
    else
      update public.inventory set on_hand = p_next where id = v_stock;
    end if;
  elsif p_metric = 'available' then
    if v_stock is null then
      insert into public.inventory (product_id, variant_id, warehouse, on_hand, reserved)
      values (p_product_id, null, 'US', p_next, 0);
    else
      update public.inventory set reserved = on_hand - p_next where id = v_stock;
    end if;
  else
    if p_metric <> 'lifetime' then
      select case p_metric
        when 'orders_received' then orders_received
        when 'shipping' then shipping
        when 'delivery' then delivery
        when 'delivered' then delivered
        when 'returns' then returns
        when 'warranty_sent' then warranty_sent
      end
      into v_current
      from jsonb_to_recordset(
        (public.inventory_counter() -> 'products')
      ) as counted(
        id text,
        orders_received integer,
        shipping integer,
        delivery integer,
        delivered integer,
        returns integer,
        warranty_sent integer
      )
      where id = p_product_id;
      v_current := coalesce(v_current, 0);
      v_base := v_current - coalesce((select amount from public.inventory_count_offsets where product_id = p_product_id and metric = p_metric), 0);
    else
      select coalesce(sum(quantity), 0) into v_base
      from public.inventory_batches
      where product_id = p_product_id and deleted_at is null;
    end if;
    insert into public.inventory_count_offsets (product_id, metric, amount)
    values (p_product_id, p_metric, p_next - v_base)
    on conflict (product_id, metric) do update set amount = excluded.amount;
  end if;

  if p_metric in ('on_hand', 'available') then
    perform public.sync_product_availability(p_product_id, v_before);
  end if;

  insert into public.inventory_count_adjustments (product_id, metric, previous_value, next_value, reason, created_by)
  values (p_product_id, p_metric, coalesce(v_current, 0), p_next, v_reason, auth.uid());
  return jsonb_build_object('ok', true);
end;
$$;

update public.products p
set commerce = jsonb_set(coalesce(p.commerce, '{}'::jsonb), '{availability}', '"out_of_stock"')
where p.deleted_at is null
  and coalesce(p.commerce->>'availability', 'in_stock') is distinct from 'out_of_stock'
  and coalesce((
    select greatest(0, i.on_hand - i.reserved)
    from public.inventory i
    where i.product_id = p.id
      and i.variant_id is null
      and i.warehouse = 'US'
      and i.deleted_at is null
    limit 1
  ), 0) <= 0;

revoke all on function public.sync_product_availability(text, integer) from public;
revoke all on function public.add_inventory_batch(text, date, text, integer, text) from public;
revoke all on function public.adjust_inventory_count(text, text, integer, text) from public;
grant execute on function public.add_inventory_batch(text, date, text, integer, text) to authenticated;
grant execute on function public.adjust_inventory_count(text, text, integer, text) to authenticated;
