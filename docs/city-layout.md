# Stadt-Layout

Das Layout ist eine **feste, kuratierte** TypeScript-Definition (ADR-0039) in
`src/domain/city/layout.ts`, versioniert über `LAYOUT_VERSION`.

## Koordinatenraum

- `viewBox` **1000×700**, top-down (ADR-0001/0040).
- Regionen liegen auf einem **3×3-Raster** ohne Überlappung: Spalten x = 40/365/690,
  Reihen y = 40/260/480, Zellgröße 270×180, Ränder 40.
- Slot-Positionen sind absolute `viewBox`-Koordinaten innerhalb der Region – deterministisch
  und testbar (Unit-Tests prüfen: Region im Canvas, keine Überlappung, Slot in Region,
  Slot-Level ≥ Region-Level).

## Struktur

- `REGION_DEFINITIONS` – neun Regionen (siehe [city-regions.md](./city-regions.md)).
- `SLOT_DEFINITIONS` – 16 Bauflächen (siehe [building-slots.md](./building-slots.md)).
- Lookups: `getRegionDefinition`, `getRegionSlots`, `getSlotDefinition`, `regionsInOrder`.

## Rendering

Die Karte (`CityMap`) rendert:

- eine dekorative Basis-Ebene (Wege/Wasser), gruppiert und `aria-hidden`;
- je Region eine fokussierbare `<g role="button">` mit Rechteck + umbrochenem Titel +
  Status-/Sublabel;
- je nicht-gesperrter Baufläche einen fokussierbaren Slot-Marker.

Die Perspektive bleibt auf 320 px lesbar; Interaktionsflächen sind Rechtecke (größer als der
sichtbare Marker, wo nötig). Layering ist deterministisch: Regionen zuerst, Slots darüber.

## Skalierung / Erweiterung

Neue Bereiche/Slots werden als weitere Definitionszeilen mit passender Position ergänzt;
größere Umbauten erhöhen `LAYOUT_VERSION` (siehe
[city-layout-versioning.md](./city-layout-versioning.md)).
