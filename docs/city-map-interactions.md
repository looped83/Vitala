# Karteninteraktionen

## Interaktionen (§25)

- **Stadtbereich auswählen** – Klick/Tap/Enter auf eine Region öffnet die Detailansicht.
- **Baufläche auswählen** – Klick/Tap/Enter auf einen Slot-Marker.
- **Auf gesperrten Bereich fokussieren** – gesperrte Regionen sind fokussier- und
  auswählbar; das Detail erklärt die Freischaltbedingung.
- **Details öffnen/schließen** – Auswahl öffnet das Panel; „Schließen"/Escape schließt es
  und gibt den Fokus zurück.
- **Zwischen Bereichen wechseln** – Tab-Navigation bzw. neue Auswahl.
- **Karte zurücksetzen** – „Zurücksetzen" setzt Zoom auf 100 % und hebt die Auswahl auf.

Bewusst **vermieden:** Drag-only-Navigation, komplexe Gesten, Doppeltipp-Zwang, versteckte
Langdruck-Interaktionen, Hover-only-Tooltips. Keine Information wird ausschließlich über
Hover vermittelt.

## Zoom & Verschieben (§26)

Zoom ist umgesetzt, weil die Gesamtkarte auf kleinen Bildschirmen sonst schwer lesbar ist:

- **Sichtbare +/−-Schaltflächen** und **Zurücksetzen**; definierte Stufen (100 % / 150 % /
  200 %), Mindest-/Maximalstufe eingehalten.
- Die SVG-Breite wächst mit dem Zoom; der Viewport (`overflow: auto`) erlaubt **Verschieben**
  per Maus-Drag und Touch-Pan (nativer Scroll, `touch-action: pan-x pan-y`) – **keine**
  globalen Mousemove-Listener (green code, §54).
- Tastaturunterstützung: fokussierte Elemente bleiben via `scrollIntoView` sichtbar; kein
  Fokusverlust, keine unendliche Fläche.
- Reduced Motion: kein animierter Zoom; Zustandswechsel sind sofort.

## Mobile (§27)

- Karte darf größer als der Viewport sein; Navigation bleibt kontrolliert (Scroll).
- Detailansicht als **Bottom Sheet** (`Drawer side="bottom"`) mit Fokusfang + Escape.
- Touch-Ziele angemessen groß (Regionen sind große Rechtecke; Slot-Marker ≥ 28 px).
- Karten-/Listenumschaltung jederzeit im Header.

## Desktop (§28)

- Karte zentral; Detail als **Seitenpanel** (sticky) neben der Karte, wenn etwas ausgewählt
  ist. Tastatursteuerung; keine übermäßig breite Leerfläche.

## Auswahl-/Ansichtszustand (§30)

Die bevorzugte Ansicht (Karte/Liste/System) wird pro Nutzer serverseitig gespeichert
(`set_city_view_mode`, optimistisch im Client). Die aktuelle Auswahl ist lokaler UI-Zustand.
