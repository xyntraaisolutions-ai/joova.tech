-- Roles, staff access, merchandising, and audit. Safe to run more than once.

alter table public.profiles add column if not exists role text not null default 'customer';
alter table public.profiles add column if not exists active boolean not null default true;
alter table public.profiles add column if not exists support_note text not null default '';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'csr', 'inventory', 'content', 'super_admin'));

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists sale_price numeric(10, 2);
alter table public.products add column if not exists on_sale boolean not null default false;
alter table public.products add column if not exists top_pick boolean not null default false;
alter table public.products add column if not exists warranty_eligible boolean not null default false;
alter table public.products add column if not exists warranty_years integer;

alter table public.product_variants add column if not exists sku text;

alter table public.site_settings add column if not exists site_url text;

alter table public.contact_messages add column if not exists status text not null default 'open';
alter table public.contact_messages add column if not exists reply text;

alter table public.warranty_claims add column if not exists status text not null default 'open';
alter table public.warranty_claims add column if not exists product_id text;

create unique index if not exists products_sku_key on public.products (sku) where sku is not null;
create unique index if not exists product_variants_sku_key on public.product_variants (sku) where sku is not null;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  view_as text,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
    or auth.role() = 'service_role'
    or current_setting('joova.profile_admin', true) = 'on' then
    return new;
  end if;
  new.role := old.role;
  new.active := old.active;
  new.email := old.email;
  new.support_note := old.support_note;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

