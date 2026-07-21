# Lokale Entwicklung

## Voraussetzungen

- **Node.js ≥ 20** und npm.
- **Docker** (nur für die lokale Supabase-Instanz / RLS-Tests).
- **Supabase CLI** (`npm i -g supabase` oder via `npx supabase`).

## Erststart

```bash
npm install
cp .env.example .env          # Werte s. u.

# Lokale Supabase-Instanz starten (Postgres, Auth, Studio):
supabase start                # gibt URL + anon key aus

# .env füllen:
#   VITE_SUPABASE_URL=http://127.0.0.1:54321
#   VITE_SUPABASE_ANON_KEY=<anon key aus `supabase status`>

npm run dev                   # http://127.0.0.1:5173
```

`supabase start` wendet die Migrationen aus `supabase/migrations/` an und lädt
`supabase/seed.sql` (Testnutzer + Households, siehe [testing-implementation.md](./testing-implementation.md)).

## Testnutzer (nur lokal)

| E-Mail             | Passwort         | Rolle / Household   |
| ------------------ | ---------------- | ------------------- |
| `lutz@vitala.test` | `vitala-test-pw` | Owner, Household A  |
| `rene@vitala.test` | `vitala-test-pw` | Member, Household A |
| `mara@vitala.test` | `vitala-test-pw` | Owner, Household B  |

Da öffentliches Self-Signup deaktiviert ist ([ADR-0011](./decisions/0011-authentication-and-registration.md)),
werden Accounts per Seed (lokal) bzw. Supabase-Dashboard (Deployment) angelegt.

## Nützliche Scripts

| Script                                  | Zweck                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                           | Vite-Dev-Server (HMR).                                                  |
| `npm run build`                         | Typecheck + Produktions-Build.                                          |
| `npm run preview`                       | Produktions-Build lokal ausliefern.                                     |
| `npm run typecheck`                     | TypeScript (strict) prüfen.                                             |
| `npm run lint`                          | ESLint.                                                                 |
| `npm run format` / `:check`             | Prettier schreiben / prüfen.                                            |
| `npm run test` / `:watch` / `:coverage` | Unit-/Komponenten-/A11y-Tests (Vitest).                                 |
| `npm run test:e2e`                      | Playwright-Smoke + Axe.                                                 |
| `npm run test:rls`                      | RLS-/Policy-Tests (`supabase test db`, pgTAP).                          |
| `npm run db:reset`                      | DB neu aufsetzen (Migrationen + Seed).                                  |
| `npm run db:types`                      | DB-Typen neu generieren (`database.types.ts`).                          |
| `npm run check`                         | Alle lokalen Qualitätsprüfungen (format, lint, typecheck, test, build). |

## Datenbanktypen aktualisieren

Nach Schemaänderungen:

```bash
npm run db:types      # supabase gen types typescript --local > src/data/supabase/database.types.ts
```

Die eingecheckte `database.types.ts` spiegelt die Migrationen, sodass die App auch ohne
laufende DB vollständig typisiert baut.
