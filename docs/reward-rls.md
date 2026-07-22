# Reward-RLS (Phase 5)

Migration `20260722100400`. Alle neuen Tabellen sind deny-by-default; **kein** Client-
`INSERT/UPDATE/DELETE` – jede Vergabe läuft über `SECURITY DEFINER`-RPCs. Ledger sind für
normale Nutzer unveränderlich (§62).

## Policies

- **Referenzdaten** (`reward_rule_versions`, `level_definitions`, `mission_definitions`):
  global lesbar (`mission_definitions` nur `is_active`).
- **`experience_transactions`:** SELECT wenn aktives Mitglied **und** (`scope='city'` oder
  `user_id = auth.uid()`). Der Partner sieht Stadt-XP und die **eigene** persönliche
  Historie, **nicht** die einzelnen persönlichen XP-Zeilen des anderen (nicht-kompetitiv,
  §46.1). Die aggregierte **Levelinformation** des Partners ist über
  `personal_reward_status` sichtbar.
- **`resources` / `resource_transactions`:** SELECT für aktive Mitglieder (gemeinsamer
  Pool).
- **`mission_assignments` / `mission_exchanges`:** SELECT für aktive Mitglieder und
  (`scope='shared'` oder eigene). **`mission_completions` / `weekly_balance_snapshots`:**
  SELECT für aktive Mitglieder.
- **`reward_processing_log`:** RLS aktiv, keine Policy → nur intern.

## Status-Views

`personal_reward_status` und `city_reward_status` laufen mit Owner-Rechten
(`security_invoker = false`) plus explizitem `app.is_active_member(household_id)`-Filter,
damit ein Mitglied die **aggregierte** Levelinformation des Households sieht, ohne
Lesezugriff auf die einzelnen persönlichen XP-Zeilen des Partners.

## Getestet

`supabase/tests/rewards.test.sql`: eigener XP lesbar, Partner-XP-Zeilen verborgen,
Stadt-XP lesbar, direkter Ledger-`INSERT`/Bestands-`UPDATE` schlägt fehl (42501).
