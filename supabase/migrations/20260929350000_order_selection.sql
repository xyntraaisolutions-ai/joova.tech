-- Remember the color, type, size, custom name, and product SKU on each ordered line.

alter table public.order_items
  add column if not exists selection jsonb not null default '{}'::jsonb;

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
  v_selection jsonb;
  v_axis text;
  v_wanted text;
  v_has boolean;
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
    v_selection := coalesce(v_item->'selection', '{}'::jsonb);
    if coalesce(v_selection->>'color', '') = '' and coalesce(v_item->>'color', '') <> '' then
      v_selection := v_selection || jsonb_build_object('color', v_item->>'color');
    end if;
    v_selection := v_selection || jsonb_build_object('sku', coalesce(v_product.sku, ''));
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

  update public.orders set subtotal = round(v_subtotal, 2) where id = v_id;
  return jsonb_build_object('ok', true, 'orderId', v_id, 'subtotal', round(v_subtotal, 2));
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
