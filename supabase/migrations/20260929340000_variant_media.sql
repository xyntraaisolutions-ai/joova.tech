-- Variant options, a default variant, and pictures or videos that belong to one variant.

alter table public.product_variants
  add column if not exists is_default boolean not null default false;

alter table public.product_images
  add column if not exists variant_id text;

alter table public.videos
  add column if not exists variant_id text;

create index if not exists product_images_variant_idx on public.product_images (variant_id);
create index if not exists videos_variant_idx on public.videos (variant_id);

create unique index if not exists product_variants_one_default
  on public.product_variants (product_id)
  where is_default and deleted_at is null;
