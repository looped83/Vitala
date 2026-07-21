# ADR-0015: PWA-Caching – App-Shell precache, keine privaten API-Antworten

**Status:** Akzeptiert · **Bezug:** [pwa-strategy.md](../pwa-strategy.md), [ADR-0008](./0008-offline-strategy.md)

## Kontext

Phase 2 richtet nur die **technische PWA-Basis** ein (Manifest, Service Worker,
Offline-Fallback). Der Service Worker darf **keine** privaten Daten oder veralteten
Auth-Seiten ausliefern (security §28).

## Entscheidung

- **Vite PWA Plugin / Workbox** mit `generateSW`.
- **Precache** nur statischer App-Shell-Assets (`js`, `css`, `html`, `svg`, `woff2`,
  `webmanifest`). **Kein** Runtime-Caching von Supabase-/Auth-Antworten.
- `navigateFallback` auf die App-Shell, mit **Denylist** für `/auth*` und `supabase`.
- **Update-Strategie `prompt`** (kein stilles `skipWaiting`): Updates greifen beim nächsten
  kontrollierten Reload; keine veralteten Auth-Seiten.
- Service Worker ist **nur in Produktion** aktiv (dev/test cachen nichts).
- Offline-Read-Cache für Daten bleibt Sache von TanStack Query (ADR-0008), **nicht** des
  Service Workers – so landen private Antworten nie im öffentlichen Cache.

## Alternativen

- **Aggressives Runtime-Caching der API:** Risiko, private/household-Daten oder Auth-Zustände
  zu cachen – abgelehnt.
- **`autoUpdate` mit skipWaiting:** kann veraltete Shell/Auth-Seiten unkontrolliert ausliefern.

## Konsequenzen

- **Positiv:** installierbar, offline-Fallback, keine privaten Daten im SW-Cache, kontrollierte
  Updates.
- **Negativ/Abwägung:** Voll-Offline-Datenerfassung folgt erst später (ADR-0008); in Phase 2
  bewusst nicht enthalten.
