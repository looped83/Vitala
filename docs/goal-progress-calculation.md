# Fortschrittsberechnung

Verbindlich: [ADR-0025](./decisions/0025-goal-progress-calculation.md). Fortschritt ist
**serverseitig, deterministisch und manipulationssicher** aus den Phase-3-Einträgen abgeleitet.

## Wo

- **`app.goal_progress(goal_id, start, end)`** (Migration `20260721100200`) – die einzige
  Wahrheit. `SECURITY INVOKER`: liest `activities`/`ritual_entries` unter der RLS des Aufrufers;
  ein Client kann keine fremden Aggregate abfragen.
- **`goal_overview`** (View, `security_invoker`) liefert je Ziel die aktive Periode + Live-Wert.
- Anzeige-Helfer (framework-frei, getestet): `src/domain/goals/progress.ts`.

## Regeln

1. **Nur lebende Zeilen** (`deleted_at is null`).
2. **Zeitraum:** `occurred_on` zwischen `start` und `end` (inklusive), lokale Kalenderdaten.
3. **Owner-Scoping:**
   - persönlich: Einträge, an denen der Eigentümer beteiligt ist (`user_id` **oder** Teilnehmer);
   - gemeinsam: alle Household-Einträge.
4. **Kein Doppelzählen:** ein gemeinsamer Eintrag ist eine Zeile (ADR-0019) → einmal gezählt.
5. **Filter:** `activity_type_keys` (Bewegung) bzw. `ritual_definition_keys` (Ritualbereiche)
   grenzen ein, welche Einträge zählen.
6. **Aggregation je Messmethode:** count / sum(duration) / distinct(occurred_on) /
   distinct(type) / count(shared).
7. **Manuell/boolean:** liest `manual_value` statt Einträge.

## Reaktion auf Änderungen aus Phase 3 (Aufgabe §44)

Weil live aggregiert wird, korrigiert sich der Fortschritt automatisch, wenn ein Eintrag
erstellt, bearbeitet, gelöscht, verschoben, einem anderen Typ zugeordnet oder anderen
Teilnehmern zugeordnet wird. Getestet u. a. gegen echte Postgres-Instanz (Live-Validierung)
und pgTAP.

## Aktuelle vs. vergangene Periode

- **Laufende Periode:** immer live berechnet.
- **Abgelaufene Perioden:** `sync_goal_periods()` friert `final_value` ein und setzt Status
  `completed`/`expired` – Historie kippt nicht rückwirkend
  ([ADR-0026](./decisions/0026-recurring-goals-and-periods.md)).

## Überschreitung & Teilerfolg

`computeProgress` deckelt den Balken bei 100 %, meldet aber `exceeded`; `progressLine` formuliert
positiv (`4 von 3 – übertroffen`, `2 von 3 erreicht`). Keine Aufforderung zur weiteren
Übererfüllung, keine Negativdarstellung (Aufgabe §12).
