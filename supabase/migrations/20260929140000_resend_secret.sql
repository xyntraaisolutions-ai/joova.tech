-- Password reset mail uses Resend. The API key lives in Supabase Vault, not in the app.

create extension if not exists supabase_vault with schema vault;

update public.email_templates
set
  from_name = 'Joova Customer Support',
  from_email = 'support@joova.tech',
  updated_at = now()
where id = 'password_reset';

drop table if exists public.mail_settings;

create or replace function public.read_resend_key()
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
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'RESEND_API_KEY'
  limit 1;
  return secret;
end;
$$;

create or replace function public.set_resend_key(p_key text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  existing uuid;
  cleaned text := trim(p_key);
begin
  if auth.role() is distinct from 'service_role'
    and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'not allowed';
  end if;
  if cleaned is null or length(cleaned) < 8 then
    raise exception 'missing key';
  end if;
  select id into existing from vault.secrets where name = 'RESEND_API_KEY' limit 1;
  if existing is null then
    perform vault.create_secret(cleaned, 'RESEND_API_KEY', 'Resend API key for Joova email');
  else
    perform vault.update_secret(existing, cleaned, 'RESEND_API_KEY', 'Resend API key for Joova email');
  end if;
end;
$$;

create or replace function public.resend_key_configured()
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret text;
begin
  if auth.role() is distinct from 'service_role' then
    return false;
  end if;
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'RESEND_API_KEY'
  limit 1;
  return secret is not null and length(secret) > 8;
end;
$$;

revoke all on function public.read_resend_key() from public, anon, authenticated;
revoke all on function public.set_resend_key(text) from public, anon, authenticated;
revoke all on function public.resend_key_configured() from public, anon, authenticated;
grant execute on function public.read_resend_key() to service_role;
grant execute on function public.set_resend_key(text) to service_role;
grant execute on function public.resend_key_configured() to service_role;
