# Deployment auf GitHub Pages (Unterpfad `/Vitala/`)

Die App wird als statisches Bundle unter `https://<user>.github.io/Vitala/` ausgeliefert.
Weil das ein **Unterpfad** ist, muss der Base-Pfad überall konsistent sein. Das ist bereits
verdrahtet; hier die Zusammenfassung und die einmaligen Repo-Einstellungen.

## Was im Code base-pfad-fähig ist

- **Vite `base`** wird aus `VITE_APP_BASE_PATH` gesetzt (`vite.config.ts`). Assets, Manifest,
  Service-Worker-Scope und `navigateFallback` erhalten dadurch den Präfix.
- **Router-Basename** (`src/app/App.tsx`) wird aus `VITE_APP_BASE_PATH` abgeleitet (ohne
  abschließenden Slash, z. B. `/Vitala`).
- **Icon-Links** in `index.html` nutzen `%BASE_URL%`; **Manifest-Icons** sind relativ.
- **Passwort-Reset-Redirect** enthält den Base-Pfad (`absoluteAppUrl(...)`), damit die URL zur
  Supabase-Allow-List passt (`…/Vitala/auth/update-password`).
- **SPA-Fallback:** Der Build kopiert `index.html` → `404.html` (`vitala-spa-404-fallback`
  Plugin), damit Deep-Links/Reloads wie `/Vitala/today` funktionieren.

## Einmalige Repo-Einstellungen

1. **Pages aktivieren:** Repo → **Settings → Pages → Build and deployment → Source: „GitHub
   Actions"**.
2. **Repository-Variablen setzen:** Repo → **Settings → Secrets and variables → Actions →
   Variables** → **New repository variable**:
   - `VITE_SUPABASE_URL` = `https://rjdybkhmaaibjmalkrmb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = euer anon-Key (öffentlich, unterliegt RLS)
   > Der anon-Key ist kein Geheimnis; eine **Variable** (nicht Secret) genügt und ist im
   > Frontend-Bundle ohnehin sichtbar. Der **Service-Role-Key** darf hier **niemals** hin.
3. **Deploy auslösen:** Push auf `main` oder Workflow „Deploy to GitHub Pages" manuell starten
   (`.github/workflows/deploy.yml`). Der Build nutzt fix `VITE_APP_BASE_PATH=/Vitala/`.

## Supabase-Auth-URLs (Dashboard → Authentication → URL Configuration)

- **Site URL:** `https://looped83.github.io/Vitala/`
- **Redirect URLs:** `https://looped83.github.io/Vitala/auth/update-password`
  (für lokales Testen zusätzlich `http://127.0.0.1:5173/auth/update-password`).

## Lokale Vorschau des Unterpfads

```bash
VITE_APP_BASE_PATH=/Vitala/ npm run build
npm run preview   # bedient das Bundle unter /Vitala/
```

## Hinweise / Grenzen

- GitHub Pages kennt keine echten HTTP-Header-Regeln; die CSP/Sicherheits-Header aus
  [deployment-security.md](./deployment-security.md) lassen sich dort nicht setzen. Für strikte
  Header wäre ein Host mit Header-Kontrolle (Netlify/Cloudflare Pages/eigener Server) nötig.
- Bei einem Wechsel auf eine Root-Domain (`/`) einfach `VITE_APP_BASE_PATH=/` bauen und die
  Supabase-URLs anpassen — es sind keine Codeänderungen nötig.
