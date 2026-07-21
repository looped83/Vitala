# ADR-0031: Archivierung & Löschung von Zielen und Ritualen

**Status:** Akzeptiert · **Bezug:** [goal-status-and-lifecycle.md](../goal-status-and-lifecycle.md),
data-model §16.9, ADR-0021, Aufgabe §16

## Kontext

Historisch relevante Ziele/Rituale sollen erhalten bleiben; dennoch muss Löschen möglich sein.
Löschen darf keine verwaisten Daten erzeugen und bestehende Aktivitätseinträge (Phase 3) nie
entfernen (§16).

## Entscheidung

- **Archivierung bevorzugt:** `status = 'archived'` (mit `archived_at`) blendet ein Ziel/Ritual
  aus der aktiven Ansicht aus, bewahrt aber Definition, Perioden und Abschlussinformationen.
  Aus `archived` gibt es keinen weiteren Statuswechsel (Endzustand).
- **Löschen = Soft Delete:** `delete_goal` / `delete_ritual` setzen `deleted_at` (und Status
  `archived`) statt hart zu löschen (konsistent mit ADR-0021 für Einträge). RLS blendet
  gelöschte Zeilen aus.
- **Keine Fremddatenlöschung:** Ziele/Rituale referenzieren **keine** Aktivitätseinträge; das
  Löschen eines Ziels lässt alle Phase-3-Einträge unberührt. `goal_periods`/
  `ritual_completions` hängen per `on delete cascade` am Eltern­objekt, werden bei Soft Delete
  aber nur ausgeblendet.
- **Bestätigung:** die UI verlangt vor dem endgültigen Löschen eine explizite Bestätigung und
  weist auf die Alternative „Archivieren" hin.
- **Fortschritt endet:** archivierte/gelöschte Ziele erzeugen keine neuen Perioden mehr
  (`sync_goal_periods` verarbeitet nur `active`/`paused`).

## Alternativen

- **Hard Delete:** Verlust von Historie und Risiko verwaister abhängiger Zeilen → verworfen.
- **Nur Archivieren, kein Löschen:** widerspricht dem Datenschutzprinzip der Löschbarkeit (§49)
  → Soft Delete als löschbarer, aber sicherer Mittelweg.

## Konsequenzen

- **Positiv:** Historie bleibt erhalten, Löschbarkeit gegeben, keine verwaisten Daten, Phase-3-
  Daten geschützt.
- **Negativ/Abwägung:** soft-gelöschte Zeilen verbleiben physisch; ein späterer echter
  Hard-Delete-/Export-Pfad (Datenschutz) kann darauf aufsetzen.
