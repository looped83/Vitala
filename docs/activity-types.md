# Aktivitäts- & Ritualtypen (Katalog)

Strategie: **Datenbankkatalog mit versioniertem Seed** (Migration
`…_activity_reference_data.sql`). Referenzdaten, kein Household-Bezug, global lesbar, nicht
client-schreibbar ([activity-rls.md](./activity-rls.md)). Nutzer legen **keine** neuen
Systemtypen an (Aufgabe §10); „Sonstiges" erlaubt eine optionale eigene Bezeichnung.

Eigenschaften je Typ: stabile `key` (Domain-ID), übersetzbares `name`, `area`, `sort_order`,
`icon`, `is_active`. `ritual_definitions` zusätzlich `kind` (`daily_block` | `special_action`).

## Bewegung (`activity_types`, area=movement)

`strength`, `endurance`, `peloton_bike`, `peloton_strength`, `peloton_yoga`, `gym`,
`running`, `treadmill`, `yoga`, `mobility`, `walk`, `cycling`, `group_class`, `hiking`,
`regeneration`, `other_movement`. Optionales Feld **Ort/Anbieter** (`location`) bildet z. B.
„Yoga @ Peloton" ab, ohne Typen zu verdoppeln (Aufgabe §6.1). „Regeneration" ist ein **Typ**,
keine Intensitätsstufe.

## Ernährung (`ritual_definitions`, area=nutrition, daily_block)

`balanced_vegan_meal`, `self_cooked`, `vegetables`, `fruit`, `legumes`, `whole_grains`,
`protein_source`, `hydration`, `mindful_eating`, `new_recipe`, `avoided_food_waste`,
`seasonal_food`, `regional_food`, `rescued_food`.

## Nachhaltigkeit (area=sustainability)

**daily_block:** `bike_instead_car`, `walk_instead_motor`, `public_transport`, `carpool`,
`avoided_trip`, `reusable`, `avoided_packaging`, `waste_separation`, `saved_electricity`,
`saved_water`, `sustainable_alternative`, `plant_alternative`, `seasonal_shopping`,
`regional_shopping`, `shared_borrowed`.
**special_action:** `second_hand`, `repaired`, `passed_on`, `avoided_purchase`,
`rescued_food_large`, `household_project`.

## Tierwohl & Biodiversität (area=animal_welfare)

**daily_block:** `replaced_animal_product`, `animal_friendly_shopping`, `cruelty_free`,
`animal_welfare_knowledge`, `native_plants`, `insect_friendly_plants`, `bird_bath`.
**special_action:** `supported_shelter`, `supported_org`, `animal_welfare_action`,
`wildflowers`, `improved_habitat`, `removed_litter`, `nature_conservation`,
`wildlife_observation`.

> **„Veganer Tag"** ist bewusst **kein** Tierwohl-Baustein: vegan zu leben ist die Grundhaltung
> von Lutz & René und darf nicht täglich als Punktequelle abgehakt werden
> ([life-areas.md](./life-areas.md) §4.4, ADR-0004, Aufgabe §9.2). Es zählen konkrete
> bewusste Handlungen und Engagement.
