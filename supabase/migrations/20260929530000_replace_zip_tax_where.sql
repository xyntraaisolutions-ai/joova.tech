-- A full replace must name a column. The database rejects DELETE with no WHERE clause.

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
  delete from public.us_zip_tax_rates where zip is not null;
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
