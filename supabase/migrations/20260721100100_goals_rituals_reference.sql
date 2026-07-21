-- ============================================================================
-- Vitala · Migration 0010 · Goal templates (versioned reference data, Phase 4)
-- ----------------------------------------------------------------------------
-- A small, curated, non-medical, non-moralising set of starter goals (spec §17)
-- covering movement, nutrition, sustainability, animal welfare and a shared
-- goal. Versioned here so every environment is identical (never dashboard-edited).
-- Templates are fully adjustable when instantiated — nothing is mandatory.
--
-- Explicitly NO templates for weight loss, calorie deficit, fasting, food
-- restriction or extreme training volumes (spec §17).
-- ============================================================================

insert into public.goal_templates
  (key, owner_type, life_area, title, description, measurement, target_value, unit,
   period_type, recurrence, activity_type_keys, ritual_definition_keys, sort_order)
values
  -- Movement -----------------------------------------------------------------
  ('move_3x_week', 'personal', 'movement',
   'Dreimal Bewegung pro Woche',
   'Drei Bewegungseinheiten in der Woche – jede Länge zählt.',
   'entry_count', 3, 'units', 'week', 'weekly', '{}', '{}', 10),
  ('strength_2x_week', 'personal', 'movement',
   'Zweimal Krafttraining pro Woche',
   'Zwei Krafteinheiten pro Woche für Stabilität und Kraft.',
   'entry_count', 2, 'units', 'week', 'weekly',
   array['strength', 'peloton_strength', 'gym'], '{}', 20),
  ('move_minutes_week', 'personal', 'movement',
   '150 Minuten Bewegung pro Woche',
   'Bewegungsminuten über die Woche gesammelt – Tempo egal.',
   'duration_minutes', 150, 'minutes', 'week', 'weekly', '{}', '{}', 30),
  ('walks_4x_week', 'personal', 'movement',
   'Vier Spaziergänge pro Woche',
   'Vier Spaziergänge in der Woche – gut für Kopf und Körper.',
   'entry_count', 4, 'units', 'week', 'weekly', array['walk'], '{}', 40),

  -- Nutrition ----------------------------------------------------------------
  ('balanced_meals_week', 'personal', 'nutrition',
   'Fünf ausgewogene vegane Mahlzeiten pro Woche',
   'Fünf ausgewogene vegane Hauptmahlzeiten in der Woche.',
   'entry_count', 5, 'meals', 'week', 'weekly', '{}',
   array['balanced_vegan_meal'], 50),
  ('self_cooked_week', 'personal', 'nutrition',
   'Dreimal selbst kochen',
   'An drei Tagen der Woche selbst kochen.',
   'entry_count', 3, 'meals', 'week', 'weekly', '{}', array['self_cooked'], 60),
  ('new_recipes_month', 'personal', 'nutrition',
   'Zwei neue vegane Rezepte im Monat',
   'Zwei neue vegane Rezepte im Monat ausprobieren.',
   'entry_count', 2, 'meals', 'month', 'monthly', '{}', array['new_recipe'], 70),

  -- Sustainability -----------------------------------------------------------
  ('sustainable_mobility_week', 'personal', 'sustainability',
   'Fünf nachhaltige Mobilitätsentscheidungen',
   'Fünf nachhaltige Wege pro Woche – Rad, zu Fuß oder ÖPNV.',
   'entry_count', 5, 'actions', 'week', 'weekly', '{}',
   array['bike_instead_car', 'walk_instead_motor', 'public_transport'], 80),
  ('reuse_month', 'personal', 'sustainability',
   'Acht Mehrwegaktionen im Monat',
   'Acht bewusste Mehrweg-Entscheidungen im Monat.',
   'entry_count', 8, 'actions', 'month', 'monthly', '{}', array['reusable'], 90),

  -- Animal welfare & biodiversity -------------------------------------------
  ('biodiversity_project_month', 'personal', 'animal_welfare',
   'Ein Biodiversitätsprojekt im Monat',
   'Ein größeres Projekt für Tierwohl oder Lebensraum im Monat.',
   'boolean', 1, 'actions', 'month', 'monthly', '{}',
   array['improved_habitat', 'wildflowers', 'nature_conservation'], 100),
  ('animal_learning_month', 'personal', 'animal_welfare',
   'Zwei Lerninhalte zu Tierwohl',
   'Zweimal im Monat Tierwohlwissen vertiefen.',
   'entry_count', 2, 'actions', 'month', 'monthly', '{}',
   array['animal_welfare_knowledge'], 110),

  -- Shared -------------------------------------------------------------------
  ('shared_activities_month', 'shared', 'movement',
   'Vier gemeinsame Aktivitäten im Monat',
   'Vier Aktivitäten im Monat, die ihr zusammen unternehmt.',
   'shared_count', 4, 'shared_activities', 'month', 'monthly', '{}', '{}', 120),
  ('shared_meals_month', 'shared', 'nutrition',
   'Zwölf gemeinsame gesunde Mahlzeiten',
   'Zwölf gemeinsame ausgewogene Mahlzeiten im Monat.',
   'shared_count', 12, 'shared_activities', 'month', 'monthly', '{}',
   array['balanced_vegan_meal'], 130),
  ('shared_sustainability_month', 'shared', 'sustainability',
   'Zehn nachhaltige Aktionen zusammen',
   'Zehn nachhaltige Aktionen, die ihr gemeinsam erfasst.',
   'shared_count', 10, 'shared_activities', 'month', 'monthly', '{}', '{}', 140);

grant select on public.goal_templates to anon, authenticated;
