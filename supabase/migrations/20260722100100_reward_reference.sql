-- ============================================================================
-- Vitala · Migration 0015 · Reward reference data (Phase 5)
-- ----------------------------------------------------------------------------
-- Deterministic, versioned reference data: rule version 1, movement reward
-- weights, the generated level tables (from the ADR-0003 formulas), and the
-- curated mission pool (§27). Values mirror src/domain/rewards exactly so the
-- client preview and the server never disagree (ADR-0005).
-- ============================================================================

-- --- Rule version 1 --------------------------------------------------------
insert into public.reward_rule_versions (version, is_active, valid_from, description, params)
values (1, true, date '2026-01-01', 'Phase-5 Ausgangsregeln (resources-and-xp §2/§5)',
  jsonb_build_object(
    'city_xp_coupling', 0.5,
    'resource_yield', 0.4,
    'daily_caps', jsonb_build_object('movement', 30, 'nutrition', 12, 'sustainability', 10, 'animal_welfare', 10),
    'special_action_bonus_cap', 5));

-- --- Movement reward weights (resources-and-xp §2) --------------------------
-- Strength/endurance 1.10 · class 1.05 · everything else 1.00. Regeneration is
-- a fixed-value type (flag), independent of duration.
update public.activity_types set reward_weight = 1.10 where category in ('strength', 'endurance');
update public.activity_types set reward_weight = 1.05 where category = 'class';
update public.activity_types set reward_weight = 1.00 where category in ('mobility', 'everyday', 'other');
update public.activity_types set is_regeneration = true, reward_weight = 1.00 where category = 'regeneration';

-- --- Level definitions (generated) -----------------------------------------
-- personal: total(N) = 20·(N−1)·(N+4);  city: total(N) = 20·(N−1)·(3N+10).
insert into public.level_definitions (scope, level, cumulative_xp, title)
select 'personal'::public.xp_scope, n, 20 * (n - 1) * (n + 4),
  case
    when n >= 50 then 'Weltenhüter'
    when n >= 40 then 'Stadtentwickler'
    when n >= 30 then 'Lebensraumgestalter'
    when n >= 20 then 'Zukunftspfleger'
    when n >= 15 then 'Verbinder'
    when n >= 10 then 'Gestalter'
    when n >= 5  then 'Wegbereiter'
    else 'Aufbruch'
  end
from generate_series(1, 60) as n;

insert into public.level_definitions (scope, level, cumulative_xp, title)
select 'city'::public.xp_scope, n, 20 * (n - 1) * (3 * n + 10),
  case
    when n >= 30 then 'Regenerative Welt'
    when n >= 23 then 'Lebenswerte Region'
    when n >= 17 then 'Grüne Metropole'
    when n >= 12 then 'Vernetzte Stadt'
    when n >= 8  then 'Nachhaltige Stadt'
    when n >= 5  then 'Lebendiges Viertel'
    when n >= 3  then 'Grüne Siedlung'
    else 'Keimzelle'
  end
from generate_series(1, 40) as n;

-- --- Mission pool (§24–§26) ------------------------------------------------
-- Rewards follow src/domain/rewards/events.ts missionReward(scope, period, area):
--   personal day  8 XP / 4 city / 1 primary
--   shared   day  6 XP / 10 city / 1 primary + 1 community
--   personal week 20 XP / 10 city / 2 primary
--   shared   week 15 XP / 30 city / 3 primary + 2 community
insert into public.mission_definitions
  (key, title, description, area, scope, period, measurement, target_value, difficulty,
   activity_type_keys, ritual_definition_keys, min_minutes, demanding,
   personal_xp, city_xp, reward_resource, reward_resource_amount, reward_community)
