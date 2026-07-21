# ADR-0030: Rückblickaggregation & neutrale Sprache

**Status:** Akzeptiert · **Bezug:** [daily-review.md](../daily-review.md),
[weekly-review.md](../weekly-review.md), [monthly-review.md](../monthly-review.md),
Aufgabe §31–§36

## Kontext

Rückblicke (Tag/Woche/Monat) sollen sachlich und wertfrei sein: keine Bewertung wie
„erfolgreich/schlecht", keine roten Negativzustände, keine aggressive Steigerungslogik.
Vergleiche zum Vormonat müssen neutral formuliert sein (§33/§34).

## Entscheidung

- **Aggregation über begrenzte Zeitfenster:** `getReviewData(household, from, to)` lädt
  `entry_feed` + `ritual_completions` **nur** für das Fenster (kleine Payloads) und aggregiert
  deterministisch zu `AreaTotals` (Einträge, aktive Tage, Bewegungsminuten, gemeinsame
  Einträge, Ritualabschlüsse, Verteilung je Bereich).
- **Neutrale Textbausteine im Domain-Layer** (`src/domain/review/aggregate.ts`, getestet):
  - `daySummaryText` – „Heute wurden 3 Einträge dokumentiert und 2 Rituale abgeschlossen."
  - `balanceText` – nennt Schwerpunkte, **nie** Defizite („zu schwach" ist verboten).
  - `comparisonText` – „Zwei gemeinsame Aktivitäten mehr als im Vormonat." / bei Rückgang
    „… weniger … – jede zählt." / bei Gleichstand „… jeweils N … erfasst."
- **Balance als zugängliche Darstellung:** `BalanceBars` rendert eine Definitionsliste mit
  Textwerten (kein reines Farbdiagramm); Farbe ist nie alleiniger Informationsträger (§46).
- **Reflexionen/Check-ins bleiben privat:** im Tagesrückblick werden nur die **eigenen**
  Check-in-Inhalte gezeigt (ADR-0028); keine automatische Auswertung.

## Alternativen

- **Serverseitige Aggregat-Views/RPC:** performanter bei sehr großen Datenmengen, aber mehr
  DB-Fläche; bei zwei Personen und begrenzten Fenstern ist die Client-Aggregation ausreichend
  und einfach → für V1 gewählt, später ersetzbar ohne UI-Änderung.
- **Diagrammbibliothek:** zusätzliche Bundle-Größe und A11y-Aufwand → verworfen zugunsten
  schlanker, zugänglicher CSS-Balken.

## Konsequenzen

- **Positiv:** wertfreie, konsistente Sprache; zugänglich; kleine Payloads; keine neue
  Abhängigkeit.
- **Negativ/Abwägung:** Aggregation im Client; bei sehr großen Historien wären
  Aggregat-Abfragen effizienter – bewusst später.
