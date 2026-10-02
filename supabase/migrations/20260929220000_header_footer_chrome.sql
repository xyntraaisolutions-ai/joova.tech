-- Header notices, slogan, and footer copy edited from the content portal.
-- One highlight picture per product.

alter table public.site_settings
  add column if not exists notice_primary text not null default 'This Website is in Development Phase',
  add column if not exists notice_primary_enabled boolean not null default true,
  add column if not exists notice_secondary text not null default 'Free US shipping · 30-day free returns',
  add column if not exists notice_secondary_enabled boolean not null default true,
  add column if not exists header_slogan text not null default 'Smarter Tech | Bigger Tomorrow',
  add column if not exists footer_blurb text not null default 'Joova brings smart, simple and fairly priced technology into everyday life. Built by Joova Tech LLC in the USA. Smarter Tech | Bigger Tomorrow.',
  add column if not exists footer_marketplaces text not null default 'Also on Amazon and TikTok Shop (links coming).';

update public.site_settings
set notice_secondary = announcement
where id = 1 and announcement <> '';

with picked as (
  select distinct on (product_id) id
  from public.product_images
  where deleted_at is null
  order by product_id, focused desc, random()
)
update public.product_images as image
set focused = image.id in (select id from picked)
where image.deleted_at is null;

create unique index if not exists product_images_one_focus
  on public.product_images (product_id)
  where focused and deleted_at is null;
