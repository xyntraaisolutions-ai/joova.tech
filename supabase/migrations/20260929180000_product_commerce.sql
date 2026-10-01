-- Sale metadata for products already on the site.
-- Unknown identifiers, weight, and origin stay empty.
-- Warranty matches the published page: devices 1 year, extra straps 90 days.

alter table public.products add column if not exists warranty_days integer;
alter table public.products add column if not exists commerce jsonb not null default '{}'::jsonb;

update public.products
set
  warranty_eligible = true,
  warranty_years = case when id = 'straps' then null else 1 end,
  warranty_days = case when id = 'straps' then 90 else null end
where id in ('band', 'ring', 'share', 'watch', 'glasses', 'buds', 'straps');

update public.products
set commerce = jsonb_strip_nulls(jsonb_build_object(
  'brand', 'Joova',
  'vendor', 'Joova',
  'currency', 'USD',
  'condition', 'new',
  'availability', 'in_stock',
  'preorder', false,
  'subscription', false,
  'requiresShipping', true,
  'freeShipping', true,
  'shipsFrom', 'US warehouses',
  'shipsTo', jsonb_build_array('US'),
  'handlingMinDays', 7,
  'handlingMaxDays', 10,
  'returnDays', 30,
  'returnShipping', 'US return shipping covered',
  'taxCode', '',
  'gtin', '',
  'mpn', '',
  'barcode', '',
  'countryOfOrigin', '',
  'googleCategory', '',
  'seoTitle', name,
  'seoDescription', summary,
  'productType', category_id,
  'tags', to_jsonb(array[category_id] || also_in),
  'material', case id
    when 'ring' then 'Stainless steel shell with an epoxy resin inner layer.'
    when 'straps' then 'Woven'
    else ''
  end,
  'warrantyNote', case
    when id = 'straps' then '90 days from the purchase date.'
    else '1 year from the purchase date. Register within 30 days for 1 extra year.'
  end
))
where commerce = '{}'::jsonb;
