# Aktivitäts-Domänenmodell (Phase 3)

Fachliche Grundlage der manuellen Erfassung der vier Lebensbereiche. Verbindliche
Entscheidungen: [ADR-0019](./decisions/0019-activity-capture-model.md),
[ADR-0004](./decisions/0004-double-counting.md), [data-model.md](./data-model.md) §16.2.

## Lebensbereiche

Genau vier gleichwertige Bereiche mit **einem** primären Bereich je Eintrag:

| Bereich         | key              | Erfassung           | Tabelle          |
| --------------- | ---------------- | ------------------- | ---------------- |
| Bewegung        | `movement`       | Aktivität (Dauer)   | `activities`     |
| Ernährung       | `nutrition`      | Ritual-Check-in     | `ritual_entries` |
| Nachhaltigkeit  | `sustainability` | Ritual-Handlung(en) | `ritual_entries` |
| Tierwohl & Bio. | `animal_welfare` | Ritual-Handlung(en) | `ritual_entries` |

## Zwei Erfassungsformen

- **Bewegung** ist eine **Aktivität** mit eigenen Feldern (Dauer, Intensität, Ort, Uhrzeit).
- **Ernährung/Nachhaltigkeit/Tierwohl** sind **Rituale**: ein _Check-in_ ist eine Gruppe
  gewählter Bausteine/Handlungen (`ritual_definitions`) mit gemeinsamem `entry_group_id`.

## Gemeinsame Basiseigenschaften (Aufgabe §3)

ID, Household-ID, Ersteller (`created_by`), primärer Nutzer (`user_id`), optionale weitere
Teilnehmer (`entry_participants`), Lebensbereich, Typ, Datum (`occurred_on`, lokal), optionale
Uhrzeit, optionale Dauer (Bewegung), `is_shared`, optionale Notiz, Quelle (`source`),
Zeitstempel (`created_at`/`updated_at`), optionaler `deleted_at` (Soft Delete).

## Schichten (framework-frei → UI)

- **Domain** (`src/domain/activity/*`, rein): `areas`, `types`, `schemas` (Zod),
  `history` (Filter/Gruppierung/Duplikat), `summary`. Kein React, kein Supabase.
- **Data** (`src/data/*`): `mappers/activity` (DB-Row → Domain), Repositories
  (`entries`, `activityCatalog`, `favorites`), Query-Keys.
- **Feature** (`src/features/capture`, `src/features/history`): Hooks + UI.

Zwischen DB-, Domain-, Formular- und Darstellungsmodell wird konsequent gemappt
(Aufgabe §15); Supabase-Typen erscheinen nie in Komponenten.

## Nicht in Phase 3

Keine XP-, Ressourcen-, Level-, Missions- oder Stadtwirkung (Aufgabe §20). Die Strukturen
(`group_id`, Ledger-Anker) sind darauf vorbereitet, lösen aber nichts aus.
