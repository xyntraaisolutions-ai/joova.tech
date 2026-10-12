-- Apps page copy, product cards, and store buttons edited in the content portal.

create table if not exists public.app_page (
  id integer primary key default 1 check (id = 1),
  kicker text not null,
  title text not null,
  lead text not null,
  phone_title text not null,
  phone_copy text not null,
  note text not null,
  includes_href text not null,
  includes_label text not null,
  privacy_href text not null,
  privacy_label text not null
);

create table if not exists public.app_notes (
  id text primary key,
  title text not null,
  body text not null,
  sort integer not null default 0,
  deleted_at timestamptz
);

create table if not exists public.app_cards (
  id text primary key,
  eyebrow text not null,
  title text not null,
  lead text not null,
  href text not null,
  href_label text not null,
  steps text[] not null default '{}',
  sort integer not null default 0,
  deleted_at timestamptz
);

create table if not exists public.app_store_buttons (
  id text primary key,
  card_id text not null references public.app_cards (id),
  store text not null check (store in ('google', 'apple')),
  kicker text not null,
  label text not null,
  href text not null default '',
  icon_url text not null default '',
  sort integer not null default 0,
  deleted_at timestamptz
);

alter table public.app_page enable row level security;
alter table public.app_notes enable row level security;
alter table public.app_cards enable row level security;
alter table public.app_store_buttons enable row level security;

drop policy if exists app_page_read on public.app_page;
create policy app_page_read on public.app_page for select to anon, authenticated using (true);
drop policy if exists app_page_write on public.app_page;
create policy app_page_write on public.app_page for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists app_notes_read on public.app_notes;
create policy app_notes_read on public.app_notes for select to anon, authenticated using (deleted_at is null);
drop policy if exists app_notes_write on public.app_notes;
create policy app_notes_write on public.app_notes for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists app_cards_read on public.app_cards;
create policy app_cards_read on public.app_cards for select to anon, authenticated using (deleted_at is null);
drop policy if exists app_cards_write on public.app_cards;
create policy app_cards_write on public.app_cards for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

drop policy if exists app_store_buttons_read on public.app_store_buttons;
create policy app_store_buttons_read on public.app_store_buttons for select to anon, authenticated using (deleted_at is null);
drop policy if exists app_store_buttons_write on public.app_store_buttons;
create policy app_store_buttons_write on public.app_store_buttons for all to authenticated
  using (public.app_role() in ('content', 'super_admin'))
  with check (public.app_role() in ('content', 'super_admin'));

grant select on public.app_page, public.app_notes, public.app_cards, public.app_store_buttons to anon, authenticated;
grant insert, update, delete on public.app_page, public.app_notes, public.app_cards, public.app_store_buttons to authenticated;

insert into public.app_page (
  id, kicker, title, lead, phone_title, phone_copy, note, includes_href, includes_label, privacy_href, privacy_label
) values (
  1,
  'Download',
  'The Joova app',
  'One app for the Activity Tracker Ring and the Activity Tracker Band. It comes with the product. No subscription.',
  'Joova',
  'Activity, sleep, and heart-rate trends. No monthly plan.',
  'The store buttons open a stand-in listing until the apps are on Google Play and the App Store. On a phone, that same tap will open the store.',
  '/app',
  'See what the app includes',
  '/privacy',
  'Privacy'
) on conflict (id) do nothing;

insert into public.app_notes (id, title, body, sort) values
  ('phone', 'Your phone', 'iPhone with iOS 15 or later, or Android 9 or later.', 0),
  ('pair', 'Before you pair', 'Turn Bluetooth on, then keep the phone close to the device.', 1),
  ('data', 'Your data', 'Tracker data stays in the Joova app and is never sold.', 2)
on conflict (id) do nothing;

insert into public.app_cards (id, eyebrow, title, lead, href, href_label, steps, sort) values
  (
    'ring',
    'Joova Smart Ring',
    'Activity Tracker Ring',
    'The ring has no screen. Activity, sleep, and heart-rate trends show in the Joova app.',
    '/ring',
    'See the Joova Smart Ring',
    array[
      'Use the phone you will keep near the ring.',
      'Choose Google Play on Android, or the App Store on iPhone.',
      'Install Joova, open it, and follow the pairing steps. Leave Bluetooth on.'
    ],
    0
  ),
  (
    'band',
    'Joova Fitness Band',
    'Activity Tracker Band',
    'The band has no display. Open the Joova app when you want steps, sleep, and heart-rate trends.',
    '/band',
    'See the Joova Fitness Band',
    array[
      'Use the phone you will pair with the band.',
      'Choose Google Play on Android, or the App Store on iPhone.',
      'Install Joova, open it, and follow the pairing steps. Leave Bluetooth on.'
    ],
    1
  )
on conflict (id) do nothing;

insert into public.app_store_buttons (id, card_id, store, kicker, label, href, icon_url, sort) values
  ('ring-google', 'ring', 'google', 'GET IT ON', 'Google Play', '', '', 0),
  ('ring-apple', 'ring', 'apple', 'Download on the', 'App Store', '', '', 1),
  ('band-google', 'band', 'google', 'GET IT ON', 'Google Play', '', '', 0),
  ('band-apple', 'band', 'apple', 'Download on the', 'App Store', '', '', 1)
on conflict (id) do nothing;
