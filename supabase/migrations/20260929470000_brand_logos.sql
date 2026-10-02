-- One logo library. Uploading keeps older files. One row is primary.

create table if not exists public.brand_logos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null default '',
  url text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists brand_logos_one_active
  on public.brand_logos (active)
  where active;

alter table public.brand_logos enable row level security;

drop policy if exists brand_logos_public_read on public.brand_logos;
create policy brand_logos_public_read on public.brand_logos
  for select to anon, authenticated
  using (active);

drop policy if exists brand_logos_admin_read on public.brand_logos;
create policy brand_logos_admin_read on public.brand_logos
  for select to authenticated
  using (public.app_role() = 'super_admin');

drop policy if exists brand_logos_admin_insert on public.brand_logos;
create policy brand_logos_admin_insert on public.brand_logos
  for insert to authenticated
  with check (public.app_role() = 'super_admin');

drop policy if exists brand_logos_admin_update on public.brand_logos;
create policy brand_logos_admin_update on public.brand_logos
  for update to authenticated
  using (public.app_role() = 'super_admin')
  with check (public.app_role() = 'super_admin');

drop policy if exists brand_logos_admin_delete on public.brand_logos;
create policy brand_logos_admin_delete on public.brand_logos
  for delete to authenticated
  using (public.app_role() = 'super_admin');

grant select on public.brand_logos to anon, authenticated;
grant insert, update, delete on public.brand_logos to authenticated;

create or replace function public.set_brand_logo_active(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and public.app_role() is distinct from 'super_admin' then
    raise exception 'not_allowed';
  end if;
  if not exists (select 1 from public.brand_logos where id = p_id) then
    raise exception 'missing';
  end if;
  update public.brand_logos set active = false where active and id is distinct from p_id;
  update public.brand_logos set active = true where id = p_id;
end;
$$;

revoke all on function public.set_brand_logo_active(uuid) from public, anon;
grant execute on function public.set_brand_logo_active(uuid) to authenticated, service_role;

insert into public.brand_logos (url, width, height, active)
select '/brand/joova-wordmark-color.png', 917, 191, true
where not exists (select 1 from public.brand_logos);
