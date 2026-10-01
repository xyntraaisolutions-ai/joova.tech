-- Avalara ZIP tables include Puerto Rico. Checkout can use those rates.

do $$
declare
  src text;
begin
  select pg_get_functiondef('public.begin_checkout(text,jsonb,jsonb)'::regprocedure) into src;
  if src not like '%''PR''%' then
    src := replace(src, '''PA'',''RI''', '''PA'',''PR'',''RI''');
    execute src;
  end if;
end $$;
