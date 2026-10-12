-- Checkout can ask whether an email belongs to a staff account without reading the profile.

create or replace function public.internal_account_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(email) = lower(trim(coalesce(p_email, '')))
      and deleted_at is null
      and role <> 'customer'
  );
$$;

revoke all on function public.internal_account_email(text) from public;
grant execute on function public.internal_account_email(text) to anon, authenticated;
