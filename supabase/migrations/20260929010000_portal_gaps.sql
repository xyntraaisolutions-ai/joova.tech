-- Follow-up for portal gaps. Safe to run more than once.

create or replace function public.support_file_claim(
  p_user uuid,
  p_order text,
  p_product text,
  p_serial text,
  p_message text,
  p_view_as text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_order text := upper(trim(coalesce(p_order, '')));
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if length(trim(coalesce(p_message, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Describe the claim.');
  end if;
  select * into v_profile from public.profiles where id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That customer was not found.');
  end if;
  if not exists (
    select 1 from public.orders
    where id = v_order and user_id = p_user
  ) then
    return jsonb_build_object('ok', false, 'error', 'That order is not on this customer account.');
  end if;
  if not exists (
    select 1 from public.order_items where order_id = v_order and product_id = p_product
  ) then
    return jsonb_build_object('ok', false, 'error', 'That product is not on the order.');
  end if;
  insert into public.warranty_claims (user_id, name, email, order_id, product_id, serial, message, status)
  values (
    p_user,
    v_profile.name,
    v_profile.email,
    v_order,
    p_product,
    nullif(trim(coalesce(p_serial, '')), ''),
    trim(p_message),
    'open'
  );
  perform public.record_audit(
    'file_claim',
    'warranty_claims',
    v_order,
    jsonb_build_object('user', p_user, 'product', p_product),
    p_view_as
  );
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.support_file_claim(uuid, text, text, text, text, text) from public;
grant execute on function public.support_file_claim(uuid, text, text, text, text, text) to authenticated;
