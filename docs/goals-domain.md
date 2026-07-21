# Ziel-Domäne

Ziele sind **freiwillige, nutzerdefinierte Vorhaben** – persönlich oder gemeinsam. Sie
erzeugen nie Druck oder Strafe (product-principles §2.1, Aufgabe §2). Fortschritt wird
serverseitig aus den bestehenden Einträgen abgeleitet – nie clientseitig „hochgezählt"
([ADR-0025](./decisions/0025-goal-progress-calculation.md)).

Bezug: missions-and-goals §8. In dieser Phase werden **keine** XP/Ressourcen/Level/Missionen
ausgelöst; die Datenstruktur ist darauf vorbereitet, aber inaktiv (Aufgabe §Abgrenzung).

## Begriffe

- **Serienkopf (`goals`):** die Definition eines Ziels (Eigentümer, Titel, Lebensbereich,
  Messmethode, Zielwert, Einheit, Zeitraum, Wiederholung, Filter, Status).
- **Zielperiode (`goal_periods`):** ein konkretes Auswertungsfenster. Einmalige Ziele haben
  genau eine Periode; wiederkehrende sammeln Perioden ([ADR-0026](./decisions/0026-recurring-goals-and-periods.md)).
- **Fortschritt:** live aus Einträgen berechnet (laufende Periode) bzw. eingefroren
  (abgelaufene Perioden).

## Felder eines Ziels

| Feld                                            | Bedeutung                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `owner_type`                                    | `personal` (genau ein aktives Mitglied) oder `shared` (Household)                                           |
| `owner_user_id`                                 | Eigentümer bei persönlichen Zielen; bei gemeinsamen `null`                                                  |
| `life_area`                                     | Bewegung / Ernährung / Nachhaltigkeit / Tierwohl                                                            |
| `measurement`                                   | genau **eine** primäre Messmethode (siehe [goal-types-and-measurement.md](./goal-types-and-measurement.md)) |
| `target_value` / `unit`                         | positiver Zielwert + fachliche Einheit                                                                      |
| `period_type` / `recurrence`                    | Tag/Woche/Monat/Quartal/eigener Zeitraum + Wiederholung                                                     |
| `activity_type_keys` / `ritual_definition_keys` | optionale Filter „nur bestimmte Arten"                                                                      |
| `status`                                        | `draft` · `active` · `paused` · `completed` · `expired` · `archived`                                        |
| `manual_value`                                  | nur für `manual`/`boolean`                                                                                  |
| Zeitstempel                                     | `created_at`, `updated_at`, `completed_at`, `paused_at`, `archived_at`, `deleted_at`                        |

## Eigentümerschaft & Sichtbarkeit

- Beide aktiven Mitglieder **lesen** alle Household-Ziele (persönliche + gemeinsame) –
  kooperatives Zwei-Personen-Produkt (Aufgabe §9/§10). Keine Vergleichs-/Rankingdarstellung.
- **Bearbeiten:** gemeinsame Ziele beide Mitglieder; persönliche der Eigentümer bzw. Ersteller.
- Fremde Nutzer sehen nichts (RLS, [goals-and-rituals-rls.md](./goals-and-rituals-rls.md)).

## Positive Verstärkung

- Fortschrittsbalken füllen visuell max. 100 %; der reale Wert darf darüber liegen und wird als
  **„übertroffen"** gezeigt (`4 von 3 Einheiten – übertroffen`).
- Teilerfolg ist positiv: `2 von 3 Einheiten erreicht` – nie „nur 2 von 3", nie „verfehlt",
  keine roten Fehlerzustände (Aufgabe §12, `src/domain/goals/progress.ts`).

## Schichten

- Domain (framework-frei): `src/domain/goals/` (types, periods, progress, status, schemas).
- Daten: `src/data/repositories/goals.ts`, `src/data/mappers/goals.ts`.
- Server: Migrationen `20260721100000`–`20260721100400` (Schema, Referenz, Funktionen, RLS, RPC).
- UI: `src/features/goals/` (GoalsPage, GoalForm, GoalCard, GoalDetail, ProgressBar).
