# Asset-Strategie der Stadt

## Grundsatz (§53)

Die Stadt kommt **ohne Rastergrafiken und ohne externe Assetdienste** aus. Alle visuellen
Elemente sind **inline-SVG + CSS**, komponiert aus Design-Tokens.

- Keine großen Bilddateien, keine externen Bild-CDNs, keine Laufzeit-Downloads.
- Keine lizenzrechtlich unklaren Assets – es werden ausschließlich selbst gezeichnete
  Formen (Rechtecke, Pfade, Marker) verwendet.
- Farben referenzieren ausschließlich Tokens (`city.module.css` + `tokens.css`).

## Wiederverwendung

- Regionen und Slots sind wiederverwendbare React-Komponenten (`CityRegion`, `CitySlot`).
- Dekoration ist gruppiert (kombinierte Pfade), nicht als viele Einzelknoten gerendert.

## Namenskonvention

- Region-IDs: `snake_case` Bereichsname (z. B. `nature_reserve`).
- Slot-IDs: `<region>_<kategorie>_<n>` (z. B. `nature_project_1`).
- CSS-Themenklassen: `theme<Thema>` (z. B. `themeNature`).

## Asset-Budget

- Keine dekorative Assetdatei > 150 KB (es gibt keine – alles inline-SVG).
- Zusätzlicher komprimierter JS-Anteil der Stadtansicht: ~11 KB gzip (Ziel < 100 KB, §54).
- Emoji-Symbole (Ressourcen, Schloss) sind Schriftglyphen, keine Bilddateien.

## Spätere Rasterbilder (falls je nötig)

Sollten in späteren Phasen doch Rasterbilder nötig sein: WebP/AVIF, responsive Größen, klare
Kompression, lokal gehostet, mit dokumentierter Quelle/Lizenz. Für Phase 6 nicht erforderlich.

## Tiere (§38)

Keine Tier-Assets im DOM in Phase 6. Die visuelle Struktur (dekorative, `aria-hidden`
Ebene) ist so angelegt, dass statische Tiere später ohne Umbau ergänzt werden können.
