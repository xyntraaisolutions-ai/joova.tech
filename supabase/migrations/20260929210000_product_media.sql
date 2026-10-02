-- Product galleries and uploaded videos, edited from the inventory portal.

alter table public.product_images
  add column if not exists focused boolean not null default false;

with first_image as (
  select distinct on (product_id) id
  from public.product_images
  where deleted_at is null
  order by product_id, sort, id
)
update public.product_images
set focused = true
where id in (select id from first_image)
  and not exists (
    select 1 from public.product_images other
    where other.product_id = product_images.product_id
      and other.focused
      and other.deleted_at is null
      and other.id <> product_images.id
  );

alter table public.videos
  add column if not exists src text not null default '',
  add column if not exists poster text not null default '',
  add column if not exists sort integer not null default 0;

drop policy if exists content_videos on public.videos;
create policy content_videos on public.videos for all to authenticated
  using (public.app_role() in ('content', 'inventory', 'super_admin'))
  with check (public.app_role() in ('content', 'inventory', 'super_admin'));

drop policy if exists media_inventory_insert on storage.objects;
create policy media_inventory_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.app_role() = 'inventory');