values
  -- Personal daily · movement
  ('pd_walk',        'Spaziergang',              'Mindestens 20 Minuten spazieren gehen.',            'movement', 'personal', 'day', 'duration_minutes', 20, 'leicht',  '{walk,hiking}', '{}', 20, false, 8, 4, 'energy', 1, 0),
  ('pd_mobility',    'Kurze Mobility-Einheit',   'Zehn Minuten Mobility oder sanftes Dehnen.',        'movement', 'personal', 'day', 'duration_minutes', 10, 'leicht',  '{mobility,yoga,peloton_yoga}', '{}', 10, false, 8, 4, 'energy', 1, 0),
  ('pd_session',     'Eine Bewegungseinheit',    'Eine Bewegungseinheit dokumentieren.',              'movement', 'personal', 'day', 'activity_count',   1,  'normal',  '{}', '{}', 20, true,  8, 4, 'energy', 1, 0),
  ('pd_regen',       'Bewusste Regeneration',    'Heute bewusst Regeneration einplanen.',             'movement', 'personal', 'day', 'activity_count',   1,  'leicht',  '{regeneration}', '{}', null, false, 8, 4, 'energy', 1, 0),
  -- Personal daily · nutrition
  ('pd_balanced',    'Ausgewogene Mahlzeit',     'Eine ausgewogene vegane Hauptmahlzeit dokumentieren.','nutrition','personal','day','ritual_count',    1,  'leicht',  '{}', '{balanced_vegan_meal}', null, false, 8, 4, 'food', 1, 0),
  ('pd_legumes',     'Hülsenfrüchte integrieren','Heute eine Hülsenfrucht oder Proteinquelle essen.', 'nutrition', 'personal', 'day', 'ritual_count',   1,  'leicht',  '{}', '{legumes,protein_source}', null, false, 8, 4, 'food', 1, 0),
  ('pd_cook',        'Selbst zubereitet',        'Eine Mahlzeit selbst zubereiten.',                  'nutrition', 'personal', 'day', 'ritual_count',   1,  'leicht',  '{}', '{self_cooked}', null, false, 8, 4, 'food', 1, 0),
  -- Personal daily · sustainability
  ('pd_reusable',    'Mehrweg nutzen',           'Heute eine Mehrwegoption nutzen.',                  'sustainability','personal','day','ritual_count', 1, 'leicht',  '{}', '{reusable,avoided_packaging}', null, false, 8, 4, 'nature', 1, 0),
  ('pd_active_way',  'Aktiv unterwegs',          'Einen Weg zu Fuß, mit Rad oder ÖPNV zurücklegen.',  'sustainability','personal','day','ritual_count', 1, 'leicht',  '{}', '{bike_instead_car,walk_instead_motor,public_transport}', null, false, 8, 4, 'nature', 1, 0),
  ('pd_reuse',       'Weiterverwenden',          'Einen Gegenstand weiterverwenden statt neu kaufen.','sustainability','personal','day','ritual_count', 1, 'normal',  '{}', '{shared_borrowed,repaired,passed_on,second_hand}', null, false, 8, 4, 'nature', 1, 0),
  -- Personal daily · animal welfare
  ('pd_bird_bath',   'Vogeltränke prüfen',       'Die Vogeltränke prüfen oder auffüllen.',            'animal_welfare','personal','day','ritual_count', 1, 'leicht',  '{}', '{bird_bath}', null, false, 8, 4, 'nature', 1, 0),
  ('pd_plant',       'Insektenfreundlich pflegen','Eine insektenfreundliche Pflanze pflegen.',        'animal_welfare','personal','day','ritual_count', 1, 'leicht',  '{}', '{insect_friendly_plants,native_plants}', null, false, 8, 4, 'nature', 1, 0),
  ('pd_animal_alt',  'Tierfreundliche Wahl',     'Eine konkrete tierfreundliche Alternative wählen.', 'animal_welfare','personal','day','ritual_count', 1, 'normal',  '{}', '{replaced_animal_product,animal_friendly_shopping,cruelty_free}', null, false, 8, 4, 'nature', 1, 0),
  -- Personal weekly
  ('pw_three_areas', 'Drei Bereiche in einer Woche','Diese Woche drei verschiedene Lebensbereiche berücksichtigen.', null,'personal','week','distinct_areas', 3, 'normal', '{}', '{}', null, false, 20, 10, null, 0, 2),
  ('pw_active_days', 'Vier aktive Bewegungstage','An vier Tagen dieser Woche Bewegung dokumentieren.','movement','personal','week','active_days', 4, 'normal', '{}', '{}', null, true, 20, 10, 'energy', 2, 0),
  ('pw_mobility',    'Nachhaltig unterwegs',     'Vier nachhaltige Mobilitätsentscheidungen dokumentieren.','sustainability','personal','week','ritual_count', 4, 'normal', '{}', '{bike_instead_car,walk_instead_motor,public_transport,carpool,avoided_trip}', null, false, 20, 10, 'nature', 2, 0),
  ('pw_cook_twice',  'Zweimal selbst kochen',    'Zweimal selbst kochen in dieser Woche.',            'nutrition','personal','week','ritual_count', 2, 'normal', '{}', '{self_cooked}', null, false, 20, 10, 'food', 2, 0),
  ('pw_biodiv',      'Zwei Biodiversitätshandlungen','Zwei Handlungen für Tierwohl oder Biodiversität.','animal_welfare','personal','week','ritual_count', 2, 'normal', '{}', '{}', null, false, 20, 10, 'nature', 2, 0),
  -- Shared daily
  ('sd_walk',        'Gemeinsam spazieren',      'Gemeinsam einen Spaziergang machen.',               'movement','shared','day','shared_count', 1, 'gemeinschaftlich', '{walk,hiking}', '{}', null, false, 6, 10, 'energy', 1, 1),
  ('sd_meal',        'Gemeinsame Mahlzeit',      'Eine gemeinsame ausgewogene Mahlzeit dokumentieren.','nutrition','shared','day','shared_count', 1, 'gemeinschaftlich', '{}', '{balanced_vegan_meal}', null, false, 6, 10, 'food', 1, 1),
  ('sd_sustainable', 'Gemeinsam nachhaltig',     'Gemeinsam eine kleine nachhaltige Entscheidung treffen.','sustainability','shared','day','shared_count', 1, 'gemeinschaftlich', '{}', '{}', null, false, 6, 10, 'nature', 1, 1),
  ('sd_nature',      'Gemeinsame Naturpflege',   'Gemeinsam eine Pflegehandlung für Natur oder Tiere.','animal_welfare','shared','day','shared_count', 1, 'gemeinschaftlich', '{}', '{}', null, false, 6, 10, 'nature', 1, 1),
  -- Shared weekly
  ('sw_two_shared',  'Zwei gemeinsame Aktivitäten','Zwei gemeinsame Aktivitäten in dieser Woche.',    'movement','shared','week','shared_count', 2, 'gemeinschaftlich', '{}', '{}', null, false, 15, 30, 'energy', 3, 2),
  ('sw_shared_care', 'Gemeinsame Woche für die Natur','Gemeinsam zwei Handlungen für Natur oder Tiere.','animal_welfare','shared','week','shared_count', 2, 'gemeinschaftlich', '{}', '{}', null, false, 15, 30, 'nature', 3, 2);
