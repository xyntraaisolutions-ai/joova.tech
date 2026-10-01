-- Stock counters, public availability, and a row-level audit of platform changes.

alter table public.audit_log add column if not exists reason text;
alter table public.audit_log add column if not exists before jsonb;
alter table public.audit_log add column if not exists after jsonb;

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

create table if not exists public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id),
  batch_date date not null default current_date,
  reference text not null default '',
  quantity integer not null check (quantity > 0),
  note text not null default '',
  created_by uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.inventory_count_offsets (
  product_id text not null references public.products (id),
  metric text not null,
  amount integer not null default 0,
  primary key (product_id, metric),
  check (metric in ('lifetime', 'orders_received', 'shipping', 'delivery', 'delivered', 'returns', 'warranty_sent'))
);

create table if not exists public.inventory_count_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id),
  metric text not null,
  previous_value integer not null,
  next_value integer not null,
  reason text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.inventory_batches enable row level security;
alter table public.inventory_count_offsets enable row level security;
alter table public.inventory_count_adjustments enable row level security;

drop policy if exists inventory_batches_staff on public.inventory_batches;
create policy inventory_batches_staff on public.inventory_batches for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists inventory_offsets_staff on public.inventory_count_offsets;
create policy inventory_offsets_staff on public.inventory_count_offsets for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists inventory_adjustments_staff on public.inventory_count_adjustments;
create policy inventory_adjustments_staff on public.inventory_count_adjustments for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_id text := coalesce(v_row->>'id', nullif(concat_ws(':', v_row->>'page', v_row->>'key'), ''), v_row->>'product_id', '');
begin
  if tg_op = 'UPDATE' and v_old = v_new then
    return new;
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, reason, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    nullif(v_id, ''),
    nullif(current_setting('joova.audit_reason', true), ''),
    v_old,
    v_new
  );
  return coalesce(new, old);
end;
$$;

