# Codebase-Struktur

Feature-orientierte, geschichtete Struktur gemäß [technical-architecture.md](./technical-architecture.md)
§15.1. Der Domain Layer ist **framework-frei** (kein React, kein Supabase); Supabase-Zugriffe
sind zentralisiert; UI-Primitive sind fachlich neutral.

## Verzeichnisbaum

```
src/
├── app/                     # App-Shell, Router, Provider, globaler Zustand
│   ├── App.tsx              # Provider-Wurzel (Query, Auth, Theme, Toast, Router)
│   ├── main? (src/main.tsx) # Einstiegspunkt
│   ├── providers/           # AuthProvider, ThemeController, queryClient
│   ├── router/              # AppRouter, guards, routes (Pfade + Nav-Config)
│   ├── layout/              # AppLayout, Header, Sidebar, BottomNav, Page
│   ├── error-boundary/      # AppErrorBoundary, ErrorFallback
│   ├── stores/              # Zustand-UI-Store (Theme, mobile Nav)
│   ├── hooks/               # app-weite Hooks (useDocumentTitle)
│   └── pwa/                 # Service-Worker-Registrierung
├── features/                # fachliche Bereiche mit eigener öffentlicher Schnittstelle
│   ├── auth/                # Login, Reset, Update-Password, AuthLayout
│   ├── onboarding/          # Wizard + Schritte (Profil/Household/Einladung)
│   ├── household/           # Queries, MembersList, InvitePanel
│   ├── profile/             # ProfilePage, Query-Hooks
│   ├── settings/            # SettingsPage, Theme/Reduced-Motion, PreferencesSync
│   ├── today/ city/ capture/ goals/ review/  # Platzhalterseiten (spätere Phasen)
│   ├── placeholders/        # PlaceholderView (klar gekennzeichnet, keine Fake-Daten)
│   └── system/              # NotFound, Forbidden
├── domain/                  # reine TS-Logik + Zod-Schemas (framework-frei)
│   ├── auth/ profile/ household/ settings/ onboarding/
├── data/                    # Datenzugriff
│   ├── supabase/            # client, database.types, errors
│   ├── repositories/        # auth, profile, household (normalisieren Fehler)
│   └── queryKeys.ts         # zentrale, hierarchische Query-Key-Factory
├── ui/                      # Designsystem-Primitive (fachlich neutral)
│   ├── Button/ Form/ Card/ Dialog/ Drawer/ Alert/ …
│   ├── tokens.ts            # typed CSS-Variablen-Referenzen
│   └── a11y/                # SkipLink, VisuallyHidden
├── lib/                     # Utilities
│   ├── config/ (env)  errors/  logging/  theme/  navigation/  dates/
├── styles/                  # tokens.css, global.css
└── test/                    # Test-Setup, Render-Helper, a11y-Tests
```

## Schichtregeln (durch ESLint erzwungen)

- `src/domain/**` darf **nicht** aus `react`, `@supabase/supabase-js`, `@/data`, `@/ui`,
  `@/app`, `@/features` importieren (Regel `no-restricted-imports` in `eslint.config.js`).
- UI-Komponenten (`src/ui`) enthalten **keine** Datenbankzugriffe – sie sind reine
  Darstellung + Interaktion.
- Feature-Code kapselt Datenzugriffe in `features/**/queries.ts` (TanStack Query) und nutzt
  Repositories aus `src/data`.
- Query Keys werden **ausschließlich** über `src/data/queryKeys.ts` gebildet.
- Formvalidierung liegt in `src/domain/**` (Zod), nicht in Komponenten.

## Namens- und Importkonventionen

- Alias `@/*` → `src/*` (siehe `tsconfig.app.json`, `vite.config.ts`).
- Typ-Importe nutzen `import type` (erzwungen: `consistent-type-imports`,
  `verbatimModuleSyntax`).
- CSS-Modules co-lokalisiert je Komponente (`Component.module.css`).
- Keine Barrel-Files, die Abhängigkeiten verschleiern – Importe sind explizit und
  tree-shake-freundlich.
