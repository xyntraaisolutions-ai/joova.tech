-- Let a product id change, and move every related row with it.

do $$
declare
  r record;
  v_def text;
begin
  for r in
    select oid, conrelid::regclass as tbl, conname
    from pg_constraint
    where confrelid = 'public.products'::regclass
      and contype = 'f'
  loop
    v_def := pg_get_constraintdef(r.oid);
    if v_def ilike '%ON UPDATE%' then
      continue;
    end if;
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format('alter table %s add constraint %I %s ON UPDATE CASCADE', r.tbl, r.conname, v_def);
  end loop;
end $$;

create or replace function public.rename_product(p_from text, p_to text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.app_role() not in ('inventory', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Inventory access is required.');
  end if;
  if p_from is null or p_to is null or p_from = p_to then
    return jsonb_build_object('ok', true);
  end if;
  if p_to !~ '^[a-z0-9-]+$' or char_length(p_to) > 40 then
    return jsonb_build_object('ok', false, 'error', 'Use lowercase letters, numbers, and hyphens.');
  end if;
  if not exists (select 1 from public.products where id = p_from) then
    return jsonb_build_object('ok', false, 'error', 'That product was not found.');
  end if;
  if exists (select 1 from public.products where id = p_to) then
    return jsonb_build_object('ok', false, 'error', 'That product id is already used.');
  end if;

  perform set_config('joova.audit_reason', 'Product id changed', true);
  update public.products set id = p_to where id = p_from;
  update public.blog_posts set product_id = p_to where product_id = p_from;
  update public.order_items set product_id = p_to where product_id = p_from;
  update public.product_blocks set product_id = p_to where product_id = p_from;
  update public.reviews set product_id = p_to where product_id = p_from;
  update public.videos set product_id = p_to where product_id = p_from;
  update public.warranty_claims set product_id = p_to where product_id = p_from;
  update public.warranty_registrations set product_id = p_to where product_id = p_from;
  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', 'The product id could not be changed.');
end;
$$;

revoke all on function public.rename_product(text, text) from public;
grant execute on function public.rename_product(text, text) to authenticated;
