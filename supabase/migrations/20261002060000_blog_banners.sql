-- Banner art for blog posts. Drafts stay unpublished until content staff publish them.

alter table public.blog_posts add column if not exists banner_url text not null default '';
alter table public.blog_posts add column if not exists banner_alt text not null default '';
