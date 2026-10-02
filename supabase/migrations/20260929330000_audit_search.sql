-- Search, facets, and permanent removal of a single audit entry.

create or replace function public.audit_keyword(p_keyword text)
returns text
language sql
immutable
as $$
  select nullif(
    replace(replace(replace(trim(coalesce(p_keyword, '')), '\', '\\'), '%', '\%'), '_', '\_'),
    ''
  );
$$;

create or replace function public.list_audit(
  p_entity text,
  p_action text,
  p_actor text,
  p_from timestamptz,
  p_to timestamptz,
  p_keyword text,
  p_limit integer,
  p_offset integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := least(100, greatest(1, coalesce(p_limit, 10)));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_keyword text := public.audit_keyword(p_keyword);
begin
  if coalesce(public.app_role(), '') <> 'super_admin' then
    return jsonb_build_object('ok', false, 'error', 'Super Admin access is required.');
  end if;

  return (
    with matched as (
      select
        a.created_at,
        jsonb_build_object(
          'id', a.id,
          'action', a.action,
          'entity', a.entity,
          'entity_id', a.entity_id,
          'reason', a.reason,
          'detail', a.detail,
          'before', a.before,
          'after', a.after,
          'view_as', a.view_as,
          'created_at', a.created_at,
          'actor_name', coalesce(nullif(trim(p.name), ''), nullif(trim(p.email), ''), 'System'),
          'actor_email', coalesce(p.email, '')
        ) as payload
      from public.audit_log a
      left join public.profiles p on p.id = a.actor_id
      where (nullif(trim(coalesce(p_entity, '')), '') is null or a.entity = trim(p_entity))
        and (nullif(trim(coalesce(p_action, '')), '') is null or a.action = trim(p_action))
        and (
          nullif(trim(coalesce(p_actor, '')), '') is null
          or (trim(p_actor) = 'system' and a.actor_id is null)
          or (trim(p_actor) <> 'system' and a.actor_id::text = trim(p_actor))
        )
        and (p_from is null or a.created_at >= p_from)
        and (p_to is null or a.created_at <= p_to)
        and (
          v_keyword is null
          or a.entity ilike '%' || v_keyword || '%' escape '\'
          or coalesce(a.entity_id, '') ilike '%' || v_keyword || '%' escape '\'
          or a.action ilike '%' || v_keyword || '%' escape '\'
          or coalesce(a.reason, '') ilike '%' || v_keyword || '%' escape '\'
          or coalesce(a.detail::text, '') ilike '%' || v_keyword || '%' escape '\'
          or coalesce(a.before::text, '') ilike '%' || v_keyword || '%' escape '\'
          or coalesce(a.after::text, '') ilike '%' || v_keyword || '%' escape '\'
          or coalesce(p.name, '') ilike '%' || v_keyword || '%' escape '\'
          or coalesce(p.email, '') ilike '%' || v_keyword || '%' escape '\'
        )
    )
    select jsonb_build_object(
      'ok', true,
      'total', (select count(*) from matched),
      'rows', coalesce((
        select jsonb_agg(payload order by created_at desc)
        from (
          select payload, created_at
          from matched
          order by created_at desc
          limit v_limit offset v_offset
        ) page
      ), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.audit_facets(
  p_from timestamptz,
  p_to timestamptz,
  p_keyword text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_keyword text := public.audit_keyword(p_keyword);
begin
  if coalesce(public.app_role(), '') <> 'super_admin' then
    return jsonb_build_object('ok', false, 'error', 'Super Admin access is required.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'entities', coalesce((
      select jsonb_agg(entity order by entity)
      from (
        select distinct a.entity
        from public.audit_log a
        left join public.profiles p on p.id = a.actor_id
        where (p_from is null or a.created_at >= p_from)
          and (p_to is null or a.created_at <= p_to)
          and (
            v_keyword is null
            or a.entity ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.entity_id, '') ilike '%' || v_keyword || '%' escape '\'
            or a.action ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.reason, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.detail::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.before::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.after::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(p.name, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(p.email, '') ilike '%' || v_keyword || '%' escape '\'
          )
      ) entities
    ), '[]'::jsonb),
    'actions', coalesce((
      select jsonb_agg(action order by action)
      from (
        select distinct a.action
        from public.audit_log a
        left join public.profiles p on p.id = a.actor_id
        where (p_from is null or a.created_at >= p_from)
          and (p_to is null or a.created_at <= p_to)
          and (
            v_keyword is null
            or a.entity ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.entity_id, '') ilike '%' || v_keyword || '%' escape '\'
            or a.action ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.reason, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.detail::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.before::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.after::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(p.name, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(p.email, '') ilike '%' || v_keyword || '%' escape '\'
          )
      ) actions
    ), '[]'::jsonb),
    'actors', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'label', label) order by label)
      from (
        select
          case when a.actor_id is null then 'system' else a.actor_id::text end as id,
          case
            when a.actor_id is null then 'System'
            else trim(both ' ·' from concat_ws(' · ', nullif(trim(p.name), ''), nullif(trim(p.email), '')))
          end as label
        from public.audit_log a
        left join public.profiles p on p.id = a.actor_id
        where (p_from is null or a.created_at >= p_from)
          and (p_to is null or a.created_at <= p_to)
          and (
            v_keyword is null
            or a.entity ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.entity_id, '') ilike '%' || v_keyword || '%' escape '\'
            or a.action ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.reason, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.detail::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.before::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(a.after::text, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(p.name, '') ilike '%' || v_keyword || '%' escape '\'
            or coalesce(p.email, '') ilike '%' || v_keyword || '%' escape '\'
          )
        group by 1, 2
      ) actors
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.delete_audit_entry(p_id uuid, p_confirm text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.app_role(), '') <> 'super_admin' then
    return jsonb_build_object('ok', false, 'error', 'Super Admin access is required.');
  end if;
  if trim(coalesce(p_confirm, '')) <> 'PERMANENT DELETE' then
    return jsonb_build_object('ok', false, 'error', 'Type PERMANENT DELETE to erase this audit entry.');
  end if;
  if nullif(trim(coalesce(p_reason, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'A reason is required.');
  end if;
  delete from public.audit_log where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That audit entry was not found.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.audit_keyword(text) from public;
revoke all on function public.list_audit(text, text, text, timestamptz, timestamptz, text, integer, integer) from public;
revoke all on function public.audit_facets(timestamptz, timestamptz, text) from public;
revoke all on function public.delete_audit_entry(uuid, text, text) from public;
grant execute on function public.list_audit(text, text, text, timestamptz, timestamptz, text, integer, integer) to authenticated;
grant execute on function public.audit_facets(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.delete_audit_entry(uuid, text, text) to authenticated;
