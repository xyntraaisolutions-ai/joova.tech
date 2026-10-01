-- Countries Joova sells to on the website. United States stays enabled.
-- Country prices stay when a country is turned off, so turning it back on restores them.

create table if not exists public.sell_countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  currency text not null check (char_length(currency) = 3),
  enabled boolean not null default true,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_country_prices (
  product_id text not null references public.products (id) on update cascade on delete cascade,
  country_code text not null references public.sell_countries (code),
  price numeric(10, 2),
  sale_price numeric(10, 2),
  primary key (product_id, country_code)
);

insert into public.sell_countries (code, name, currency, enabled, locked)
values ('US', 'United States', 'USD', true, true)
on conflict (code) do update
set name = excluded.name,
    currency = excluded.currency,
    enabled = true,
    locked = true;

create or replace function public.protect_sell_country()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.locked then
    raise exception 'locked';
  end if;
  if tg_op = 'UPDATE' and old.locked then
    new.code := old.code;
    new.name := old.name;
    new.currency := old.currency;
    new.enabled := true;
    new.locked := true;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_sell_country on public.sell_countries;
create trigger protect_sell_country
  before update or delete on public.sell_countries
  for each row execute function public.protect_sell_country();

alter table public.sell_countries enable row level security;
alter table public.product_country_prices enable row level security;

drop policy if exists sell_countries_public_read on public.sell_countries;
create policy sell_countries_public_read on public.sell_countries
  for select to anon, authenticated
  using (enabled);

drop policy if exists sell_countries_admin_read on public.sell_countries;
create policy sell_countries_admin_read on public.sell_countries
  for select to authenticated
  using (public.app_role() = 'super_admin');

drop policy if exists sell_countries_admin_write on public.sell_countries;
create policy sell_countries_admin_write on public.sell_countries
  for all to authenticated
  using (public.app_role() = 'super_admin')
  with check (public.app_role() = 'super_admin');

drop policy if exists product_country_prices_read on public.product_country_prices;
create policy product_country_prices_read on public.product_country_prices
  for select to anon, authenticated
  using (true);

drop policy if exists product_country_prices_write on public.product_country_prices;
create policy product_country_prices_write on public.product_country_prices
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

grant select on public.sell_countries to anon, authenticated;
grant insert, update, delete on public.sell_countries to authenticated;
grant select on public.product_country_prices to anon, authenticated;
grant insert, update, delete on public.product_country_prices to authenticated;
