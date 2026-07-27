# ADR-0042: Bauflächen-Modell (Slots) als Phase-7-Vorbereitung

**Status:** Akzeptiert · **Datum:** 2026-07 · **Bezug:** [building-slots.md](../building-slots.md),
[building-system.md](../building-system.md), [ADR-0039](./0039-city-layout-definitions.md)

## Kontext

Phase 6 baut noch **keine** Gebäude, muss die Bauflächen aber vollständig auf die konkrete
Gebäudekonstruktion in Phase 7 vorbereiten (task §16–§18, Abgrenzung). Slots brauchen
stabile IDs, Positionen, Größen/Kategorien, Freischaltlevel und erlaubte Gebäudekategorien.

## Entscheidung

Eine **Baufläche** ist eine statische `SlotDefinition` (ADR-0039) mit: `id`, `regionId`,
`position` (viewBox-Koordinaten), `size` (`small`/`medium`/`large`/`nature_project`/
`infrastructure`/`community`), `unlockLevel` (≥ Region-Level), `allowedCategories`
(Bewegung/Ernährung/Nachhaltigkeit/Tierwohl/Gemeinschaft) und `buildableInV1`.

**Slot-Status in V1** ist rein abgeleitet: `locked` (Level < unlockLevel), `available`
(freigeschaltet, `buildableInV1 = true`) oder `reserved` (freigeschaltet, aber
`buildableInV1 = false` – sichtbarer Ausblick, z. B. Umland). **Es gibt keinen Status
„bebaut"** und keine Möglichkeit, einen Slot clientseitig zu belegen – es werden **keine
Fake-Gebäude** dargestellt (§17/§60).

## Alternativen

- **Slots erst in Phase 7 einführen:** verworfen – die Karte soll schon jetzt freie
  Bauflächen zeigen und die Datenstruktur muss stehen, damit keine Migration nötig wird.
- **Slot-Status in der DB:** verworfen für Phase 6 – ohne Gebäude gibt es keinen
  persistenten Slot-Zustand; Status ist aus Level + Definition ableitbar.

## Konsequenzen

- **Positiv:** Phase 7 kann Gebäude direkt an bestehende Slot-IDs/-Kategorien knüpfen, ohne
  Layout-Migration; Größen/Kategorien stützen Gebäudeanforderungen und Baukosten.
- **Folge:** `allowedCategories` und `size` sind der Vertrag zwischen Slot und künftigem
  `building_definitions`-Katalog (building-system §10).
