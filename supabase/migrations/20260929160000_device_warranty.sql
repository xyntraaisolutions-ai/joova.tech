alter table public.warranty_registrations alter column order_id drop not null;

alter table public.warranty_registrations
  add column if not exists purchase_date date,
  add column if not exists purchased_from text,
  add column if not exists contact_email text,
  add column if not exists receipt_path text,
  add column if not exists model_code text;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create or replace function public.register_device_warranty(
  p_serial text,
  p_purchase date,
  p_from text,
  p_email text,
  p_receipt text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_extra boolean := false;
  v_end date;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to register a device.');
  end if;
  if p_serial !~ '^(JSB01|JSB02|JSR01|STRAP1|STRAP2)-[0-9]{4}-[0-9]{6}$' then
    return jsonb_build_object('ok', false, 'error', 'Enter a serial number like JSB01-2611-000123.');
  end if;
  if p_purchase is null or p_purchase > current_date then
    return jsonb_build_object('ok', false, 'error', 'Enter the purchase date.');
  end if;
  if length(trim(coalesce(p_from, ''))) < 2 or position('@' in coalesce(p_email, '')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter where you bought it and an email address.');
  end if;
  if exists (
    select 1 from public.warranty_registrations
    where serial = p_serial and deleted_at is null
  ) then
    return jsonb_build_object('ok', false, 'error', 'That serial number is already registered.');
  end if;

  v_code := split_part(p_serial, '-', 1);
  v_extra := v_code in ('JSB01', 'JSB02', 'JSR01') and (current_date - p_purchase) <= 30;
  v_end := case
    when v_code like 'STRAP%' then p_purchase + 90
    when v_extra then (p_purchase + interval '2 years')::date
    else (p_purchase + interval '1 year')::date
  end;

  insert into public.warranty_registrations (
    user_id, product_id, serial, coverage_ends_at, purchase_date, purchased_from, contact_email, receipt_path, model_code
  ) values (
    v_user,
    lower(v_code),
    p_serial,
    v_end::timestamptz,
    p_purchase,
    trim(p_from),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_receipt, '')), ''),
    v_code
  );
  return jsonb_build_object('ok', true, 'coverageEnds', v_end, 'extended', v_extra);
end;
$$;

revoke all on function public.register_device_warranty(text, date, text, text, text) from public;
grant execute on function public.register_device_warranty(text, date, text, text, text) to authenticated;

update public.policies
set
  warranty_registration = 'Every Joova device comes with a 1-year limited warranty. Register it and we add 1 extra year, free.',
  strap_title = '90-day strap coverage',
  dock_title = '1-year limited warranty',
  hero_line = '2 straps in every box · 30-day free returns · 1-year limited warranty',
  strap_summary = 'Extra straps are covered for 90 days from the purchase date.',
  dock_summary = 'Joova devices are covered for 1 year from the purchase date. Register within 30 days and we add 1 extra year, free.'
where id = 1;

insert into public.page_copy (page, key, value) values
  ('warranty', 'title', 'Joova Limited Warranty'),
  ('warranty', 'intro', 'Every Joova device comes with a 1-year limited warranty. Register it and we add 1 extra year, free.'),
  ('warranty', 'eligibleNote', 'Warranty starts on the purchase date. Applies to products bought new from joova.tech or authorized sellers (e.g. Amazon) in the USA and Canada.'),
  ('warranty', 'product1Name', 'Joova Smart Band (JSB01)'),
  ('warranty', 'product1Term', '1 year'),
  ('warranty', 'product1Extra', '+1 year when registered'),
  ('warranty', 'product2Name', 'Joova Smart Band ECG (JSB02)'),
  ('warranty', 'product2Term', '1 year'),
  ('warranty', 'product2Extra', '+1 year when registered'),
  ('warranty', 'product3Name', 'Joova Smart Ring (JSR01)'),
  ('warranty', 'product3Term', '1 year'),
  ('warranty', 'product3Extra', '+1 year when registered'),
  ('warranty', 'product4Name', 'Extra straps (1-pack, 2-pack)'),
  ('warranty', 'product4Term', '90 days'),
  ('warranty', 'product4Extra', '—'),
  ('warranty', 'covered', 'Manufacturing defects, battery or charging failure in normal use.'),
  ('warranty', 'notCovered', 'Accidental damage, water damage beyond the rating (bands are splash resistant only), normal wear, misuse, unauthorized repair.'),
  ('warranty', 'remedy', 'We repair or replace the product.'),
  ('warranty', 'step1', 'Create a Joova Customer Account on this website, or sign in.'),
  ('warranty', 'step2', 'Register the device with the serial number from the card in the box and on the box label. Add the purchase date, where you bought it, and the receipt.'),
  ('warranty', 'step3', 'Done: your warranty is extended to 2 years. Registration is free and must be completed within 30 days of purchase.'),
  ('warranty', 'claim', 'Sign in, open My Devices, select the device, and choose Start warranty claim. Or use the contact form. Have your serial number and receipt ready.'),
  ('warranty', 'footerNote', 'No registration? You''re still covered for 1 year with proof of purchase. This warranty does not affect your rights under local law.'),
  ('returns', 'notWarranty', 'A warranty claim is not a return. Devices are covered for 1 year from the purchase date. Register within 30 days for 1 extra year.')
on conflict (page, key) do update set value = excluded.value, deleted_at = null;
