alter table public.policies
  add column if not exists outside_us_notice text not null
  default 'Joova delivers in the United States today. We may start delivering to {{country}} soon. Thank you for visiting.';
