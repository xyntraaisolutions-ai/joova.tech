-- The Super Admin is the email stored as SUPER_ADMIN_EMAIL. Portal users cannot change that account.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.super_admin_email (
  id integer primary key check (id = 1),
  email text not null
);
revoke all on table private.super_admin_email from public, anon, authenticated;

create or replace function public.read_super_admin_email()
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret text;
begin
  if auth.role() is distinct from 'service_role' then
    return null;
  end if;
  select lower(trim(decrypted_secret)) into secret
  from vault.decrypted_secrets
  where name = 'SUPER_ADMIN_EMAIL'
  limit 1;
  return secret;
end;
$$;

create or replace function public.super_admin_password_ok(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  stored text;
  ok boolean;
begin
  if auth.role() is distinct from 'service_role' then
    return false;
  end if;
  if p_password is null or length(p_password) < 1 or p_email is null then
    return false;
  end if;
  select encrypted_password into stored
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
  if stored is null or length(stored) < 4 then
    return false;
  end if;
  begin
    ok := stored = extensions.crypt(p_password, stored);
  exception when others then
    return false;
  end;
  return coalesce(ok, false);
end;
$$;

create or replace function public.sync_super_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  locked text := lower(trim(p_email));
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'not allowed';
  end if;
  if locked is null or position('@' in locked) = 0 then
    raise exception 'missing email';
  end if;
  insert into private.super_admin_email (id, email)
  values (1, locked)
  on conflict (id) do update set email = excluded.email;
  perform set_config('joova.super_admin_backend', 'on', true);
  perform set_config('joova.profile_admin', 'on', true);
  update public.profiles
  set role = 'customer'
  where role = 'super_admin' and lower(email) <> locked;
  update public.profiles
  set role = 'super_admin', active = true, deleted_at = null
  where lower(email) = locked;
end;
$$;

create or replace function public.protect_super_admin_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  locked text;
begin
  if current_setting('joova.super_admin_backend', true) = 'on' then
    return new;
  end if;
  select lower(email) into locked from private.super_admin_email where id = 1;
  if locked is not null and lower(old.email) = locked and (
    new.role is distinct from 'super_admin'
    or new.active is distinct from true
    or new.deleted_at is not null
    or lower(new.email) is distinct from lower(old.email)
  ) then
    raise exception 'The Super Admin can only be changed from the backend.';
  end if;
  if locked is not null and new.role = 'super_admin' and lower(new.email) is distinct from locked then
    raise exception 'Super Admin is assigned from the backend.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_super_admin_row on public.profiles;
create trigger protect_super_admin_row
  before update on public.profiles
  for each row execute function public.protect_super_admin_row();

create or replace function public.set_user_role(p_id uuid, p_role text, p_active boolean, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  locked text;
begin
  if public.app_role() is distinct from 'super_admin' then
    return jsonb_build_object('ok', false, 'error', 'Only a Super Admin can change users.');
  end if;
  if p_role = 'super_admin' then
    return jsonb_build_object('ok', false, 'error', 'Super Admin is assigned from the backend.');
  end if;
  if p_role not in ('customer', 'csr', 'inventory', 'content') then
    return jsonb_build_object('ok', false, 'error', 'Choose a valid role.');
  end if;
  if not exists (select 1 from public.profiles where id = p_id) then
    return jsonb_build_object('ok', false, 'error', 'That person does not have an account.');
  end if;
  select lower(email) into locked from private.super_admin_email where id = 1;
  if locked is not null and exists (
    select 1 from public.profiles where id = p_id and lower(email) = locked
  ) then
    return jsonb_build_object('ok', false, 'error', 'The Super Admin can only be changed from the backend.');
  end if;
  perform set_config('joova.profile_admin', 'on', true);
  update public.profiles set role = p_role, active = p_active where id = p_id;
  perform public.record_audit('set_role', 'profiles', p_id::text, jsonb_build_object('role', p_role, 'active', p_active), p_view_as);
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.read_super_admin_email() from public, anon, authenticated;
revoke all on function public.super_admin_password_ok(text, text) from public, anon, authenticated;
revoke all on function public.sync_super_admin(text) from public, anon, authenticated;
grant execute on function public.read_super_admin_email() to service_role;
grant execute on function public.super_admin_password_ok(text, text) to service_role;
grant execute on function public.sync_super_admin(text) to service_role;
