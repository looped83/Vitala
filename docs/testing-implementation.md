# Tests – Umsetzung

Umsetzung von [testing-strategy.md](./testing-strategy.md). Werkzeuge: Vitest + React Testing
Library, `vitest-axe` / `@axe-core/playwright`, Playwright, pgTAP.

## Ebenen

### Unit (Domain & Lib, framework-frei)

`src/**/*.test.ts` — u. a.:

- Environment-Validierung (`lib/config/env`).
- Fehlernormalisierung (`lib/errors`, `data/supabase/errors`).
- Theme-Auflösung (`lib/theme`).
- Redirect-Validierung (`lib/navigation/redirect`).
- Rollen-/Status-Helfer (`domain/household/roles`).
- Profil-/Household-Schemas (`domain/**/schemas`).
- Onboarding-Ableitung (`domain/onboarding/state`).
- Initialen-Ableitung (`ui/Avatar`).

### Komponenten / Integration

`src/**/*.test.tsx` — Button (Loading/Disabled/Klick), FormField (aria-Wiring/Fehler), Dialog
(Fokus/Escape), Login-Formular (Validierung, Submit an Repository, Fehleranzeige) via
`renderWithProviders` (Query + Router + Toast). Externe Grenzen (Supabase-Repos) werden
gemockt.

### Accessibility

`src/test/a11y.test.tsx` — axe-Prüfung zentraler Bausteine + Login-Seite (keine Verstöße);
zusätzlich axe im E2E-Smoke.

### E2E-Smoke (Playwright)

`e2e/smoke.spec.ts` (Chromium + Mobile) — backend-unabhängige Kernpfade: geschützte Route ohne
Login → Redirect, Root-Redirect, Login-Rendern + axe, Formularvalidierung, 404-Seite,
Tastatur-Erreichbarkeit des Reset-Links. Der Dev-/Preview-Server wird von Playwright gestartet.

### Datenbank / RLS (pgTAP)

`supabase/tests/rls.test.sql`, ausgeführt mit `supabase test db`. Deckt die Fälle aus
[row-level-security.md](./row-level-security.md) ab (Isolation, 2-Personen-Grenze,
Rollenrechte, Deaktivierung, Kaskaden). Die Logik wurde zusätzlich gegen ein reines PostgreSQL
per SQL-Assertions verifiziert.

## Seeds / Testdaten

`supabase/seed.sql` (nur lokal/Test, `@vitala.test`-Adressen, `NOTICE`-Guard):

- Household A: Owner (`lutz`) + Member (`rene`) – vollständig eingerichtet.
- Household B: Owner (`mara`) + **deaktiviertes** Mitglied (`theo`) – für Isolations-/
  Deaktivierungstests.

Seeds überschreiben keine produktiven Daten und laufen nicht in Produktion.

## Ausführung

```bash
npm run test           # Unit + Komponenten + a11y
npm run test:coverage  # + Coverage (Domain/Lib/Data)
npm run test:e2e       # Playwright-Smoke + axe
npm run test:rls       # supabase test db (pgTAP)
npm run check          # format + lint + typecheck + test + build
```

In dieser Umgebung ohne vorinstallierten Playwright-Browser:
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=<pfad-zu-chrome> npm run test:e2e`.
