-- One row per physical unit received from a manufacturer. Serial is required and unique.

create table if not exists public.inventory_serials (
  id uuid primary key default gen_random_uuid(),
  serial text not null,
  manufacturer_sku text not null default '',
  manufacturer_model text not null default '',
  manufacturer_warranty text not null default '',
  product_name text not null default '',
  color text not null default '',
  product_type text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (length(btrim(serial)) > 0)
);

create unique index if not exists inventory_serials_serial_idx
  on public.inventory_serials (lower(btrim(serial)))
  where deleted_at is null;

create index if not exists inventory_serials_created_idx
  on public.inventory_serials (created_at desc)
  where deleted_at is null;

alter table public.inventory_serials enable row level security;

drop policy if exists inventory_serials_staff on public.inventory_serials;
create policy inventory_serials_staff on public.inventory_serials
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

grant select, insert, update, delete on public.inventory_serials to authenticated;
