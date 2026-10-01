-- Other places to buy Joova, shown under the business address and edited in the footer.

create table if not exists public.store_links (
  id text primary key,
  label text not null,
  href text not null default '',
  enabled boolean not null default true,
  sort integer not null default 0,
  deleted_at timestamptz
);

alter table public.store_links enable row level security;

drop policy if exists stores_read on public.store_links;
create policy stores_read on public.store_links for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists content_stores on public.store_links;
create policy content_stores on public.store_links for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

grant select on public.store_links to anon, authenticated;
grant insert, update, delete on public.store_links to authenticated;

insert into public.store_links (id, label, href, enabled, sort) values
  ('amazon', 'Amazon (FBA)', '', true, 0),
  ('tiktok-shop', 'TikTok Shop', '', true, 1),
  ('walmart', 'Walmart Marketplace', '', true, 2),
  ('best-buy', 'Best Buy Marketplace', '', true, 3),
  ('target', 'Target Plus', '', true, 4)
on conflict (id) do update set label = excluded.label, sort = excluded.sort;
