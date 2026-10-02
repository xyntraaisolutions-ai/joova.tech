-- Website signups always start as customers. A later portal update can assign staff roles.
-- An existing Super Admin row keeps its role.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'customer'
  )
  on conflict (id) do update set name = excluded.name, email = excluded.email;
  return new;
end;
$$;
