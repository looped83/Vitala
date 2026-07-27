# Designsystem – Umsetzung

Technische Umsetzung von [design-system.md](./design-system.md). Siehe auch
[ADR-0013](./decisions/0013-theme-strategy.md) (Theme) und
[ADR-0014](./decisions/0014-ui-component-strategy.md) (Komponenten/Fonts).

## Tokens

- **`src/styles/tokens.css`** – alle Werte als **CSS Custom Properties**:
  - **Primitive:** Spacing (2–64), Radien, Typo-Skala, Motion (Dauer/Easing), Z-Index,
    Breakpoints, Inhaltsbreiten, Touch-Zielgröße.
  - **Semantisch (Light + Dark):** `--color-bg`, `--color-surface(-2/-elevated)`,
    `--color-text-primary/-secondary`, `--color-border(-strong)`, `--color-primary(-strong/-soft)`,
    `--color-accent`, `--color-focus`, `--color-success/-info/-warning/-attention` (+ `-soft`),
    Schatten.
  - **Lebensbereiche:** `--color-movement/-nutrition/-sustainability/-animal-welfare` – **nie
    alleiniger Informationsträger** (immer mit Icon/Text/Label).
- **`src/ui/tokens.ts`** – typisierte Referenzen (`var(--…)`) für JS-Nutzung (kein Duplizieren
  von Werten).
- Komponenten verwenden **ausschließlich Tokens**, keine harten Farbwerte.

## Light / Dark / System

- Themes über `data-theme="light|dark"` an `<html>`. System-Präferenz wird zu Light/Dark
  aufgelöst (`src/lib/theme`).
- **Flackerfrei:** Inline-Boot-Skript in `index.html` setzt `data-theme` vor dem Mount; der
  `ThemeController` hält es synchron (inkl. `prefers-color-scheme`-Änderungen).
- Persistenz: `localStorage` (`vitala.theme`) + serverseitig `user_preferences.theme`.
- Dark Mode setzt stärker auf Border-Kontrast statt Schatten; Kontraste in beiden Modi AA.

## Typografie

- **System-Font-Stack** (`--font-family-base`), kein externer Font-Request (ADR-0014).
- Skala 0,75–2,25 rem; Body-Line-Height 1,5, Headlines 1,2; Gewichte 400/500/600.
- `.numeric` für tabellarische Ziffern (spätere Kennzahlen).

## Komponentenbibliothek (`src/ui/`)

Button, IconButton, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, FormField
(Label/Description/Error), Card/Section, Badge, Chip, Avatar (Initialen), Divider, Alert,
EmptyState, Spinner (Loading), Skeleton, Dialog, Drawer/Sheet, DropdownMenu, Toast,
VisuallyHidden, SkipLink, Icon (eigenes SVG-Set).

Jede Komponente: klare Props + TypeScript-Typen, zugängliche Zustände (Focus/Disabled/Loading/
Error), Light-/Dark-Support, Reduced-Motion-Verträglichkeit. Native HTML-Elemente zuerst.

## Reduced Motion

- Global respektiert (`@media (prefers-reduced-motion: reduce)`) **und** manuell
  (`data-reduced-motion="true"` an `<html>`, aus `user_preferences.reduced_motion`).
- Animationen (Spinner, Skeleton, Dialog/Drawer, Toast) haben statische Entsprechungen.

## Responsive

Mobile-first. Breakpoints 375/768/1024/1440. Bottom-Navigation (mobil) ↔ Sidebar (Desktop);
Safe-Area-Insets; keine erzwungenen horizontalen Scrolls bei normalem Inhalt. Geprüft bei
320/375/768/1024/1440 px Breite.

## Phase 6 – Stadtansicht

Die Stadtansicht führt keine neuen Primitives ein, sondern komponiert das bestehende
Designsystem (Card, Section, Badge, Button/IconButton, Dialog, Drawer, Alert, ProgressBar).
Neu sind **kartenspezifische Themen-Tokens** in `src/features/city/city.module.css`:
`--region-fill`, `--region-fill-hover`, `--region-stroke`, `--region-ink`,
`--region-ink-soft` je Bereichsthema sowie `--map-sky`, `--map-slot*`, `--map-locked*` für
die Kartenfläche. Sie sind für Light **und** Dark getrennt definiert (keine naive
Invertierung, gedämpfte Abendstimmung statt Nacht-Simulation).

Status wird nie allein über Farbe transportiert: gesperrte Bereiche tragen zusätzlich einen
gestrichelten Rand und ein Schloss-Label, Slots ein Statustext-Badge. Fokusrahmen nutzen
`--color-focus` und sind auf beiden Themes sichtbar. Details:
[city-visual-language.md](./city-visual-language.md).