create or replace function public.public_stock()
returns table (product_id text, availability text, available integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    case
      when coalesce(p.commerce->>'availability', 'in_stock') = 'out_of_stock' then 'out_of_stock'
      else 'in_stock'
    end,
    case
      when coalesce(p.commerce->>'showAvailable', 'false') = 'true'
        and coalesce(p.commerce->>'availability', 'in_stock') <> 'out_of_stock'
      then greatest(0, coalesce(i.on_hand, 0) - coalesce(i.reserved, 0))
      else null
    end
  from public.products p
  left join public.inventory i
    on i.product_id = p.id
    and i.variant_id is null
    and i.warehouse = 'US'
    and i.deleted_at is null
  where p.published
    and p.deleted_at is null
$$;

create or replace function public.inventory_counter()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_products jsonb;
  v_batches jsonb;
  v_adjustments jsonb;
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Inventory access is required.');
  end if;

  with ship as (
    select distinct on (s.order_id) s.order_id, s.status
    from public.shipments s
    order by s.order_id, s.shipped_at desc nulls last, s.id
  ),
  buckets as (
    select
      oi.product_id,
      sum(oi.quantity) filter (
        where coalesce(ship.status, o.status, 'preparing') not in ('shipped', 'out_for_delivery', 'delivered')
      ) as orders_received,
      sum(oi.quantity) filter (
        where coalesce(ship.status, o.status) = 'shipped'
      ) as shipping,
      sum(oi.quantity) filter (
        where coalesce(ship.status, o.status) = 'out_for_delivery'
      ) as delivery,
      sum(oi.quantity) filter (
        where coalesce(ship.status, o.status) = 'delivered'
      ) as delivered
    from public.order_items oi
    join public.orders o on o.id = oi.order_id and o.deleted_at is null
    left join ship on ship.order_id = o.id
    group by oi.product_id
  ),
  received as (
    select product_id, coalesce(sum(quantity), 0) as lifetime
    from public.inventory_batches
    where deleted_at is null
    group by product_id
  ),
  returned as (
    select oi.product_id, coalesce(sum(oi.quantity), 0) as returns
    from public.returns r
    join public.orders o on o.id = r.order_id and o.deleted_at is null
    join public.order_items oi on oi.order_id = o.id
    where r.deleted_at is null
      and r.status in ('approved', 'received', 'refunded')
    group by oi.product_id
  ),
  warranty as (
    select p.id as product_id, count(c.id)::integer as warranty_sent
    from public.products p
    join public.warranty_claims c
      on c.deleted_at is null
      and c.status = 'replaced'
      and (
        c.product_id = p.id
        or exists (
          select 1 from public.order_items oi
          where oi.order_id = c.order_id and oi.product_id = p.id
        )
      )
    group by p.id
  )
  select coalesce(jsonb_agg(row_to_json(counted) order by counted.name), '[]'::jsonb)
  into v_products
  from (
    select
      p.id,
      p.name,
      p.sku,
      p.deleted_at,
      coalesce(received.lifetime, 0) + coalesce(life.amount, 0) as lifetime,
      coalesce(i.on_hand, 0) as on_hand,
      coalesce(buckets.orders_received, 0) + coalesce(recv.amount, 0) as orders_received,
      coalesce(buckets.shipping, 0) + coalesce(ship_off.amount, 0) as shipping,
      coalesce(buckets.delivery, 0) + coalesce(del_off.amount, 0) as delivery,
      coalesce(buckets.delivered, 0) + coalesce(done_off.amount, 0) as delivered,
      greatest(0, coalesce(i.on_hand, 0) - coalesce(i.reserved, 0)) as available,
      coalesce(returned.returns, 0) + coalesce(ret_off.amount, 0) as returns,
      coalesce(warranty.warranty_sent, 0) + coalesce(war_off.amount, 0) as warranty_sent
    from public.products p
    left join public.inventory i
      on i.product_id = p.id and i.variant_id is null and i.warehouse = 'US' and i.deleted_at is null
    left join received on received.product_id = p.id
    left join buckets on buckets.product_id = p.id
    left join returned on returned.product_id = p.id
    left join warranty on warranty.product_id = p.id
    left join public.inventory_count_offsets life on life.product_id = p.id and life.metric = 'lifetime'
    left join public.inventory_count_offsets recv on recv.product_id = p.id and recv.metric = 'orders_received'
    left join public.inventory_count_offsets ship_off on ship_off.product_id = p.id and ship_off.metric = 'shipping'
    left join public.inventory_count_offsets del_off on del_off.product_id = p.id and del_off.metric = 'delivery'
    left join public.inventory_count_offsets done_off on done_off.product_id = p.id and done_off.metric = 'delivered'
    left join public.inventory_count_offsets ret_off on ret_off.product_id = p.id and ret_off.metric = 'returns'
    left join public.inventory_count_offsets war_off on war_off.product_id = p.id and war_off.metric = 'warranty_sent'
    where p.deleted_at is null
  ) counted;

  select coalesce(jsonb_agg(row_to_json(batch) order by batch.batch_date desc, batch.created_at desc), '[]'::jsonb)
  into v_batches
  from (
    select id, product_id, batch_date, reference, quantity, note, created_at
    from public.inventory_batches
    where deleted_at is null
  ) batch;

  select coalesce(jsonb_agg(row_to_json(change) order by change.created_at desc), '[]'::jsonb)
  into v_adjustments
  from (
    select a.id, a.product_id, a.metric, a.previous_value, a.next_value, a.reason, a.created_at, pr.name as actor
    from public.inventory_count_adjustments a
    left join public.profiles pr on pr.id = a.created_by
    order by a.created_at desc
    limit 80
  ) change;

  return jsonb_build_object('ok', true, 'products', v_products, 'batches', v_batches, 'adjustments', v_adjustments);
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

  if p_metric = 'on_hand' then
    v_current := v_on;
    if p_next < v_reserved then
      return jsonb_build_object('ok', false, 'error', 'Current stock cannot be lower than the units already held for orders.');
    end if;
  elsif p_metric = 'available' then
    v_current := greatest(0, v_on - v_reserved);
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

  insert into public.inventory_count_adjustments (product_id, metric, previous_value, next_value, reason, created_by)
  values (p_product_id, p_metric, coalesce(v_current, 0), p_next, v_reason, auth.uid());
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.place_order(p_email text, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id text := 'JO-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_price numeric;
  v_subtotal numeric := 0;
  v_updated integer;
  v_left integer;
begin
  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Sign in, register, or continue as a guest with your email.');
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    return jsonb_build_object('ok', false, 'error', 'The cart could not be checked out.');
  end if;

  insert into public.orders (id, user_id, email, guest, status, payment_status, subtotal)
  values (v_id, v_user, v_email, v_user is null, 'pending_payment', 'unpaid', 0);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_quantity';
    end if;
    select * into v_product from public.products
    where id = v_item->>'productId' and published and deleted_at is null;
    if not found then
      raise exception 'unknown_product';
    end if;
    if coalesce(v_product.commerce->>'availability', 'in_stock') = 'out_of_stock' then
      raise exception 'not_enough_stock';
    end if;
    v_price := case
      when v_product.on_sale and v_product.sale_price is not null and v_product.sale_price > 0
        then v_product.sale_price
      else v_product.price
    end;
    update public.inventory
      set reserved = reserved + v_qty
      where product_id = v_product.id
        and variant_id is null
        and warehouse = 'US'
        and deleted_at is null
        and on_hand - reserved >= v_qty;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'not_enough_stock';
    end if;
    select on_hand - reserved into v_left
    from public.inventory
    where product_id = v_product.id and variant_id is null and warehouse = 'US' and deleted_at is null;
    if coalesce(v_left, 0) <= 0 then
      update public.products
        set commerce = jsonb_set(coalesce(commerce, '{}'::jsonb), '{availability}', '"out_of_stock"')
        where id = v_product.id;
    end if;
    insert into public.order_items (order_id, product_id, name, price, quantity, color)
    values (v_id, v_product.id, v_product.name, v_price, v_qty, nullif(v_item->>'color', ''));
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  update public.orders set subtotal = round(v_subtotal, 2) where id = v_id;
  return jsonb_build_object('ok', true, 'orderId', v_id, 'subtotal', round(v_subtotal, 2));
exception
  when others then
    return jsonb_build_object('ok', false, 'error', case sqlerrm
      when 'not_enough_stock' then 'That quantity is not available right now.'
      when 'unknown_product' then 'The cart could not be checked out.'
      else 'The cart could not be checked out.'
    end);
end;
$$;

create or replace function public.support_set_shipment(
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
  v_status text := lower(trim(coalesce(p_status, 'preparing')));
  v_id uuid;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_status not in ('preparing', 'shipped', 'out_for_delivery', 'delivered') then
    return jsonb_build_object('ok', false, 'error', 'Choose a shipment status.');
  end if;
  if not exists (select 1 from public.orders where id = v_order) then
    return jsonb_build_object('ok', false, 'error', 'That order was not found.');
  end if;
  select id into v_id from public.shipments where order_id = v_order order by shipped_at desc nulls last limit 1;
  if v_id is null then
    insert into public.shipments (order_id, carrier, tracking_number, status, shipped_at, delivered_at)
    values (
      v_order,
      nullif(trim(coalesce(p_carrier, '')), ''),
      nullif(trim(coalesce(p_tracking, '')), ''),
      v_status,
      case when v_status in ('shipped', 'out_for_delivery', 'delivered') then now() else null end,
      case when v_status = 'delivered' then now() else null end
    );
  else
    update public.shipments set
      carrier = nullif(trim(coalesce(p_carrier, '')), ''),
      tracking_number = nullif(trim(coalesce(p_tracking, '')), ''),
      status = v_status,
      shipped_at = case when v_status in ('shipped', 'out_for_delivery', 'delivered') then coalesce(shipped_at, now()) else shipped_at end,
      delivered_at = case when v_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
    where id = v_id;
  end if;
  update public.orders set status = v_status where id = v_order;
  perform public.record_audit('set_shipment', 'orders', v_order, jsonb_build_object('status', v_status), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

insert into public.inventory_batches (product_id, batch_date, reference, quantity, note)
select i.product_id, current_date, 'Opening', i.on_hand, 'Count already on the stock record.'
from public.inventory i
where i.variant_id is null
  and i.warehouse = 'US'
  and i.deleted_at is null
  and i.on_hand > 0
  and not exists (
    select 1 from public.inventory_batches b
    where b.product_id = i.product_id and b.deleted_at is null
  );

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'categories', 'products', 'product_images', 'product_variants', 'product_blocks',
    'deals', 'featured_products', 'blog_posts', 'blog_sections', 'videos', 'help_articles',
    'social_links', 'payment_methods', 'support_links', 'support_channels', 'page_copy',
    'reviews', 'inventory', 'contact_messages', 'orders', 'order_items', 'shipments',
    'returns', 'warranty_claims', 'warranty_registrations', 'profiles', 'site_settings',
    'policies', 'nav_items', 'store_links', 'inventory_batches', 'inventory_count_offsets',
    'inventory_count_adjustments'
  ]
  loop
    execute format('drop trigger if exists audit_change on public.%I', v_table);
    execute format(
      'create trigger audit_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      v_table
    );
  end loop;
end $$;

grant select, insert, update, delete on public.inventory_batches, public.inventory_count_offsets, public.inventory_count_adjustments to authenticated;

revoke all on function public.public_stock() from public;
grant execute on function public.public_stock() to anon, authenticated;

revoke all on function public.inventory_counter() from public;
revoke all on function public.add_inventory_batch(text, date, text, integer, text) from public;
revoke all on function public.adjust_inventory_count(text, text, integer, text) from public;
grant execute on function public.inventory_counter() to authenticated;
grant execute on function public.add_inventory_batch(text, date, text, integer, text) to authenticated;
grant execute on function public.adjust_inventory_count(text, text, integer, text) to authenticated;
