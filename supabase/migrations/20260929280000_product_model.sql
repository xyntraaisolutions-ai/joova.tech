-- Public model name for the hidden ECG products. Manufacturer details stay empty until entered.

update public.products
set commerce = commerce || jsonb_build_object('model', name)
where id in ('ecg-band', 'ecg-strap')
  and coalesce(commerce->>'model', '') = '';
