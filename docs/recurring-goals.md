# Wiederkehrende Ziele & Perioden

Verbindlich: [ADR-0026](./decisions/0026-recurring-goals-and-periods.md).

## Modell

- **Serienidentität:** `goals` (der Kopf) bleibt stabil; `recurrence` ∈
  `none` · `daily` · `weekly` · `monthly` · `quarterly`.
- **Perioden:** `goal_periods` mit `period_index` (0-basiert), `period_start`/`period_end`
  (inklusive), `target_value`-Snapshot, `status`, `final_value`.
- **Einmalige Ziele** (`recurrence = none`) haben genau eine Periode; bei `custom` ist es
  `[start_date, end_date]`, sonst die ausgerichtete Tages-/Wochen-/Monats-/Quartalsperiode um
  `start_date`.

## Periodenmathematik

Reine, deterministische Helfer auf lokalen Kalenderdaten – SQL (`app.period_start`,
`period_end_from_start`, `period_start_for_index`, `current_period_index`, Migration
`20260721100200`) und gespiegelt/getestet in `src/domain/goals/periods.ts`:

- **Wochenbeginn** aus `household_settings.week_start` (Default Montag = 1).
- **Monats-/Quartalsgrenzen** über `date_trunc`.
- **DST-sicher** (UTC-Arithmetik auf Datumsstrings; keine Instant-Verschiebung).

## Roll & Freeze (ohne Cron)

`public.sync_goal_periods()` (SECURITY DEFINER, idempotent) läuft **vor jedem Ziel-Read**
(`getGoalsOverview`) und in `save_goal`/Statuswechseln:

1. Für jedes aktive/pausierte Ziel die aktuelle Periode bestimmen.
2. Fehlende Perioden bis zur aktuellen anlegen (pro Lauf gedeckelt, Performance §51).
3. Abgelaufene Perioden **einfrieren**: `final_value = goal_progress(...)`, Status
   `completed` (Ziel erreicht) oder `expired` (nicht erreicht) – **ohne** Wertung/Strafe.
4. Einmalige Ziele übernehmen den Endzustand ihrer einzigen Periode (`completed`/`expired`).

Pausierte Ziele werden **nicht** vorangeschoben (kein Erwartungsdruck, Aufgabe §14).

## Erstellung in laufender Periode

Ein mittwochs angelegtes Wochenziel gilt **sofort** für die laufende Woche (ausgerichtet auf
`week_start`) – keine überraschenden Teilzeiträume (Aufgabe §7). Startdaten in der Vergangenheit
werden per Backfill zu Historie.

## Bearbeitung von Serien

Siehe [ADR-0029](./decisions/0029-goal-series-edits.md): Änderungen wirken „ab jetzt";
eingefrorene Perioden bleiben unverändert; die laufende Periode übernimmt den neuen Zielwert.
