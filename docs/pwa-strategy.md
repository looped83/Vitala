# PWA-Strategie

Nur die **technische PWA-Basis** in Phase 2. Details/Begründung:
[ADR-0015](./decisions/0015-pwa-caching.md), [ADR-0008](./decisions/0008-offline-strategy.md).

## Bestandteile

- **Web App Manifest** (via `vite-plugin-pwa`): Name „Vitala", Kurzname, Beschreibung,
  `theme_color` `#2F6F4E`, `background_color` `#F7F5F0`, `display: standalone`, Icons
  (192/512 + maskable, self-hosted SVG).
- **Service Worker** (Workbox `generateSW`), registriert über `src/app/pwa/registerServiceWorker.ts`
  – **nur in Produktion** aktiv.
- **Offline-Fallback:** `public/offline.html` (statisch, theme-aware).

## Was gecacht wird

- **Precache:** statische App-Shell-Assets – `js`, `css`, `html`, `svg`, `woff2`,
  `webmanifest`.
- **Runtime-Cache:** ausschließlich lokale Fonts (`woff2`, CacheFirst). Aktuell nutzt die App
  System-Fonts, sodass i. d. R. nichts extern nachgeladen wird.

## Was NICHT gecacht wird

- **Keine** Supabase-/Auth-Antworten, **keine** Nutzer- oder Household-Daten im
  Service-Worker-Cache.
- `navigateFallback` besitzt eine **Denylist** für `/auth*` und `supabase`.
- Der Offline-**Read-Cache für Daten** ist Sache von TanStack Query (ADR-0008), nicht des SW —
  so landen private Antworten nie im öffentlichen Cache.

## Update-Verhalten

- Strategie **`prompt`** (kein stilles `skipWaiting`): eine neue Version übernimmt nicht
  unbemerkt, sondern beim nächsten kontrollierten Reload. Registrierung prüft höchstens
  stündlich auf Updates (kein aggressives Polling).
- Dadurch werden **keine veralteten Auth-Seiten** dauerhaft ausgeliefert und Updates nicht
  blockiert.

## Noch nicht enthalten (spätere Phasen)

Offline-Datenerfassung (Outbox, ADR-0008), Hintergrundsynchronisation, Push-Benachrichtigungen,
aggressive Cache-Strategien.
