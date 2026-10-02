-- Header and footer links edited from the content portal.

create table if not exists public.nav_items (
  id text primary key,
  area text not null check (area in ('header', 'footer')),
  parent_id text,
  kind text not null default 'link' check (kind in ('link', 'menu', 'products')),
  label text not null,
  href text not null default '',
  sort integer not null default 0,
  published boolean not null default true,
  deleted_at timestamptz
);

alter table public.nav_items enable row level security;

grant select on public.nav_items to anon, authenticated;
grant insert, update, delete on public.nav_items to authenticated;

drop policy if exists nav_items_read on public.nav_items;
create policy nav_items_read on public.nav_items for select to anon, authenticated
  using (published and deleted_at is null);

drop policy if exists nav_items_staff on public.nav_items;
create policy nav_items_staff on public.nav_items for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

insert into public.nav_items (id, area, parent_id, kind, label, href, sort) values
  ('header-shop', 'header', null, 'link', 'Shop', '/shop', 0),
  ('header-deals', 'header', null, 'link', 'Deals', '/deals', 1),
  ('header-products', 'header', null, 'products', 'Products', '/shop', 2),
  ('header-videos', 'header', null, 'link', 'Videos', '/videos', 3),
  ('header-blog', 'header', null, 'link', 'Blogs', '/blog', 4),
  ('header-about', 'header', null, 'link', 'About', '/about', 5),
  ('header-support', 'header', null, 'menu', 'Support', '/help', 6),
  ('header-support-help', 'header', 'header-support', 'link', 'FAQs', '/help', 0),
  ('header-support-contact', 'header', 'header-support', 'link', 'Contact Us', '/contact', 1),
  ('header-support-app', 'header', 'header-support', 'link', 'APP Download', '/app', 2),
  ('footer-customer', 'footer', null, 'menu', 'Customer', '', 0),
  ('footer-reviews', 'footer', 'footer-customer', 'link', 'Reviews', '/reviews', 0),
  ('footer-track', 'footer', 'footer-customer', 'link', 'Track order', '/track', 1),
  ('footer-warranty', 'footer', 'footer-customer', 'link', 'Warranty', '/warranty', 2),
  ('footer-legal', 'footer', null, 'menu', 'Legal', '', 1),
  ('footer-privacy', 'footer', 'footer-legal', 'link', 'Privacy', '/privacy', 0),
  ('footer-terms', 'footer', 'footer-legal', 'link', 'Terms', '/terms', 1),
  ('footer-accessibility', 'footer', 'footer-legal', 'link', 'Accessibility', '/accessibility', 2)
on conflict (id) do nothing;
