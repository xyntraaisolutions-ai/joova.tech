-- Stripe checkout holds stock until the webhook marks the order paid or releases it.

alter table public.orders add column if not exists shipping jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists checkout_token text;
alter table public.orders add column if not exists checkout_session_id text;
alter table public.orders add column if not exists stock_held boolean not null default false;

create or replace function public.read_stripe_key()
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret text;
begin
  if auth.role() is distinct from 'service_role' then
    return null;
  end if;
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'STRIPE_SECRET_KEY'
  limit 1;
  return secret;
end;
$$;

create or replace function public.read_stripe_webhook_secret()
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret text;
begin
  if auth.role() is distinct from 'service_role' then
    return null;
  end if;
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'STRIPE_WEBHOOK_SECRET'
  limit 1;
  return secret;
end;
$$;

create or replace function public.release_held_stock(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_id for update;
  if not found or not v_order.stock_held or v_order.payment_status = 'paid' then
    return;
  end if;
  update public.inventory stock
  set reserved = greatest(stock.reserved - needed.quantity, 0)
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = v_order.id
    group by product_id
  ) needed
  where stock.product_id = needed.product_id
    and stock.variant_id is null
    and stock.warehouse = 'US'
    and stock.deleted_at is null;
  update public.products product
  set commerce = jsonb_set(coalesce(product.commerce, '{}'::jsonb), '{availability}', '"in_stock"')
  from public.inventory stock
  where stock.product_id = product.id
    and stock.variant_id is null
    and stock.warehouse = 'US'
    and stock.deleted_at is null
    and stock.on_hand - stock.reserved > 0
    and coalesce(product.commerce->>'availability', '') = 'out_of_stock';
  update public.orders
  set stock_held = false, status = 'cancelled'
  where id = v_order.id and payment_status <> 'paid';
end;
$$;

