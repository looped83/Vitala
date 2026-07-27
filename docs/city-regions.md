# Stadtbereiche

Die Stadt besteht aus einer festen, kuratierten Struktur von neun Bereichen (kein
prozedurales Layout, ADR-0039/0040). Namen und Freischaltlevel folgen der verbindlichen
Phase-1-Tabelle ([city-and-world-concept §9.2](./city-and-world-concept.md)).

## Bereichsübersicht

| ID                     | Titel                        | Freischaltung | Ressource    | Lebensbereich(e)          | Raster  |
| ---------------------- | ---------------------------- | :-----------: | ------------ | ------------------------- | :-----: |
| `city_center`          | Stadtzentrum                 |   Start (1)   | Gemeinschaft | übergreifend              | oben M  |
| `residential`          | Wohngebiet                   |   Start (1)   | Gemeinschaft | übergreifend              | mitte L |
| `movement_quarter`     | Sportviertel                 |       2       | Energie      | Bewegung                  | oben L  |
| `nutrition_quarter`    | Garten- & Ernährungsviertel  |       3       | Nahrung      | Ernährung                 | oben R  |
| `sustainability_infra` | Nachhaltigkeitsinfrastruktur |       4       | Natur        | Nachhaltigkeit            | mitte R |
| `nature_reserve`       | Naturschutzgebiet            |       5       | Natur        | Tierwohl                  | unten L |
| `culture_quarter`      | Bildungs- & Kulturviertel    |       6       | Gemeinschaft | übergreifend              | mitte M |
| `water_forest`         | Wasser- & Waldgebiet         |       7       | Natur        | Nachhaltigkeit + Tierwohl | unten M |
| `expansion`            | Umland & vernetzte Region    |       8       | Gemeinschaft | übergreifend (Ausblick)   | unten R |

Die vier Lebensbereiche sind visuell gleichwertig repräsentiert (§20): Bewegung → Energie /
Sportviertel, Ernährung → Nahrung / Ernährungsviertel, Nachhaltigkeit → Natur /
Nachhaltigkeitsinfrastruktur, Tierwohl → Natur / Naturschutzgebiet. Gemeinschaft trägt
Stadtzentrum und Kulturviertel.

## Felder einer Region (`RegionDefinition`)

`id`, `name` (intern), `title` (Anzeige), `description`, `outlook` (spätere Entwicklung),
`theme` (Farb-/Deko-Schlüssel), `areas`, `primaryResource`, `unlockLevel`, `order`, `rect`
(Position im 1000×700-`viewBox`), `isExpansion`.

## Zustände (§15)

Abgeleitet aus dem Stadtlevel + der gesehenen Stufe des Nutzers:

- **gesperrt** (`locked`) – `stadtlevel < unlockLevel`; zeigt „Ab Stadtlevel N".
- **neu freigeschaltet** (`newly_unlocked`) – gerade überschritten und noch nicht bestätigt.
- **verfügbar** (`available`) – freigeschaltet und bestätigt.

Startbereiche (Level 1) werden nie als „neu" markiert. Weitere Zustände (vollständig
erschlossen, erweitert) sind erst in späteren Phasen relevant und bewusst nicht umgesetzt.

## Stadtzentrum (§6)

Immer verfügbar, Herz der Stadt und Navigationsausgangspunkt. Zeigt in Phase 6 Stadtname,
-level, -stufe, Fortschritt und Ressourcenbezug – **noch keine** baubaren Hauptgebäude.

## Wasser- & Erholungsbereich (§11)

`water_forest` ist statisch bzw. sehr dezent; Wasserflächen sind nicht als Baufläche
missverständlich (nur ein Naturprojekt-Slot), respektieren Reduced Motion und bieten klare
Kontraste.

## Erweiterungsfläche (§12)

`expansion` ist sichtbar, aber nicht betretbar: „Wird auf einem späteren Stadtlevel
erschlossen." Kein Kaufzwang, keine Mystery-Mechanik – Freischaltung über spätere Level.
