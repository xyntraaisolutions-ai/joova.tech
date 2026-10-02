-- Joova content and commerce. Safe to run more than once.

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand text not null,
  legal_name text not null,
  copyright text not null,
  address text not null,
  email text not null,
  support_hours text not null,
  site_description text not null,
  announcement text not null,
  no_subscription text not null,
  published boolean not null default true
);

create table if not exists public.policies (
  id integer primary key default 1 check (id = 1),
  returns_title text not null,
  strap_title text not null,
  dock_title text not null,
  hero_line text not null,
  strap_summary text not null,
  dock_summary text not null,
  shipping text not null,
  returns_summary text not null,
  warranty_registration text not null,
  account_summary text not null
);

create table if not exists public.categories (
  id text primary key,
  label text not null,
  href text not null,
  summary text not null,
  sort integer not null default 0
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  menu_label text not null,
  href text not null,
  category_id text not null references public.categories (id),
  also_in text[] not null default '{}',
  price numeric(10, 2) not null,
  price_label text not null,
  status text not null,
  summary text not null,
  kicker text not null default '',
  lead text not null default '',
  detail text not null default '',
  note text not null default '',
  signals jsonb not null default '[]',
  published boolean not null default true,
  sort integer not null default 0
);

create table if not exists public.product_images (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  src text not null,
  alt text not null,
  width integer not null,
  height integer not null,
  sort integer not null default 0
);

create table if not exists public.product_variants (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  sort integer not null default 0,
  attrs jsonb not null
);

create table if not exists public.product_blocks (
  id text primary key,
  product_id text,
  kind text not null,
  payload jsonb not null
);

create table if not exists public.deals (
  id text primary key,
  title text not null,
  badge text not null,
  detail text not null,
  href text not null,
  price_label text,
  published boolean not null default true,
  sort integer not null default 0
);

create table if not exists public.featured_products (
  product_id text primary key references public.products (id) on delete cascade,
  sort integer not null
);

create table if not exists public.blog_posts (
  slug text primary key,
  product_id text not null,
  title text not null,
  description text not null,
  excerpt text not null,
  published_label text not null,
  published_iso date not null,
  reading_minutes integer not null,
  points jsonb not null default '[]',
  related_slug text,
  published boolean not null default true
);

create table if not exists public.blog_sections (
  id text primary key,
  post_slug text not null references public.blog_posts (slug) on delete cascade,
  section_id text not null,
  heading text not null,
  paragraphs jsonb not null default '[]',
  sort integer not null default 0
);

create table if not exists public.videos (
  id text primary key,
  product_id text not null,
  title text not null,
  youtube_id text not null,
  published boolean not null default true
);

create table if not exists public.help_articles (
  slug text primary key,
  title text not null,
  summary text not null,
  body text not null,
  sort integer not null default 0,
  published boolean not null default true
);

create table if not exists public.social_links (
  id text primary key,
  label text not null,
  href text not null,
  sort integer not null default 0
);

create table if not exists public.payment_methods (
  id text primary key,
  label text not null,
  sort integer not null default 0
);

create table if not exists public.support_links (
  href text primary key,
  label text not null,
  sort integer not null default 0
);

create table if not exists public.support_channels (
  id text primary key,
  label text not null,
  reply text not null,
  href text,
  sort integer not null default 0
);

create table if not exists public.page_copy (
  page text not null,
  key text not null,
  value text not null,
  primary key (page, key)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id),
  variant_id text,
  warehouse text not null default 'US',
  on_hand integer not null default 0,
  reserved integer not null default 0,
  unique (product_id, variant_id, warehouse)
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles (id),
  email text not null,
  guest boolean not null default true,
  status text not null default 'pending_payment',
  payment_status text not null default 'unpaid',
  payment_provider text,
  payment_reference text,
  subtotal numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id text not null,
  name text not null,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  color text
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  carrier text,
  tracking_number text,
  status text not null default 'preparing',
  shipped_at timestamptz,
  delivered_at timestamptz
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  user_id uuid references public.profiles (id),
  email text not null,
  reason text not null,
  status text not null default 'requested',
  requested_at timestamptz not null default now()
);

create table if not exists public.warranty_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  order_id text not null references public.orders (id),
  product_id text not null,
  serial text,
  registered_at timestamptz not null default now(),
  coverage_ends_at timestamptz
);

create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  name text not null,
  email text not null,
  order_id text not null,
  serial text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid references public.profiles (id),
  author text not null,
  body text not null,
  verified boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.policies enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_blocks enable row level security;
alter table public.deals enable row level security;
alter table public.featured_products enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_sections enable row level security;
alter table public.videos enable row level security;
alter table public.help_articles enable row level security;
alter table public.social_links enable row level security;
alter table public.payment_methods enable row level security;
alter table public.support_links enable row level security;
alter table public.support_channels enable row level security;
alter table public.page_copy enable row level security;
alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.warranty_registrations enable row level security;
alter table public.warranty_claims enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.site_settings, public.policies, public.categories, public.products,
  public.product_images, public.product_variants, public.product_blocks, public.deals,
  public.featured_products, public.blog_posts, public.blog_sections, public.videos,
  public.help_articles, public.social_links, public.payment_methods, public.support_links,
  public.support_channels, public.page_copy, public.reviews
  to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.orders, public.order_items, public.shipments, public.returns,
  public.warranty_registrations, public.warranty_claims to authenticated;

drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings for select to anon, authenticated using (published);

drop policy if exists policies_read on public.policies;
create policy policies_read on public.policies for select to anon, authenticated using (true);

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using (true);

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated using (published);

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images for select to anon, authenticated using (true);

