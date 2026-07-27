# ADR-0038: Stadtansicht-Rendering – inline-SVG + CSS (Phase 6)

**Status:** Akzeptiert · **Datum:** 2026-07 · **Bezug:** [ADR-0001](./0001-world-rendering.md),
[city-view.md](../city-view.md), [city-visual-language.md](../city-visual-language.md)

## Kontext

Phase 6 setzt die erste real nutzbare Stadtansicht um. ADR-0001 hat bereits die
Grundsatzentscheidung getroffen (top-down 2D, **keine 3D-Engine**, SVG statt Canvas
wegen Accessibility, Skalierung und DOM-Semantik). Phase 6 muss diese Entscheidung
konkret einlösen und für interaktive Bereiche/Bauflächen ausformulieren.

## Entscheidung

Die Stadt wird als **inline-SVG-Karte** in einem responsiven `viewBox` (1000×700,
top-down) gerendert, gestylt über CSS-Design-Tokens. Interaktive Stadtbereiche und
Bauflächen sind **fokussierbare `<g role="button">`-Elemente** mit vollständigem
`aria-label`, Tastaturaktivierung (Enter/Leertaste) und sichtbarem Fokusrahmen.
Dekorative Elemente sind gruppiert und `aria-hidden`. **Kein Canvas, kein WebGL,
keine Game-Engine, keine permanente Renderloop.** Bewegung entsteht ausschließlich
über CSS-Transitions, die die globalen Reduced-Motion-Regeln automatisch entfernen.

## Alternativen

- **Canvas/WebGL:** verworfen (ADR-0001) – keine native Accessibility, kein DOM-Fokus.
- **Vorgerenderte Einzelbilder je Level:** verworfen – nicht datengetrieben, kein echtes
  Wachstum, hoher Asset-Aufwand, schlechte Skalierung.
- **PixiJS/Phaser:** verworfen – unnötiger Bundle-Zuwachs und Renderloop ohne
  Produktnutzen (Prinzip 2.5, task-Abgrenzung).

## Konsequenzen

- **Positiv:** semantische, tastaturbedienbare Elemente; verlustfreie Skalierung; kleines,
  lazy geladenes Chunk (~11 KB gzip, weit unter dem 100-KB-Budget); voll testbar in jsdom.
- **Folgeanforderung:** gleichwertige Listenansicht ist Pflicht (ADR-0001, §29) und
  wird in Phase 6 mitgeliefert.
- **Grenze:** Bei sehr vielen künftigen Gebäuden greifen die Performance-Maßnahmen aus
  [city-performance.md](../city-performance.md) (Gruppierung, nur interaktive Elemente
  einzeln im DOM).
