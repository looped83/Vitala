# Accessibility

Zielniveau: **WCAG 2.2 AA**. Accessibility ist kein Zusatz, sondern
Akzeptanzkriterium jeder Phase.

---

## 19. Grundsätze & Anforderungen

### 19.1 Semantik & Struktur

- **Semantisches HTML** (Buttons sind `<button>`, Listen `<ul>/<ol>`, Überschriften in
  logischer Hierarchie, Landmarks `header/nav/main/footer`).
- Jede Seite hat genau eine `<h1>`; logische Überschriftenfolge.
- Formulare mit `<label>`-Verknüpfung, `fieldset/legend` für Gruppen.

### 19.2 Tastaturbedienung

- **Alle** interaktiven Elemente per Tastatur erreichbar und bedienbar.
- **Sichtbare Fokuszustände** (deutlicher Fokusring, ≥ 3:1 Kontrast, nicht nur Farbe).
- **Logische Fokusreihenfolge**; Modals/Sheets mit **Fokusfalle** und
  Fokus-Rückgabe beim Schließen.
- Skip-Link („Zum Inhalt springen").
- Keine Tastaturfallen; Escape schließt Overlays.

### 19.3 Screenreader

- Aussagekräftige `aria-label`/`aria-describedby`, wo sichtbarer Text fehlt.
- **Live-Regionen** (`aria-live="polite"`) für dynamische Belohnungen, Fortschritts- und
  Statusänderungen (z. B. „+12 XP, +5 Nahrung, Ziel zu 60 %").
- Zustände: `aria-pressed` (Chips/Toggles), `aria-expanded` (Aufklapper),
  `aria-current` (aktive Navigation).

### 19.4 Touch & Motorik

- **Touch-Ziele ≥ 44 × 44 px**, ausreichende Abstände.
- Keine reinen Hover-Interaktionen; alles auch per Tap/Klick.
- Keine zeitkritischen Eingaben (kein Countdown; Prinzip 2.2 ohnehin).

### 19.5 Kontraste & Farbe

- Text ≥ 4,5:1, große Texte/UI-Komponenten ≥ 3:1 (Light **und** Dark).
- **Farbe ist nie alleiniger Informationsträger:** Status immer zusätzlich mit
  **Icon + Text**, Diagrammserien zusätzlich mit **Muster/Beschriftung**.

### 19.6 Formulare & Fehlermeldungen

- Sichtbare Labels; Platzhalter ersetzen keine Labels.
- Fehlermeldungen **feldnah**, mit `aria-invalid` + `aria-describedby`, konkret und
  freundlich.
- Erfolg/Änderung per Live-Region bestätigt.

### 19.7 Alternative Texte & Medien

- Illustrationen/Icons: sinnvolle `alt`/`aria-label` oder `aria-hidden` bei rein
  dekorativen Elementen.
- Keine reinen Bild-Informationen ohne Textentsprechung.

### 19.8 Reduced Motion & Animationen

- `prefers-reduced-motion: reduce` respektiert; nicht-essentielle Animationen aus.
- Belohnungs-/Level-/Saisoneffekte haben statische Entsprechungen.
- Keine blinkenden/flackernden Effekte (Schutz vor Anfällen).

---

## 19.9 Barrierefreie Stadtansicht (verbindlich)

Die Stadt darf **nicht** ausschließlich als visuelle Karte existieren.

- **Gleichwertige Strukturansicht** (`Stadt → Strukturansicht`): Stadtbereiche als
  aufklappbare Abschnitte, Gebäude als Liste mit Name, Zustand, Nutzen, Baudatum,
  Freischaltgrund, Fortschritt – vollständig tastatur- und screenreaderbedienbar.
- **SVG-Karte selbst zugänglich:** jedes bedeutsame Element ist fokussierbar
  (`tabindex`), hat `role="img"`/`role="button"` + `<title>`/`aria-label`; Auswahl per
  Enter/Space; Kartenaktionen (Zoom/Pan) haben Button-Alternativen.
- **Karteninteraktion:** kein reines Drag-only; Buttons für Zoom/Navigation.
- Bau-/Freischalt-Ereignisse werden per Live-Region angekündigt.

## 19.10 Barrierefreie Diagramme

- Jedes Diagramm (Balance, Rückblick) hat eine **Datentabellen-Alternative**
  (sichtbar umschaltbar oder als visuell verborgene Tabelle).
- Serien zusätzlich durch Muster/Beschriftung unterscheidbar (nicht nur Farbe).
- Werte als Text vorhanden (nicht nur als Balkenhöhe).

---

## 19.11 Testbarkeit (Verweise)

- Automatisierte A11y-Prüfungen (axe) in Unit-/E2E-Tests.
- Manuelle Tastatur- und Screenreader-Durchläufe je Kern-Flow.
- Kontrast-Checks der Tokens im Build/Review.
- Details: [testing-strategy.md](./testing-strategy.md), §22 (Accessibility-Tests).

## 19.12 Akzeptanzkriterien (Definition of Done je Feature)

- [ ] Vollständig per Tastatur bedienbar, sichtbarer Fokus.
- [ ] Screenreader-Struktur sinnvoll, dynamische Änderungen angekündigt.
- [ ] Kontraste AA in Light und Dark.
- [ ] Keine reine Farbkodierung.
- [ ] Reduced-Motion-Variante vorhanden.
- [ ] Für Kartenfeatures: gleichwertige Strukturansicht vorhanden.
- [ ] Automatisierte axe-Prüfung ohne kritische Verstöße.
