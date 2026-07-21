# Tagesrückblick

Teil der Rückblick-Seite (`src/features/review/ReviewPage.tsx`, Scope „Tag"). Sachlich und
wertfrei ([ADR-0030](./decisions/0030-review-aggregation.md), Aufgabe §32).

## Inhalt

- **Neutrale Zusammenfassung:** `daySummaryText`, z. B. „Heute wurden drei Einträge dokumentiert
  und zwei Rituale abgeschlossen." An einem leeren Tag: „… wurde noch nichts dokumentiert – das
  ist völlig in Ordnung." Nie „erfolgreich/schlecht/unproduktiv/versagt".
- **Überblick:** Einträge, aktive Tage, Bewegungsminuten, gemeinsame Einträge, Ritualabschlüsse.
- **Balance der Bereiche:** zugängliche `BalanceBars` (Textwerte, Farbe nicht allein).
- **Deine Check-ins:** nur die **eigenen** Morgen-/Abend-Angaben (privat, ADR-0028) inkl.
  optionalem positivem Tagesmoment/Reflexion.
- **Einträge:** die Tageseinträge als `EntryCard`.

## Formulierung

Neutral, wertschätzend, ohne Bewertung ausgelassener Punkte. Vergangene Tage sind über die
Zeitraum-Navigation erreichbar (kein Sprung in die Zukunft).
