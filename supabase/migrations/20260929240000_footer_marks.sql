-- Footer payment marks and social accounts can be turned on from the content portal.

alter table public.payment_methods
  add column if not exists offered boolean not null default true;

alter table public.social_links
  add column if not exists enabled boolean not null default true;

insert into public.payment_methods (id, label, sort, offered) values
  ('amex', 'American Express', 0, true),
  ('apple-pay', 'Apple Pay', 1, true),
  ('bancontact', 'Bancontact', 2, true),
  ('google-pay', 'Google Pay', 3, true),
  ('wero', 'Wero', 4, true),
  ('mastercard', 'Mastercard', 5, true),
  ('paypal', 'PayPal', 6, true),
  ('shop', 'Shop Pay', 7, true),
  ('visa', 'Visa', 8, true)
on conflict (id) do update set label = excluded.label, sort = excluded.sort;

insert into public.social_links (id, label, href, sort, enabled) values
  ('facebook', 'Facebook', 'https://facebook.com/joova', 0, true),
  ('instagram', 'Instagram', 'https://instagram.com/joova', 1, true),
  ('youtube', 'YouTube', 'https://www.youtube.com/@joova', 2, true),
  ('tiktok', 'TikTok', 'https://www.tiktok.com/@joova', 3, true),
  ('pinterest', 'Pinterest', 'https://www.pinterest.com/joova', 4, true)
on conflict (id) do update set label = excluded.label, sort = excluded.sort;
