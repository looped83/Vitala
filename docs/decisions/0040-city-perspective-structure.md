# ADR-0040: Kartenperspektive & feste 3×3-Bereichsstruktur

**Status:** Akzeptiert · **Datum:** 2026-07 · **Bezug:** [city-layout.md](../city-layout.md),
[city-regions.md](../city-regions.md), [ADR-0001](./0001-world-rendering.md)

## Kontext

Die Karte braucht eine konsistente Perspektive und eine feste Anordnung der Stadtbereiche,
die auf kleinen Bildschirmen lesbar bleibt, klare Interaktionsflächen bietet und später
Gebäude aufnehmen kann (task §4/§5).

## Entscheidung

- **Perspektive: klare top-down-Draufsicht** (ADR-0001), keine Isometrie. Damit entfallen
  perspektivische Überdeckung, teure Assets und Layering-Probleme; Interaktionsflächen sind
  einfache Rechtecke.
- **Struktur: festes 3×3-Raster** aus neun Bereichen ohne Überlappung. Spalten bei
  x = 40/365/690, Reihen bei y = 40/260/480, Zellgröße 270×180 im 1000×700-`viewBox`.
- **Bereiche & Freischaltung** folgen der verbindlichen Phase-1-Tabelle
  ([city-and-world-concept §9.2](../city-and-world-concept.md)): Stadtzentrum + Wohngebiet
  ab Start, dann Sport (2), Ernährung (3), Nachhaltigkeit (4), Naturschutz (5), Kultur (6),
  Wasser/Wald (7), Umland (8).

## Alternativen

- **Isometrische Ansicht:** verworfen (ADR-0001) – höherer Aufwand, schwächere
  Responsive-/A11y-Eigenschaften.
- **Freie/organische Anordnung:** verworfen – schwer testbar, überlappungsanfällig,
  unruhiger auf Mobil.
- **Task-Beispiel-Freischaltreihenfolge (§13, Bewegung ab Level 3):** verworfen zugunsten
  der **verbindlichen Phase-1-Tabelle** (Bewegung ab Level 2). Die narrativen
  Stufennamen aus §13 werden als Entwicklungsstufen übernommen
  ([city-development-stages.md](../city-development-stages.md)).

## Konsequenzen

- **Positiv:** deterministisch, testbar (Nicht-Überlappung + Canvas-Grenzen als Unit-Test),
  auf 320 px skalierbar, klare Fokusflächen, später um Slots erweiterbar.
- **Abwägung:** Ein starres Raster ist weniger „organisch"; dafür robust, barrierefrei und
  wartungsarm. Dekorative Wege/Wasser mildern die Rasterwirkung optisch.
