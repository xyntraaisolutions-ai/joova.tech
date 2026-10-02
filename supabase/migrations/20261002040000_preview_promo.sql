create or replace function public.preview_promo(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v public.promo_codes%rowtype;
  v_today date := (timezone('America/Chicago', now()))::date;
  v_subtotal numeric := greatest(coalesce(p_subtotal, 0), 0);
  v_discount numeric;
begin
  if nullif(trim(coalesce(p_code, '')), '') is null then
    return jsonb_build_object('ok', true, 'discount', 0);
  end if;
  select * into v from public.promo_codes where code = upper(trim(p_code));
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if v.starts_on is not null and v_today < v.starts_on and v.enabled then
    return jsonb_build_object('ok', false, 'reason', 'not_yet');
  end if;
  if (v.ends_on is not null and v_today > v.ends_on)
    or (v.max_uses is not null and v.used_count >= v.max_uses)
    or not v.enabled then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if v.kind = 'percent' then
    v_discount := round(v_subtotal * v.amount) / 100;
  else
    v_discount := least(v.amount, v_subtotal);
  end if;
  v_discount := round(least(v_discount, v_subtotal) * 100) / 100;
  return jsonb_build_object('ok', true, 'discount', v_discount, 'code', v.code);
end;
$$;

revoke all on function public.preview_promo(text, numeric) from public;
grant execute on function public.preview_promo(text, numeric) to anon, authenticated;
