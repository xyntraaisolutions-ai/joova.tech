-- Apps in the header, and the support link points at the download page.

insert into public.nav_items (id, area, parent_id, kind, label, href, sort)
values ('header-apps', 'header', null, 'link', 'Apps', '/apps', 5)
on conflict (id) do update set
  label = excluded.label,
  href = excluded.href,
  sort = excluded.sort,
  published = true,
  deleted_at = null;

update public.nav_items set sort = 6 where id = 'header-about';
update public.nav_items set sort = 7 where id = 'header-support';
update public.nav_items
set label = 'Apps', href = '/apps'
where id = 'header-support-app';

insert into public.support_links (href, label, sort)
values ('/apps', 'Apps', 2)
on conflict (href) do update set label = excluded.label, sort = excluded.sort;

delete from public.support_links where href = '/app';