create or replace function public.begin_checkout(p_email text, p_items jsonb, p_shipping jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id text := 'JO-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  v_token text := gen_random_uuid()::text;
  v_ship jsonb := coalesce(p_shipping, '{}'::jsonb);
  v_name text := trim(coalesce(v_ship->>'name', ''));
  v_line1 text := trim(coalesce(v_ship->>'line1', ''));
  v_line2 text := trim(coalesce(v_ship->>'line2', ''));
  v_city text := trim(coalesce(v_ship->>'city', ''));
  v_region text := upper(trim(coalesce(v_ship->>'region', '')));
  v_postal text := trim(coalesce(v_ship->>'postal', ''));
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_price numeric;
  v_subtotal numeric := 0;
  v_updated integer;
  v_left integer;
  v_selection jsonb;
  v_axis text;
  v_wanted text;
  v_has boolean;
  v_sku text;
begin
  if v_user is not null then
    select lower(email) into v_email from public.profiles where id = v_user;
  end if;
  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Sign in, or continue as a guest with your email.');
  end if;
  if length(v_name) < 1 or length(v_name) > 80
    or length(v_line1) < 1 or length(v_line1) > 120
    or length(v_line2) > 120
    or length(v_city) < 1 or length(v_city) > 80 then
    return jsonb_build_object('ok', false, 'error', 'Enter the ship-to name and address.');
  end if;
  if v_region not in (
    'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'
  ) then
    return jsonb_build_object('ok', false, 'error', 'Choose a US state.');
  end if;
  if v_postal !~ '^[0-9]{5}(-[0-9]{4})?$' then
    return jsonb_build_object('ok', false, 'error', 'Enter a US ZIP code.');
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    return jsonb_build_object('ok', false, 'error', 'The cart could not be checked out.');
  end if;

  v_ship := jsonb_build_object(
    'name', v_name,
    'line1', v_line1,
    'line2', nullif(v_line2, ''),
    'city', v_city,
    'region', v_region,
    'postal', v_postal,
    'country', 'US'
  );

  insert into public.orders (id, user_id, email, guest, status, payment_status, payment_provider, subtotal, shipping, checkout_token, stock_held)
  values (v_id, v_user, v_email, v_user is null, 'pending_payment', 'unpaid', 'stripe', 0, v_ship, v_token, false);

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
    v_selection := coalesce(v_item->'selection', '{}'::jsonb);
    if coalesce(v_selection->>'color', '') = '' and coalesce(v_item->>'color', '') <> '' then
      v_selection := v_selection || jsonb_build_object('color', v_item->>'color');
    end if;
    foreach v_axis in array array['color', 'type', 'size', 'custom']
    loop
      v_wanted := btrim(coalesce(v_selection->>v_axis, ''));
      select exists (
        select 1 from public.product_variants v
        where v.product_id = v_product.id
          and v.deleted_at is null
          and coalesce(v.attrs->>'available', 'true') <> 'false'
          and (
            case
              when coalesce(v.attrs->>'axis', '') in ('color', 'type', 'size', 'custom') then v.attrs->>'axis'
              when coalesce(v.attrs->>'customName', '') <> '' then 'custom'
              when coalesce(v.attrs->>'type', '') <> '' and coalesce(v.attrs->>'color', '') = '' and coalesce(v.attrs->>'size', '') = '' then 'type'
              when coalesce(v.attrs->>'size', '') <> '' and coalesce(v.attrs->>'color', '') = '' and coalesce(v.attrs->>'type', '') = '' then 'size'
              else 'color'
            end
          ) = v_axis
      ) into v_has;
      if v_has and v_wanted = '' then
        raise exception 'unavailable_option';
      end if;
      if v_wanted <> '' and not exists (
        select 1 from public.product_variants v
        where v.product_id = v_product.id
          and v.deleted_at is null
          and coalesce(v.attrs->>'available', 'true') <> 'false'
          and lower(btrim(coalesce(nullif(v.attrs->>'name', ''), nullif(v.attrs->>v_axis, ''), nullif(v.attrs->>'customName', ''), ''))) = lower(v_wanted)
          and (
            case
              when coalesce(v.attrs->>'axis', '') in ('color', 'type', 'size', 'custom') then v.attrs->>'axis'
              when coalesce(v.attrs->>'customName', '') <> '' then 'custom'
              when coalesce(v.attrs->>'type', '') <> '' and coalesce(v.attrs->>'color', '') = '' and coalesce(v.attrs->>'size', '') = '' then 'type'
              when coalesce(v.attrs->>'size', '') <> '' and coalesce(v.attrs->>'color', '') = '' and coalesce(v.attrs->>'type', '') = '' then 'size'
              else 'color'
            end
          ) = v_axis
      ) then
        raise exception 'unavailable_option';
      end if;
    end loop;
    v_sku := null;
    select v.sku into v_sku
    from public.product_variants v
    where v.product_id = v_product.id
      and v.deleted_at is null
      and v.sku is not null
      and btrim(v.sku) <> ''
      and (
        coalesce(v_selection->>'color', '') = ''
        or lower(btrim(coalesce(nullif(v.attrs->>'finish', ''), nullif(v.attrs->>'color', ''), nullif(v.attrs->>'name', ''), ''))) = lower(btrim(v_selection->>'color'))
      )
      and (
        coalesce(v_selection->>'type', '') = ''
        or lower(btrim(coalesce(nullif(v.attrs->>'style', ''), nullif(v.attrs->>'type', ''), case when coalesce(v.attrs->>'axis', '') = 'type' then v.attrs->>'name' else '' end, ''))) = lower(btrim(v_selection->>'type'))
      )
      and (
        coalesce(v_selection->>'size', '') = ''
        or lower(btrim(coalesce(nullif(v.attrs->>'size', ''), case when coalesce(v.attrs->>'axis', '') = 'size' then v.attrs->>'name' else '' end, ''))) = lower(btrim(v_selection->>'size'))
      )
      and (
        coalesce(v_selection->>'custom', '') = ''
        or lower(btrim(coalesce(nullif(v.attrs->>'customName', ''), case when coalesce(v.attrs->>'axis', '') = 'custom' then v.attrs->>'name' else '' end, ''))) = lower(btrim(v_selection->>'custom'))
      )
      and (
        (coalesce(v_selection->>'color', '') <> '' and lower(btrim(coalesce(nullif(v.attrs->>'finish', ''), nullif(v.attrs->>'color', ''), nullif(v.attrs->>'name', ''), ''))) = lower(btrim(v_selection->>'color')))
        or (coalesce(v_selection->>'type', '') <> '' and lower(btrim(coalesce(nullif(v.attrs->>'style', ''), nullif(v.attrs->>'type', ''), case when coalesce(v.attrs->>'axis', '') = 'type' then v.attrs->>'name' else '' end, ''))) = lower(btrim(v_selection->>'type')))
        or (coalesce(v_selection->>'size', '') <> '' and lower(btrim(coalesce(nullif(v.attrs->>'size', ''), case when coalesce(v.attrs->>'axis', '') = 'size' then v.attrs->>'name' else '' end, ''))) = lower(btrim(v_selection->>'size')))
        or (coalesce(v_selection->>'custom', '') <> '' and lower(btrim(coalesce(nullif(v.attrs->>'customName', ''), case when coalesce(v.attrs->>'axis', '') = 'custom' then v.attrs->>'name' else '' end, ''))) = lower(btrim(v_selection->>'custom')))
      )
    order by v.sort
    limit 1;
    v_selection := v_selection || jsonb_build_object('sku', coalesce(nullif(btrim(v_sku), ''), v_product.sku, ''));
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
    insert into public.order_items (order_id, product_id, name, price, quantity, color, selection)
    values (v_id, v_product.id, v_product.name, v_price, v_qty, nullif(v_selection->>'color', ''), v_selection);
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  update public.orders
  set subtotal = round(v_subtotal, 2), stock_held = true
  where id = v_id;
  return jsonb_build_object('ok', true, 'orderId', v_id, 'token', v_token, 'subtotal', round(v_subtotal, 2));
exception
  when others then
    return jsonb_build_object('ok', false, 'error', case sqlerrm
      when 'not_enough_stock' then 'That quantity is not available right now.'
      when 'unknown_product' then 'The cart could not be checked out.'
      when 'unavailable_option' then 'That choice is not available.'
      else 'The cart could not be checked out.'
    end);
end;
$$;

create or replace function public.attach_checkout_session(p_order text, p_token text, p_session text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object('ok', false, 'error', 'Not allowed.');
  end if;
  update public.orders
  set checkout_session_id = trim(p_session), payment_provider = 'stripe'
  where id = upper(trim(p_order))
    and checkout_token = trim(p_token)
    and payment_status <> 'paid'
    and status = 'pending_payment';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That checkout could not be started.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.release_checkout(p_order text, p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  select id into v_id
  from public.orders
  where id = upper(trim(coalesce(p_order, '')))
    and checkout_token = trim(coalesce(p_token, ''));
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That checkout could not be found.');
  end if;
  perform public.release_held_stock(v_id);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.release_checkout_session(p_session text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object('ok', false, 'error', 'Not allowed.');
  end if;
  select id into v_id from public.orders where checkout_session_id = trim(coalesce(p_session, ''));
  if not found then
    return jsonb_build_object('ok', true);
  end if;
  perform public.release_held_stock(v_id);
  return jsonb_build_object('ok', true);
end;
$$;

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
    'shipping', v_order.shipping,
    'items', v_items
  );
end;
$$;

create or replace function public.checkout_status(p_session text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where checkout_session_id = trim(coalesce(p_session, ''));
  if not found then
    return jsonb_build_object('found', false);
  end if;
  return jsonb_build_object(
    'found', true,
    'orderId', v_order.id,
    'paymentStatus', v_order.payment_status,
    'email', v_order.email
  );
end;
$$;

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
  return jsonb_build_object('ok', true, 'email', v_email, 'shipped', v_current is distinct from 'shipped' and v_status = 'shipped');
end;
$$;

revoke all on function public.read_stripe_key() from public, anon, authenticated;
revoke all on function public.read_stripe_webhook_secret() from public, anon, authenticated;
revoke all on function public.release_held_stock(text) from public, anon, authenticated;
revoke all on function public.begin_checkout(text, jsonb, jsonb) from public;
revoke all on function public.attach_checkout_session(text, text, text) from public, anon, authenticated;
revoke all on function public.release_checkout(text, text) from public;
revoke all on function public.release_checkout_session(text) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;
revoke all on function public.checkout_status(text) from public;

grant execute on function public.read_stripe_key() to service_role;
grant execute on function public.read_stripe_webhook_secret() to service_role;
grant execute on function public.release_held_stock(text) to service_role;
grant execute on function public.begin_checkout(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.attach_checkout_session(text, text, text) to service_role;
grant execute on function public.release_checkout(text, text) to anon, authenticated;
grant execute on function public.release_checkout_session(text) to service_role;
grant execute on function public.mark_order_paid(text, text) to service_role;
grant execute on function public.checkout_status(text) to anon, authenticated;
