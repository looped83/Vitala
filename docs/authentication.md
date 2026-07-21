# Authentifizierung

Umsetzung des Auth-Konzepts aus [security-and-privacy.md](./security-and-privacy.md) §17 und
[ADR-0011](./decisions/0011-authentication-and-registration.md).

## Überblick

- **Provider:** Supabase Auth (E-Mail + Passwort, PKCE-Flow).
- **Öffentliches Self-Signup: deaktiviert** (`auth.enable_signup = false`). Accounts werden
  administrativ (Dashboard „Invite user") bzw. per Seed (lokal) angelegt.
- **Session:** persistiert (`localStorage`, Key `vitala.auth`), automatische Token-Erneuerung,
  `detectSessionInUrl` für Reset-Flows.

## Flüsse

### Login (`/login`)

- Formular (E-Mail + Passwort), validiert über `loginSchema` (Zod).
- Kein Registrierungslink (privates Produkt).
- Erfolgreicher Login → Weiterleitung auf das **sanitizte** `redirect`-Ziel
  (`sanitizeRedirect`, nur same-origin Pfade → kein Open Redirect).

### Passwort zurücksetzen (`/reset-password` → `/auth/update-password`)

- Nutzer fordert einen Link an; die UI zeigt eine **neutrale Bestätigung** (keine
  Account-Enumeration).
- Der Link stellt eine Recovery-Session her; auf `/auth/update-password` wird das neue Passwort
  gesetzt (`passwordUpdateSchema`).

### Logout

- `signOut()` beendet die Session; der `AuthProvider` **leert den Query-Cache**
  (`queryClient.clear()`), damit keine Daten zwischengespeichert bleiben.

## Session-Beobachtung

`src/app/providers/AuthProvider.tsx` kapselt `supabase.auth.getSession()` +
`onAuthStateChange` und exponiert `status` (`loading | authenticated | unauthenticated`),
`session`, `user`. Während `loading` zeigen Guards einen Ladezustand (kein Flash der
Login-Seite).

## Geschützte Routen (Guards)

`src/app/router/guards.tsx`:

- **`RequireAuth`** – ohne Session → `/login?redirect=<sanitized>`.
- **`PublicOnly`** – angemeldete Nutzer werden von Login/Reset weggeleitet.
- **`RequireOnboarding`** – ohne abgeschlossenes Onboarding → `/onboarding`.
- **`RedirectIfOnboarded`** – hält abgeschlossene Nutzer aus dem Wizard heraus (der optionale
  Einladungsschritt bleibt für allein gebliebene Owner erreichbar).

**Redirect-Schleifen-Schutz:** `/login` und `/onboarding` liegen außerhalb der jeweils
weiterleitenden Guard-Ebene; Rücksprungziele werden immer saniert.

## Onboarding

Idempotenter Wizard (`/onboarding`): Profil → Household (erstellen **oder** per Code beitreten)
→ optionale Einladung. Der aktuelle Schritt wird aus persistierten Daten **abgeleitet**
(`deriveOnboardingState`), sodass ein Reload nie einen zweiten Household erzeugt oder einen
abgeschlossenen Schritt wiederholt. Details: [household-model.md](./household-model.md).
