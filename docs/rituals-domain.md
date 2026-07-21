# Ritual-Domäne

Verbindlich: [ADR-0027](./decisions/0027-ritual-instances.md). Ein Ritual ist eine **kleine
wiederkehrende Handlung oder Reflexion** – kein Ziel, keine Aktivität. Rituale erzeugen in
dieser Phase **keine** Punkte/Ressourcen und lösen **keine** Push-Erinnerung aus (Aufgabe §18).

## Definition (`rituals`)

| Feld                           | Bedeutung                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `owner_type` / `owner_user_id` | persönlich (ein Mitglied) oder gemeinsam (Household)                             |
| `title`, `description`         | Titel + kurze Beschreibung                                                       |
| `life_area`                    | optionaler Bereich (Farbe/Kategorie)                                             |
| `ritual_type`                  | `check` · `choice` · `scale` · `reflection` · `activity_link` · `shared_checkin` |
| `recurrence`                   | `daily` · `weekly` · `monthly` · `flexible`                                      |
| `preferred_time`               | `morning` · `day` · `evening` · `flexible` (reine Anzeige, keine Push)           |
| `weekdays`                     | ISO 0–6 (bei `weekly`)                                                           |
| `start_date` / `end_date`      | Gültigkeit                                                                       |
| `status`                       | `active` · `paused` · `archived` (+ Soft Delete)                                 |
| `sort_order`                   | Reihenfolge                                                                      |

## Planung (framework-frei, getestet)

`isRitualScheduledOn(ritual, date)` / `ritualsDueOn` (`src/domain/rituals/schedule.ts`):

- `daily`: jeden Tag; `weekly`: an den gewählten Wochentagen; `monthly`: am Starttag des Monats
  (auf kurze Monate geklammert); `flexible`: immer verfügbar.
- Nur `active` Rituale sind fällig; `start_date`/`end_date` begrenzen.

## Abschlüsse (`ritual_completions`)

- Eine Instanz = **Ritual + lokaler Tag**; `unique(ritual_id, occurred_on)` verhindert
  Doppelabschluss.
- Status: `done` · `skipped` · `not_relevant`; „open" = keine Zeile. „Übersprungen" wird nie
  negativ bewertet (Aufgabe §26).
- `complete_ritual` ist ein Upsert; `clear_ritual_completion` setzt auf „open" zurück.
- Persönliche Rituale schließt nur der Eigentümer ab; gemeinsame beide Mitglieder – `user_id`
  hält fest, **wer** abgeschlossen hat (Aufgabe §28).

## Flexibilität (Aufgabe §27)

Heute überspringen, pausieren, dauerhaft deaktivieren (archivieren), Wiederholung ändern – über
einfache, nachvollziehbare Regeln; **kein** komplexer Ausnahme-Editor.

## UI

`src/features/rituals/` (RitualsManager, RitualForm, RitualItem) + die Heute-Seite
([today-page.md](./today-page.md)) zeigen fällige Rituale mit Abschluss/Überspringen.
