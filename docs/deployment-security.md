# Deployment-Sicherheit

Sicherheitsanforderungen für das spätere Deployment (security-and-privacy §30). Die App ist
ein statisches SPA-Bundle + Supabase-Backend.

## Secrets & Keys

- Nur `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` gelangen ins Bundle. Der
  **Service-Role-Key darf nie** ins Frontend/Repo.
- Keine Secrets in Logs, keine Tokens in URLs (Auth-Callbacks nutzen Supabase-Defaults).

## Empfohlene HTTP-Header (Hoster/Edge)

| Header                      | Wert (Richtwert)                                                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`   | `default-src 'self'; connect-src 'self' https://<projekt>.supabase.co wss://<projekt>.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                                                                                                                                                                                                              |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                                                                                                                   |
| `Referrer-Policy`           | `no-referrer`                                                                                                                                                                                                                                               |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), interest-cohort=()`                                                                                                                                                                                              |
| `X-Frame-Options`           | `DENY` (bzw. `frame-ancestors 'none'` via CSP)                                                                                                                                                                                                              |

Hinweise:

- `connect-src` muss die konkrete Supabase-Projekt-Domain (HTTPS **und** WSS für Realtime)
  enthalten.
- `style-src 'unsafe-inline'` ist nötig, solange Komponenten inline-`style`-Attribute nutzen;
  perspektivisch reduzierbar. Das flackerfreie Theme-Boot-Skript ist inline — bei strenger CSP
  per Nonce/Hash erlauben.
- HTTPS erzwingen; sichere Cookies/Token-Handling gemäß Supabase-Defaults.

## Supabase-seitig

- **RLS auf allen Tabellen aktiv** (siehe [row-level-security.md](./row-level-security.md)).
- Öffentliches Signup deaktiviert; nur `public` als API-Schema exponiert (`app` privat).
- Redirect-URLs (Auth) auf die echte App-Domain beschränken.
- Kritische Schreibpfade nur über `SECURITY DEFINER`-RPCs mit minimalen Rechten und fixem
  `search_path`.

## Service Worker

Keine privaten API-Antworten cachen; Update-Strategie `prompt` (siehe
[pwa-strategy.md](./pwa-strategy.md)).
