-- Font and background choices for the two header notices.

alter table public.site_settings
  add column if not exists notice_primary_color text not null default 'red',
  add column if not exists notice_primary_background text not null default 'ink',
  add column if not exists notice_secondary_color text not null default 'white',
  add column if not exists notice_secondary_background text not null default 'ink';

alter table public.site_settings
  drop constraint if exists site_settings_notice_primary_color_check,
  drop constraint if exists site_settings_notice_primary_background_check,
  drop constraint if exists site_settings_notice_secondary_color_check,
  drop constraint if exists site_settings_notice_secondary_background_check;

alter table public.site_settings
  add constraint site_settings_notice_primary_color_check
    check (notice_primary_color in ('red', 'orange', 'blue', 'green', 'white')),
  add constraint site_settings_notice_primary_background_check
    check (notice_primary_background in ('ink', 'white', 'red', 'orange', 'blue')),
  add constraint site_settings_notice_secondary_color_check
    check (notice_secondary_color in ('red', 'orange', 'blue', 'green', 'white')),
  add constraint site_settings_notice_secondary_background_check
    check (notice_secondary_background in ('ink', 'white', 'red', 'orange', 'blue'));
