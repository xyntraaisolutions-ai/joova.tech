-- After Fulfillment marks a return received, Support creates the exchange order or the refund.
-- Warranty replacements use the same replacement-order path.

alter table public.orders add column if not exists order_kind text not null default 'sale';
alter table public.orders drop constraint if exists orders_order_kind_check;
alter table public.orders add constraint orders_order_kind_check check (order_kind in ('sale', 'exchange', 'warranty'));
alter table public.orders add column if not exists source_return_id uuid references public.returns (id);
alter table public.orders add column if not exists source_claim_id uuid references public.warranty_claims (id);

alter table public.returns add column if not exists replacement_order_id text references public.orders (id);
alter table public.returns add column if not exists refund_receipt_path text not null default '';
alter table public.returns add column if not exists refund_invoice_path text not null default '';

alter table public.warranty_claims add column if not exists replacement_order_id text references public.orders (id);

insert into storage.buckets (id, name, public)
values ('return-files', 'return-files', false)
on conflict (id) do nothing;

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
  v_status text;
  v_resolution text;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if nullif(trim(coalesce(p_refund, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'A Stripe refund is required.');
  end if;
  select order_id, stock_restored, stripe_refund_id, status, resolution
    into v_order, v_restored, v_existing, v_status, v_resolution
  from public.returns
  where id = p_id and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  if v_resolution is distinct from 'refund' and not v_restored then
    return jsonb_build_object('ok', false, 'error', 'This return is an exchange. Create the exchange order instead of refunding.');
  end if;
  if not v_restored and v_status is distinct from 'received' then
    return jsonb_build_object('ok', false, 'error', 'Mark the return received in Fulfillment before refunding.');
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

create or replace function public.support_close_return(p_id uuid, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.returns%rowtype;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  select * into v_return from public.returns where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  if v_return.status = 'closed' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  if v_return.resolution = 'refund' and v_return.status is distinct from 'refunded' then
    return jsonb_build_object('ok', false, 'error', 'Refund the original payment before closing this return.');
  end if;
  if v_return.resolution = 'exchange' and (v_return.status is distinct from 'exchange_ordered' or nullif(v_return.replacement_order_id, '') is null) then
    return jsonb_build_object('ok', false, 'error', 'Create the exchange order before closing this return.');
  end if;
  update public.returns
  set status = 'closed', closed_at = coalesce(closed_at, now())
  where id = p_id;
  perform public.record_audit('close_return', 'returns', p_id::text, jsonb_build_object('orderId', v_return.order_id), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_create_replacement_order(p_kind text, p_id uuid, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text := lower(trim(coalesce(p_kind, '')));
  v_return public.returns%rowtype;
  v_claim public.warranty_claims%rowtype;
  v_source public.orders%rowtype;
  v_id text := 'JO-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  v_email text;
  v_user uuid;
  v_shipping jsonb := '{}'::jsonb;
  v_name text;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_kind not in ('exchange', 'warranty') then
    return jsonb_build_object('ok', false, 'error', 'Choose an exchange or a warranty replacement.');
  end if;

  if v_kind = 'exchange' then
    select * into v_return from public.returns where id = p_id and deleted_at is null for update;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'That return was not found.');
    end if;
    if v_return.resolution is distinct from 'exchange' then
      return jsonb_build_object('ok', false, 'error', 'This return is a refund. Refund the original payment instead.');
    end if;
    if v_return.status is distinct from 'received' then
      return jsonb_build_object('ok', false, 'error', 'Mark the return received in Fulfillment before creating the exchange order.');
    end if;
    if nullif(v_return.replacement_order_id, '') is not null then
      return jsonb_build_object('ok', true, 'already', true, 'orderId', v_return.replacement_order_id, 'email', v_return.email);
    end if;
    select * into v_source from public.orders where id = v_return.order_id and deleted_at is null for update;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'The original order was not found.');
    end if;
    if not exists (select 1 from public.order_items where order_id = v_source.id) then
      return jsonb_build_object('ok', false, 'error', 'The original order has no items to replace.');
    end if;
    v_email := v_source.email;
    v_user := v_source.user_id;
    v_shipping := coalesce(v_source.shipping, '{}'::jsonb);
    if not v_return.stock_restored then
      if v_source.stock_committed_at is not null then
        update public.inventory stock
        set on_hand = stock.on_hand + needed.quantity
        from (
          select product_id, sum(quantity)::integer as quantity
          from public.order_items
          where order_id = v_source.id
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
          where order_id = v_source.id
          group by product_id
        ) needed
        where stock.product_id = needed.product_id
          and stock.variant_id is null
          and stock.warehouse = 'US'
          and stock.deleted_at is null;
        update public.orders set stock_held = false where id = v_source.id;
      end if;
      update public.returns set stock_restored = true where id = v_return.id;
    end if;
  else
    select * into v_claim from public.warranty_claims where id = p_id and deleted_at is null for update;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'That claim was not found.');
    end if;
    if v_claim.status is distinct from 'approved' then
      return jsonb_build_object('ok', false, 'error', 'Approve the warranty claim before creating the replacement order.');
    end if;
    if nullif(v_claim.replacement_order_id, '') is not null then
      return jsonb_build_object('ok', true, 'already', true, 'orderId', v_claim.replacement_order_id, 'email', v_claim.email);
    end if;
    select * into v_source from public.orders where id = nullif(v_claim.order_id, '') and deleted_at is null;
    v_email := nullif(v_claim.email, '');
    v_user := v_claim.user_id;
    v_shipping := '{}'::jsonb;
    if found then
      v_email := coalesce(v_email, v_source.email);
      v_user := coalesce(v_user, v_source.user_id);
      v_shipping := coalesce(v_source.shipping, '{}'::jsonb);
    end if;
    if nullif(v_email, '') is null then
      return jsonb_build_object('ok', false, 'error', 'This claim has no email for the replacement order.');
    end if;
    select name into v_name from public.products where id = v_claim.product_id;
    if not found then
      v_name := coalesce(nullif(v_claim.product_id, ''), 'Replacement');
    end if;
  end if;

  if v_kind = 'exchange' then
    if exists (
      select 1
      from (
        select product_id, sum(quantity)::integer as quantity
        from public.order_items
        where order_id = v_source.id
        group by product_id
      ) needed
      where not exists (
        select 1 from public.inventory stock
        where stock.product_id = needed.product_id
          and stock.variant_id is null
          and stock.warehouse = 'US'
          and stock.deleted_at is null
          and stock.on_hand - stock.reserved >= needed.quantity
      )
    ) then
      return jsonb_build_object('ok', false, 'error', 'Not enough stock to reserve the exchange order.');
    end if;
  elsif not exists (
    select 1 from public.inventory stock
    where stock.product_id = v_claim.product_id
      and stock.variant_id is null
      and stock.warehouse = 'US'
      and stock.deleted_at is null
      and stock.on_hand - stock.reserved >= 1
  ) then
    return jsonb_build_object('ok', false, 'error', 'Not enough stock to reserve the replacement order.');
  end if;

  insert into public.orders (
    id, user_id, email, guest, status, payment_status, payment_provider, subtotal,
    shipping, stock_held, order_kind, source_return_id, source_claim_id,
    tax_amount, shipping_amount, discount_amount
  ) values (
    v_id,
    v_user,
    lower(v_email),
    v_user is null,
    'preparing',
    'paid',
    'replacement',
    0,
    v_shipping,
    true,
    v_kind,
    case when v_kind = 'exchange' then v_return.id else null end,
    case when v_kind = 'warranty' then v_claim.id else null end,
    0,
    0,
    0
  );

  if v_kind = 'exchange' then
    insert into public.order_items (order_id, product_id, name, price, quantity, color, selection)
    select v_id, product_id, name, 0, quantity, color, selection
    from public.order_items
    where order_id = v_source.id;
    update public.inventory stock
    set reserved = stock.reserved + needed.quantity
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_source.id
      group by product_id
    ) needed
    where stock.product_id = needed.product_id
      and stock.variant_id is null
      and stock.warehouse = 'US'
      and stock.deleted_at is null;
    update public.returns
    set replacement_order_id = v_id, status = 'exchange_ordered'
    where id = v_return.id;
  else
    insert into public.order_items (order_id, product_id, name, price, quantity)
    values (v_id, coalesce(nullif(v_claim.product_id, ''), 'replacement'), v_name, 0, 1);
    update public.inventory stock
    set reserved = stock.reserved + 1
    where stock.product_id = v_claim.product_id
      and stock.variant_id is null
      and stock.warehouse = 'US'
      and stock.deleted_at is null;
    update public.warranty_claims
    set replacement_order_id = v_id
    where id = v_claim.id;
  end if;

  perform public.record_audit(
    'create_replacement_order',
    'orders',
    v_id,
    jsonb_build_object('kind', v_kind, 'source', p_id),
    p_view_as
  );
  return jsonb_build_object('ok', true, 'orderId', v_id, 'email', lower(v_email));
exception
  when others then
    if sqlerrm = 'not_enough_stock' then
      return jsonb_build_object('ok', false, 'error', 'Not enough stock to reserve the replacement order.');
    end if;
    raise;
end;
$$;

create or replace function public.support_close_claim(p_id uuid, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.warranty_claims%rowtype;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  select * into v_claim from public.warranty_claims where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That claim was not found.');
  end if;
  if v_claim.status = 'replaced' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  if nullif(v_claim.replacement_order_id, '') is null then
    return jsonb_build_object('ok', false, 'error', 'Create the replacement order before closing this claim.');
  end if;
  update public.warranty_claims
  set status = 'replaced', reviewed_at = coalesce(reviewed_at, now())
  where id = p_id;
  perform public.record_audit('close_claim', 'warranty_claims', p_id::text, jsonb_build_object('orderId', v_claim.replacement_order_id), p_view_as);
  return jsonb_build_object('ok', true, 'orderId', v_claim.replacement_order_id);
end;
$$;

revoke all on function public.support_complete_refund(uuid, text, text) from public;
revoke all on function public.support_close_return(uuid, text) from public;
revoke all on function public.support_create_replacement_order(text, uuid, text) from public;
revoke all on function public.support_close_claim(uuid, text) from public;
grant execute on function public.support_complete_refund(uuid, text, text) to authenticated;
grant execute on function public.support_close_return(uuid, text) to authenticated;
grant execute on function public.support_create_replacement_order(text, uuid, text) to authenticated;
grant execute on function public.support_close_claim(uuid, text) to authenticated;

insert into public.page_copy (page, key, value) values
  ('returns', 'exchange', 'A Joova Ring size exchange is included in those same 30 days. Wear the free sizing sample, then confirm the size before the ring ships. If the ring still does not fit, request the exchange inside the 30 days. Any return is either a refund or an exchange for a similar item. A refund is issued only after the item is received, and it appears on the original payment method 5 to 10 business days later. The return closes after the refund is sent or the exchange order is created. An exchange ships like a new order. If a request is rejected, support can reopen it so you can request again.'),
  ('returns', 'stepShip', 'Pack the product and send it back. After we receive it, we refund the original payment or create an exchange order that ships like a new order. You can follow the return from the account.')
on conflict (page, key) do update set value = excluded.value, deleted_at = null;
