# Reward-Datenbankschema (Phase 5)

Migrationen `20260722100000`–`100400`. Grundsätze: append-only Ledger als Wahrheit
([ADR-0032](./decisions/0032-reward-ledger.md)), typisierte Spalten statt JSONB für
abfragbare Werte, RLS überall ([reward-rls.md](./reward-rls.md)).

## Referenzdaten

- **`reward_rule_versions`** – Version, `is_active`, `valid_from`, `params` (JSONB).
- **`level_definitions`** – `(scope, level)` PK, `cumulative_xp`, `title`; generiert aus
  den ADR-0003-Formeln (persönlich 1–60, Stadt 1–30).
- **`mission_definitions`** – kuratierter Missionspool mit expliziter Belohnung.
- **`activity_types`** erweitert um `reward_weight` und `is_regeneration`.

## Ledger

- **`experience_transactions`** – `scope` (personal/city), `amount` (auch negativ),
  `reason`, `area`, `is_special`, `source_kind`, `source_id`, `rule_version`,
  `correction_of`, `business_date`, `dedup_key` (partiell unique). Constraint:
  personal ⇒ `user_id` gesetzt, city ⇒ `user_id` null.
- **`resource_transactions`** – `resource_key`, `amount`, `reason`, `source_kind`,
  `source_id`, `rule_version`, `created_by`, `business_date`, `dedup_key` (partiell unique).
- **`resources`** – gecachte Projektion `(household_id, resource_key)` → `balance ≥ 0`,
  `total_earned`, `total_spent`.

## Missionen & Balance

- **`mission_assignments`** – Scope/Periode/Zeitraum/Status/`swaps_used`; partielle Unique-
  Indizes erzwingen „max eine aktive" je Person bzw. Household und Periode.
- **`mission_completions`** – ein terminaler Abschluss je Zuweisung (unique).
- **`mission_exchanges`** – Tausch-Audit.
- **`weekly_balance_snapshots`** – ein Snapshot je Household + Woche (unique).
- **`reward_processing_log`** – leichtes Audit für den Backfill.

## Views

- **`personal_reward_status`** / **`city_reward_status`** – Level, Titel, Fortschritt aus
  Ledger-Summe + `level_definitions` (owner-privilegiert + `is_active_member`-Guard).

## Indizes (Auszug)

`experience_transactions`: `(household_id, scope)`, `(user_id, scope)`,
`(household_id, business_date)`, `(source_kind, source_id)`, partieller Area-Tages-Index.
`resource_transactions`: `(household_id, resource_key, created_at desc)`,
`(source_kind, source_id)`. Dedup: partielle Unique-Indizes auf `dedup_key`.
