-- Keep the latest Avalara CSV folder. A successful upload replaces the previous files
-- and rebuilds the ZIP tax table from those files.

alter table public.us_zip_tax_rates add column if not exists import_id uuid;

create table if not exists public.tax_csv_files (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.tax_imports (id) on delete cascade,
  filename text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (import_id, filename)
);

alter table public.tax_csv_files enable row level security;

drop policy if exists tax_csv_files_read on public.tax_csv_files;
create policy tax_csv_files_read on public.tax_csv_files
  for select to authenticated
  using (public.app_role() = 'super_admin');

grant select on public.tax_csv_files to authenticated;

create or replace function public.replace_zip_tax_rates(p_import uuid, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not_allowed';
  end if;
  delete from public.us_zip_tax_rates;
  insert into public.us_zip_tax_rates (
    zip, state, region_name, combined_rate, state_rate, county_rate, city_rate, special_rate, risk_level, updated_at, import_id
  )
  select
    zip, state, region_name, combined_rate, state_rate, county_rate, city_rate, special_rate, risk_level, now(), p_import
  from jsonb_to_recordset(p_rows) as row(
    zip text,
    state text,
    region_name text,
    combined_rate numeric,
    state_rate numeric,
    county_rate numeric,
    city_rate numeric,
    special_rate numeric,
    risk_level integer
  );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.replace_zip_tax_rates(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_zip_tax_rates(uuid, jsonb) to service_role;