create or replace function public.record_audit(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_detail jsonb,
  p_view_as text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.app_role();
begin
  if v_role is null or v_role = 'customer' then
    raise exception 'not_allowed';
  end if;
  insert into public.audit_log (actor_id, view_as, action, entity, entity_id, detail)
  values (
    auth.uid(),
    case when v_role = 'super_admin' then nullif(trim(coalesce(p_view_as, '')), '') else null end,
    p_action,
    p_entity,
    nullif(p_entity_id, ''),
    coalesce(p_detail, '{}'::jsonb)
  );
end;
$$;

create or replace function public.set_user_role(p_id uuid, p_role text, p_active boolean, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.app_role() is distinct from 'super_admin' then
    return jsonb_build_object('ok', false, 'error', 'Only a Super Admin can change users.');
  end if;
  if p_role not in ('customer', 'csr', 'inventory', 'content', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Choose a valid role.');
  end if;
  if not exists (select 1 from public.profiles where id = p_id) then
    return jsonb_build_object('ok', false, 'error', 'That person does not have an account.');
  end if;
  if exists (
    select 1 from public.profiles
    where id = p_id and role = 'super_admin' and (p_role <> 'super_admin' or p_active = false)
  ) and (
    select count(*) from public.profiles where role = 'super_admin' and active and id <> p_id
  ) < 1 then
    return jsonb_build_object('ok', false, 'error', 'Keep at least one active Super Admin.');
  end if;
  perform set_config('joova.profile_admin', 'on', true);
  update public.profiles set role = p_role, active = p_active where id = p_id;
  perform public.record_audit('set_role', 'profiles', p_id::text, jsonb_build_object('role', p_role, 'active', p_active), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.csr_update_customer(p_id uuid, p_name text, p_note text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if length(trim(coalesce(p_name, ''))) < 1 then
    return jsonb_build_object('ok', false, 'error', 'Enter the customer name.');
  end if;
  perform set_config('joova.profile_admin', 'on', true);
  update public.profiles
    set name = trim(p_name), support_note = trim(coalesce(p_note, ''))
    where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That customer was not found.');
  end if;
  perform public.record_audit('update_customer', 'profiles', p_id::text, jsonb_build_object('name', trim(p_name)), p_view_as);
  return jsonb_build_object('ok', true);
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
  if v_status not in ('preparing', 'shipped', 'delivered') then
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
      case when v_status in ('shipped', 'delivered') then now() else null end,
      case when v_status = 'delivered' then now() else null end
    );
  else
    update public.shipments set
      carrier = nullif(trim(coalesce(p_carrier, '')), ''),
      tracking_number = nullif(trim(coalesce(p_tracking, '')), ''),
      status = v_status,
      shipped_at = case when v_status in ('shipped', 'delivered') then coalesce(shipped_at, now()) else shipped_at end,
      delivered_at = case when v_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
    where id = v_id;
  end if;
  update public.orders set status = v_status where id = v_order;
  perform public.record_audit('set_shipment', 'orders', v_order, jsonb_build_object('status', v_status), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_set_return(p_id uuid, p_status text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_status not in ('requested', 'approved', 'received', 'refunded', 'closed') then
    return jsonb_build_object('ok', false, 'error', 'Choose a return status.');
  end if;
  update public.returns set status = v_status where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That return was not found.');
  end if;
  perform public.record_audit('set_return', 'returns', p_id::text, jsonb_build_object('status', v_status), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_set_claim(p_id uuid, p_status text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_status not in ('open', 'reviewing', 'approved', 'replaced', 'closed') then
    return jsonb_build_object('ok', false, 'error', 'Choose a claim status.');
  end if;
  update public.warranty_claims set status = v_status where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That claim was not found.');
  end if;
  perform public.record_audit('set_claim', 'warranty_claims', p_id::text, jsonb_build_object('status', v_status), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_reply(p_id uuid, p_reply text, p_status text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if length(trim(coalesce(p_reply, ''))) < 1 then
    return jsonb_build_object('ok', false, 'error', 'Write a reply.');
  end if;
  update public.contact_messages
    set reply = trim(p_reply), status = case when p_status = 'closed' then 'closed' else 'replied' end
    where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That message was not found.');
  end if;
  perform public.record_audit('reply', 'contact_messages', p_id::text, jsonb_build_object('status', p_status), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.register_warranty(p_order text, p_product text, p_serial text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_end timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to register a product.');
  end if;
  select * into v_order from public.orders where id = upper(trim(p_order)) and user_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That order is not on this account.');
  end if;
  if not exists (select 1 from public.order_items where order_id = v_order.id and product_id = p_product) then
    return jsonb_build_object('ok', false, 'error', 'That product is not on the order.');
  end if;
  select * into v_product from public.products where id = p_product;
  if not found or not v_product.warranty_eligible then
    return jsonb_build_object('ok', false, 'error', 'This product is not eligible for warranty registration.');
  end if;
  if exists (
    select 1 from public.warranty_registrations
    where user_id = auth.uid() and order_id = v_order.id and product_id = p_product
  ) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  v_end := case when v_product.warranty_years is null then null else now() + make_interval(years => v_product.warranty_years) end;
  insert into public.warranty_registrations (user_id, order_id, product_id, serial, coverage_ends_at)
  values (auth.uid(), v_order.id, p_product, nullif(trim(coalesce(p_serial, '')), ''), v_end);
  return jsonb_build_object('ok', true, 'coverageEndsAt', v_end);
end;
$$;

create or replace function public.support_register_warranty(
  p_user uuid,
  p_order text,
  p_product text,
  p_serial text,
  p_view_as text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_end timestamptz;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  select * into v_order from public.orders where id = upper(trim(p_order)) and user_id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That order is not on this customer account.');
  end if;
  if not exists (select 1 from public.order_items where order_id = v_order.id and product_id = p_product) then
    return jsonb_build_object('ok', false, 'error', 'That product is not on the order.');
  end if;
  select * into v_product from public.products where id = p_product;
  if not found or not v_product.warranty_eligible then
    return jsonb_build_object('ok', false, 'error', 'This product is not eligible for warranty registration.');
  end if;
  if exists (
    select 1 from public.warranty_registrations
    where user_id = p_user and order_id = v_order.id and product_id = p_product
  ) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  v_end := case when v_product.warranty_years is null then null else now() + make_interval(years => v_product.warranty_years) end;
  insert into public.warranty_registrations (user_id, order_id, product_id, serial, coverage_ends_at)
  values (p_user, v_order.id, p_product, nullif(trim(coalesce(p_serial, '')), ''), v_end);
  perform public.record_audit('register_warranty', 'warranty_registrations', p_order, jsonb_build_object('product', p_product, 'user', p_user), p_view_as);
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
    select * into v_product from public.products where id = v_item->>'productId' and published;
    if not found then
      raise exception 'unknown_product';
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
        and on_hand - reserved >= v_qty;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'not_enough_stock';
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

do $$
begin
  if not exists (select 1 from public.products where warranty_eligible) then
    update public.products set
      warranty_eligible = true,
      warranty_years = case id
        when 'band' then 3
        when 'ring' then 2
        when 'straps' then null
        else 1
      end;
  end if;
end $$;

update public.products set sku = 'JOOVA-' || upper(id) where sku is null;
update public.product_variants set sku = 'JOOVA-' || upper(replace(id, '-', '')) where sku is null;

grant select on public.audit_log to authenticated;
grant select, insert, update, delete on public.products, public.product_images, public.product_variants,
  public.categories, public.deals, public.featured_products, public.inventory to authenticated;
grant select, insert, update, delete on public.site_settings, public.policies, public.page_copy,
  public.blog_posts, public.blog_sections, public.videos, public.help_articles, public.social_links,
  public.support_links, public.support_channels, public.payment_methods, public.product_blocks to authenticated;
grant select, update on public.contact_messages to authenticated;
grant select, insert, update on public.reviews to authenticated;
grant select on public.orders, public.order_items, public.shipments, public.returns,
  public.warranty_registrations, public.warranty_claims to authenticated;

revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

drop policy if exists profiles_staff_read on public.profiles;
create policy profiles_staff_read on public.profiles for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists products_staff on public.products;
create policy products_staff on public.products for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists product_images_staff on public.product_images;
create policy product_images_staff on public.product_images for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists product_variants_staff on public.product_variants;
create policy product_variants_staff on public.product_variants for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists categories_staff on public.categories;
create policy categories_staff on public.categories for all to authenticated
  using (public.app_role() in ('inventory', 'content', 'super_admin'))
  with check (public.app_role() in ('inventory', 'content', 'super_admin'));

drop policy if exists deals_staff on public.deals;
create policy deals_staff on public.deals for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists featured_staff on public.featured_products;
create policy featured_staff on public.featured_products for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists inventory_staff on public.inventory;
create policy inventory_staff on public.inventory for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists content_settings on public.site_settings;
create policy content_settings on public.site_settings for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_policies on public.policies;
create policy content_policies on public.policies for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_pages on public.page_copy;
create policy content_pages on public.page_copy for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_blog on public.blog_posts;
create policy content_blog on public.blog_posts for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_blog_sections on public.blog_sections;
create policy content_blog_sections on public.blog_sections for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_videos on public.videos;
create policy content_videos on public.videos for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_help on public.help_articles;
create policy content_help on public.help_articles for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_social on public.social_links;
create policy content_social on public.social_links for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_support_links on public.support_links;
create policy content_support_links on public.support_links for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_channels on public.support_channels;
create policy content_channels on public.support_channels for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists content_payments on public.payment_methods;
create policy content_payments on public.payment_methods for all to authenticated
  using (public.app_role() = 'super_admin')
  with check (public.app_role() = 'super_admin');

drop policy if exists content_blocks on public.product_blocks;
create policy content_blocks on public.product_blocks for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists orders_staff on public.orders;
create policy orders_staff on public.orders for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists order_items_staff on public.order_items;
create policy order_items_staff on public.order_items for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists shipments_staff on public.shipments;
create policy shipments_staff on public.shipments for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists returns_staff on public.returns;
create policy returns_staff on public.returns for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists warranty_reg_staff on public.warranty_registrations;
create policy warranty_reg_staff on public.warranty_registrations for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists warranty_claims_staff on public.warranty_claims;
create policy warranty_claims_staff on public.warranty_claims for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists contact_staff on public.contact_messages;
create policy contact_staff on public.contact_messages for select to authenticated
  using (public.app_role() in ('csr', 'super_admin'));

drop policy if exists reviews_staff on public.reviews;
create policy reviews_staff on public.reviews for all to authenticated
  using (public.app_role() in ('content', 'csr', 'super_admin'))
  with check (public.app_role() in ('content', 'csr', 'super_admin'));

drop policy if exists audit_admin on public.audit_log;
create policy audit_admin on public.audit_log for select to authenticated
  using (public.app_role() = 'super_admin');

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists media_staff_insert on storage.objects;
create policy media_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.app_role() in ('content', 'super_admin'));

drop policy if exists media_staff_update on storage.objects;
create policy media_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.app_role() in ('content', 'super_admin'));

drop policy if exists media_staff_delete on storage.objects;
create policy media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.app_role() in ('content', 'super_admin'));

revoke all on function public.app_role() from public;
revoke all on function public.record_audit(text, text, text, jsonb, text) from public;
revoke all on function public.set_user_role(uuid, text, boolean, text) from public;
revoke all on function public.csr_update_customer(uuid, text, text, text) from public;
revoke all on function public.support_set_shipment(text, text, text, text, text) from public;
revoke all on function public.support_set_return(uuid, text, text) from public;
revoke all on function public.support_set_claim(uuid, text, text) from public;
revoke all on function public.support_reply(uuid, text, text, text) from public;
revoke all on function public.support_register_warranty(uuid, text, text, text, text) from public;

grant execute on function public.app_role() to anon, authenticated;
grant execute on function public.record_audit(text, text, text, jsonb, text) to authenticated;
grant execute on function public.set_user_role(uuid, text, boolean, text) to authenticated;
grant execute on function public.csr_update_customer(uuid, text, text, text) to authenticated;
grant execute on function public.support_set_shipment(text, text, text, text, text) to authenticated;
grant execute on function public.support_set_return(uuid, text, text) to authenticated;
grant execute on function public.support_set_claim(uuid, text, text) to authenticated;
grant execute on function public.support_reply(uuid, text, text, text) to authenticated;
grant execute on function public.support_register_warranty(uuid, text, text, text, text) to authenticated;
