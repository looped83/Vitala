# ADR-0001: Welt-Darstellung – SVG-basierte top-down Kachelwelt

**Status:** Akzeptiert · **Datum:** 2026-07 · **Bezug:** [city-and-world-concept.md](../city-and-world-concept.md)

## Kontext

Die Stadt ist das zentrale Motivationselement und muss über Jahre wachsen. Anforderungen:
hohe visuelle Qualität, responsive (iPhone bis Desktop), WCAG 2.2 AA, gute Performance
auf Mobilgeräten, langfristige Erweiterbarkeit/Wartbarkeit, **keine 3D-Engine**.

## Entscheidung

Die Welt wird als **top-down, modulare Kachelwelt aus inline-SVG + CSS** umgesetzt.
Jedes Gebäude/Weltelement ist eine wiederverwendbare SVG-Komponente mit definierten
Zuständen (Baustelle → Ausbaustufen). Die Welt wird **datengetrieben** aus
`world_areas`/`world_elements`/`buildings` rekonstruiert. Performance-Maßnahmen:
Viewport-Culling, gecachte statische Ebenen, `content-visibility: auto`.

## Alternativen

- **Isometrische 2D (Canvas/Sprites):** höchste visuelle Qualität, aber hoher
  Asset-/Zeichenaufwand, schwache Accessibility, komplexeres responsives Layout.
- **Reine Canvas-Welt:** beste Rohperformance, aber **keine** native Accessibility
  (kein DOM/Fokus/Screenreader) – disqualifiziert wegen §19.9.
- **Illustrative Einzelbild-Stadt:** minimaler Aufwand, aber nicht datengetrieben,
  kaum erweiterbar, kein echtes Wachstum.

## Konsequenzen

- **Positiv:** semantische, fokussierbare Elemente (A11y), verlustfreie Skalierung,
  komponierbare/versionierbare Gebäude, gute Testbarkeit, moderater Aufwand.
- **Negativ/Risiko:** DOM-Last bei sehr vielen Elementen (R9) → Culling + Budgets
  (DOM ≤ 1500 sichtbar, ≤ 12 animierte Elemente).
- **Folgeanforderung:** gleichwertige barrierefreie Strukturansicht ist Pflicht.
