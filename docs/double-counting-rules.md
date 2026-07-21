# Doppelzählungsregeln

Verbindlich: [ADR-0004](./decisions/0004-double-counting.md) (Modell C). Phase 3 setzt die
Regeln **fachlich und technisch** um, obwohl noch keine XP vergeben werden – die Struktur muss
Doppelzählung von Anfang an verhindern (Aufgabe §5).

## Grundsatz

Jede reale Handlung wird als **genau ein primärer Eintrag** mit **genau einem** primären
Lebensbereich erfasst. Sekundäre positive Merkmale erzeugen **keine** zusätzlichen vollen
Einträge in anderen Bereichen.

## Beispiele

- **Selbst gekochte vegane Mahlzeit** → **ein** Ernährungs-Check-in. Merkmale wie „saisonal",
  „selbst gekocht", „Food Waste vermieden" sind Bausteine **innerhalb** desselben Check-ins,
  nicht separate Nachhaltigkeits-/Tierwohl-Einträge.
- **Fahrrad** → entweder **Bewegung** (Sport) **oder** **Nachhaltigkeit** (statt Auto), pro
  Fahrt genau eine primäre Kategorie.

## Technische Durchsetzung

- **Ein primärer Bereich pro Zeile** (`area`/Bewegungstabelle).
- **Unique-Index** `ritual_entries (household, user, ritual_definition_id, occurred_on)` auf
  lebenden Zeilen → derselbe Baustein nicht zweimal am selben Tag.
- **Serverseitige RPC-Validierung** (Typ gehört zum Bereich; keine Vervielfachung).
- **Gemeinsamer Eintrag = eine Zeile** + Teilnehmer (keine doppelte Historie).

## Duplikatshinweis (weich)

Zusätzlich warnt die UI **dezent**, wenn am selben Tag ein sehr ähnlicher Eintrag derselben
Person existiert (`findDuplicateHint`) – mit Möglichkeit fortzufahren. **Keine** aggressive
Sperre legitimer ähnlicher Einträge (Aufgabe §5).

## Tests

Unit: `history.test.ts` (Duplikathinweis), `schemas.test.ts` (leere Auswahl abgelehnt).
DB/RLS: `activity.test.sql` (Typ-/Bereichs-Mismatch, `duplicate_ritual`, gemeinsamer Eintrag
atomar).
