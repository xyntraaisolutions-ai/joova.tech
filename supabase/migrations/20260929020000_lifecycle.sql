-- Soft delete, category enable flag, and portfolio-wide SKU uniqueness.

alter table public.categories add column if not exists active boolean not null default true;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'categories', 'products', 'product_images', 'product_variants', 'product_blocks',
    'deals', 'featured_products', 'blog_posts', 'blog_sections', 'videos', 'help_articles',
    'social_links', 'payment_methods', 'support_links', 'support_channels', 'page_copy',
    'reviews', 'inventory', 'contact_messages', 'orders', 'returns', 'warranty_claims',
    'warranty_registrations', 'profiles'
  ]
  loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', v_table);
  end loop;
end $$;

create or replace function public.assert_unique_sku()
returns trigger
language plpgsql
as $$
begin
  if new.sku is null or btrim(new.sku) = '' then
    new.sku := null;
    return new;
  end if;
  new.sku := upper(btrim(new.sku));
  if exists (
    select 1 from public.products
    where sku = new.sku
      and not (tg_table_name = 'products' and id = new.id)
  ) or exists (
    select 1 from public.product_variants
    where sku = new.sku
      and not (tg_table_name = 'product_variants' and id = new.id)
  ) then
    raise exception 'SKU % is already used in the inventory portfolio', new.sku
      using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists products_unique_sku on public.products;
create trigger products_unique_sku
  before insert or update of sku on public.products
  for each row execute function public.assert_unique_sku();

drop trigger if exists variants_unique_sku on public.product_variants;
create trigger variants_unique_sku
  before insert or update of sku on public.product_variants
  for each row execute function public.assert_unique_sku();

