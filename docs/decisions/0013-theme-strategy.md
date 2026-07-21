# ADR-0013: Theme-Strategie – CSS Custom Properties, `data-theme`, flackerfrei

**Status:** Akzeptiert · **Bezug:** [design-system.md](../design-system.md) §18.5, [design-system-implementation.md](../design-system-implementation.md)

## Kontext

Light/Dark Mode müssen gleichwertig, systemabhängig, nutzerpersistent und **flackerfrei**
beim ersten Laden sein.

## Entscheidung

- Alle Farb-/Schatten-Tokens sind **CSS Custom Properties** in `:root` (Light) und
  `:root[data-theme="dark"]` (Dark). Komponenten verwenden **nur** Tokens, nie feste Werte.
- Die Theme-Wahl (`system` | `light` | `dark`) wird in **`localStorage` (`vitala.theme`)**
  gehalten (flackerfrei) und – wenn angemeldet – in **`user_preferences.theme`** persistiert
  (geräteübergreifend).
- Ein **Inline-Boot-Skript** in `index.html` setzt `data-theme` **vor** dem React-Mount,
  sodass kein Farb-Flash entsteht. Der `ThemeController` hält das Attribut danach synchron
  und reagiert auf `prefers-color-scheme`-Wechsel.
- Die lokale UI-State-Haltung erfolgt über einen **kleinen Zustand-Store** (ADR-0007), nicht
  über TanStack Query (kein Serverdaten-Spiegel).

## Alternativen

- **Nur Klassen-Toggle ohne Boot-Skript:** Farb-Flash beim Laden.
- **Theme in Query-Cache:** vermischt UI-State mit Serverstate (ADR-0007 widerspricht).

## Konsequenzen

- **Positiv:** flackerfrei, konsistent, leicht anpassbar (Balancing), AA-Kontraste in beiden
  Modi.
- **Negativ/Abwägung:** Der `localStorage`-Schlüssel muss mit dem Boot-Skript synchron
  bleiben – als Konstante (`THEME_STORAGE_KEY`) dokumentiert.
