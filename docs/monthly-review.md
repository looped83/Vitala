# Monatsrückblick

Rückblick-Seite, Scope „Monat". Sachlich, wertfrei
([ADR-0030](./decisions/0030-review-aggregation.md), Aufgabe §34).

## Inhalt

- **Zeitraum** (z. B. „März 2026").
- **Balance-Zeile** (neutral) und **Überblick:** Gesamtzahl der Einträge, Bewegungsminuten,
  gemeinsame Aktivitäten, aktive Tage, Ritualabschlüsse, Verteilung je Bereich.
- **Vergleich zum Vormonat** (`comparisonText`), neutral formuliert:
  - mehr: „Zwei gemeinsame Aktivitäten mehr als im Vormonat."
  - gleich: „In beiden Zeiträumen wurden jeweils sechs Aktionen erfasst."
  - weniger: „Eine gemeinsame Aktivität weniger als im Vormonat – jede zählt."

Keine aggressive Steigerungslogik, keine Wertung. Der Vergleich lädt ein zweites, begrenztes
Zeitfenster (Vormonat) und aggregiert deterministisch.

## Quartalsrückblick

Vorbereitet (Periodentyp `quarter` existiert für Ziele); als eigener Rückblick-Scope bewusst
**nicht** implementiert, um unnötige Komplexität zu vermeiden (Aufgabe §31). Die Periodenmathematik
(`period_start`/`current_period_index` für Quartale) steht bereit, falls er später ergänzt wird.
