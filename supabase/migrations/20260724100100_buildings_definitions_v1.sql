-- ============================================================================
-- Vitala · Migration 0025 · Building definitions V1 data (Phase 7) — DML
-- ---------------------------------------------------------------------------
-- Insert the canonical 19 buildings from the Phase-1 specification.
-- All V1 buildings are frozen at definition_version = 1.
--
-- Cost balancing:
-- • Small buildings (~10–18 total) are reachable within days.
-- • Medium buildings (~20–35 total) are mid-term goals (weeks).
-- • Large buildings (~40–65 total) are long-term joint targets.
-- • All costs are tuned against typical household resource income (~35–45/week per type).
-- ============================================================================

insert into public.building_definitions (
  id,
  title,
  description,
  long_description,
  primary_category,
  secondary_areas,
  compatible_sizes,
  allowed_regions,
  unlock_level,
  prerequisite_building,
  base_cost_energy,
  base_cost_food,
  base_cost_nature,
  base_cost_community,
  base_cost_building_material,
  upgrade_costs,
  effects,
  asset_id,
  a11y_description,
  sort_order,
  rule_version,
  definition_version
) values
  -- MOVEMENT (5 buildings)
  ('training_room', 'Trainingsraum', 'Ein Platz für regelmäßiges Training und Kraftentwicklung.', 'Der Trainingsraum ist ein Ort der Konzentration und Kontinuität. Hier entstehen feste Bewegungsroutinen und regelmäßiges Training wird Teil der gemeinsamen Struktur. Der Raum schafft Raum für fokussierte Bewegung.', 'movement', '{}', '{small,medium}', '{movement_quarter}', 2, null, 12, 0, 2, 3, 8, '{}'::jsonb, '[{"id":"training_room_missions","type":"mission_pool_add","parameters":{"mission_type":"movement_focus"},"limit":0,"limitPeriod":"none","label":"Neue fokussierte Bewegungsmissionen verfügbar"}]'::jsonb, 'building_training_room', 'Trainingsraum, kleines bis mittleres Gebäude im Sportviertel', 1, 1, 1),

  ('gym', 'Fitnessstudio', 'Moderne Ausrüstung für diverse Trainingsmethoden.', 'Das Fitnessstudio erweitert die Möglichkeiten für abwechslungsreiches Training. Mit verschiedenen Geräten und Flächen entstehen neue Trainingsmöglichkeiten für beide.', 'movement', '{}', '{medium,large}', '{movement_quarter}', 3, 'training_room', 18, 2, 3, 5, 16, '{}'::jsonb, '[{"id":"gym_goals","type":"goal_template_unlock","parameters":{"goal_template":"gym_strength_goal"},"limit":0,"limitPeriod":"none","label":"Neue Trainingszielvorlagen freigeschaltet"}]'::jsonb, 'building_gym', 'Fitnessstudio, mittleres bis großes Gebäude im Sportviertel', 2, 1, 1),

  ('running_track', 'Laufstrecke', 'Ein gepflegter Weg für Laufen und Joggen.', 'Die Laufstrecke ist ein offener, einladender Ort für Ausdauerbewegung. Ein schöner Weg mit klarer Länge schafft Struktur für das gemeinsame Joggen.', 'movement', '{}', '{large}', '{movement_quarter}', 2, null, 10, 0, 4, 2, 9, '{}'::jsonb, '[{"id":"running_track_bonus","type":"resource_bonus","parameters":{"resource_type":"energy","value":1,"trigger":"shared_outdoor_activity"},"limit":2,"limitPeriod":"week","label":"Bis zu 2× pro Woche +1 Energie für gemeinsame Außenaktivitäten"}]'::jsonb, 'building_running_track', 'Laufstrecke, großes Gebäude im Sportviertel', 3, 1, 1),

  ('yoga_studio', 'Yogastudio', 'Ein ruhiger Platz für Yoga und Dehnübungen.', 'Das Yogastudio ist ein Ort der Ruhe und Achtsamkeit. Hier entsteht Raum für sanfte, regenerative Bewegung und gemeinsame Rituale der Entschleunigung.', 'movement', '{}', '{small}', '{movement_quarter}', 2, null, 8, 1, 3, 4, 7, '{}'::jsonb, '[{"id":"yoga_ritual","type":"ritual_template_unlock","parameters":{"ritual_template":"shared_yoga_morning"},"limit":0,"limitPeriod":"none","label":"Neues gemeinsames Morgen-Yoga-Ritual möglich"}]'::jsonb, 'building_yoga_studio', 'Yogastudio, kleines Gebäude im Sportviertel', 4, 1, 1),

  ('bike_station', 'Fahrradstation', 'Werkstatt und Abstellplatz für Fahrräder.', 'Die Fahrradstation verbindet Bewegung mit Nachhaltigkeit. Hier werden Fahrräder gepflegt und Radausflüge geplant – eine Brücke zwischen Aktivität und Umweltschonung.', 'movement', '{sustainability}', '{small,medium}', '{movement_quarter,sustainability_infra}', 2, null, 9, 0, 3, 3, 8, '{}'::jsonb, '[{"id":"bike_missions","type":"mission_pool_add","parameters":{"mission_type":"bike_activity"},"limit":0,"limitPeriod":"none","label":"Fahrrad-Missionen verfügbar"}]'::jsonb, 'building_bike_station', 'Fahrradstation, kleines bis mittleres Gebäude', 5, 1, 1),

  -- NUTRITION (4 buildings)
  ('veg_bed', 'Gemüsebeet', 'Ein kleines Beet für frisches Gemüse.', 'Das Gemüsebeet ist der Anfang der Eigenversorgung. Ein überschaubares Projekt, das schnell erste Früchte bringt und den Samen für größere Gartenprojekte legt.', 'nutrition', '{}', '{small}', '{nutrition_quarter,residential}', 1, null, 2, 8, 5, 2, 6, '{}'::jsonb, '[{"id":"veg_missions","type":"mission_pool_add","parameters":{"mission_type":"veg_gardening"},"limit":0,"limitPeriod":"none","label":"Garten-Missionen verfügbar"}]'::jsonb, 'building_veg_bed', 'Gemüsebeet, kleines Gebäude', 1, 1, 1),

  ('community_garden', 'Gemeinschaftsgarten', 'Ein großer, gepflegter Garten für gemeinsame Ernte.', 'Der Gemeinschaftsgarten ist ein Zentrum der Eigenversorgung und des gemeinsamen Handelns. Hier wachsen Gemüse, Kräuter und Früchte – und mit ihnen eine tiefere Verbindung zur Natur und zueinander.', 'nutrition', '{}', '{medium,large}', '{nutrition_quarter}', 3, 'veg_bed', 5, 22, 10, 8, 18, '{}'::jsonb, '[{"id":"community_garden_goals","type":"goal_template_unlock","parameters":{"goal_template":"shared_garden_goal"},"limit":0,"limitPeriod":"none","label":"Neue gemeinsame Gartenziele freigeschaltet"}]'::jsonb, 'building_community_garden', 'Gemeinschaftsgarten, mittleres bis großes Gebäude', 2, 1, 1),

  ('orchard', 'Obstgarten', 'Obstbäume und Beerensträucher für langfristige Ernte.', 'Der Obstgarten ist ein Versprechen in die Zukunft. Mit Bäumen, die über Jahre hinweg wachsen, entsteht eine Kontinuität von Pflege und Ernte – wie auch die gemeinsame Stadt selbst.', 'nutrition', '{sustainability}', '{large}', '{nutrition_quarter}', 3, null, 3, 18, 8, 4, 15, '{}'::jsonb, '[{"id":"orchard_bonus","type":"resource_bonus","parameters":{"resource_type":"food","value":1,"trigger":"harvest"},"limit":3,"limitPeriod":"week","label":"Bis zu 3× pro Woche +1 Nahrung bei Ernte-Aktivitäten"}]'::jsonb, 'building_orchard', 'Obstgarten, großes Gebäude im Ernährungsviertel', 3, 1, 1),

  ('farmers_market', 'Wochenmarkt', 'Ein Marktplatz für Austausch regionaler, veganer Produkte.', 'Der Wochenmarkt ist ein Treffpunkt und Verteilzentrum für regionale, vegane Produkte. Hier tauschen sich Lutz und René mit anderen Gärtner*innen aus und entdecken neue Sorten.', 'nutrition', '{community}', '{medium,large}', '{nutrition_quarter}', 4, null, 2, 16, 3, 10, 14, '{}'::jsonb, '[{"id":"market_ritual","type":"ritual_template_unlock","parameters":{"ritual_template":"market_visit_ritual"},"limit":0,"limitPeriod":"none","label":"Ritual \"Wochenmarktbesuch\" freigeschaltet"}]'::jsonb, 'building_farmers_market', 'Wochenmarkt, mittleres bis großes Gebäude', 4, 1, 1),

  -- SUSTAINABILITY (5 buildings)
  ('solar_roofs', 'Solardächer', 'Solaranlagen auf Hausdächern für saubere Energie.', 'Die Solardächer nutzen die Kraft der Sonne für saubere Energie. Ein sichtbares Symbol der Stadttransformation – jeden Tag sichtbar, jeden Tag wirksam.', 'sustainability', '{}', '{small,medium}', '{sustainability_infra}', 4, null, 6, 1, 10, 4, 12, '{}'::jsonb, '[{"id":"solar_missions","type":"mission_pool_add","parameters":{"mission_type":"renewable_energy"},"limit":0,"limitPeriod":"none","label":"Missionen zu erneuerbarer Energie verfügbar"}]'::jsonb, 'building_solar_roofs', 'Solardächer, kleines bis mittleres Gebäude', 1, 1, 1),

  ('rainwater_store', 'Regenwasserspeicher', 'Sammlung und Speicherung von Regenwasser.', 'Der Regenwasserspeicher nutzt das kostbare Regenwasser und reduziert Abhängigkeit von externen Ressourcen. Ein kluges System, das den Wasserkreislauf respektiert.', 'sustainability', '{}', '{small}', '{sustainability_infra,nutrition_quarter}', 4, null, 3, 2, 12, 2, 10, '{}'::jsonb, '[{"id":"rainwater_bonus","type":"resource_bonus","parameters":{"resource_type":"nature","value":1,"trigger":"rainy_activity"},"limit":2,"limitPeriod":"week","label":"+1 Natur bis zu 2× wöchentlich für Regenwasser-Nutzung"}]'::jsonb, 'building_rainwater_store', 'Regenwasserspeicher, kleines Gebäude', 2, 1, 1),

  ('recycling_center', 'Recyclingzentrum', 'Anlaufstelle für Recycling und Abfalltrennung.', 'Das Recyclingzentrum ist ein Treffpunkt für bewusstes Wirtschaften. Hier wird Müll zu Rohstoffen, und Achtsamkeit wird zur alltäglichen Praxis.', 'sustainability', '{}', '{medium}', '{sustainability_infra}', 4, null, 2, 1, 14, 5, 13, '{}'::jsonb, '[{"id":"recycling_goals","type":"goal_template_unlock","parameters":{"goal_template":"zero_waste_goal"},"limit":0,"limitPeriod":"none","label":"Ziele zur Abfallvermeidung freigeschaltet"}]'::jsonb, 'building_recycling_center', 'Recyclingzentrum, mittleres Gebäude', 3, 1, 1),

  ('repair_workshop', 'Reparaturwerkstatt', 'Werkstatt zur Reparatur und Instandhaltung von Gegenständen.', 'Die Reparaturwerkstatt ist ein Zeichen von Geduld und Nachhaltigkeit. Statt Wegwerfkultur: Pflege, Reparatur, Wertschätzung für das, was schon vorhanden ist.', 'sustainability', '{community}', '{small,medium}', '{sustainability_infra,culture_quarter}', 4, null, 5, 0, 8, 6, 11, '{}'::jsonb, '[{"id":"repair_missions","type":"mission_pool_add","parameters":{"mission_type":"repair_sustainability"},"limit":0,"limitPeriod":"none","label":"Reparatur- und Wartungsmissionen verfügbar"}]'::jsonb, 'building_repair_workshop', 'Reparaturwerkstatt, kleines bis mittleres Gebäude', 4, 1, 1),

  ('green_roof', 'Begrüntes Dach', 'Ein begrünter Dachgarten für Natur in der Stadt.', 'Das begrünte Dach schafft Grünraum dort, wo Platz knapp ist. Ein kleines Biotop inmitten der Stadt – für Insekten, Pflanzen und menschliche Regeneration.', 'sustainability', '{animal_welfare}', '{small}', '{city_center,culture_quarter}', 4, null, 1, 3, 11, 3, 9, '{}'::jsonb, '[{"id":"green_roof_nature_bonus","type":"resource_bonus","parameters":{"resource_type":"nature","value":1,"trigger":"nature_observation"},"limit":2,"limitPeriod":"week","label":"+1 Natur bis zu 2× wöchentlich für Naturbeobachtung"}]'::jsonb, 'building_green_roof', 'Begrüntes Dach, kleines Gebäude', 5, 1, 1),

  -- ANIMAL WELFARE (4 buildings)
  ('wildflower_meadow', 'Wildblumenwiese', 'Eine Blütenwiese für Bienen, Schmetterlinge und andere Insekten.', 'Die Wildblumenwiese ist ein Fest der Farben und Leben. Blüten locken Bestäuber an, die Wiese wird zum Refugium für Artenvielfalt – unmittelbar sichtbar und täglich erlebbar.', 'animal_welfare', '{}', '{small,medium}', '{nature_reserve}', 5, null, 1, 2, 14, 2, 10, '{}'::jsonb, '[{"id":"wildflower_missions","type":"mission_pool_add","parameters":{"mission_type":"pollinator_garden"},"limit":0,"limitPeriod":"none","label":"Missionen zur Bestäuterförderung verfügbar"}]'::jsonb, 'building_wildflower_meadow', 'Wildblumenwiese, kleines bis mittleres Gebäude', 1, 1, 1),

  ('butterfly_garden', 'Schmetterlingsgarten', 'Ein Garten gezielt für Schmetterlinge und ihre Raupen.', 'Der Schmetterlingsgarten ist ein bewusstes Projekt für eine charismatische Tiergruppe. Mit Nektarpflanzen und Raupenfutter wird die ganze Lebensbahn der Schmetterlinge unterstützt.', 'animal_welfare', '{}', '{small,medium}', '{nature_reserve}', 5, null, 2, 3, 16, 3, 11, '{}'::jsonb, '[{"id":"butterfly_goals","type":"goal_template_unlock","parameters":{"goal_template":"butterfly_observation_goal"},"limit":0,"limitPeriod":"none","label":"Schmetterlingsbeobachtungsziele freigeschaltet"}]'::jsonb, 'building_butterfly_garden', 'Schmetterlingsgarten, kleines bis mittleres Gebäude', 2, 1, 1),

  ('bird_reserve', 'Vogelreservat', 'Ein geschützter Lebensraum für einheimische Vogelarten.', 'Das Vogelreservat ist ein Rückzugsort für Vögel in einer oft lauten Stadt. Mit natürlicher Vegetation, Wasser und Brutplätzen wird die Vogelvielfalt gefördert und die morgendliche Stille bereichert.', 'animal_welfare', '{}', '{large}', '{nature_reserve,water_forest}', 5, null, 2, 2, 18, 4, 14, '{}'::jsonb, '[{"id":"bird_bonus","type":"community_bonus","parameters":{"value":2},"limit":1,"limitPeriod":"week","label":"+2 Gemeinschaft einmal pro Woche für gemeinsame Vogelbeobachtung"}]'::jsonb, 'building_bird_reserve', 'Vogelreservat, großes Gebäude', 3, 1, 1),

  ('hedgehog_garden', 'Igelgarten', 'Ein Garten gezielt für Igel und kleine Säugetiere.', 'Der Igelgarten ist Heimat für die kleinen nächtlichen Bewohner. Mit Unterschlupfmöglichkeiten, natürlichen Futterquellen und ungiftigen Pflanzen wird ein Paradies für Igel geschaffen.', 'animal_welfare', '{}', '{small}', '{nature_reserve,residential}', 5, null, 1, 2, 13, 2, 9, '{}'::jsonb, '[{"id":"hedgehog_missions","type":"mission_pool_add","parameters":{"mission_type":"small_mammal_care"},"limit":0,"limitPeriod":"none","label":"Missionen zur Kleintierpflege verfügbar"}]'::jsonb, 'building_hedgehog_garden', 'Igelgarten, kleines Gebäude', 4, 1, 1),

  -- COMMUNITY (3 buildings)
  ('library', 'Bibliothek', 'Ein Treffpunkt für Literatur, Wissen und Austausch.', 'Die Bibliothek ist ein Herz der Gemeinde – Bücher, aber auch ein Ort der Stille, des Nachdenkens und des Gesprächs. Ein Anker für gemeinsame Bildung und gegenseitige Bereicherung.', 'community', '{}', '{medium}', '{city_center,culture_quarter}', 3, null, 2, 1, 3, 18, 14, '{}'::jsonb, '[{"id":"library_goals","type":"goal_template_unlock","parameters":{"goal_template":"reading_goal"},"limit":0,"limitPeriod":"none","label":"Gemeinsame Leseziele freigeschaltet"}]'::jsonb, 'building_library', 'Bibliothek, mittleres Gebäude im Stadtzentrum oder Kulturviertel', 1, 1, 1),

  ('community_house', 'Gemeinschaftshaus', 'Ein zentraler Ort für gemeinsame Aktivitäten und Rituale.', 'Das Gemeinschaftshaus ist das Herz der gemeinsamen Stadt. Hier entstehen Treffen, Feste, regelmäßige Rituale – ein Ort, an dem beide ihre Zeit miteinander vertiefen können.', 'community', '{}', '{medium,large}', '{culture_quarter,city_center}', 6, null, 3, 2, 4, 24, 18, '{}'::jsonb, '[{"id":"community_house_ritual","type":"ritual_template_unlock","parameters":{"ritual_template":"shared_gathering_ritual"},"limit":0,"limitPeriod":"none","label":"Neues gemeinsames Zusammenkunfts-Ritual möglich"}]'::jsonb, 'building_community_house', 'Gemeinschaftshaus, mittleres bis großes Gebäude', 2, 1, 1);

-- End of building definitions.
