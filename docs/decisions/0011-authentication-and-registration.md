# ADR-0011: Authentifizierung & Registrierung – Invite-basiert, Self-Signup deaktiviert

**Status:** Akzeptiert · **Bezug:** [security-and-privacy.md](../security-and-privacy.md) §17, [authentication.md](../authentication.md)

## Kontext

Vitala ist eine private App für genau zwei Personen. Es darf **keine öffentliche
Registrierung** geben. Phase 1 (§17.1) nennt Supabase Auth (E-Mail + Passwort) und
einen Einladungsmechanismus für das zweite Household-Mitglied.

## Entscheidung

- **Supabase Auth** mit E-Mail + Passwort; **öffentliches Self-Signup deaktiviert**
  (`auth.enable_signup = false`).
- **Auth-Accounts** werden administrativ bereitgestellt (Supabase-Dashboard „Invite user"
  bzw. Seed für lokale Umgebungen). Die App selbst bietet keine Registrierungsseite.
- **Household-Beitritt** erfolgt app-intern über einen **Einladungscode** (RPC
  `accept_household_invite`): Der Owner erzeugt via `create_household_invite` einen
  einmaligen, gehashten, 7 Tage gültigen Code; die bereits provisionierte zweite Person
  löst ihn beim Onboarding ein.
- **Login** (E-Mail/Passwort), **Logout**, **Session-Wiederherstellung**,
  **Passwort-Reset** (E-Mail-Link → `/auth/update-password`) sind implementiert.
- **Sichere Redirects:** Rücksprungziele nach Login werden auf same-origin Pfade
  begrenzt (kein Open Redirect).

## Alternativen

- **Offene Registrierung + späteres Sperren:** Risiko, dass das Sperren vergessen wird;
  unnötige Angriffsfläche.
- **Fest verdrahtete zwei Accounts ohne Auth-Provider:** unsicher, keine Session-/Passwort-
  Verwaltung.

## Konsequenzen

- **Positiv:** keine ungewollten Accounts, klarer Onboarding-Pfad, minimale Angriffsfläche.
- **Negativ/Abwägung:** Account-Erstellung ist ein administrativer Schritt (Dashboard/Seed);
  für zwei Personen akzeptabel und dokumentiert.
