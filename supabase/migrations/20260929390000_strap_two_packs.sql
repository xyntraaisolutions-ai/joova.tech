-- Two-strap packs. Each variant is one pair of the single-strap colors, using those same pictures.

insert into public.products (
  id, name, menu_label, href, category_id, also_in, price, sale_price, on_sale, price_label, status, summary,
  kicker, lead, detail, note, signals, published, sort, sku, top_pick, warranty_eligible, warranty_years, warranty_days, commerce
)
select
  'joova_band_strap_2pk_jtfbs03',
  'Joova Fitness Band Strap 2 Pack',
  'Strap 2 Pack',
  '/joova_band_strap_2pk_jtfbs03',
  category_id,
  also_in,
  21.98,
  15.98,
  true,
  '$15.98',
  status,
  'Two woven straps without the tracker. Each pack is two different colors.',
  kicker,
  'Two straps, without the band.',
  'Each pack is two different colors. The tracker and magnetic cable stay with the Joova Band.',
  note,
  '[{"label":"Colors","text":"Two different colors"},{"label":"Price","text":"$15.98"},{"label":"Warranty","text":"Lifetime, after registration"}]'::jsonb,
  true,
  sort + 1,
  'SKUJTFBS03',
  false,
  warranty_eligible,
  warranty_years,
  warranty_days,
  commerce || jsonb_build_object(
    'model', 'JTFBS03',
    'seoTitle', 'Two woven straps',
    'seoDescription', 'Two replacement or extra colors. Each pack is two different colors. The band box already includes straps.'
  )
from public.products
where id = 'joova_fitness_band_strap_jtfbs01'
on conflict (id) do update set
  name = excluded.name,
  menu_label = excluded.menu_label,
  href = excluded.href,
  price = excluded.price,
  sale_price = excluded.sale_price,
  on_sale = excluded.on_sale,
  price_label = excluded.price_label,
  summary = excluded.summary,
  lead = excluded.lead,
  detail = excluded.detail,
  signals = excluded.signals,
  sku = excluded.sku,
  published = true,
  deleted_at = null,
  commerce = excluded.commerce;

insert into public.products (
  id, name, menu_label, href, category_id, also_in, price, sale_price, on_sale, price_label, status, summary,
  kicker, lead, detail, note, signals, published, sort, sku, top_pick, warranty_eligible, warranty_years, warranty_days, commerce
)
select
  'joova_band_plus_strap_2pk_jtfbs04',
  'Joova Fitness Band Plus Strap 2 Pack',
  'ECG strap 2 Pack',
  '/joova_band_plus_strap_2pk_jtfbs04',
  category_id,
  also_in,
  25.98,
  null,
  false,
  '$25.98',
  status,
  'Two 22 mm woven straps for the Joova Band ECG J02, without the tracker. Each pack is two different colors.',
  kicker,
  'Two straps, without the tracker.',
  'Each pack is two different 22 mm woven straps for the Joova Band ECG J02. The tracker is not included.',
  note,
  '[]'::jsonb,
  true,
  sort + 1,
  'SKUJTFBS04',
  false,
  warranty_eligible,
  warranty_years,
  warranty_days,
  commerce || jsonb_build_object(
    'model', 'JTFBS04',
    'seoTitle', 'Two Joova Band ECG straps',
    'seoDescription', 'Two 22 mm woven straps for the Joova Band ECG J02. Each pack is two different colors.'
  )
from public.products
where id = 'joova_fitness_band_plus_strap_jtfbs02'
on conflict (id) do update set
  name = excluded.name,
  menu_label = excluded.menu_label,
  href = excluded.href,
  price = excluded.price,
  sale_price = excluded.sale_price,
  on_sale = excluded.on_sale,
  price_label = excluded.price_label,
  summary = excluded.summary,
  lead = excluded.lead,
  detail = excluded.detail,
  sku = excluded.sku,
  published = true,
  deleted_at = null,
  commerce = excluded.commerce;

