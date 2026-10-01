-- A device claim stays on the registration. Support reviews it, and a second click does not open another claim.

alter table public.warranty_claims add column if not exists registration_id uuid references public.warranty_registrations (id);
alter table public.warranty_claims add column if not exists decision_note text not null default '';
alter table public.warranty_claims add column if not exists customer_reply text not null default '';
alter table public.warranty_claims add column if not exists reviewed_at timestamptz;

with ranked as (
  select id,
    row_number() over (
      partition by user_id, coalesce(serial, ''), message
      order by created_at
    ) as n
  from public.warranty_claims
  where deleted_at is null and status = 'open'
)
update public.warranty_claims c
set deleted_at = now()
from ranked
where c.id = ranked.id and ranked.n > 1;

update public.warranty_claims c
set registration_id = r.id,
    product_id = coalesce(nullif(c.product_id, ''), r.product_id)
from public.warranty_registrations r
where c.deleted_at is null
  and c.registration_id is null
  and r.deleted_at is null
  and r.user_id = c.user_id
  and nullif(r.serial, '') is not null
  and r.serial = c.serial;

create or replace function public.customer_start_warranty_claim(p_registration uuid, p_message text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reg public.warranty_registrations%rowtype;
  v_profile public.profiles%rowtype;
  v_existing uuid;
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to start a warranty claim.');
  end if;
  if length(trim(coalesce(p_message, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Tell us what happened.');
  end if;
  select * into v_reg
  from public.warranty_registrations
  where id = p_registration and deleted_at is null and user_id = v_user
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That device is not on this account.');
  end if;
  if v_reg.coverage_ends_at is not null and v_reg.coverage_ends_at < now() then
    return jsonb_build_object('ok', false, 'error', 'Coverage for this device has ended.');
  end if;
  select id into v_existing
  from public.warranty_claims
  where registration_id = v_reg.id
    and deleted_at is null
    and status not in ('closed', 'replaced')
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'already', true, 'id', v_existing);
  end if;
  select * into v_profile from public.profiles where id = v_user;
  insert into public.warranty_claims (
    user_id, name, email, order_id, product_id, serial, message, status, registration_id
  ) values (
    v_user,
    coalesce(nullif(trim(v_profile.name), ''), 'Customer'),
    coalesce(nullif(lower(trim(v_profile.email)), ''), nullif(lower(trim(v_reg.contact_email)), ''), ''),
    coalesce(nullif(trim(v_reg.order_id), ''), ''),
    v_reg.product_id,
    nullif(trim(coalesce(v_reg.serial, '')), ''),
    trim(p_message),
    'open',
    v_reg.id
  )
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.customer_add_claim_info(p_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.warranty_claims%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to update this claim.');
  end if;
  if length(trim(coalesce(p_note, ''))) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Add the information support asked for.');
  end if;
  select * into v_claim from public.warranty_claims where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That claim was not found.');
  end if;
  if v_claim.status <> 'needs_info' then
    return jsonb_build_object('ok', false, 'error', 'Support is not waiting on more information.');
  end if;
  if v_claim.user_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'That claim is on a different account.');
  end if;
  update public.warranty_claims
  set customer_reply = trim(p_note), status = 'open'
  where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.support_review_claim(p_id uuid, p_decision text, p_note text, p_view_as text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decision text := lower(trim(coalesce(p_decision, '')));
  v_note text := trim(coalesce(p_note, ''));
  v_claim public.warranty_claims%rowtype;
begin
  if public.app_role() not in ('csr', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Customer support access is required.');
  end if;
  if v_decision not in ('approve', 'reject', 'needs_info', 'replace') then
    return jsonb_build_object('ok', false, 'error', 'Choose approve, reject, request more information, or mark the replacement sent.');
  end if;
  if v_decision in ('reject', 'needs_info') and length(v_note) < 3 then
    return jsonb_build_object('ok', false, 'error', 'Add a reason the customer can read.');
  end if;
  select * into v_claim from public.warranty_claims where id = p_id and deleted_at is null for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'That claim was not found.');
  end if;
  if v_decision = 'approve' and v_claim.status not in ('open', 'reviewing') then
    return jsonb_build_object('ok', false, 'error', 'Only an open claim can be approved.');
  end if;
  if v_decision = 'needs_info' and v_claim.status not in ('open', 'reviewing') then
    return jsonb_build_object('ok', false, 'error', 'More information can be requested while the claim is open.');
  end if;
  if v_decision = 'reject' and v_claim.status not in ('open', 'reviewing', 'needs_info', 'approved') then
    return jsonb_build_object('ok', false, 'error', 'This claim can no longer be closed.');
  end if;
  if v_decision = 'replace' and v_claim.status <> 'approved' then
    return jsonb_build_object('ok', false, 'error', 'Approve the claim before marking a replacement sent.');
  end if;
  if v_decision = 'approve' then
    update public.warranty_claims
    set status = 'approved', decision_note = v_note, reviewed_at = now()
    where id = p_id;
  elsif v_decision = 'needs_info' then
    update public.warranty_claims
    set status = 'needs_info', decision_note = v_note, reviewed_at = now()
    where id = p_id;
  elsif v_decision = 'replace' then
    update public.warranty_claims
    set status = 'replaced', reviewed_at = coalesce(reviewed_at, now())
    where id = p_id;
  else
    update public.warranty_claims
    set status = 'closed', decision_note = v_note, reviewed_at = now()
    where id = p_id;
  end if;
  perform public.record_audit(
    'review_claim',
    'warranty_claims',
    p_id::text,
    jsonb_build_object('decision', v_decision, 'note', v_note),
    p_view_as
  );
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.customer_start_warranty_claim(uuid, text) from public;
revoke all on function public.customer_add_claim_info(uuid, text) from public;
revoke all on function public.support_review_claim(uuid, text, text, text) from public;
grant execute on function public.customer_start_warranty_claim(uuid, text) to authenticated;
grant execute on function public.customer_add_claim_info(uuid, text) to authenticated;
grant execute on function public.support_review_claim(uuid, text, text, text) to authenticated;
