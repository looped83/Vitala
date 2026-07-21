# ADR-0026: Wiederkehrende Ziele & Zielperioden

**Status:** Akzeptiert · **Bezug:** [recurring-goals.md](../recurring-goals.md),
missions-and-goals §8.2/§8.5, Aufgabe §7/§8

## Kontext

Ziele gibt es einmalig und wiederkehrend (täglich/wöchentlich/monatlich/quartalsweise).
Jede Periode muss getrennt auswertbar sein, vergangene Ergebnisse dürfen nicht rückwirkend
verfälscht werden, und eine unnötig komplexe Kalender-Engine ist zu vermeiden (§8).

## Entscheidung

- **Serienkopf + Perioden:** `goals` ist die Definition (Serienidentität); `goal_periods`
  materialisiert konkrete Auswertungsfenster. Ein einmaliges Ziel hat **genau eine**
  Periode; wiederkehrende Ziele sammeln Perioden.
- **Deterministische Periodenmathematik:** reine SQL-Helfer (`app.period_start`,
  `period_end_from_start`, `period_start_for_index`, `current_period_index`) auf lokalen
  Kalenderdaten; Wochenbeginn aus `household_settings.week_start`. Gespiegelt in
  `src/domain/goals/periods.ts` (getestet) für Anzeige.
- **Roll-Funktion statt Cron:** `public.sync_goal_periods()` (SECURITY DEFINER, idempotent)
  wird vor jedem Ziel-Read aufgerufen. Sie legt fehlende Perioden bis zur aktuellen an
  (pro Lauf gedeckelt) und **friert** abgelaufene Perioden ein (`final_value` + Status
  `completed`/`expired`). Kein Hintergrundjob nötig.
- **Aktuelle Periode live, Historie eingefroren:** nur die laufende Periode ist `active`
  und wird live berechnet (ADR-0025); abgelaufene bleiben unverändert erhalten.
- **Erstellung in laufender Periode:** ein z. B. mittwochs angelegtes Wochenziel gilt
  **sofort** für die laufende Woche (aligned auf `week_start`) – keine überraschenden
  Teilzeiträume.
- **Startdatum in der Vergangenheit:** Roll-Funktion backfillt Perioden ab Start (gedeckelt),
  sodass Historie entsteht.

## Alternativen

- **Virtuelle Perioden (nur berechnet, nicht gespeichert):** einfache Aktualität, aber kein
  stabiler Verlauf/Freeze → verworfen.
- **Cron/Edge-Function für Periodenwechsel:** zusätzliche Infrastruktur, Zeitzonenrisiko →
  verworfen zugunsten der idempotenten Read-Zeit-Synchronisation.

## Konsequenzen

- **Positiv:** getrennte Perioden, echte Historie, kein Cron, DST-/Monats-/Quartalssicher,
  einfache Regeln statt Kalender-Engine.
- **Negativ/Abwägung:** ein Read löst ggf. kleine Schreibvorgänge (Perioden anlegen/frieren)
  aus – idempotent und günstig bei zwei Personen. Tägliche Ziele akkumulieren viele Perioden;
  der Backfill ist pro Lauf gedeckelt.
