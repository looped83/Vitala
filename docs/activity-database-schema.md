# Aktivitäts-Datenbankschema (Phase 3)

Migrationen (versioniert, deterministisch, additiv):

| Migration                             | Inhalt                                            |
| ------------------------------------- | ------------------------------------------------- |
| `…090000_activity_capture.sql`        | Enums, Tabellen, Constraints, Indizes, Trigger    |
| `…090100_activity_reference_data.sql` | Katalog-Seed (activity_types, ritual_definitions) |
| `…090200_activity_rls.sql`            | Grants + RLS-Policies                             |
| `…090300_activity_rpc.sql`            | Schreib-RPCs + Helper                             |
| `…090400_entry_feed_view.sql`         | Vereinheitlichte Historien-View                   |

## Enums

`life_area`, `activity_intensity (light|medium|intense)`, `entry_source (manual|quick_action|
import)`, `entry_kind (activity|ritual)`, `ritual_kind (daily_block|special_action)`.

## Tabellen

- **`activity_types`** / **`ritual_definitions`** — Referenzkataloge (`key` unique, `area`,
  `sort_order`, `is_active`; Rituale zusätzlich `kind`).
- **`activities`** — Bewegung: `household_id`, `user_id`, `created_by`, `activity_type_id`,
  `occurred_on` (date, lokal), `started_at_time`, `duration_min (5–300)`, `intensity`,
  `location`, `note (≤500)`, `custom_label`, `is_shared`, `group_id`, `source`,
  `idempotency_key`, Zeitstempel, `deleted_at`.
- **`ritual_entries`** — Ernährung/Nachhaltigkeit/Tierwohl: `ritual_definition_id`, `area`
  (`<> movement`), `occurred_on`, `note`, `meal_label`, `custom_label`, `is_shared`,
  `entry_group_id`, `deleted_at`.
- **`entry_participants`** — `entry_kind`, `group_id`, `user_id`; Unique
  `(entry_kind, group_id, user_id)`.
- **`entry_favorites`** — Vorlagen (siehe [favorites-and-quick-actions.md](./favorites-and-quick-actions.md)).
- **View `entry_feed`** — `security_invoker`, eine Zeile je Eintrag für die Historie.

## Constraints & Indizes (Auswahl)

- `activities.duration_min between 5 and 300`; `activities_shared_has_group`
  (`is_shared = (group_id is not null)`); Datumsbereich-Check.
- Unique `ritual_entries (household, user, definition, occurred_on) where deleted_at is null`
  (Doppelzählungsschutz).
- Unique `activities (household, idempotency_key) where idempotency_key is not null`.
- Partielle Indizes auf `(household_id, occurred_on desc) where deleted_at is null`; Gruppen-
  und Bereichsindizes.
- FKs auf `households`/`auth.users`/Katalog mit passender `on delete`-Semantik.

## RPCs

`save_activity`, `save_ritual_checkin`, `delete_entry`, `save_favorite`, `delete_favorite`
sowie Helper `app.current_household`, `app.household_today` (alle `SECURITY DEFINER`,
`search_path = ''`). Siehe [activity-rls.md](./activity-rls.md) und
[ADR-0020](./decisions/0020-entry-write-path-rpc.md).
