# Bauflächen (Gebäudeslots)

Eine **Baufläche** ist ein fester Ort für ein späteres Gebäude (ADR-0042). Phase 6 baut
noch keine Gebäude, modelliert die Slots aber vollständig als Vorbereitung für Phase 7.

## Felder (`SlotDefinition`)

| Feld                | Bedeutung                                                    |
| ------------------- | ------------------------------------------------------------ |
| `id`                | stabile Slot-ID (eindeutig je Layoutversion)                 |
| `regionId`          | zugehöriger Stadtbereich                                     |
| `position`          | Mittelpunkt im 1000×700-`viewBox` (deterministisch, testbar) |
| `size`              | Slot-Kategorie (s. u.)                                       |
| `unlockLevel`       | Freischaltlevel (≥ Region-Level)                             |
| `allowedCategories` | erlaubte Gebäudekategorien für Phase 7                       |
| `order`             | Reihenfolge innerhalb der Region                             |
| `buildableInV1`     | ob Phase 7 hier bauen kann (`false` = reservierter Ausblick) |

## Slot-Kategorien (`size`)

`small`, `medium`, `large`, `nature_project`, `infrastructure`, `community`. Sie stützen die
späteren Gebäudeanforderungen (Größe/Typ) aus [building-system.md](./building-system.md).

## Gebäudekategorien (`allowedCategories`)

`movement`, `nutrition`, `sustainability`, `animal_welfare`, `community`. Sie sind der
Vertrag zwischen Slot und künftigem Gebäudekatalog.

## Status (§17)

Rein abgeleitet aus Level + Definition – **kein** persistenter Slot-Zustand, **kein**
Status „bebaut", **keine** Fake-Gebäude:

- **gesperrt** (`locked`) – `stadtlevel < unlockLevel`.
- **verfügbar** (`available`) – freigeschaltet und `buildableInV1 = true`.
- **reserviert** (`reserved`) – freigeschaltet, aber `buildableInV1 = false` (z. B. Umland).

Auf der Karte werden nur nicht-gesperrte Slots als interaktive Marker gerendert; gesperrte
Slots sind durch ihre gesperrte Region abgedeckt.

## Bauflächendetails (§18)

Das Detailpanel zeigt Bereich, Größe, erlaubte Gebäudekategorien, Freischaltlevel und einen
klaren Hinweis, dass das eigentliche Bauen in Phase 7 folgt („hier werden dann Ressourcen
eingesetzt"). Beispielgebäude erscheinen ausschließlich als **Vorschautext**. Baukosten
werden nicht als ausführbare Interaktion dargestellt (in Phase 1 als Startkalibrierung
definiert, aber noch nicht final – daher nur als spätere Option benannt).

## Vorbereitung für Phase 7

Gebäude in Phase 7 knüpfen an bestehende `id`/`allowedCategories`/`size` an – ohne
Layout-Migration. Nur neue `building_definitions`-Zeilen und SVG-Assets kommen hinzu.
