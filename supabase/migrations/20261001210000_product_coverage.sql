-- Snapshot warranty, shipping, and return eligibility onto each order line.

alter table public.order_items add column if not exists coverage jsonb not null default '[]'::jsonb;

create or replace function public.coverage_for_product(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select jsonb_build_array(
      case
        when not p.warranty_eligible then 'This product is not covered by the Joova limited warranty.'
        when coalesce(p.warranty_years, 0) > 0 then
          (case when p.warranty_years = 1 then '1 year' else p.warranty_years::text || ' years' end)
          || ' limited warranty from the purchase date. Register within 30 days for 1 extra year.'
        when coalesce(p.warranty_days, 0) > 0 then p.warranty_days::text || '-day coverage from the purchase date.'
        else 'Covered by the Joova limited warranty from the purchase date.'
      end,
      case
        when coalesce(p.commerce->>'freeShipping', 'true') in ('false', '0') then 'Shipping is charged at checkout.'
        else 'Free shipping in the United States.'
      end,
      case
        when coalesce(nullif(p.commerce->>'returnDays', '')::integer, 30) >= 30 then 'Free returns for 30 days from delivery.'
        when coalesce(nullif(p.commerce->>'returnDays', '')::integer, 30) > 0 then
          'Returns for ' || coalesce(nullif(p.commerce->>'returnDays', '')::integer, 30)::text || ' days from delivery.'
        else 'This product is not in the free 30-day return window.'
      end
    )
    from public.products p
    where p.id = p_id
  ), '[]'::jsonb);
$$;

create or replace function public.set_order_item_coverage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    new.coverage := public.coverage_for_product(new.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_coverage on public.order_items;
create trigger order_items_coverage
  before insert on public.order_items
  for each row
  execute function public.set_order_item_coverage();

update public.order_items
set coverage = public.coverage_for_product(product_id)
where product_id is not null;

create or replace function public.mark_order_paid(p_session text, p_payment text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object('ok', false, 'error', 'Not allowed.');
  end if;
  select * into v_order from public.orders where checkout_session_id = trim(coalesce(p_session, '')) for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That order was not found.');
  end if;
  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'orderId', v_order.id);
  end if;
  if v_order.status = 'cancelled' or not v_order.stock_held then
    return jsonb_build_object('ok', false, 'error', 'That checkout is no longer open.');
  end if;
  update public.orders
  set payment_status = 'paid',
      payment_provider = 'stripe',
      payment_reference = nullif(trim(coalesce(p_payment, '')), '')
  where id = v_order.id;
  if v_order.promo_code is not null then
    update public.promo_codes
    set used_count = used_count + 1
    where code = v_order.promo_code;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', name,
    'quantity', quantity,
    'price', price,
    'color', color,
    'selection', selection,
    'coverage', coverage
  ) order by name), '[]'::jsonb)
  into v_items
  from public.order_items
  where order_id = v_order.id;
  return jsonb_build_object(
    'ok', true,
    'already', false,
    'orderId', v_order.id,
    'email', v_order.email,
    'subtotal', v_order.subtotal,
    'taxPercent', v_order.tax_percent,
    'taxAmount', v_order.tax_amount,
    'shipping', v_order.shipping,
    'shippingAmount', v_order.shipping_amount,
    'shippingName', v_order.shipping_name,
    'discountAmount', v_order.discount_amount,
    'promoCode', v_order.promo_code,
    'items', v_items
  );
end;
$$;

update public.policies
set shipping = 'Eligible products ship free in the United States from US warehouses and arrive in 7 to 10 days.',
    returns_summary = 'Eligible products have 30 days from delivery to start a free return in the United States. Choose a refund or an exchange for a similar item. A refund is issued after we receive the item and appears on the original payment method in 5 to 10 business days. We cover return shipping. This is the only free return window.',
    warranty_registration = 'Eligible devices come with a 1-year limited warranty. Register within 30 days and we add 1 extra year, free. Eligible straps are covered for 90 days.'
where id = 1;

insert into public.page_copy (page, key, value) values
  ('warranty', 'intro', 'The Joova limited warranty applies to eligible products bought new from joova.tech or an authorized seller in the United States or Canada. The product page states whether that product is eligible, and for how long.'),
  ('warranty', 'eligibleNote', 'Eligibility is set on the product. Devices below include 1 year from the purchase date. Register that device within 30 days and coverage runs for 2 years. Straps are covered for 90 days and do not gain an extra year.'),
  ('warranty', 'devicesName', 'Joova Fitness Band, Fitness Band Plus, Fitness Ring, Watch, Glasses, Buds, and Share Pod'),
  ('warranty', 'devicesTerm', '1 year from the purchase date'),
  ('warranty', 'devicesExtra', 'Register within 30 days for 1 extra year'),
  ('warranty', 'strapsName', 'Joova straps, including 1-packs and 2-packs'),
  ('warranty', 'strapsTerm', '90 days from the purchase date'),
  ('warranty', 'strapsExtra', 'No extra year'),
  ('warranty', 'step1', 'Confirm the product is warranty eligible. The product page, cart, receipt, and your account list that eligibility.'),
  ('warranty', 'step2', 'Create a Joova Customer Account, or sign in. Register a 1-year device within 30 days of purchase. Use the serial number from the card in the box and on the box label, plus the purchase date, where you bought it, and the receipt.'),
  ('warranty', 'step3', 'Registration is free. A registered 1-year device is covered for 2 years from the purchase date. A 90-day strap stays at 90 days.'),
  ('warranty', 'claim', 'Sign in, open My Devices, and choose Start warranty claim. Or use the contact form. Include the serial number and what happened. Support reviews the claim, may ask for more information, and repairs or replaces a covered product.'),
  ('warranty', 'footerNote', 'A device that is not registered is still covered for 1 year with proof of purchase. This warranty does not affect your rights under local law. A warranty claim is not a return.'),
  ('warranty', 'shippingNote', 'Eligible products ship free in the United States. They leave US warehouses and arrive in 7 to 10 days. A product that is not eligible shows its shipping charge at checkout.'),
  ('warranty', 'returnsNote', 'Eligible products can be returned free for 30 days after delivery in the United States. Joova covers return shipping. You choose a refund or an exchange for a similar item. A product that is not eligible is outside this window.'),
  ('returns', 'window', 'The 30 days start on the delivery date and apply to eligible Joova products in the United States. We cover return shipping. After day 30, the free return window is closed.'),
  ('returns', 'notWarranty', 'A warranty claim is not a return. Eligible devices are covered for 1 year from the purchase date. Register within 30 days for 1 extra year. Eligible straps are covered for 90 days.')
on conflict (page, key) do update set value = excluded.value, deleted_at = null;

update public.email_templates
set body = E'Thank you for your order, {{name}}.\n\nPayment for {{order_id}} is received. This email is your receipt. The Stripe invoice is attached.\n\nEach item lists its warranty, shipping, and return eligibility. Eligible products ship free in the United States, leave US warehouses, and arrive in 7 to 10 days. We will email you again when it ships.'
where id = 'order_confirmation';

revoke all on function public.coverage_for_product(text) from public;
grant execute on function public.coverage_for_product(text) to authenticated, service_role;
