# Accessibility – Umsetzung

Zielniveau **WCAG 2.2 AA** ([accessibility.md](./accessibility.md)). A11y ist
Akzeptanzkriterium, kein Zusatz.

## Struktur & Semantik

- Landmarken: `header` / `nav` / `main` (App-Shell). Jede Seite hat genau **eine `<h1>`**
  (`Page`/`AuthLayout`), Überschriftenhierarchie über `Section`/`Card` (steuerbarer
  `headingLevel`).
- **Skip-Link** („Zum Inhalt springen") als erstes fokussierbares Element → `#main-content`
  (`main tabindex="-1"`).
- Eindeutige, seitenspezifische **Dokumenttitel** (`Page`/`useDocumentTitle`).

## Tastatur & Fokus

- Alle interaktiven Elemente sind native Controls (Buttons `<button>`, Links `<a>`, Formulare
  mit `<label>`), voll tastaturbedienbar.
- Sichtbarer, kontraststarker Fokusring (`:focus-visible`, `--color-focus`, ≥ 3:1).
- **Dialoge/Drawer:** Fokusfalle, Fokus-Rückgabe beim Schließen, Escape schließt
  (`useFocusTrap`), zugänglicher Name via `aria-labelledby`.

## Formulare

- `FormField` verknüpft Label ↔ Control, wiring von `aria-describedby` (Description + Error)
  und `aria-invalid`; Pflichtfelder als `aria-required`.
- Fehler **feldnah**, mit **Icon + Text** (nie nur Farbe), `role="alert"`.
- Fokus springt auf das erste ungültige Feld (RHF `setFocus`).

## Farbe, Kontrast, Status

- Farbe ist nie alleiniger Träger: Alerts/Badges/Chips kombinieren Farbe mit Icon/Text;
  Lebensbereichsfarben zusätzlich benennbar.
- Kontraste in Light **und** Dark auf AA ausgelegt.

## Dynamik & Ankündigungen

- **Live-Regionen:** Toasts (`aria-live="polite"`), Ladezustände (`role="status"`).
- Aktive Navigation über `aria-current` (React-Router `NavLink`).

## Touch & Motorik

- Touch-Ziele ≥ 44 × 44 px (Buttons, Nav, Chips, Checkboxen). Ausreichende Abstände,
  Safe-Area-Insets. Keine reinen Hover-Interaktionen.

## Reduced Motion & Zoom

- `prefers-reduced-motion` **und** manuelle Präferenz deaktivieren nicht-essentielle
  Animationen; statische Entsprechungen vorhanden.
- Layout in relativen Einheiten; bis 200 % Zoom nutzbar, kein erzwungener horizontaler Scroll.

## Automatisierte Prüfung

- **axe-core** in Komponententests (`src/test/a11y.test.tsx`, `vitest-axe`) und im
  E2E-Smoke (`@axe-core/playwright`) – keine kritischen/schweren Verstöße auf Kernseiten.
- Manuell zu prüfen je Kern-Flow: Tastaturdurchlauf, Fokusreihenfolge, Dialog-Fokus, Dark
  Mode, Reduced Motion, Zoom 200 %.
