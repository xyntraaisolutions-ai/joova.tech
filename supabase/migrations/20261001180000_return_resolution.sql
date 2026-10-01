-- A return is a refund or an exchange. Support can reopen a rejection.
-- The case closes after the refund is sent or the replacement ships.

alter table public.returns add column if not exists resolution text not null default 'refund';
alter table public.returns drop constraint if exists returns_resolution_check;
alter table public.returns add constraint returns_resolution_check check (resolution in ('refund', 'exchange'));
alter table public.returns add column if not exists replacement_carrier text not null default '';
alter table public.returns add column if not exists replacement_tracking text not null default '';
alter table public.returns add column if not exists closed_at timestamptz;
alter table public.returns add column if not exists reopened_at timestamptz;

drop function if exists public.request_return(text, text, text);

create function public.request_return(p_order text, p_email text, p_reason text, p_resolution text default 'refund')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_delivered timestamptz;
  v_existing public.returns%rowtype;
  v_resolution text := lower(trim(coalesce(p_resolution, 'refund')));
begin
  if length(trim(coalesce(p_reason, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Tell us why you are returning it.');
  end if;
  if v_resolution not in ('refund', 'exchange') then
    return jsonb_build_object('ok', false, 'error', 'Choose a refund or an exchange.');
  end if;
  select * into v_order from public.orders where id = upper(trim(p_order)) and email = lower(trim(p_email));
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That order number and email do not match.');
  end if;
  if auth.uid() is not null and v_order.user_id is distinct from auth.uid() and v_order.user_id is not null then
    return jsonb_build_object('ok', false, 'error', 'That order is on a different account.');
  end if;
  select delivered_at into v_delivered from public.shipments where order_id = v_order.id and delivered_at is not null order by delivered_at desc limit 1;
  if v_delivered is null then
    return jsonb_build_object('ok', false, 'error', 'Returns start after delivery.');
  end if;
  if v_delivered < now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'error', 'The 30-day free return window is closed.');
  end if;
  select * into v_existing
  from public.returns
  where order_id = v_order.id and deleted_at is null
  order by requested_at desc
  limit 1
  for update;
  if found then
    if v_existing.status = 'reopened' then
      update public.returns
      set reason = trim(p_reason),
          resolution = v_resolution,
          status = 'requested',
          decision_note = '',
          customer_reply = '',
          requested_at = now(),
          reviewed_at = null,
          received_at = null,
          closed_at = null
      where id = v_existing.id;
      return jsonb_build_object('ok', true);
    end if;
    if v_existing.status = 'rejected' then
      return jsonb_build_object('ok', false, 'error', 'Support has to reopen this return before you can request it again.');
    end if;
    return jsonb_build_object('ok', false, 'error', 'A return is already open for this order.');
  end if;
  insert into public.returns (order_id, user_id, email, reason, status, resolution)
  values (v_order.id, coalesce(auth.uid(), v_order.user_id), v_order.email, trim(p_reason), 'requested', v_resolution);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_review_return(p_id uuid, p_decision text, p_note text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decision text := lower(trim(coalesce(p_decision, '')));
  v_note text := trim(coalesce(p_note, ''));
  v_return public.returns%rowtype;
  v_delivered timestamptz;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_decision not in ('approve', 'reject', 'needs_info', 'reopen') then
    return jsonb_build_object('ok', false, 'error', 'Choose approve, reject, request more information, or reopen.');
  end if;
  if v_decision in ('reject', 'needs_info') and length(v_note) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Add a reason the customer can read.');
  end if;
  select * into v_return from public.returns where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  if v_decision = 'approve' and v_return.status <> 'requested' then
    return jsonb_build_object('ok', false, 'error', 'Only a requested return can be approved.');
  end if;
  if v_decision = 'needs_info' and v_return.status <> 'requested' then
    return jsonb_build_object('ok', false, 'error', 'More information can be requested while the return is requested.');
  end if;
  if v_decision = 'reject' and v_return.status not in ('requested', 'needs_info') then
    return jsonb_build_object('ok', false, 'error', 'This return can no longer be rejected.');
  end if;
  if v_decision = 'reopen' and v_return.status <> 'rejected' then
    return jsonb_build_object('ok', false, 'error', 'Only a rejected return can be reopened.');
  end if;
  if v_decision = 'approve' then
    select delivered_at into v_delivered
    from public.shipments
    where order_id = v_return.order_id and delivered_at is not null
    order by delivered_at desc
    limit 1;
    if v_delivered is null then
      return jsonb_build_object('ok', false, 'error', 'The return policy starts on the delivery date. This order is not delivered.');
    end if;
    if v_delivered < now() - interval '30 days' then
      return jsonb_build_object('ok', false, 'error', 'The 30-day free return window is closed.');
    end if;
    update public.returns
    set status = 'approved', decision_note = v_note, reviewed_at = now()
    where id = p_id;
  elsif v_decision = 'reject' then
    update public.returns
    set status = 'rejected', decision_note = v_note, reviewed_at = now()
    where id = p_id;
  elsif v_decision = 'reopen' then
    update public.returns
    set status = 'reopened',
        reopened_at = now(),
        decision_note = case when length(v_note) > 0 then v_note else decision_note end,
        reviewed_at = now()
    where id = p_id;
  else
    update public.returns
    set status = 'needs_info', decision_note = v_note, reviewed_at = now()
    where id = p_id;
  end if;
  perform public.record_audit(
    'review_return',
    'returns',
    p_id::text,
    jsonb_build_object('decision', v_decision, 'note', v_note),
    p_view_as
  );
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
  v_status text;
  v_resolution text;
begin
  if public.app_role() not in ('csr', 'inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Fulfillment access is required.');
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
    return jsonb_build_object('ok', false, 'error', 'This return is an exchange. Send the replacement instead of refunding.');
  end if;
  if not v_restored and v_status is distinct from 'received' then
    return jsonb_build_object('ok', false, 'error', 'Mark the return received in Fulfillment before refunding.');
  end if;
  if v_restored then
    update public.returns
    set status = 'closed',
        closed_at = coalesce(closed_at, now()),
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
  set status = 'closed',
      closed_at = coalesce(closed_at, now()),
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

create or replace function public.fulfill_send_replacement(p_id uuid, p_carrier text, p_tracking text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.returns%rowtype;
  v_carrier text := trim(coalesce(p_carrier, ''));
  v_tracking text := trim(coalesce(p_tracking, ''));
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Fulfillment access is required.');
  end if;
  if length(v_carrier) < 2 or length(v_tracking) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Add the carrier and tracking number for the replacement.');
  end if;
  select * into v_return from public.returns where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  if v_return.resolution is distinct from 'exchange' then
    return jsonb_build_object('ok', false, 'error', 'This return is a refund. Refund the original payment instead of sending a replacement.');
  end if;
  if v_return.status is distinct from 'received' then
    return jsonb_build_object('ok', false, 'error', 'Mark the return received before sending the replacement.');
  end if;
  update public.returns
  set status = 'closed',
      closed_at = now(),
      replacement_carrier = v_carrier,
      replacement_tracking = v_tracking
  where id = p_id;
  perform public.record_audit(
    'send_replacement',
    'returns',
    p_id::text,
    jsonb_build_object('orderId', v_return.order_id, 'carrier', v_carrier, 'tracking', v_tracking),
    p_view_as
  );
  return jsonb_build_object('ok', true);
end;
$$;

do $patch$
declare
  v_sql text;
begin
  v_sql := pg_get_functiondef('public.inventory_counter()'::regprocedure);
  v_sql := replace(
    v_sql,
    'r.status in (''approved'', ''received'', ''refunded'')',
    'r.status in (''approved'', ''received'', ''refunded'', ''closed'')'
  );
  execute v_sql;
end
$patch$;

update public.policies
set returns_summary = 'You have 30 days from delivery to start a free return in the United States. Choose a refund or an exchange for a similar item. A refund is issued after we receive the item and appears on the original payment method in 5 to 10 business days. We cover return shipping. This is the only free return window.'
where id = 1;

insert into public.page_copy (page, key, value) values
  ('returns', 'exchange', 'A Joova Ring size exchange is included in those same 30 days. Wear the free sizing sample, then confirm the size before the ring ships. If the ring still does not fit, request the exchange inside the 30 days. Any return is either a refund or an exchange for a similar item. A refund is issued only after the item is received, and it appears on the original payment method 5 to 10 business days later. The return closes once the refund is sent or the replacement ships. If a request is rejected, support can reopen it so you can request again.'),
  ('returns', 'stepShip', 'Pack the product and send it back. We issue the refund or send the similar item after we receive it. You can follow the return from the account.')
on conflict (page, key) do update set value = excluded.value, deleted_at = null;

revoke all on function public.request_return(text, text, text, text) from public;
revoke all on function public.fulfill_send_replacement(uuid, text, text, text) from public;
grant execute on function public.request_return(text, text, text, text) to anon, authenticated;
grant execute on function public.support_review_return(uuid, text, text, text) to authenticated;
grant execute on function public.support_complete_refund(uuid, text, text) to authenticated;
grant execute on function public.fulfill_send_replacement(uuid, text, text, text) to authenticated;
