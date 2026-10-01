-- Password reset email copy and the mail server that sends it. Super Admin only.

create table if not exists public.email_templates (
  id text primary key,
  from_name text not null,
  from_email text not null,
  subject text not null,
  heading text not null,
  body text not null,
  button_label text not null,
  footer text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.mail_settings (
  id integer primary key default 1 check (id = 1),
  smtp_host text not null default '',
  smtp_port integer not null default 587,
  smtp_user text not null default '',
  smtp_pass text not null default '',
  smtp_secure boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.email_templates (
  id, from_name, from_email, subject, heading, body, button_label, footer
) values (
  'password_reset',
  'Joova',
  'support@joova.tech',
  'Reset your Joova password',
  'Reset your password',
  E'We received a request to reset the password for {{email}}.\n\nUse the button below. It opens Joova so you can choose a new password. If you did not ask for this, you can ignore this email.',
  'Choose a new password',
  'Joova Tech LLC · Grapevine, Texas · {{support_email}}'
) on conflict (id) do nothing;

insert into public.mail_settings (id) values (1) on conflict (id) do nothing;

alter table public.email_templates enable row level security;
alter table public.mail_settings enable row level security;

revoke all on public.email_templates from anon, authenticated;
revoke all on public.mail_settings from anon, authenticated;
