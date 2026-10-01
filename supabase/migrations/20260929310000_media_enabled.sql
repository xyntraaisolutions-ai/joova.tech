-- Hide a picture from the shop without removing it.

alter table public.product_images
  add column if not exists enabled boolean not null default true;

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images for select to anon, authenticated
  using (deleted_at is null and enabled);
