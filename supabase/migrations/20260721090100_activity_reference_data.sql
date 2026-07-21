-- ============================================================================
-- Vitala · Migration 0005 · Activity & ritual reference data (versioned seed)
-- ----------------------------------------------------------------------------
-- Deterministic catalog for the four life areas. This is REFERENCE data (not
-- household data), versioned in a migration so every environment is identical
-- (spec §10/§11 — no manual dashboard edits). Keys are stable domain ids;
-- names/labels are German display strings and may later be translated.
--
-- Sources: docs/life-areas.md §4.1–§4.4, docs/activity-types.md.
-- Note on "veganer Tag": deliberately NOT a daily animal-welfare block — vegan
-- living is the baseline for Lutz & René, so it must not be a daily farmable
-- entry (life-areas §4.4, ADR-0004, §9.2 of the Phase-3 brief).
-- ============================================================================

-- --- Movement activity types (life-areas §4.1) ----------------------------
insert into public.activity_types (key, name, category, icon, sort_order) values
  ('strength',         'Krafttraining',      'strength',    'movement', 10),
  ('endurance',        'Ausdauertraining',   'endurance',   'movement', 20),
  ('peloton_bike',     'Peloton Bike',       'endurance',   'movement', 30),
  ('peloton_strength', 'Peloton Kraft',      'strength',    'movement', 40),
  ('peloton_yoga',     'Peloton Yoga',       'mobility',    'movement', 50),
  ('gym',              'Fitnessstudio',      'strength',    'movement', 60),
  ('running',          'Laufen',             'endurance',   'movement', 70),
  ('treadmill',        'Laufband',           'endurance',   'movement', 80),
  ('yoga',             'Yoga',               'mobility',    'movement', 90),
  ('mobility',         'Mobility',           'mobility',    'movement', 100),
  ('walk',             'Spaziergang',        'everyday',    'movement', 110),
  ('cycling',          'Fahrrad',            'endurance',   'movement', 120),
  ('group_class',      'Gruppenkurs',        'class',       'movement', 130),
  ('hiking',           'Wandern',            'endurance',   'movement', 140),
  ('regeneration',     'Regeneration',       'regeneration','movement', 150),
  ('other_movement',   'Sonstige Bewegung',  'other',       'movement', 900);

-- --- Nutrition building blocks (life-areas §4.2) --------------------------
insert into public.ritual_definitions (key, area, kind, name, icon, sort_order) values
  ('balanced_vegan_meal', 'nutrition', 'daily_block', 'Ausgewogene vegane Hauptmahlzeit', 'nutrition', 10),
  ('self_cooked',         'nutrition', 'daily_block', 'Selbst gekocht',                    'nutrition', 20),
  ('vegetables',          'nutrition', 'daily_block', 'Gemüse',                            'nutrition', 30),
  ('fruit',               'nutrition', 'daily_block', 'Obst',                              'nutrition', 40),
  ('legumes',             'nutrition', 'daily_block', 'Hülsenfrüchte',                     'nutrition', 50),
  ('whole_grains',        'nutrition', 'daily_block', 'Vollkorn',                          'nutrition', 60),
  ('protein_source',      'nutrition', 'daily_block', 'Vegane Proteinquelle',              'nutrition', 70),
  ('hydration',           'nutrition', 'daily_block', 'Ausreichend getrunken',             'nutrition', 80),
  ('mindful_eating',      'nutrition', 'daily_block', 'Bewusst gegessen',                  'nutrition', 90),
  ('new_recipe',          'nutrition', 'daily_block', 'Neues veganes Rezept ausprobiert',  'nutrition', 100),
  ('avoided_food_waste',  'nutrition', 'daily_block', 'Lebensmittelverschwendung vermieden','nutrition',110),
  ('seasonal_food',       'nutrition', 'daily_block', 'Saisonale Lebensmittel',            'nutrition', 120),
  ('regional_food',       'nutrition', 'daily_block', 'Regionale Lebensmittel',            'nutrition', 130),
  ('rescued_food',        'nutrition', 'daily_block', 'Gerettete Lebensmittel verwendet',  'nutrition', 140);

