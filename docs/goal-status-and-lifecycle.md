# Zielstatus & Lebenszyklus

## Status (`goal_status`)

`draft` · `active` · `paused` · `completed` · `expired` · `archived` (+ Soft Delete via
`deleted_at`).

## Erlaubte Übergänge (Aufgabe §13)

| von \ nach | active         | paused | completed | expired  | archived |
| ---------- | -------------- | ------ | --------- | -------- | -------- |
| draft      | ✓              |        |           |          | ✓        |
| active     |                | ✓      | ✓         | (System) | ✓        |
| paused     | ✓              |        | ✓         |          | ✓        |
| completed  | ✓              |        |           |          | ✓        |
| expired    | ✓ (verlängern) |        |           |          | ✓        |
| archived   | — Endzustand — |        |           |          |          |

Server (`set_goal_status`) und Client (`src/domain/goals/status.ts`) prüfen dieselbe Matrix
(Defense in Depth). Ungültige Wechsel werden mit `invalid_status` abgelehnt. `expired` erzeugt
das System beim Freeze abgelaufener Perioden nicht erreichter einmaliger Ziele.

## Pausieren (Aufgabe §14)

- Freiwillig, **ohne Verlust**, ohne negative Bewertung.
- Optionaler `pause_reason` (kein Pflichtfeld) und optionales Wiederaufnahmedatum `resume_on`.
- Pausierte Ziele erzeugen keine Erwartung (Perioden werden nicht vorangeschoben), bleiben in
  der Historie sichtbar und lassen sich fortsetzen, bearbeiten oder archivieren.

## Bearbeiten (Aufgabe §15)

Bearbeitbar: Titel, Beschreibung, Zielwert, Zeitraum, Typen/Bausteine, Wiederholung, Eigentümer
im zulässigen Rahmen, Status. **Nicht** frei änderbar: `id`, `household_id`, `created_by`,
historische Periodenergebnisse. Änderungen wirken „ab jetzt"
([ADR-0029](./decisions/0029-goal-series-edits.md)); die laufende Periode wird atomar neu
bewertet, vergangene bleiben eingefroren.

## Archivieren & Löschen (Aufgabe §16)

Siehe [ADR-0031](./decisions/0031-archive-and-delete.md): Archivieren blendet aus und bewahrt
Verlauf/Abschlussinfos; Löschen ist ein Soft Delete (`deleted_at`), erzeugt keine verwaisten
Daten und lässt bestehende Aktivitätseinträge unberührt. Die UI verlangt eine Bestätigung und
empfiehlt Archivieren.
