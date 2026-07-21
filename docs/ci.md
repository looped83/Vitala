# Continuous Integration

Workflow: `.github/workflows/ci.yml`, ausgelöst bei Push auf `main` und bei Pull Requests.
Nicht-geheime Platzhalter-Env auf Job-Ebene; **kein Zugriff auf produktive Secrets**.

## Jobs

### `quality` – Lint · Typecheck · Unit · Build

1. `npm ci`
2. `npm run format:check` (Prettier)
3. `npm run lint` (ESLint)
4. `npm run typecheck` (TypeScript strict)
5. `npm run test:coverage` (Unit + Komponenten + a11y)
6. `npm run build` (Produktions-Build)
7. Artefakt `dist` hochladen.

### `database` – RLS · Migrationen (pgTAP)

1. `supabase/setup-cli`
2. `supabase start` (Docker; wendet Migrationen + Seed an)
3. `supabase test db` (pgTAP-Tests aus `supabase/tests/`)
4. `supabase stop` (immer).

### `e2e` – E2E-Smoke · Accessibility

1. `npm ci`
2. `npx playwright install --with-deps chromium`
3. `npm run test:e2e -- --project=chromium` (baut + startet Preview, Playwright + axe)
4. Playwright-Report als Artefakt.

## Grundsätze

- **Reproduzierbar:** `npm ci`, gepinnte Node-Version, npm-Cache.
- **Keine stillen Fehler:** jeder Schritt bricht bei Fehler ab; Warnungen werden nicht pauschal
  unterdrückt.
- **Keine Redundanz:** Build-Artefakt wird geteilt; Jobs sind klar getrennt.
- **Keine produktiven Secrets** in CI – die App spricht dort kein echtes Backend an.
