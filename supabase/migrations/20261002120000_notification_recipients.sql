-- People who are emailed when an order, return, or warranty claim arrives.

create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order', 'return', 'warranty')),
  full_name text not null,
  email text not null,
  phone text not null default '',
  role_label text not null default '',
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists notification_recipients_kind_email
  on public.notification_recipients (kind, lower(email))
  where deleted_at is null;

alter table public.notification_recipients enable row level security;

drop policy if exists notification_recipients_admin on public.notification_recipients;
create policy notification_recipients_admin on public.notification_recipients
  for all to authenticated
  using (public.app_role() = 'super_admin')
  with check (public.app_role() = 'super_admin');

grant select, insert, update, delete on public.notification_recipients to authenticated;
revoke all on public.notification_recipients from anon;

alter table public.returns add column if not exists staff_notified_at timestamptz;
alter table public.warranty_claims add column if not exists staff_notified_at timestamptz;

insert into public.email_templates (
  id, from_name, from_email, subject, heading, body, button_label, footer
) values
(
  'staff_return',
  'Joova Customer Support',
  'support@joova.tech',
  'Return request for {{order_id}}',
  'New return request',
  E'{{name}} asked for a {{resolution}} on {{order_id}}.\n\n{{email}}\n\n{{reason}}',
  'Open support',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
),
(
  'staff_warranty',
  'Joova Customer Support',
  'support@joova.tech',
  'Warranty claim for {{order_id}}',
  'New warranty claim',
  E'{{name}} started a warranty claim for {{order_id}}.\n\n{{email}}\n\n{{message}}',
  'Open support',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
)
on conflict (id) do nothing;
