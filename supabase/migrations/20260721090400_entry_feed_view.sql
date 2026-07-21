-- ============================================================================
-- Vitala · Migration 0008 · entry_feed view (unified, paginated history)
-- ----------------------------------------------------------------------------
-- One row per captured entry: a movement activity OR a ritual check-in (the
-- group of chosen definitions collapsed into a single row). This is what the
-- shared history reads — keyset-paginated by (occurred_on, created_at, entry_id).
--
-- `security_invoker = true` (PG15): the view runs with the CALLER's privileges,
-- so the underlying activities / ritual_entries RLS policies (household scope +
-- `deleted_at is null`) apply automatically — no data leak, no separate policy.
--
-- Reference: docs/activity-history.md, spec §21/§22/§36.
-- ============================================================================

create view public.entry_feed
with (security_invoker = true)
as
-- Movement activities: one row each.
select
  'activity'::public.entry_kind          as kind,
  a.id                                   as entry_id,
  a.household_id,
  'movement'::public.life_area           as area,
  a.occurred_on,
  a.user_id                              as primary_user_id,
  a.created_by,
  a.is_shared,
  a.note,
  a.custom_label,
  a.created_at,
  a.updated_at,
  a.activity_type_id,
  a.duration_min,
  a.intensity,
  a.location,
  a.started_at_time,
  null::uuid[]                           as definition_ids,
  null::text                             as meal_label,
  false                                  as is_special
from public.activities a
where a.deleted_at is null

union all

-- Ritual check-ins: collapse the group into a single row.
select
  'ritual'::public.entry_kind            as kind,
  re.entry_group_id                      as entry_id,
  re.household_id,
  re.area,
  re.occurred_on,
  re.user_id                             as primary_user_id,
  re.created_by,
  re.is_shared,
  re.note,
  re.custom_label,
  min(re.created_at)                     as created_at,
  max(re.updated_at)                     as updated_at,
  null::uuid                             as activity_type_id,
  null::integer                          as duration_min,
  null::public.activity_intensity        as intensity,
  null::text                             as location,
  null::time                             as started_at_time,
  array_agg(re.ritual_definition_id order by rd.sort_order) as definition_ids,
  re.meal_label,
  bool_or(rd.kind = 'special_action')    as is_special
from public.ritual_entries re
join public.ritual_definitions rd on rd.id = re.ritual_definition_id
where re.deleted_at is null
group by
  re.entry_group_id, re.household_id, re.area, re.occurred_on,
  re.user_id, re.created_by, re.is_shared, re.note, re.custom_label, re.meal_label;

grant select on public.entry_feed to authenticated;
