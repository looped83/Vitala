# ADR-0014: UI-Komponenten- & Font-Strategie – schlanke eigene Primitive, System-Fonts

**Status:** Akzeptiert · **Bezug:** [design-system.md](../design-system.md), [technical-architecture.md](../technical-architecture.md) §15

## Kontext

Phase 1 legt eine **eigene, schlanke Primitiv-Bibliothek** (`src/ui/`) statt einer schweren
UI-Framework-Abhängigkeit fest (Bundle-Budget, Green Code). Ebenso ist ein performantes,
datenschutzfreundliches Typografiesystem gefordert.

## Entscheidung

- **Eigene Komponentenbibliothek** in `src/ui/` (Button, Input, Card, Dialog, …), aufgebaut
  auf **nativen HTML-Elementen** (Zugänglichkeit zuerst) mit CSS-Modules und Design-Tokens.
  Keine externe UI-Lib.
- **Icons** als eigenes, inline gerendertes SVG-Set (`src/ui/Icon`) – keine Icon-Lib.
- **Fonts:** **System-Font-Stack** (`system-ui, -apple-system, Segoe UI, Roboto, …`), **kein
  externer Font-Request und kein gebündeltes Font-Binary**. Das erfüllt „System Fonts **oder**
  lokal eingebundene Fonts" aus design-system §18.2 und vermeidet Netzwerk-/Datenschutz- und
  Bundle-Kosten. Selbst gehostetes „Inter" kann später über die Token
  `--font-family-base` ergänzt werden, ohne Komponenten zu ändern.

## Alternativen

- **UI-Framework (MUI/Chakra):** zu groß, verletzt Bundle-Budget, weniger Kontrolle über A11y.
- **Google Fonts / CDN-Font:** externer Request, Datenschutz-/Performance-Nachteil.
- **Gebündeltes Inter-Binary jetzt:** zusätzlicher Asset-/Wartungsaufwand ohne klaren Mehrwert
  in Phase 2.

## Konsequenzen

- **Positiv:** kleines Bundle (initial ~142 kB gzip), volle A11y-Kontrolle, keine externen
  Requests, konsistente Tokens.
- **Negativ/Abwägung:** Komponenten müssen selbst gepflegt werden – bewusst akzeptiert für
  Schlankheit und Kontrolle; abgedeckt durch Komponententests.
