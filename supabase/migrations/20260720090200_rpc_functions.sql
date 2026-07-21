-- ============================================================================
-- Vitala · Migration 0003 · RPC functions (household & membership lifecycle)
-- ----------------------------------------------------------------------------
-- The only write path to households / household_members / household_invites.
-- Each function is SECURITY DEFINER with a fixed empty search_path, checks the
-- caller's identity and role, and is safe to retry (idempotent where sensible).
--
-- References: docs/authentication.md, docs/household-model.md,
-- security-and-privacy §17.2/§17.5, ADR-0006, ADR-0011.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- create_household(name) → household id
-- Idempotent: if the caller is already an active member, returns that
-- household instead of creating a second one (onboarding reload safety).
-- ---------------------------------------------------------------------------
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing uuid;
  v_household uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using hint = 'Bitte zuerst anmelden.';
  end if;

  select hm.household_id into v_existing
  from public.household_members hm
  where hm.user_id = v_uid and hm.status = 'active'
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'invalid_name' using hint = 'Bitte einen Namen mit 1–80 Zeichen angeben.';
  end if;

  insert into public.households (name, created_by)
  values (v_name, v_uid)
  returning id into v_household;

  insert into public.household_settings (household_id) values (v_household);

  insert into public.household_members (household_id, user_id, role, status)
  values (v_household, v_uid, 'owner', 'active');

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id)
  values (v_household, v_uid, 'household_created', 'household', v_household);

  return v_household;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_household_invite() → (code, expires_at)
-- Owner-only. The plaintext code is returned ONCE; only its hash is stored.
-- ---------------------------------------------------------------------------
create or replace function public.create_household_invite()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_code text;
  v_expires timestamptz := now() + interval '7 days';
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select hm.household_id into v_household
  from public.household_members hm
  where hm.user_id = v_uid and hm.status = 'active' and hm.role = 'owner'
  limit 1;

  if v_household is null then
    raise exception 'not_owner' using hint = 'Nur die verwaltende Person kann einladen.';
  end if;

  if app.active_member_count(v_household) >= 2 then
    raise exception 'household_full' using hint = 'Der Household ist bereits vollständig.';
  end if;

  -- 10 hex chars (~40 bits); ample for a private one-time invite.
  v_code := upper(encode(extensions.gen_random_bytes(5), 'hex'));

  -- Supersede any earlier unaccepted invites for this household. Alias the
  -- table so `expires_at` resolves to the column, not the OUT parameter.
  update public.household_invites hi
    set expires_at = now()
    where hi.household_id = v_household
      and hi.accepted_at is null
      and hi.expires_at > now();

  insert into public.household_invites (household_id, code_hash, created_by, expires_at)
  values (
    v_household,
    encode(extensions.digest(v_code, 'sha256'), 'hex'),
    v_uid,
    v_expires
  );

  insert into public.audit_log (household_id, actor_id, action, entity)
  values (v_household, v_uid, 'invite_created', 'household_invite');

  return query select v_code, v_expires;
end;
$$;

-- ---------------------------------------------------------------------------
-- accept_household_invite(code) → household id
-- Validates the hashed code, enforces the two-member cap, adds the caller as a
-- member. Rejects users who are already in a household.
-- ---------------------------------------------------------------------------
create or replace function public.accept_household_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_invite public.household_invites;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (
    select 1 from public.household_members hm
    where hm.user_id = v_uid and hm.status = 'active'
  ) then
    raise exception 'already_in_household'
      using hint = 'Du bist bereits Teil eines Households.';
  end if;

  v_hash := encode(extensions.digest(upper(btrim(coalesce(p_code, ''))), 'sha256'), 'hex');

  select * into v_invite
  from public.household_invites
  where code_hash = v_hash
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if v_invite.id is null then
    raise exception 'invalid_invite'
      using hint = 'Der Code ist ungültig oder abgelaufen.';
  end if;

  if app.active_member_count(v_invite.household_id) >= 2 then
    raise exception 'household_full' using hint = 'Der Household ist bereits vollständig.';
  end if;

  insert into public.household_members (household_id, user_id, role, status)
  values (v_invite.household_id, v_uid, 'member', 'active');

  update public.household_invites
    set accepted_at = now(), accepted_by = v_uid
    where id = v_invite.id;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id)
  values (v_invite.household_id, v_uid, 'invite_accepted', 'household_member', v_uid);

  return v_invite.household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- deactivate_household_member(member_id)
-- Owner-only; cannot deactivate yourself. Reversible (status flag only).
-- ---------------------------------------------------------------------------
create or replace function public.deactivate_household_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.household_members;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_member from public.household_members where id = p_member_id;
  if v_member.id is null then
    raise exception 'not_found';
  end if;

  if not app.is_owner(v_member.household_id, v_uid) then
    raise exception 'not_owner';
  end if;

  if v_member.user_id = v_uid then
    raise exception 'cannot_deactivate_self'
      using hint = 'Du kannst dich nicht selbst entfernen.';
  end if;

  update public.household_members set status = 'deactivated' where id = p_member_id;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id)
  values (v_member.household_id, v_uid, 'member_deactivated', 'household_member', v_member.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: expose only to authenticated (never anon). Revoke the PUBLIC default.
-- ---------------------------------------------------------------------------
revoke all on function public.create_household(text) from public;
revoke all on function public.create_household_invite() from public;
revoke all on function public.accept_household_invite(text) from public;
revoke all on function public.deactivate_household_member(uuid) from public;

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.create_household_invite() to authenticated;
grant execute on function public.accept_household_invite(text) to authenticated;
grant execute on function public.deactivate_household_member(uuid) to authenticated;
