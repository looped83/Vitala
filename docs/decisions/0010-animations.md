# ADR-0010: Animationen – CSS-first, Framer Motion eng begrenzt, Reduced Motion Pflicht

**Status:** Akzeptiert · **Bezug:** [design-system.md](../design-system.md) §18.6, [accessibility.md](../accessibility.md) §19.8

## Kontext

Animationen sollen Belohnung und Lebendigkeit vermitteln (Vision), ohne Performance,
Green-Code-Ziele oder Accessibility zu verletzen und ohne verspielt/kindlich zu wirken.

## Entscheidung

- **CSS-first:** Standard-Übergänge/Micro-Interaktionen über CSS (`transform`/`opacity`,
  GPU-freundlich). Keine Animationslib für den Normalfall.
- **Framer Motion nur eng begrenzt** und **lazy geladen** für definierte Fälle:
  Belohnungs-Feedback nach Erfassung, Levelaufstieg (persönlich/Stadt), Freischalt-/
  Bau-Moment. Kein flächiger Einsatz.
- **Reduced Motion Pflicht:** `prefers-reduced-motion: reduce` **und** manuelle
  Einstellung deaktivieren nicht-essentielle Animationen; jede Animation hat eine
  **statische Entsprechung**.
- **Grenzen:** ≤ 12 gleichzeitig animierte Elemente (Stadt/Belohnung), 0 bei Reduced
  Motion; keine blinkenden/flackernden Effekte; Saison-/Belebungseffekte abschaltbar.

## Alternativen

- **Framer Motion überall:** unnötige Bundle-Last, Performance-/Green-Code-Risiko.
- **Gar keine Animationsbibliothek:** komplexere Belohnungs-/Übergangschoreografien
  wären mühsam; gezielter, lazy Einsatz ist der bessere Kompromiss.
- **Canvas/WebGL-Effekte:** Overkill, A11y-Probleme.

## Konsequenzen

- **Positiv:** schlankes Bundle, gute Performance, vollständige Reduced-Motion-Konformität,
  erwachsene, ruhige Anmutung.
- **Negativ/Abwägung:** Animationen müssen doppelt gedacht werden (animiert + statisch) →
  als Akzeptanzkriterium (a11y DoD) verankert.
