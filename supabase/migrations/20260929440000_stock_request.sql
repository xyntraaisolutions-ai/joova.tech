alter table public.contact_messages
  add column if not exists kind text not null default 'message';

alter table public.contact_messages
  drop constraint if exists contact_messages_kind_check;

alter table public.contact_messages
  add constraint contact_messages_kind_check
  check (kind in ('message', 'customer_request'));

create or replace function public.submit_stock_request(p_name text, p_email text, p_message text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_name, ''))) < 1
    or position('@' in coalesce(p_email, '')) = 0
    or length(trim(coalesce(p_message, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Enter your name, email, and a note.');
  end if;
  insert into public.contact_messages (name, email, message, kind)
  values (trim(p_name), lower(trim(p_email)), trim(p_message), 'customer_request');
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_stock_request(text, text, text) from public;
grant execute on function public.submit_stock_request(text, text, text) to anon, authenticated;
