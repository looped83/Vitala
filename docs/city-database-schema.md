# Stadt – Datenbankschema

Phase 6 speichert nur **Household-Zustand** und eine **Layout-Referenz**. Statische Layout-/
Slot-Definitionen liegen im Code (ADR-0039). Migrationen:
`20260723090000_city_schema.sql`, `..._city_functions.sql`, `..._city_rls.sql`.

## Tabellen

### `city_layout_versions` (Referenzdaten)

| Spalte       | Typ         | Regeln                                   |
| ------------ | ----------- | ---------------------------------------- |
| `version`    | integer     | PK, ≥ 1                                  |
| `is_current` | boolean     | genau eine `true` (partieller Unique-Ix) |
| `notes`      | text        | –                                        |
| `created_at` | timestamptz | –                                        |

### `city_states` (eine Stadt je Household)

| Spalte                    | Typ         | Regeln                                                     |
| ------------------------- | ----------- | ---------------------------------------------------------- |
| `household_id`            | uuid        | **PK** → genau eine Stadt je Household; FK `households`    |
| `name`                    | text        | `char_length(btrim) between 2 and 40` und `name !~ '[<>]'` |
| `layout_version`          | integer     | default 1, **FK** `city_layout_versions(version)`          |
| `highest_level`           | integer     | ≥ 1, monoton (Trigger)                                     |
| `created_at`/`updated_at` | timestamptz | `touch_updated_at`-Trigger                                 |

### `city_view_preferences` (pro Nutzer)

| Spalte                    | Typ         | Regeln                              |
| ------------------------- | ----------- | ----------------------------------- |
| `user_id`                 | uuid        | **PK**; FK `auth.users`             |
| `household_id`            | uuid        | FK `households`                     |
| `view_mode`               | text        | `in ('map','list','system')`        |
| `seen_city_level`         | integer     | ≥ 0 (gesehene Freischaltstufe, §33) |
| `created_at`/`updated_at` | timestamptz | `touch_updated_at`-Trigger          |

Index: `city_view_preferences_household_idx (household_id)`.

## Constraints (§46)

- **Eine Stadt pro Household** – PK auf `household_id`.
- **Gültige Layoutversion** – FK auf `city_layout_versions`.
- **Stadt gehört zu gültigem Household** – FK + RLS.
- **Stadtname** – Länge 2–40 und keine spitzen Klammern (DB-Check + RPC-Validierung).
- **Höchste Stufe fällt nie** – `city_guard_highest_level`-Trigger.
- **Freischaltlevel positiv / Layoutpositionen im Koordinatenraum** – im Code (Definition +
  Unit-Tests), da Definitionen nicht in der DB liegen.
- **Slot-ID eindeutig je Layoutversion / Bereichs-ID eindeutig** – im Code (Unit-Tests
  `layout.test.ts`).

## Funktionen / Views

Keine neue View. Das Stadtlevel kommt aus dem bestehenden `city_reward_status` bzw. wird in
den RPCs direkt aus `experience_transactions` + `level_definitions` abgeleitet
(`app.city_current_level`). Siehe [city-migration.md](./city-migration.md) für die RPCs.

## Indizes

`city_states` PK (`household_id`); `city_view_preferences` PK (`user_id`) +
`city_view_preferences_household_idx`; `city_layout_versions` PK (`version`) +
`city_layout_versions_one_current`.
