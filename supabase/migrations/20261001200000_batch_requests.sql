-- Manufacturer batch orders and per-product low-stock watches.
-- inventory_batches stays the stock-receipt ledger. These tables are purchase requests.

create table if not exists public.inventory_batch_requests (
  id uuid primary key default gen_random_uuid(),
  vendor text not null default '',
  status text not null default 'draft',
  notes text not null default '',
  shipping_cost numeric(12, 2) not null default 0,
  misc_cost numeric(12, 2) not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (status in ('draft', 'review', 'ordered', 'shipped', 'delivered', 'delayed', 'abandoned', 'completed')),
  check (shipping_cost >= 0),
  check (misc_cost >= 0)
);

create table if not exists public.inventory_batch_request_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.inventory_batch_requests (id) on delete cascade,
  product_id text references public.products (id),
  product_name text not null default '',
  joova_model text not null default '',
  manufacturer_model text not null default '',
  quantity integer not null,
  unit_price numeric(12, 2) not null default 0,
  unit_discount numeric(12, 2) not null default 0,
  notes text not null default '',
  sort integer not null default 0,
  check (quantity > 0),
  check (unit_price >= 0),
  check (unit_discount >= 0),
  check (unit_discount <= unit_price)
);

create table if not exists public.inventory_batch_request_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.inventory_batch_requests (id) on delete cascade,
  name text not null,
  path text not null,
  content_type text not null default 'application/pdf',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.inventory_low_stock (
  product_id text primary key references public.products (id) on delete cascade,
  enabled boolean not null default false,
  threshold integer not null default 5,
  notify boolean not null default true,
  watcher_emails text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (threshold >= 0)
);

create index if not exists inventory_batch_requests_status_idx
  on public.inventory_batch_requests (status)
  where deleted_at is null;

create index if not exists inventory_batch_request_items_batch_idx
  on public.inventory_batch_request_items (batch_id);

alter table public.inventory_batch_requests enable row level security;
alter table public.inventory_batch_request_items enable row level security;
alter table public.inventory_batch_request_files enable row level security;
alter table public.inventory_low_stock enable row level security;

drop policy if exists inventory_batch_requests_staff on public.inventory_batch_requests;
create policy inventory_batch_requests_staff on public.inventory_batch_requests
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists inventory_batch_request_items_staff on public.inventory_batch_request_items;
create policy inventory_batch_request_items_staff on public.inventory_batch_request_items
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists inventory_batch_request_files_staff on public.inventory_batch_request_files;
create policy inventory_batch_request_files_staff on public.inventory_batch_request_files
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

drop policy if exists inventory_low_stock_staff on public.inventory_low_stock;
create policy inventory_low_stock_staff on public.inventory_low_stock
  for all to authenticated
  using (public.app_role() in ('inventory', 'super_admin'))
  with check (public.app_role() in ('inventory', 'super_admin'));

grant select, insert, update, delete on public.inventory_batch_requests to authenticated;
grant select, insert, update, delete on public.inventory_batch_request_items to authenticated;
grant select, insert, update, delete on public.inventory_batch_request_files to authenticated;
grant select, insert, update, delete on public.inventory_low_stock to authenticated;

insert into storage.buckets (id, name, public)
values ('batch-files', 'batch-files', false)
on conflict (id) do nothing;