drop policy if exists product_variants_read on public.product_variants;
create policy product_variants_read on public.product_variants for select to anon, authenticated using (true);

drop policy if exists product_blocks_read on public.product_blocks;
create policy product_blocks_read on public.product_blocks for select to anon, authenticated using (true);

drop policy if exists deals_read on public.deals;
create policy deals_read on public.deals for select to anon, authenticated using (published);

drop policy if exists featured_read on public.featured_products;
create policy featured_read on public.featured_products for select to anon, authenticated using (true);

drop policy if exists blog_posts_read on public.blog_posts;
create policy blog_posts_read on public.blog_posts for select to anon, authenticated using (published);

drop policy if exists blog_sections_read on public.blog_sections;
create policy blog_sections_read on public.blog_sections for select to anon, authenticated using (true);

drop policy if exists videos_read on public.videos;
create policy videos_read on public.videos for select to anon, authenticated using (published);

drop policy if exists help_read on public.help_articles;
create policy help_read on public.help_articles for select to anon, authenticated using (published);

drop policy if exists social_read on public.social_links;
create policy social_read on public.social_links for select to anon, authenticated using (true);

drop policy if exists payments_read on public.payment_methods;
create policy payments_read on public.payment_methods for select to anon, authenticated using (true);

drop policy if exists support_links_read on public.support_links;
create policy support_links_read on public.support_links for select to anon, authenticated using (true);

drop policy if exists support_channels_read on public.support_channels;
create policy support_channels_read on public.support_channels for select to anon, authenticated using (true);

drop policy if exists page_copy_read on public.page_copy;
create policy page_copy_read on public.page_copy for select to anon, authenticated using (true);

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated using (published);

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders for select to authenticated using (user_id = auth.uid());

drop policy if exists order_items_own on public.order_items;
create policy order_items_own on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists shipments_own on public.shipments;
create policy shipments_own on public.shipments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists returns_own on public.returns;
create policy returns_own on public.returns for select to authenticated using (user_id = auth.uid());

drop policy if exists warranty_reg_own on public.warranty_registrations;
create policy warranty_reg_own on public.warranty_registrations for select to authenticated using (user_id = auth.uid());

drop policy if exists warranty_claims_own on public.warranty_claims;
create policy warranty_claims_own on public.warranty_claims for select to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do update set name = excluded.name, email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
    values (v_id, v_product.id, v_product.name, v_product.price, v_qty, nullif(v_item->>'color', ''));
    v_subtotal := v_subtotal + v_product.price * v_qty;
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

create or replace function public.track_order(p_order text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_ship public.shipments%rowtype;
begin
  select * into v_order
  from public.orders
  where id = upper(trim(p_order)) and email = lower(trim(p_email));
  if not found then
    return jsonb_build_object('found', false);
  end if;
  select * into v_ship from public.shipments where order_id = v_order.id order by shipped_at desc nulls last limit 1;
  return jsonb_build_object(
    'found', true,
    'orderId', v_order.id,
    'status', v_order.status,
    'carrier', v_ship.carrier,
    'trackingNumber', v_ship.tracking_number,
    'shipmentStatus', coalesce(v_ship.status, 'preparing')
  );
end;
$$;

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
  insert into public.returns (order_id, user_id, email, reason)
  values (v_order.id, coalesce(auth.uid(), v_order.user_id), v_order.email, trim(p_reason));
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
  v_years integer;
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
  if exists (
    select 1 from public.warranty_registrations
    where user_id = auth.uid() and order_id = v_order.id and product_id = p_product
  ) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  v_years := case p_product
    when 'band' then 3
    when 'ring' then 2
    when 'straps' then null
    else 1
  end;
  v_end := case when v_years is null then null else now() + make_interval(years => v_years) end;
  insert into public.warranty_registrations (user_id, order_id, product_id, serial, coverage_ends_at)
  values (auth.uid(), v_order.id, p_product, nullif(trim(coalesce(p_serial, '')), ''), v_end);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.submit_warranty_claim(
  p_name text,
  p_email text,
  p_order text,
  p_serial text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_name, ''))) < 1
    or position('@' in coalesce(p_email, '')) = 0
    or length(trim(coalesce(p_order, ''))) < 1
    or length(trim(coalesce(p_message, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Enter your name, email, order number, and what happened.');
  end if;
  insert into public.warranty_claims (user_id, name, email, order_id, serial, message)
  values (
    auth.uid(),
    trim(p_name),
    lower(trim(p_email)),
    upper(trim(p_order)),
    nullif(trim(coalesce(p_serial, '')), ''),
    trim(p_message)
  );
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.submit_contact(p_name text, p_email text, p_message text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_name, ''))) < 1
    or position('@' in coalesce(p_email, '')) = 0
    or length(trim(coalesce(p_message, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Enter your name, email, and a message.');
  end if;
  insert into public.contact_messages (name, email, message)
  values (trim(p_name), lower(trim(p_email)), trim(p_message));
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.place_order(text, jsonb) from public;
revoke all on function public.track_order(text, text) from public;
revoke all on function public.request_return(text, text, text) from public;
revoke all on function public.register_warranty(text, text, text) from public;
revoke all on function public.submit_warranty_claim(text, text, text, text, text) from public;
revoke all on function public.submit_contact(text, text, text) from public;

grant execute on function public.place_order(text, jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.request_return(text, text, text) to anon, authenticated;
grant execute on function public.register_warranty(text, text, text) to authenticated;
grant execute on function public.submit_warranty_claim(text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_contact(text, text, text) to anon, authenticated;
