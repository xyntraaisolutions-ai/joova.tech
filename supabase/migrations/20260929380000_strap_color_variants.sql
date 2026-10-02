-- Color choices for the Fitness Band Strap, with each color picture on that choice.

insert into public.product_variants (id, product_id, sort, sku, is_default, deleted_at, attrs)
values
  ('strap-black', 'joova_fitness_band_strap_jtfbs01', 0, null, true, null, '{"axis":"color","name":"Black","available":true,"image":"/bands/joova-band-black-1600.png"}'::jsonb),
  ('strap-green', 'joova_fitness_band_strap_jtfbs01', 1, null, false, null, '{"axis":"color","name":"Green","available":true,"image":"/bands/joova-band-green-1600.png"}'::jsonb),
  ('strap-orange', 'joova_fitness_band_strap_jtfbs01', 2, null, false, null, '{"axis":"color","name":"Orange","available":true,"image":"/bands/joova-band-orange-1600.png"}'::jsonb),
  ('strap-blue', 'joova_fitness_band_strap_jtfbs01', 3, null, false, null, '{"axis":"color","name":"Blue","available":true,"image":"/bands/joova-band-blue-1600.png"}'::jsonb),
  ('strap-red', 'joova_fitness_band_strap_jtfbs01', 4, null, false, null, '{"axis":"color","name":"Red","available":true,"image":"/bands/joova-band-red-1600.png"}'::jsonb)
on conflict (id) do update set
  product_id = excluded.product_id,
  sort = excluded.sort,
  sku = excluded.sku,
  is_default = excluded.is_default,
  deleted_at = null,
  attrs = excluded.attrs;

update public.product_images as image
set variant_id = variant.id,
    focused = false
from public.product_variants as variant
where image.product_id = 'joova_fitness_band_strap_jtfbs01'
  and variant.product_id = image.product_id
  and image.deleted_at is null
  and image.variant_id is null
  and image.src = variant.attrs->>'image';
