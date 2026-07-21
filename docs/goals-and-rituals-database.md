# Datenbank: Ziele, Rituale & Check-ins (Phase 4)

Migrationen `20260721100000`–`20260721100400`. Alle Schreibvorgänge laufen ausschließlich über
SECURITY-DEFINER-RPCs (ADR-0020); Clients erhalten nur SELECT.

## Tabellen

| Tabelle              | Zweck                                                     |
| -------------------- | --------------------------------------------------------- |
| `goals`              | Serienkopf/Definition eines Ziels                         |
| `goal_periods`       | konkrete Auswertungsfenster (Historie + laufende Periode) |
| `rituals`            | Ritualdefinitionen                                        |
| `ritual_completions` | ein Ergebnis je Ritualinstanz (Ritual + Tag)              |
| `daily_check_ins`    | private Morgen-/Abend-Check-ins (typisierte Detailfelder) |
| `goal_templates`     | kuratierte Zielvorlagen (versionierte Referenzdaten)      |

## Enums

`owner_type`, `goal_period_type`, `goal_recurrence`, `goal_measurement`, `goal_unit`,
`goal_status`, `goal_period_status`, `ritual_recurrence`, `ritual_time`, `ritual_type`,
`ritual_status`, `ritual_completion_status`, `check_in_type`, `time_budget`, `day_intensity`,
`day_focus`.

## Views

- `goal_overview` (`security_invoker`): je Ziel die aktive Periode + Live-Fortschritt
  (`app.goal_progress`).

## Funktionen

- **Periodenmathematik (`app`):** `period_start`, `period_end_from_start`, `period_start_for_index`,
  `current_period_index` (immutable, reine Kalenderlogik).
- **`app.goal_progress(goal_id, start, end)`** (SECURITY INVOKER): Fortschritt aus Einträgen.
- **RPCs (SECURITY DEFINER):** `sync_goal_periods`, `save_goal`, `set_goal_status`,
  `set_goal_manual_progress`, `delete_goal`, `save_ritual`, `set_ritual_status`, `delete_ritual`,
  `complete_ritual`, `clear_ritual_completion`, `save_check_in`, `delete_check_in`.

## Wichtige Constraints & Indizes

- `goals_owner_shape` (persönlich ↔ Eigentümer, gemeinsam ↔ null),
  `goals_unit_measurement` (minutes↔duration_minutes, days↔active_days),
  `goals_boolean_target` (boolean ⇒ Zielwert 1),
  `goals_recurrence_period` (Wiederholung passt zum Zeitraum), `target_value > 0`.
- `goal_periods_unique(goal_id, period_index)`; partieller Index auf aktive Perioden.
- `ritual_completions_unique(ritual_id, occurred_on)` – kein Doppelabschluss.
- `daily_check_ins_unique(user_id, check_in_type, business_date)` – max. ein Check-in/Typ/Tag.
- Household-/Datum-Indizes für Zeitraumabfragen (`goals(household_id,status)`,
  `goal_periods(household_id,period_start desc)`, `ritual_completions(household_id,occurred_on desc)`,
  `daily_check_ins(user_id,business_date desc)`).

## Trigger

`touch_updated_at` auf `goals`, `goal_periods`, `rituals`, `ritual_completions`,
`daily_check_ins` (wiederverwendet aus der Identitätsmigration).

## Zeit & Perioden

`occurred_on`/`business_date` sind lokale Kalenderdaten in der Household-Zeitzone (ADR-0024);
technische Zeitstempel bleiben UTC. Periodenlogik: [recurring-goals.md](./recurring-goals.md).
