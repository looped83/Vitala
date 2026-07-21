# Datenbank & Migrationen

Versionierte Supabase-Migrationen in `supabase/migrations/`. Keine produktive Struktur wird
ausschließlich über das Dashboard eingerichtet.

## Migrationsdateien (Phase 2)

| Datei                             | Inhalt                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `…090000_identity_foundation.sql` | Extensions (`pgcrypto` in `extensions`), privates Schema `app`, Enums, `updated_at`-Trigger, Tabellen (`households`, `household_settings`, `household_members`, `profiles`, `user_preferences`, `household_invites`, `audit_log`), Constraints, Indizes, 2-Personen-Trigger, `handle_new_user`-Trigger. |
| `…090100_row_level_security.sql`  | RLS-Hilfsfunktionen (`app.*`, SECURITY DEFINER), Basis-`GRANT`s, RLS aktiviert, Policies je Tabelle.                                                                                                                                                                                                    |
| `…090200_rpc_functions.sql`       | RPCs: `create_household`, `create_household_invite`, `accept_household_invite`, `deactivate_household_member` (SECURITY DEFINER, fixer `search_path`).                                                                                                                                                  |

## Prinzipien

- **Deterministisch & nachvollziehbar:** eine gerichtete Abfolge; keine manuellen Dashboard-
  Schritte.
- **Idempotent im Migrationskontext:** `create … if not exists`, `on conflict do nothing` wo
  sinnvoll; Migrationen laufen genau einmal je Umgebung (`supabase db reset` setzt neu auf).
- **Typisierte Spalten** für abfrage-/aggregationsrelevante Werte; JSONB nur für variable
  Konfiguration (`audit_log.meta`).
- **Constraints statt App-Logik:** Enums, Checks, Unique-/Foreign-Keys, `ON DELETE`-Regeln.

## Constraints, Indizes, Kaskaden (Auszug)

- `households.max_members = 2` (Check); `households.name` 1–80 Zeichen.
- `household_members` **Unique(household_id, user_id)**; **partieller Unique-Index** auf
  `user_id WHERE status='active'` (ein aktiver Household je Nutzer); Indizes auf
  `household_id`, `user_id`.
- `household_invites` **Unique(code_hash)**; Index auf `household_id`.
- **`ON DELETE`:** Household-Löschung **kaskadiert** in Settings, Members, Invites, Audit;
  `households.created_by` ist `ON DELETE RESTRICT` (kein versehentliches Löschen des Erstellers
  löscht Daten). `profiles.id`/`user_preferences.user_id` kaskadieren mit `auth.users`.
- **`updated_at`** wird per Trigger (`app.touch_updated_at`) gepflegt.

## Typen generieren

`npm run db:types` erzeugt `src/data/supabase/database.types.ts` aus der laufenden lokalen DB.
Die eingecheckte Version ist handgepflegt spiegelgleich, damit die App ohne DB baut.

## Seeds

`supabase/seed.sql` legt Testnutzer + zwei Households an (nur lokal/Test; klar als
`@vitala.test` erkennbar). Details: [testing-implementation.md](./testing-implementation.md).

## Validierung ohne CLI

Die Migrationen wurden zusätzlich gegen ein reines PostgreSQL (mit minimalem `auth`-Schema und
`auth.uid()`-Emulation) angewandt und die RLS-/RPC-Logik per SQL-Assertions geprüft — die
Grants machen RLS auf jeder Postgres-Instanz zur maßgeblichen Zugriffskontrolle, nicht nur bei
Supabase-eigenen Default-Grants.
