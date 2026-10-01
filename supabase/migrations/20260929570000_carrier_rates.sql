-- US carrier rate brackets. Weights are pounds and sizes are inches.
-- our_price stays null until a Joova price is entered.

create table if not exists public.shipping_carrier_rates (
  id uuid primary key default gen_random_uuid(),
  carrier text not null check (carrier in ('usps', 'ups', 'fedex')),
  service text not null check (char_length(btrim(service)) between 1 and 80),
  max_weight_lb numeric(8, 2) not null check (max_weight_lb > 0 and max_weight_lb <= 150),
  max_length_in numeric(8, 2) not null check (max_length_in > 0 and max_length_in <= 108),
  max_width_in numeric(8, 2) not null check (max_width_in > 0 and max_width_in <= 108),
  max_height_in numeric(8, 2) not null check (max_height_in > 0 and max_height_in <= 108),
  carrier_price numeric(10, 2) not null check (carrier_price >= 0 and carrier_price <= 100000),
  our_price numeric(10, 2) check (our_price is null or (our_price >= 0 and our_price <= 100000)),
  sort integer not null default 0
);

alter table public.shipping_carrier_rates enable row level security;

drop policy if exists shipping_carrier_rates_read on public.shipping_carrier_rates;
create policy shipping_carrier_rates_read on public.shipping_carrier_rates
  for select to anon, authenticated
  using (true);

drop policy if exists shipping_carrier_rates_write on public.shipping_carrier_rates;
create policy shipping_carrier_rates_write on public.shipping_carrier_rates
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

grant select on public.shipping_carrier_rates to anon, authenticated;
grant insert, update, delete on public.shipping_carrier_rates to authenticated;
