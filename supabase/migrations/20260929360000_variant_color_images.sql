-- Color, type, and size pictures belong on the variant. Pictures that do not
-- name one choice stay on the product and show after the selected choice.

with path_hits as (
  select i.id as image_id, v.id as variant_id
  from public.product_images i
  join public.product_variants v on v.product_id = i.product_id
  where i.deleted_at is null
    and i.variant_id is null
    and coalesce(v.attrs->>'image', '') <> ''
    and (
      i.src = v.attrs->>'image'
      or i.src like '%/' || regexp_replace(v.attrs->>'image', '^.*/', '')
    )
),
unique_path as (
  select image_id, min(variant_id) as variant_id
  from path_hits
  group by image_id
  having count(distinct variant_id) = 1
),
alt_hits as (
  select i.id as image_id, v.id as variant_id
  from public.product_images i
  join public.product_variants v on v.product_id = i.product_id
  where i.deleted_at is null
    and i.variant_id is null
    and not exists (select 1 from unique_path path where path.image_id = i.id)
    and coalesce(v.attrs->>'name', '') <> ''
    and i.alt ~* (
      '(^|[^[:alnum:]])'
      || regexp_replace(v.attrs->>'name', '([\\.^$|()*+?\[\]{}])', '\\\1', 'g')
      || '([^[:alnum:]]|$)'
    )
    and (
      coalesce(v.attrs->>'style', '') = ''
      or i.alt ~* (
        '(^|[^[:alnum:]])'
        || regexp_replace(v.attrs->>'style', '([\\.^$|()*+?\[\]{}])', '\\\1', 'g')
        || '([^[:alnum:]]|$)'
      )
    )
),
unique_alt as (
  select image_id, min(variant_id) as variant_id
  from alt_hits
  group by image_id
  having count(distinct variant_id) = 1
),
assigned as (
  select image_id, variant_id from unique_path
  union all
  select image_id, variant_id from unique_alt
)
update public.product_images as image
set
  variant_id = assigned.variant_id,
  focused = false,
  sort = coalesce((
    select min(existing.sort) - 1
    from public.product_images as existing
    where existing.variant_id = assigned.variant_id
      and existing.deleted_at is null
      and existing.id <> image.id
  ), image.sort)
from assigned
where image.id = assigned.image_id
  and image.variant_id is null;
