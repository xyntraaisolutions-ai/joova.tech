-- Portal list page size. Super Admin can change it from platform settings.

alter table public.site_settings add column if not exists list_page_size integer not null default 10;

alter table public.site_settings drop constraint if exists site_settings_list_page_size_check;
alter table public.site_settings add constraint site_settings_list_page_size_check
  check (list_page_size between 1 and 100);
