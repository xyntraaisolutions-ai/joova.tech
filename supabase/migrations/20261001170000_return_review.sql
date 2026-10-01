-- Return requests stay with Support until they are approved. Fulfillment receives the package and refunds it.

alter table public.returns add column if not exists decision_note text not null default '';
alter table public.returns add column if not exists customer_reply text not null default '';
alter table public.returns add column if not exists reviewed_at timestamptz;
alter table public.returns add column if not exists received_at timestamptz;

drop policy if exists returns_staff on public.returns;
create policy returns_staff on public.returns for select to authenticated
  using (public.app_role() in ('csr', 'inventory', 'super_admin'));

create or replace function public.request_return(p_order text, p_email text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_delivered timestamptz;
begin
  if length(trim(coalesce(p_reason, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Tell us why you are returning it.');
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
  if exists (
    select 1 from public.returns
    where order_id = v_order.id and deleted_at is null and status <> 'rejected'
  ) then
    return jsonb_build_object('ok', false, 'error', 'A return is already open for this order.');
  end if;
  insert into public.returns (order_id, user_id, email, reason, status)
  values (v_order.id, coalesce(auth.uid(), v_order.user_id), v_order.email, trim(p_reason), 'requested');
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
  if v_decision not in ('approve', 'reject', 'needs_info') then
    return jsonb_build_object('ok', false, 'error', 'Choose approve, reject, or request more information.');
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

create or replace function public.customer_add_return_info(p_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.returns%rowtype;
  v_owner uuid;
  v_email text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to update this return.');
  end if;
  if length(trim(coalesce(p_note, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Add the information support asked for.');
  end if;
  select * into v_return from public.returns where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  if v_return.status <> 'needs_info' then
    return jsonb_build_object('ok', false, 'error', 'Support is not waiting on more information.');
  end if;
  select user_id, email into v_owner, v_email from public.orders where id = v_return.order_id;
  if v_return.user_id is distinct from auth.uid()
    and v_owner is distinct from auth.uid()
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and lower(email) = lower(v_return.email)
    ) then
    return jsonb_build_object('ok', false, 'error', 'That return is on a different account.');
  end if;
  update public.returns
  set customer_reply = trim(p_note), status = 'requested'
  where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.fulfill_receive_return(p_id uuid, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order text;
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Fulfillment access is required.');
  end if;
  select order_id into v_order
  from public.returns
  where id = p_id and deleted_at is null and status = 'approved'
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Only an approved return can be marked received.');
  end if;
  update public.returns
  set status = 'received', received_at = now()
  where id = p_id;
  perform public.record_audit('receive_return', 'returns', p_id::text, jsonb_build_object('orderId', v_order), p_view_as);
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
begin
  if public.app_role() not in ('csr', 'inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Fulfillment access is required.');
  end if;
  if nullif(trim(coalesce(p_refund, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'A Stripe refund is required.');
  end if;
  select order_id, stock_restored, stripe_refund_id, status
    into v_order, v_restored, v_existing, v_status
  from public.returns
  where id = p_id and deleted_at is null
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
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

revoke all on function public.support_review_return(uuid, text, text, text) from public;
revoke all on function public.customer_add_return_info(uuid, text) from public;
revoke all on function public.fulfill_receive_return(uuid, text) from public;
grant execute on function public.support_review_return(uuid, text, text, text) to authenticated;
grant execute on function public.customer_add_return_info(uuid, text) to authenticated;
grant execute on function public.fulfill_receive_return(uuid, text) to authenticated;
