# ADR-0025: Fortschrittsberechnung von Zielen

**Status:** Akzeptiert · **Bezug:** [goal-progress-calculation.md](../goal-progress-calculation.md),
missions-and-goals §8.4, Aufgabe §11/§44

## Kontext

Zielfortschritt muss deterministisch, manipulationssicher und stets aktuell aus den
Phase-3-Einträgen abgeleitet werden. Ein clientseitig „hochgezählter" Wert driftet und
ließe sich fälschen (Aufgabe §50). Änderungen an bestehenden Einträgen (bearbeiten,
löschen, verschieben, Teilnehmer ändern) müssen den Fortschritt korrekt korrigieren (§44).

## Entscheidung

- **Server-Funktion als einzige Wahrheit:** `app.goal_progress(goal_id, start, end)`
  aggregiert live aus `activities` / `ritual_entries` im Zeitraum. `SECURITY INVOKER`,
  damit RLS greift – ein Client kann nie fremde Aggregate abfragen.
- **Nur lebende Zeilen:** `deleted_at is null`; gelöschte/archivierte Einträge zählen nicht.
- **Owner-Scoping:** persönliche Ziele zählen Einträge, an denen der Eigentümer beteiligt
  ist (`user_id` **oder** Teilnehmer); gemeinsame Ziele zählen den ganzen Household.
- **Doppelzählungsschutz:** Ein gemeinsamer Eintrag ist **eine** Zeile (ADR-0019) und wird
  daher genau einmal gezählt.
- **Aktuelle Periode live, vergangene eingefroren:** die laufende Periode wird bei jedem
  Read live berechnet; abgelaufene Perioden frieren `final_value` ein (ADR-0026), damit
  Historie nicht rückwirkend kippt.
- **Anzeige über View:** `goal_overview` (`security_invoker`) liefert je Ziel die aktuelle
  Periode + Live-Wert; Clients setzen Fortschrittswerte **nie** selbst.
- **Manuelle Ziele:** `manual`/`boolean` lesen keine Einträge, sondern `manual_value`
  (nur über `set_goal_manual_progress`, nur für diese Messmethoden).

## Alternativen

- **Materialisierter Fortschritt (Trigger/Spalte):** schnell, aber Drift-/Konsistenzrisiko
  bei Edits/Deletes und komplexe Invalidierung → verworfen für V1.
- **Reine Client-Aggregation:** manipulierbar, nicht konsistent → verworfen.

## Konsequenzen

- **Positiv:** immer korrekt, reagiert automatisch auf Phase-3-Änderungen, keine Drift,
  keine Client-Manipulation, RLS-sicher.
- **Negativ/Abwägung:** Aggregat je Read; durch Zeitraum-Indizes (`household_id, occurred_on`)
  und die kleine Datenmenge (zwei Personen) performant. Bei viel größeren Datenmengen kann
  später eine materialisierte Sicht ergänzt werden, ohne die Schnittstelle zu ändern.
