# Barrierefreiheit der Stadtansicht

Die Stadtansicht erfüllt WCAG 2.2 AA. Die visuell komplexe Karte ist vollständig durch eine
gleichwertige, nicht-visuelle Zugänglichkeit ergänzt (ADR-0001, §56).

## Gleichwertige Listenansicht (§29/§56.5)

Die Listenansicht (`CityList`) ist **kein Notfallmodus**, sondern funktional gleichwertig:
alle Stadtbereiche mit Status, Freischaltlevel, primärer Ressource, Anzahl freier
Bauflächen, Bauflächentypen und Beschreibung; „Details" und Slot-Auswahl mit denselben
Aktionen wie die Karte. Umschaltung über den Header-Toggle; Präferenz wird pro Nutzer
gespeichert.

## Kartenbeschreibung (§56.1)

Das SVG trägt `role="group"` mit einem `aria-label`, das Stadtname, Level + Stufe, Anzahl
erschlossener Bereiche und freier Bauflächen sowie den Hinweis auf die Listenansicht nennt
(`mapSummary` in `src/domain/city/a11y.ts`).

## Interaktive Stadtbereiche (§56.2)

Jede Region ist ein `<g role="button" tabindex="0">` mit vollständigem Label, z. B.
„Naturschutzgebiet, gesperrt, Freischaltung auf Stadtlevel 5." bzw. „Stadtzentrum,
verfügbar, 2 freie Bauflächen." Fokuszustand über sichtbaren Rahmen; Aktivierung per
Enter/Leertaste.

## Bauflächen (§56.3)

Jeder interaktive Slot trägt ein Label „Größe, Status, Bereich, für Kategorie(n)", z. B.
„Große Baufläche, frei, Garten- & Ernährungsviertel, für nutrition."

## Tastaturnavigation (§56.4)

- Tab erreicht Regionen und sichtbare Slots in sinnvoller Reihenfolge.
- Enter/Leertaste öffnet die Auswahl; das Detailpanel (Dialog/Bottom Sheet) fängt den Fokus,
  Escape schließt und gibt den Fokus zurück (Dialog/Drawer-Kontrakt).
- Zoom-Buttons sind fokussierbar; fokussierte Elemente werden bei Zoom via `scrollIntoView`
  im Sichtbereich gehalten (kein Fokusverlust).

## Kontraste & Nicht-Farbe-allein (§56.7)

- Status wird immer als Text/Icon genannt, nie nur über Farbe.
- Gesperrte Bereiche nutzen zusätzlich Muster (gestrichelter Rand) + Schloss-Label, nicht
  nur reduzierte Deckkraft.
- Fokusrahmen sind auf allen Hintergründen (hell/dunkel) sichtbar.

## Zoom (§56.6)

Der App-Zoom ersetzt oder blockiert den Browser-Zoom nicht; kein `user-scalable=no`. Bei
200 % Browser-Zoom bleibt die Seite bedienbar (SVG skaliert, Layout bricht um).

## Reduced Motion (§57)

Alle Bewegung ist transition-basiert und wird durch die globalen Reduced-Motion-Regeln
(Media-Query **und** App-Präferenz) entfernt. Keine Information wird ausschließlich über
Bewegung vermittelt; keine automatischen Kamerafahrten oder Zoomsequenzen.

## Tests

Axe-Prüfung der Listenansicht, Rollen-/Label-Tests der Karte und der Slots, Fokus- und
Tastaturtests (siehe [city-testing.md](./city-testing.md)).