create or replace function public.manage_resource_delete(
  p_table text,
  p_id text,
  p_confirm text,
  p_reason text,
  p_view_as text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.app_role();
  v_confirm text := trim(coalesce(p_confirm, ''));
  v_reason text := trim(coalesce(p_reason, ''));
  v_column text;
  v_cast text;
  v_allowed text[];
  v_gone boolean;
  v_count integer;
  v_profile public.profiles%rowtype;
begin
  if v_role is null or v_role = 'customer' then
    return jsonb_build_object('ok', false, 'error', 'Portal access is required.');
  end if;

  v_allowed := case p_table
    when 'categories' then array['inventory']
    when 'products' then array['inventory']
    when 'product_images' then array['inventory']
    when 'product_variants' then array['inventory']
    when 'deals' then array['inventory']
    when 'inventory' then array['inventory']
    when 'featured_products' then array['inventory']
    when 'product_blocks' then array['inventory', 'content']
    when 'blog_posts' then array['content']
    when 'blog_sections' then array['content']
    when 'videos' then array['content', 'inventory']
    when 'help_articles' then array['content']
    when 'social_links' then array['content']
    when 'payment_methods' then array['content']
    when 'support_links' then array['content']
    when 'nav_items' then array['content']
    when 'support_channels' then array['content']
    when 'page_copy' then array['content']
    when 'reviews' then array['content']
    when 'contact_messages' then array['csr']
    when 'orders' then array['csr']
    when 'returns' then array['csr']
    when 'warranty_claims' then array['csr']
    when 'warranty_registrations' then array['csr']
    when 'profiles' then array['super_admin']
    else null
  end;

  if v_allowed is null then
    return jsonb_build_object('ok', false, 'error', 'That record cannot be removed here.');
  end if;
  if v_role is distinct from 'super_admin' and not (v_role = any (v_allowed)) then
    return jsonb_build_object('ok', false, 'error', 'That area is not open for this role.');
  end if;
  if v_confirm not in ('SOFT DELETE', 'PERMANENT DELETE') then
    return jsonb_build_object('ok', false, 'error', 'Type SOFT DELETE first. Permanent delete comes after that.');
  end if;

  if p_table = 'profiles' then
    select * into v_profile from public.profiles where id = p_id::uuid;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'That person was not found.');
    end if;
    if v_profile.id = auth.uid() then
      return jsonb_build_object('ok', false, 'error', 'You cannot remove your own account.');
    end if;
    if v_profile.role = 'super_admin' and (
      select count(*) from public.profiles
      where role = 'super_admin' and active and deleted_at is null and id <> v_profile.id
    ) < 1 then
      return jsonb_build_object('ok', false, 'error', 'Keep at least one active Super Admin.');
    end if;
    if v_confirm = 'SOFT DELETE' then
      if v_profile.deleted_at is not null then
        return jsonb_build_object('ok', false, 'error', 'This is already removed. Permanent delete is the next step.');
      end if;
      perform set_config('joova.profile_admin', 'on', true);
      update public.profiles set deleted_at = now(), active = false where id = v_profile.id;
      perform public.record_audit('soft_delete', 'profiles', p_id, '{}'::jsonb, p_view_as);
      return jsonb_build_object('ok', true);
    end if;
    if length(v_reason) < 3 then
      return jsonb_build_object('ok', false, 'error', 'Add a reason for the permanent delete.');
    end if;
    if v_profile.deleted_at is null then
      return jsonb_build_object('ok', false, 'error', 'Remove it first. Type SOFT DELETE.');
    end if;
    perform public.record_audit('permanent_delete', 'profiles', p_id, jsonb_build_object('reason', v_reason), p_view_as);
    return jsonb_build_object('ok', true, 'auth_delete', true);
  end if;

  if p_table = 'page_copy' then
    if split_part(p_id, '::', 1) = '' or split_part(p_id, '::', 2) = '' then
      return jsonb_build_object('ok', false, 'error', 'That record was not found.');
    end if;
    if v_confirm = 'SOFT DELETE' then
      update public.page_copy set deleted_at = now()
      where page = split_part(p_id, '::', 1) and key = split_part(p_id, '::', 2) and deleted_at is null;
      get diagnostics v_count = row_count;
      if v_count = 0 then
        return jsonb_build_object('ok', false, 'error', 'This is already removed, or it was not found. Permanent delete is the next step.');
      end if;
    else
      if length(v_reason) < 3 then
        return jsonb_build_object('ok', false, 'error', 'Add a reason for the permanent delete.');
      end if;
      delete from public.page_copy
      where page = split_part(p_id, '::', 1) and key = split_part(p_id, '::', 2) and deleted_at is not null;
      get diagnostics v_count = row_count;
      if v_count = 0 then
        return jsonb_build_object('ok', false, 'error', 'Remove it first. Type SOFT DELETE.');
      end if;
    end if;
    perform public.record_audit(
      case when v_confirm = 'SOFT DELETE' then 'soft_delete' else 'permanent_delete' end,
      'page_copy', p_id, jsonb_build_object('reason', nullif(v_reason, '')), p_view_as
    );
    return jsonb_build_object('ok', true);
  end if;

  v_column := case p_table
    when 'blog_posts' then 'slug'
    when 'help_articles' then 'slug'
    when 'support_links' then 'href'
    when 'featured_products' then 'product_id'
    else 'id'
  end;
  v_cast := case
    when p_table in ('reviews', 'inventory', 'contact_messages', 'returns', 'warranty_claims', 'warranty_registrations') then 'uuid'
    else 'text'
  end;

  if v_confirm = 'SOFT DELETE' then
    execute format(
      'update public.%I set deleted_at = now() where %I = $1::%s and deleted_at is null',
      p_table, v_column, v_cast
    ) using p_id;
    get diagnostics v_count = row_count;
    if v_count = 0 then
      execute format(
        'select deleted_at is not null from public.%I where %I = $1::%s',
        p_table, v_column, v_cast
      ) into v_gone using p_id;
      if v_gone then
        return jsonb_build_object('ok', false, 'error', 'This is already removed. Permanent delete is the next step.');
      end if;
      return jsonb_build_object('ok', false, 'error', 'That record was not found.');
    end if;
    perform public.record_audit('soft_delete', p_table, p_id, '{}'::jsonb, p_view_as);
    return jsonb_build_object('ok', true);
  end if;

  if length(v_reason) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Add a reason for the permanent delete.');
  end if;

  execute format(
    'select deleted_at is not null from public.%I where %I = $1::%s',
    p_table, v_column, v_cast
  ) into v_gone using p_id;
  if v_gone is null then
    return jsonb_build_object('ok', false, 'error', 'That record was not found.');
  end if;
  if not v_gone then
    return jsonb_build_object('ok', false, 'error', 'Remove it first. Type SOFT DELETE.');
  end if;

  if p_table = 'categories' and exists (select 1 from public.products where category_id = p_id) then
    return jsonb_build_object('ok', false, 'error', 'Permanently delete the products in this category first.');
  end if;
  if p_table = 'products' then
    if exists (select 1 from public.product_variants where product_id = p_id and deleted_at is null)
      or exists (select 1 from public.product_images where product_id = p_id and deleted_at is null)
      or exists (select 1 from public.inventory where product_id = p_id and deleted_at is null) then
      return jsonb_build_object('ok', false, 'error', 'Remove the variants, images, and stock for this product first.');
    end if;
    delete from public.product_variants where product_id = p_id;
    delete from public.product_images where product_id = p_id;
    delete from public.inventory where product_id = p_id;
    delete from public.featured_products where product_id = p_id;
  end if;
  if p_table = 'blog_posts' then
    if exists (select 1 from public.blog_sections where post_slug = p_id and deleted_at is null) then
      return jsonb_build_object('ok', false, 'error', 'Remove each section of this post first.');
    end if;
    delete from public.blog_sections where post_slug = p_id;
  end if;
  if p_table = 'orders' then
    if exists (select 1 from public.returns where order_id = p_id and deleted_at is null)
      or exists (select 1 from public.warranty_claims where order_id = p_id and deleted_at is null)
      or exists (select 1 from public.warranty_registrations where order_id = p_id and deleted_at is null) then
      return jsonb_build_object('ok', false, 'error', 'Remove the returns, claims, and warranty registrations on this order first.');
    end if;
    delete from public.returns where order_id = p_id;
    delete from public.warranty_claims where order_id = p_id;
    delete from public.warranty_registrations where order_id = p_id;
  end if;

  execute format('delete from public.%I where %I = $1::%s and deleted_at is not null', p_table, v_column, v_cast) using p_id;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'That record could not be deleted.');
  end if;
  perform public.record_audit('permanent_delete', p_table, p_id, jsonb_build_object('reason', v_reason), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.manage_resource_delete(text, text, text, text, text) from public;
grant execute on function public.manage_resource_delete(text, text, text, text, text) to authenticated;

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated
  using (deleted_at is null and active);

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists product_variants_read on public.product_variants;
create policy product_variants_read on public.product_variants for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists product_blocks_read on public.product_blocks;
create policy product_blocks_read on public.product_blocks for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists deals_read on public.deals;
create policy deals_read on public.deals for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists featured_read on public.featured_products;
create policy featured_read on public.featured_products for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists blog_posts_read on public.blog_posts;
create policy blog_posts_read on public.blog_posts for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists blog_sections_read on public.blog_sections;
create policy blog_sections_read on public.blog_sections for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists videos_read on public.videos;
create policy videos_read on public.videos for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists help_read on public.help_articles;
create policy help_read on public.help_articles for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists social_read on public.social_links;
create policy social_read on public.social_links for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists payments_read on public.payment_methods;
create policy payments_read on public.payment_methods for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists support_links_read on public.support_links;
create policy support_links_read on public.support_links for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists support_channels_read on public.support_channels;
create policy support_channels_read on public.support_channels for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists page_copy_read on public.page_copy;
create policy page_copy_read on public.page_copy for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders for select to authenticated
  using (user_id = auth.uid() and deleted_at is null);

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
    select * into v_product from public.products
    where id = v_item->>'productId' and published and deleted_at is null;
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
        and deleted_at is null
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
