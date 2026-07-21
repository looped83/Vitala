# Vitala

Vitala ist eine **private, kooperative Gamification-App für genau zwei Personen** (Lutz &
René). Sie verbindet Bewegung, gesunde vegane Ernährung, Nachhaltigkeit sowie Tierwohl &
Biodiversität mit täglichen Ritualen, gemeinsamen Zielen und dem Aufbau einer nachhaltigen
Stadt.

Ausschließlich private Nutzung: **keine** öffentliche Community, Registrierung, Ranglisten,
Werbung/Tracking, Social-Media-Funktionen.

## Status

- **Phase 1 – Konzept & Dokumentation:** abgeschlossen (`docs/`).
- **Phase 2 – Technische & visuelle Projektgrundlage:** in diesem Stand umgesetzt
  (Projektstruktur, Supabase-Anbindung, Auth, Household/Profile, RLS, geschützte Routen,
  App-Shell, Designsystem, Light/Dark, Accessibility-Grundlage, Fehler-/Logging-Grundlage,
  PWA-Basis, CI, Tests).
- **Phase 3 – Aktivitäten, Ernährung, Nachhaltigkeit & Tierwohl:** in diesem Stand umgesetzt.
  Die App ist erstmals fachlich produktiv nutzbar: manuelle Erfassung der vier Lebensbereiche
  (Bewegung, Ernährung, Nachhaltigkeit, Tierwohl), gemeinsame Einträge, Favoriten/Schnell-
  aktionen, gemeinsame Historie mit Suche, Filter, Bearbeiten und Löschen — abgesichert durch
  RLS und atomare SECURITY-DEFINER-RPCs. **Noch keine** Punkte/XP/Ressourcen/Stadtlogik
  (folgt in Phase 5). Einstieg: [`docs/activity-domain.md`](./docs/activity-domain.md).
  Weiterhin bewusste, klar gekennzeichnete Platzhalter für noch nicht begonnene Bereiche
  (keine Fake-Daten).

## Tech-Stack

React 18 · TypeScript (strict) · Vite · Supabase (PostgreSQL, Auth, RLS, RPC) · TanStack Query ·
React Router · React Hook Form + Zod · Zustand (minimal, UI-State) · Vitest + React Testing
Library · Playwright · axe-core · vite-plugin-pwa. Eigenes, schlankes Designsystem (`src/ui`),
System-Fonts, keine externen Requests.

## Schnellstart

```bash
npm install
cp .env.example .env

# lokale Supabase-Instanz (Docker) – wendet Migrationen + Seed an:
supabase start
# VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aus `supabase status` in .env eintragen

npm run dev            # http://127.0.0.1:5173
```

Details: [docs/local-development.md](./docs/local-development.md) ·
[docs/environment-variables.md](./docs/environment-variables.md).

## Scripts

| Script                                           | Zweck                                      |
| ------------------------------------------------ | ------------------------------------------ |
| `dev` / `build` / `preview`                      | Entwicklung / Produktions-Build / Vorschau |
| `typecheck` / `lint` / `format` / `format:check` | Qualität                                   |
| `test` / `test:watch` / `test:coverage`          | Unit-, Komponenten-, A11y-Tests            |
| `test:e2e`                                       | Playwright-Smoke + axe                     |
| `test:rls`                                       | RLS-/Policy-Tests (`supabase test db`)     |
| `db:reset` / `db:types`                          | DB neu aufsetzen / Typen generieren        |
| `check`                                          | Alle lokalen Qualitätsprüfungen            |

## Projektstruktur (Kurz)

`src/app` (Shell, Router, Provider) · `src/features` (Auth, Onboarding, Household, Profile,
Settings, Platzhalterseiten) · `src/domain` (framework-freie Logik + Zod) · `src/data`
(Supabase-Client, Repositories, Query Keys) · `src/ui` (Designsystem-Primitive) · `src/lib`
(env, errors, logging, theme, navigation, dates) · `supabase/` (Migrationen, Seed, RLS-Tests).

Vollständig: [docs/codebase-structure.md](./docs/codebase-structure.md).

## Dokumentation

Konzept (Phase 1) und Umsetzung (Phase 2) liegen unter [`docs/`](./docs), Entscheidungen als
ADRs unter [`docs/decisions/`](./docs/decisions). Einstieg:
[Auth](./docs/authentication.md) · [Household-Modell](./docs/household-model.md) ·
[Datenbank & Migrationen](./docs/database-and-migrations.md) ·
[Row Level Security](./docs/row-level-security.md) ·
[Designsystem](./docs/design-system-implementation.md) ·
[Accessibility](./docs/accessibility-implementation.md) ·
[PWA](./docs/pwa-strategy.md) · [Tests](./docs/testing-implementation.md) ·
[CI](./docs/ci.md) · [Deployment-Sicherheit](./docs/deployment-security.md) ·
[Deployment (GitHub Pages)](./docs/deployment-github-pages.md) ·
[Datenschutz-Datenbestand](./docs/privacy-data-inventory.md).

## Lizenz

Siehe [LICENSE](./LICENSE). Private Nutzung.
