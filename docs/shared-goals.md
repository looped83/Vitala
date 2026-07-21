# Gemeinsame Ziele

Gemeinsame Ziele gehören dem **Household** (`owner_type = 'shared'`, `owner_user_id = null`).

## Fortschritt

- Beiträge **beider** Personen zählen. Da ein gemeinsamer Eintrag als **eine** Zeile
  gespeichert wird (ADR-0019), wird er genau **einmal** für den Haushaltsfortschritt gewertet
  – keine Doppelzählung ([goal-progress-calculation.md](./goal-progress-calculation.md)).
- Die Messmethode `shared_count` zählt ausdrücklich nur **gemeinsame** Einträge
  (`is_shared`), z. B. „vier gemeinsame Aktivitäten im Monat". Andere Messmethoden auf einem
  gemeinsamen Ziel zählen alle Household-Einträge im Zeitraum.

## Beispiele

- Acht gemeinsame Bewegungseinheiten im Monat (`shared_count`).
- Zwölf gemeinsame gesunde Mahlzeiten (`shared_count` + Baustein-Filter `balanced_vegan_meal`).
- Zehn nachhaltige Aktionen zusammen (`shared_count`).
- Ein gemeinsames Biodiversitätsprojekt (`boolean`).

## Sichtbarkeit & Verwaltung

- Beide aktiven Mitglieder sehen und verwalten gemeinsame Ziele.
- Individuelle Beiträge können sichtbar gemacht werden (Beitragsquellen), **ohne**
  Vergleichs-/Konkurrenzdarstellung, ohne Gewinner-/Verliererlogik (Aufgabe §2.3/§10).
- Die Zieldetailansicht erklärt neutral, wie der Fortschritt zustande kommt
  („Beiträge beider Personen zählen (gemeinsame Einträge einmal)").

## Abgrenzung persönlich ↔ gemeinsam

- **Persönliches Ziel:** Fortschritt nur aus Einträgen des Zielinhabers; gemeinsame Einträge,
  an denen der Inhaber beteiligt ist, zählen anteilig für ihn.
- **Keine** Rangfolge, **kein** Ranking, **keine** automatische Schuldzuweisung.
