-- A removed product can be deleted with its pictures, variants, stock, and videos.

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
    delete from public.inventory where product_id = p_id;
    delete from public.videos where product_id = p_id;
    delete from public.product_variants where product_id = p_id;
    delete from public.product_images where product_id = p_id;
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
