alter table public.orders add column if not exists confirmation_sent_at timestamptz;

create or replace function public.claim_order_email(p_order text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  if auth.role() is distinct from 'service_role' then
    return false;
  end if;
  update public.orders
  set confirmation_sent_at = now()
  where id = p_order and payment_status = 'paid' and confirmation_sent_at is null
  returning id into v_id;
  return v_id is not null;
end;
$$;

create or replace function public.clear_order_email(p_order text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    return;
  end if;
  update public.orders set confirmation_sent_at = null where id = p_order;
end;
$$;

revoke all on function public.claim_order_email(text) from public, anon, authenticated;
revoke all on function public.clear_order_email(text) from public, anon, authenticated;
grant execute on function public.claim_order_email(text) to service_role;
grant execute on function public.clear_order_email(text) to service_role;
