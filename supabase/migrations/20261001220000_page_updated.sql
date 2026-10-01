-- Last updated dates for page management, and return-window wording from the product record.

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
        when coalesce(nullif(p.commerce->>'returnDays', '')::integer, 30) > 0 then
          'Free returns for ' || coalesce(nullif(p.commerce->>'returnDays', '')::integer, 30)::text || ' days from delivery.'
        else 'This product is not in the free return window.'
      end
    )
    from public.products p
    where p.id = p_id
  ), '[]'::jsonb);
$$;

update public.page_copy
set value = 'Each product below uses the warranty length, free shipping, and return window stored on that product.',
    deleted_at = null
where page = 'warranty'
  and key = 'eligibleNote';

insert into public.page_copy (page, key, value) values
  ('about', 'updatedOn', '2026-10-01'),
  ('privacy', 'updatedOn', '2026-10-01'),
  ('terms', 'updatedOn', '2026-10-01'),
  ('accessibility', 'updatedOn', '2026-10-01'),
  ('returns', 'updatedOn', '2026-10-01'),
  ('returns', 'headingHow', 'How to start a return'),
  ('returns', 'stepAccount', 'Sign in to your Joova Customer Account and start the return from your purchase history.'),
  ('returns', 'stepAlso', 'You can also email'),
  ('returns', 'stepForm', 'or use the'),
  ('returns', 'contactLink', 'contact form'),
  ('returns', 'stepOrder', 'Include your order number.'),
  ('returns', 'accountCta', 'Open your Joova Customer Account'),
  ('returns', 'headingAccount', 'What the account is for'),
  ('returns', 'accountItems', E'Purchase history\nOrder tracking\nReturns\nReplacements'),
  ('returns', 'warrantyLead', 'See the'),
  ('returns', 'warrantyLink', 'warranty policy'),
  ('warranty', 'updatedOn', '2026-10-01'),
  ('warranty', 'headingEligible', 'Eligible products'),
  ('warranty', 'columnProduct', 'Product'),
  ('warranty', 'columnWarranty', 'Warranty'),
  ('warranty', 'columnShipping', 'Shipping'),
  ('warranty', 'columnReturns', 'Returns'),
  ('warranty', 'headingCovered', 'Covered'),
  ('warranty', 'headingNotCovered', 'Not covered'),
  ('warranty', 'headingShipping', 'Free shipping'),
  ('warranty', 'headingReturns', 'Free 30-day returns'),
  ('warranty', 'returnLink', 'Return policy'),
  ('warranty', 'headingExtra', 'Get 1 extra year'),
  ('warranty', 'step1Title', '1. Create your account'),
  ('warranty', 'step2Title', '2. Register the device'),
  ('warranty', 'step3Title', '3. Extra year added'),
  ('warranty', 'accountCta', 'Create a Joova Customer Account'),
  ('warranty', 'headingRegister', 'Register your device'),
  ('warranty', 'registerNote', 'Registration is on joova.tech. Sign in with your Joova Customer Account to submit this form.'),
  ('warranty', 'headingClaim', 'How to make a claim'),
  ('warranty', 'devicesLink', 'My Devices'),
  ('warranty', 'contactLink', 'Contact form')
on conflict (page, key) do nothing;
