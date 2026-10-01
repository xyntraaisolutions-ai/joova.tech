-- Approximate published zone 5 retail prices. Our price stays blank.

alter table public.shipping_carrier_rates
  add column if not exists detail text not null default '';

alter table public.shipping_carrier_rates
  drop constraint if exists shipping_carrier_rates_detail_length;

alter table public.shipping_carrier_rates
  add constraint shipping_carrier_rates_detail_length check (char_length(detail) <= 160);

insert into public.shipping_carrier_rates (
  carrier, service, max_weight_lb, max_length_in, max_width_in, max_height_in, carrier_price, our_price, detail, sort
)
select * from (values
  ('usps', 'Ground Advantage', 1, 10, 7, 2, 10.95, null::numeric, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 2–5 days. Fuel not included.', 0),
  ('usps', 'Ground Advantage', 2, 12, 8, 3, 14.10, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 2–5 days. Fuel not included.', 1),
  ('usps', 'Ground Advantage', 5, 12, 10, 5, 17.45, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 2–5 days. Fuel not included.', 2),
  ('usps', 'Priority Mail', 1, 10, 7, 2, 13.05, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 2–3 days. Fuel not included.', 3),
  ('usps', 'Priority Mail', 2, 12, 8, 3, 16.85, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 2–3 days. Fuel not included.', 4),
  ('usps', 'Priority Mail', 5, 12, 10, 5, 22.10, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 2–3 days. Fuel not included.', 5),
  ('usps', 'Priority Mail Express', 1, 10, 7, 2, 51.50, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 1–3 days. Fuel not included.', 6),
  ('usps', 'Priority Mail Express', 2, 12, 8, 3, 59.85, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 1–3 days. Fuel not included.', 7),
  ('usps', 'Priority Mail Express', 5, 12, 10, 5, 85.00, null, 'Zone 5 retail, USPS Notice 123, July 12, 2026. About 1–3 days. Fuel not included.', 8),
  ('ups', 'Ground', 1, 10, 7, 2, 15.79, null, 'Zone 5 retail, 2026 UPS rate guide. About 1–5 business days. Fuel not included.', 9),
  ('ups', 'Ground', 2, 12, 8, 3, 17.02, null, 'Zone 5 retail, 2026 UPS rate guide. About 1–5 business days. Fuel not included.', 10),
  ('ups', 'Ground', 5, 12, 10, 5, 20.18, null, 'Zone 5 retail, 2026 UPS rate guide. About 1–5 business days. Fuel not included.', 11),
  ('ups', '2nd Day Air', 1, 10, 7, 2, 32.07, null, 'Zone 5 retail, 2026 UPS rate guide. 2 business days. Fuel not included.', 12),
  ('ups', '2nd Day Air', 2, 12, 8, 3, 34.71, null, 'Zone 5 retail, 2026 UPS rate guide. 2 business days. Fuel not included.', 13),
  ('ups', '2nd Day Air', 5, 12, 10, 5, 48.78, null, 'Zone 5 retail, 2026 UPS rate guide. 2 business days. Fuel not included.', 14),
  ('ups', 'Next Day Air', 1, 10, 7, 2, 89.12, null, 'Zone 5 retail, 2026 UPS rate guide. Next business day. Fuel not included.', 15),
  ('ups', 'Next Day Air', 2, 12, 8, 3, 96.61, null, 'Zone 5 retail, 2026 UPS rate guide. Next business day. Fuel not included.', 16),
  ('ups', 'Next Day Air', 5, 12, 10, 5, 119.95, null, 'Zone 5 retail, 2026 UPS rate guide. Next business day. Fuel not included.', 17),
  ('fedex', 'Ground', 1, 10, 7, 2, 14.00, null, 'Zone 5 list rate, 2026 FedEx chart. About 1–5 business days. Fuel not included.', 18),
  ('fedex', 'Ground', 2, 12, 8, 3, 15.66, null, 'Zone 5 list rate, 2026 FedEx chart. About 1–5 business days. Fuel not included.', 19),
  ('fedex', 'Ground', 5, 12, 10, 5, 18.53, null, 'Zone 5 list rate, 2026 FedEx chart. About 1–5 business days. Fuel not included.', 20),
  ('fedex', '2Day', 1, 10, 7, 2, 35.94, null, 'Zone 5 list rate, 2026 FedEx chart. 2 business days. Fuel not included.', 21),
  ('fedex', '2Day', 2, 12, 8, 3, 39.04, null, 'Zone 5 list rate, 2026 FedEx chart. 2 business days. Fuel not included.', 22),
  ('fedex', '2Day', 5, 12, 10, 5, 55.07, null, 'Zone 5 list rate, 2026 FedEx chart. 2 business days. Fuel not included.', 23),
  ('fedex', 'Standard Overnight', 1, 10, 7, 2, 81.00, null, 'Zone 5 list rate, 2026 FedEx chart. Next business day. Fuel not included.', 24),
  ('fedex', 'Standard Overnight', 2, 12, 8, 3, 91.38, null, 'Zone 5 list rate, 2026 FedEx chart. Next business day. Fuel not included.', 25),
  ('fedex', 'Standard Overnight', 5, 12, 10, 5, 120.63, null, 'Zone 5 list rate, 2026 FedEx chart. Next business day. Fuel not included.', 26)
) as seed(carrier, service, max_weight_lb, max_length_in, max_width_in, max_height_in, carrier_price, our_price, detail, sort)
where not exists (select 1 from public.shipping_carrier_rates);
