# Umgebungsvariablen

Alle Frontend-Variablen tragen das Vite-Präfix `VITE_` und werden beim App-Start **validiert**
(`src/lib/config/env.ts`, Zod). Fehlt/ist eine Variable ungültig, bricht der Start mit einer
verständlichen Meldung ab. Die einzige Vorlage ist [`.env.example`](../.env.example).

## Zulässige Variablen

| Variable                 | Pflicht | Default       | Beschreibung                                                            |
| ------------------------ | :-----: | ------------- | ----------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      |   ja    | –             | Öffentliche Supabase-Projekt-URL (bzw. `http://127.0.0.1:54321` lokal). |
| `VITE_SUPABASE_ANON_KEY` |   ja    | –             | Öffentlicher **anon**-Key (JWT). Unterliegt RLS – **kein Geheimnis**.   |
| `VITE_APP_ENV`           |  nein   | `development` | `development` \| `test` \| `production`.                                |
| `VITE_APP_BASE_PATH`     |  nein   | `/`           | Basis-Pfad (Router-Basename, PWA-Scope).                                |
| `VITE_LOG_LEVEL`         |  nein   | `info`        | `debug` \| `info` \| `warn` \| `error`.                                 |

## Sicherheitsregeln

- **Nur der anon-Key** gehört ins Frontend. Der **Service-Role-Key darf niemals** in `.env`
  (VITE_-Präfix) oder in den Browser gelangen (security §30).
- `.env`-Dateien sind in `.gitignore` (außer `.env.example`). **Keine Secrets committen.**
- Produktive URLs werden nicht fest codiert, sondern über die Umgebung gesetzt.

## Einrichtung je Umgebung

- **Lokal:** `cp .env.example .env`, Werte aus `supabase status` eintragen (siehe
  [local-development.md](./local-development.md)).
- **Test (Vitest):** feste, nicht-geheime Werte über `test.env` in `vite.config.ts`.
- **E2E (Playwright):** feste, nicht-geheime Werte über `webServer.env` in
  `playwright.config.ts`.
- **CI:** nicht-geheime Platzhalter als Job-`env` in `.github/workflows/ci.yml`.
- **Deployment:** echte Projekt-URL + anon-Key als Build-Umgebungsvariablen des Hosters
  setzen; siehe [deployment-security.md](./deployment-security.md).
