-- United States shipping choices set in Fulfillment settings and applied per product.

create table if not exists public.shipping_options (
  code text primary key check (code in ('free', 'standard', 'expedited')),
  name text not null,
  price numeric(10, 2) not null check (price >= 0 and price <= 100000),
  min_days integer not null check (min_days >= 0 and min_days <= 60),
  max_days integer not null check (max_days >= 0 and max_days <= 60),
  enabled boolean not null default true,
  sort integer not null,
  constraint shipping_options_window check (max_days >= min_days)
);

create table if not exists public.product_shipping (
  product_id text primary key references public.products (id) on update cascade on delete cascade
);

create table if not exists public.product_shipping_options (
  product_id text not null references public.product_shipping (product_id) on update cascade on delete cascade,
  option_code text not null references public.shipping_options (code),
  primary key (product_id, option_code)
);

insert into public.shipping_options (code, name, price, min_days, max_days, enabled, sort)
values
  ('free', 'Free Shipping', 0, 7, 10, true, 1),
  ('standard', 'Standard Shipping', 0, 5, 7, true, 2),
  ('expedited', 'Expedited Shipping', 0, 2, 3, true, 3)
on conflict (code) do nothing;

alter table public.shipping_options enable row level security;
alter table public.product_shipping enable row level security;
alter table public.product_shipping_options enable row level security;

drop policy if exists shipping_options_public_read on public.shipping_options;
create policy shipping_options_public_read on public.shipping_options
  for select to anon, authenticated
  using (enabled);

drop policy if exists shipping_options_staff_read on public.shipping_options;
create policy shipping_options_staff_read on public.shipping_options
  for select to authenticated
  using (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists shipping_options_staff_write on public.shipping_options;
create policy shipping_options_staff_write on public.shipping_options
  for update to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists product_shipping_read on public.product_shipping;
create policy product_shipping_read on public.product_shipping
  for select to anon, authenticated
  using (true);

drop policy if exists product_shipping_write on public.product_shipping;
create policy product_shipping_write on public.product_shipping
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists product_shipping_options_read on public.product_shipping_options;
create policy product_shipping_options_read on public.product_shipping_options
  for select to anon, authenticated
  using (true);

drop policy if exists product_shipping_options_write on public.product_shipping_options;
create policy product_shipping_options_write on public.product_shipping_options
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

grant select on public.shipping_options to anon, authenticated;
grant update on public.shipping_options to authenticated;
grant select on public.product_shipping to anon, authenticated;
grant insert, update, delete on public.product_shipping to authenticated;
grant select on public.product_shipping_options to anon, authenticated;
grant insert, update, delete on public.product_shipping_options to authenticated;