insert into public.inventory (product_id, variant_id, warehouse, on_hand, reserved)
select id, null, 'US', 0, 0
from public.products
where id in ('joova_band_strap_2pk_jtfbs03', 'joova_band_plus_strap_2pk_jtfbs04')
  and not exists (
    select 1 from public.inventory stock
    where stock.product_id = products.id and stock.variant_id is null and stock.warehouse = 'US'
  );

insert into public.product_images (id, product_id, src, alt, width, height, sort, focused, enabled, variant_id)
select
  'plus2-general',
  'joova_band_plus_strap_2pk_jtfbs04',
  src,
  alt,
  width,
  height,
  sort,
  false,
  enabled,
  null
from public.product_images
where product_id = 'joova_fitness_band_plus_strap_jtfbs02'
  and variant_id is null
  and deleted_at is null
on conflict (id) do update set
  src = excluded.src,
  alt = excluded.alt,
  width = excluded.width,
  height = excluded.height,
  variant_id = null,
  deleted_at = null;

update public.product_variants
set deleted_at = now(), is_default = false
where product_id in ('joova_band_strap_2pk_jtfbs03', 'joova_band_plus_strap_2pk_jtfbs04')
  and deleted_at is null;

update public.product_images
set deleted_at = now()
where product_id in ('joova_band_strap_2pk_jtfbs03', 'joova_band_plus_strap_2pk_jtfbs04')
  and variant_id is not null
  and deleted_at is null;

do $$
declare
  pack record;
  first_color text;
  second_color text;
  first_index integer;
  second_index integer;
  variant_id text;
  pair_name text;
  sort_index integer;
begin
  for pack in
    select *
    from (
      values
        ('joova_band_strap_2pk_jtfbs03', 'joova_fitness_band_strap_jtfbs01', 'band2', array['Black', 'Green', 'Orange', 'Blue', 'Red']),
        ('joova_band_plus_strap_2pk_jtfbs04', 'joova_fitness_band_plus_strap_jtfbs02', 'plus2', array['Silver', 'Black', 'Gold'])
    ) as source(product_id, source_id, prefix, colors)
  loop
    sort_index := 0;
    for first_index in 1..array_length(pack.colors, 1)
    loop
      first_color := pack.colors[first_index];
      for second_index in first_index + 1..array_length(pack.colors, 1)
      loop
        second_color := pack.colors[second_index];
        variant_id := pack.prefix || '-' || lower(replace(first_color, ' ', '')) || '-' || lower(replace(second_color, ' ', ''));
        pair_name := first_color || ' & ' || second_color;
        insert into public.product_variants (id, product_id, sort, sku, is_default, deleted_at, attrs)
        values (
          variant_id,
          pack.product_id,
          sort_index,
          null,
          sort_index = 0,
          null,
          jsonb_build_object(
            'axis', 'color',
            'name', pair_name,
            'color', pair_name,
            'available', true
          )
        )
        on conflict (id) do update set
          product_id = excluded.product_id,
          sort = excluded.sort,
          sku = null,
          is_default = excluded.is_default,
          deleted_at = null,
          attrs = excluded.attrs;
        insert into public.product_images (id, product_id, variant_id, src, alt, width, height, sort, focused, enabled)
        values (
          variant_id || '-pair',
          pack.product_id,
          variant_id,
          case
            when pack.prefix = 'band2' then '/bands/packs/'
            else '/ecg-band/packs/'
          end || lower(replace(first_color, ' ', '')) || '-' || lower(replace(second_color, ' ', '')) || '.png',
          first_color || ' and ' || second_color || ' straps',
          1600,
          1600,
          0,
          false,
          true
        )
        on conflict (id) do update set
          src = excluded.src,
          alt = excluded.alt,
          width = excluded.width,
          height = excluded.height,
          variant_id = excluded.variant_id,
          deleted_at = null;
        sort_index := sort_index + 1;
      end loop;
    end loop;
  end loop;
end $$;
