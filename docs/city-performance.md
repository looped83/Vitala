# Performance & Green Code der Stadtansicht

## Budgets (§54)

| Ziel                                           | Budget          | Ist (Phase 6, gemessen)              |
| ---------------------------------------------- | --------------- | ------------------------------------ |
| Zusätzlicher komprimierter JS-Anteil der Stadt | < 100 KB gzip   | **10,63 KB gzip** (32,43 KB roh)     |
| Einzelne dekorative Assetdatei                 | < 150 KB        | 0 (nur inline-SVG)                   |
| Gleichzeitig animierte Elemente                | ≤ 12 (ADR-0001) | 0 dauerhaft (nur Transitions)        |
| Sichtbare DOM-Knoten                           | ≤ 1500          | ~9 Regionen + ~11 Slots + Deko (≈50) |

**Gemessen** (`npm run build`, Vergleich mit dem Stand vor Phase 6):

- `CityPage`-Chunk: **32,43 KB roh / 10,63 KB gzip** – eigenes Route-Lazy-Chunk, wird nur
  auf `/city` geladen.
- Gemeinsamer Vendor-Chunk: 503,48 KB → 503,78 KB (**+0,30 KB roh / +0,09 KB gzip**) – die
  Stadtansicht bringt praktisch keine neuen Abhängigkeiten mit (keine neue Bibliothek).
- PWA-Precache: 782,53 KiB → 821,98 KiB (**+39,45 KiB** unkomprimiert, inkl. CSS).
- Die bestehende Warnung „chunks larger than 500 kB" betrifft den Vendor-Chunk
  (React/Router/Query) und besteht bereits vor Phase 6 – sie wird durch die Stadtansicht
  nicht verursacht.

## Maßnahmen

- **Keine Game-Engine, keine Renderloop, keine Physik.** Bewegung ausschließlich über
  CSS-Transitions (durch Reduced-Motion automatisch entfernt).
- **Nur interaktive Elemente einzeln im DOM** – Regionen und nicht-gesperrte Slots.
  Gesperrte Slots werden nicht gerendert; Dekoration ist gruppiert.
- **Keine permanenten Resize-/Scroll-/Mousemove-Listener.** Der Desktop/Mobil-Wechsel nutzt
  einen einzelnen `matchMedia`-Listener mit sauberem Cleanup (`useIsDesktop`).
- **Memoisierung:** Das `CityModel` wird via `useMemo` aus dem Overview + gesehenem Level
  abgeleitet; statische Layoutdaten sind Modulkonstanten außerhalb des Renderpfads.
- **Zoom/Pan** über native `overflow: auto`-Scroll statt eigener Drag-Logik.

## Query-/Cache-Strategie (§52)

- Statische Layoutdaten liegen im Bundle (kein Query).
- `city_overview` ist household-scoped mit 30 s `staleTime`; Mutationen invalidieren gezielt
  nur `queryKeys.city.overview(householdId)` – keine globale Cache-Leerung, kein Polling.
- Stadtlevel-Änderungen (aus Phase 5) spiegeln sich über den Reward-Cache; die Stadtseite
  liest Level über `city_overview`.

## Große DOM-Strukturen (§55)

Da die Karte statisch und klein ist, ist **keine** Virtualisierung nötig. Bei künftigem
Wachstum: Gruppierung nicht-interaktiver Deko zu kombinierten Pfaden, ggf.
`content-visibility: auto` für Off-Screen-Bereiche (ADR-0001).
