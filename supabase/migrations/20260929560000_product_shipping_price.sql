-- A product can keep its own price for each shipping option.
-- A null price means the product still uses the price from Fulfillment settings.

alter table public.product_shipping_options
  add column if not exists price numeric(10, 2);

alter table public.product_shipping_options
  drop constraint if exists product_shipping_options_price_check;

alter table public.product_shipping_options
  add constraint product_shipping_options_price_check
  check (price is null or (price >= 0 and price <= 100000));
