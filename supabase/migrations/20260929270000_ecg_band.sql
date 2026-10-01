-- Joova Band ECG J02 and its extra strap. Hidden until a price is set and the product is ready to show.
-- Specs follow the Joova Band ECG J02 brand sheet. Marketplace medical claims and the factory brand name are not stored.

insert into public.products (
  id, name, menu_label, href, category_id, also_in, price, price_label, status, summary,
  kicker, lead, detail, note, signals, published, sort, sku, on_sale, top_pick,
  warranty_eligible, warranty_years, warranty_days, commerce
) values (
  'ecg-band',
  'Joova Band ECG J02',
  'ECG Band',
  '/ecg-band',
  'wearables',
  array['devices'],
  0,
  'Price not set',
  'Hidden',
  'Screenless band for heart rate, ECG, blood pressure, sleep, and activity. Silver, black, or gold. Readings are not a substitute for professional medical equipment. No subscription needed. Ever.',
  '',
  'Screenless. Pay once.',
  'A screenless Joova Band ECG J02 with an aluminum alloy case and a PC back. Silver, black, or gold. The box includes the band, 1 extra woven strap, a magnetic charging cable, and a quick-start guide.

Bluetooth 5.3. Battery 180 mAh, about 15–20 days, with standby up to 20–30 days. Magnetic charging takes about 2.5 hours. 1 ATM splash resistant. It is not for swimming or showering. Size 45.6 × 26.6 × 9.9 mm. The woven strap is 22 mm and can be replaced. It can be worn on the wrist or the ankle.

The Joova app tracks heart rate, blood oxygen, ECG, blood pressure, sleep for up to 24 hours, steps, distance, calories, and stress. It also includes call and message reminders, an alarm, sedentary and other daily reminders, fall detection, and SOS. Set emergency contacts in the app, then press the button several times to start an SOS call. Sport modes expand in the app. Charge the band before the first use.

Readings are not a substitute for professional medical equipment.',
  'Readings are not a substitute for professional medical equipment.',
  '[
    {"label":"Heart","text":"Rate, ECG, and blood pressure"},
    {"label":"Sleep","text":"Up to 24 hours"},
    {"label":"Battery","text":"180 mAh, about 15–20 days"},
    {"label":"Water","text":"1 ATM, splash resistant"}
  ]'::jsonb,
  false,
  20,
  'JOOVA-ECGJ02',
  false,
  false,
  true,
  1,
  null,
  jsonb_build_object(
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
    'mpn', 'J02',
    'barcode', '',
    'countryOfOrigin', '',
    'googleCategory', '',
    'seoTitle', 'Joova Band ECG J02',
    'seoDescription', 'Screenless Joova Band ECG J02 for heart rate, ECG, blood pressure, sleep, and activity.',
    'productType', 'wearables',
    'tags', jsonb_build_array('wearables', 'devices'),
    'material', 'Aluminum alloy case, PC back, woven strap.',
    'warrantyNote', '1 year from the purchase date. Register within 30 days for 1 extra year.'
  )
),
(
  'ecg-strap',
  'Joova Band ECG strap',
  'ECG strap',
  '/ecg-strap',
  'accessories',
  array[]::text[],
  0,
  'Price not set',
  'Hidden',
  'A 22 mm woven strap for the Joova Band ECG J02, without the tracker. Silver, black, or gold.',
  '',
  'The strap, without the tracker.',
  'A replaceable 22 mm woven strap for the Joova Band ECG J02. Silver, black, or gold. The tracker is not included.',
  '90 days from the purchase date.',
  '[]'::jsonb,
  false,
  21,
  'JOOVA-ECGSTRAP',
  false,
  false,
  true,
  null,
  90,
  jsonb_build_object(
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
    'seoTitle', 'Joova Band ECG strap',
    'seoDescription', 'A 22 mm woven strap for the Joova Band ECG J02. Silver, black, or gold.',
    'productType', 'accessories',
    'tags', jsonb_build_array('accessories'),
    'material', 'Woven',
    'warrantyNote', '90 days from the purchase date.'
  )
)
on conflict (id) do nothing;

insert into public.product_variants (id, product_id, sku, sort, attrs) values
  ('ecg-band-silver', 'ecg-band', 'JOOVA-ECGJ02-SILVER', 0, '{"id":"silver","name":"Silver","image":"/ecg-band/joova-band-ecg-silver.png","status":"Hidden"}'::jsonb),
  ('ecg-band-black', 'ecg-band', 'JOOVA-ECGJ02-BLACK', 1, '{"id":"black","name":"Black","image":"/ecg-band/joova-band-ecg-black.png","status":"Hidden"}'::jsonb),
  ('ecg-band-gold', 'ecg-band', 'JOOVA-ECGJ02-GOLD', 2, '{"id":"gold","name":"Gold","image":"/ecg-band/joova-band-ecg-gold.png","status":"Hidden"}'::jsonb),
  ('ecg-strap-silver', 'ecg-strap', 'JOOVA-ECGSTRAP-SILVER', 0, '{"id":"silver","name":"Silver","status":"Hidden"}'::jsonb),
  ('ecg-strap-black', 'ecg-strap', 'JOOVA-ECGSTRAP-BLACK', 1, '{"id":"black","name":"Black","status":"Hidden"}'::jsonb),
  ('ecg-strap-gold', 'ecg-strap', 'JOOVA-ECGSTRAP-GOLD', 2, '{"id":"gold","name":"Gold","status":"Hidden"}'::jsonb)
on conflict (id) do nothing;

insert into public.product_images (id, product_id, src, alt, width, height, sort, focused) values
  ('ecg-band-silver', 'ecg-band', '/ecg-band/joova-band-ecg-silver.png', 'Joova Band ECG J02 in silver, screenless tracker on a woven strap', 782, 964, 0, true),
  ('ecg-band-black', 'ecg-band', '/ecg-band/joova-band-ecg-black.png', 'Joova Band ECG J02 in black, screenless tracker on a woven strap', 782, 964, 1, false),
  ('ecg-band-gold', 'ecg-band', '/ecg-band/joova-band-ecg-gold.png', 'Joova Band ECG J02 in gold, screenless tracker on a woven strap', 782, 964, 2, false)
on conflict (id) do nothing;

insert into public.inventory (product_id, warehouse, on_hand, reserved)
select product.id, 'US', 0, 0
from public.products as product
where product.id in ('ecg-band', 'ecg-strap')
  and not exists (
    select 1 from public.inventory as stock
    where stock.product_id = product.id and stock.variant_id is null and stock.warehouse = 'US' and stock.deleted_at is null
  );
