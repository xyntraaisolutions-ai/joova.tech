-- Guest orders placed with an email belong to the customer who later registers that email.

create or replace function public.claim_orders_for_email(p_user uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if p_user is null or v_email = '' then
    return;
  end if;

  update public.orders
  set user_id = p_user,
      guest = false
  where user_id is null
    and lower(email) = v_email;

  update public.returns r
  set user_id = p_user
  from public.orders o
  where r.order_id = o.id
    and o.user_id = p_user
    and r.user_id is null
    and lower(r.email) = v_email;

  update public.warranty_claims c
  set user_id = p_user
  from public.orders o
  where c.order_id = o.id
    and o.user_id = p_user
    and c.user_id is null
    and lower(c.email) = v_email;
end;
$$;

revoke all on function public.claim_orders_for_email(uuid, text) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(new.email, '')));
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(v_email, '@', 1)),
    v_email,
    'customer'
  )
  on conflict (id) do update set name = excluded.name, email = excluded.email;

  perform public.claim_orders_for_email(new.id, v_email);
  return new;
end;
$$;

create or replace function public.attach_guest_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if new.user_id is not null then
    return new;
  end if;
  select id into v_user
  from public.profiles
  where lower(email) = lower(trim(coalesce(new.email, '')))
    and role = 'customer'
    and deleted_at is null
  limit 1;
  if v_user is not null then
    new.user_id := v_user;
    new.guest := false;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_attach_customer on public.orders;
create trigger orders_attach_customer
  before insert on public.orders
  for each row execute function public.attach_guest_order();

do $$
declare
  v_row record;
begin
  for v_row in
    select id, email
    from public.profiles
    where role = 'customer'
      and deleted_at is null
  loop
    perform public.claim_orders_for_email(v_row.id, v_row.email);
  end loop;
end $$;