-- --- Sustainability actions (life-areas §4.3) -----------------------------
insert into public.ritual_definitions (key, area, kind, name, icon, sort_order) values
  ('bike_instead_car',      'sustainability', 'daily_block',   'Fahrrad statt Auto',              'sustainability', 10),
  ('walk_instead_motor',    'sustainability', 'daily_block',   'Zu Fuß statt motorisiert',        'sustainability', 20),
  ('public_transport',      'sustainability', 'daily_block',   'ÖPNV genutzt',                    'sustainability', 30),
  ('carpool',               'sustainability', 'daily_block',   'Fahrgemeinschaft',                'sustainability', 40),
  ('avoided_trip',          'sustainability', 'daily_block',   'Unnötige Fahrt vermieden',        'sustainability', 50),
  ('reusable',              'sustainability', 'daily_block',   'Mehrweg verwendet',               'sustainability', 60),
  ('avoided_packaging',     'sustainability', 'daily_block',   'Verpackung vermieden',            'sustainability', 70),
  ('waste_separation',      'sustainability', 'daily_block',   'Müll korrekt getrennt',           'sustainability', 80),
  ('saved_electricity',     'sustainability', 'daily_block',   'Strom bewusst gespart',           'sustainability', 90),
  ('saved_water',           'sustainability', 'daily_block',   'Wasser bewusst gespart',          'sustainability', 100),
  ('sustainable_alternative','sustainability','daily_block',   'Nachhaltigere Alternative gewählt','sustainability',110),
  ('plant_alternative',     'sustainability', 'daily_block',   'Pflanzliche Alternative gewählt', 'sustainability', 120),
  ('seasonal_shopping',     'sustainability', 'daily_block',   'Saisonal eingekauft',             'sustainability', 130),
  ('regional_shopping',     'sustainability', 'daily_block',   'Regional eingekauft',             'sustainability', 140),
  ('shared_borrowed',       'sustainability', 'daily_block',   'Ausgeliehen oder geteilt',        'sustainability', 150),
  -- Larger one-off actions
  ('second_hand',           'sustainability', 'special_action','Second-Hand gekauft',             'sustainability', 200),
  ('repaired',              'sustainability', 'special_action','Repariert statt ersetzt',         'sustainability', 210),
  ('passed_on',             'sustainability', 'special_action','Gegenstand weitergegeben',        'sustainability', 220),
  ('avoided_purchase',      'sustainability', 'special_action','Unnötigen Kauf vermieden',        'sustainability', 230),
  ('rescued_food_large',    'sustainability', 'special_action','Lebensmittel gerettet (größere Menge)','sustainability', 240),
  ('household_project',     'sustainability', 'special_action','Nachhaltiges Haushaltsprojekt abgeschlossen','sustainability', 250);

-- --- Animal welfare & biodiversity actions (life-areas §4.4) ---------------
insert into public.ritual_definitions (key, area, kind, name, icon, sort_order) values
  ('replaced_animal_product','animal_welfare','daily_block',   'Tierprodukt bewusst ersetzt',     'animal_welfare', 10),
  ('animal_friendly_shopping','animal_welfare','daily_block',  'Tierfreundlich eingekauft',       'animal_welfare', 20),
  ('cruelty_free',          'animal_welfare', 'daily_block',   'Produkt ohne Tierversuche gewählt','animal_welfare', 30),
  ('animal_welfare_knowledge','animal_welfare','daily_block',  'Tierwohlwissen vertieft',         'animal_welfare', 40),
  ('native_plants',         'animal_welfare', 'daily_block',   'Heimische Pflanze gepflegt',      'animal_welfare', 50),
  ('insect_friendly_plants','animal_welfare', 'daily_block',   'Insektenfreundliche Pflanze gepflegt','animal_welfare', 60),
  ('bird_bath',             'animal_welfare', 'daily_block',   'Vogeltränke gepflegt',            'animal_welfare', 70),
  -- Larger one-off actions
  ('supported_shelter',     'animal_welfare', 'special_action','Tierheim unterstützt',            'animal_welfare', 200),
  ('supported_org',         'animal_welfare', 'special_action','Tierschutzorganisation unterstützt','animal_welfare', 210),
  ('animal_welfare_action', 'animal_welfare', 'special_action','Tierwohlaktion durchgeführt',     'animal_welfare', 220),
  ('wildflowers',           'animal_welfare', 'special_action','Wildblumen gepflegt oder gepflanzt','animal_welfare', 230),
  ('improved_habitat',      'animal_welfare', 'special_action','Lebensraum für Tiere verbessert', 'animal_welfare', 240),
  ('removed_litter',        'animal_welfare', 'special_action','Müll aus der Natur entfernt',     'animal_welfare', 250),
  ('nature_conservation',   'animal_welfare', 'special_action','Natur- oder Artenschutzprojekt unterstützt','animal_welfare', 260),
  ('wildlife_observation',  'animal_welfare', 'special_action','Tierbeobachtung dokumentiert',    'animal_welfare', 270);
