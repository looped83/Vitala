# Datenschutz – Datenbestand (Phase 2)

Interne Übersicht der in dieser Phase verarbeiteten Daten. Grundhaltung: Datenminimierung,
Household-Isolation, keine externen Tracker (security-and-privacy §18).

## Gespeicherte Daten dieser Phase

| Daten                                                   | Ort                                        | Zweck                       | Zugriff                                            |
| ------------------------------------------------------- | ------------------------------------------ | --------------------------- | -------------------------------------------------- |
| E-Mail, Passwort-Hash, Session                          | Supabase `auth.users` (verwaltet)          | Anmeldung                   | nur der Nutzer / Auth-System                       |
| Anzeigename, Akzentfarbe, Motiv                         | `public.profiles`                          | Darstellung im Household    | Nutzer + zweites aktives Household-Mitglied (RLS)  |
| Theme, Reduced Motion, Sprache, Notification-Opt-in     | `public.user_preferences`                  | persönliche Einstellungen   | nur der Nutzer (RLS)                               |
| Household-Name, Zeitzone, Wochenbeginn, Defaults        | `public.households` / `household_settings` | gemeinsamer Kontext         | Household-Mitglieder (RLS)                         |
| Mitgliedschaft (Rolle, Status)                          | `public.household_members`                 | Zugehörigkeit/Rollen        | Household-Mitglieder (RLS), Schreiben nur via RPC  |
| Einladungscode (**gehasht**), Ablauf                    | `public.household_invites`                 | Beitritt der zweiten Person | Household-Mitglieder (nur Hash), Klartext einmalig |
| Audit-Einträge (Household-/Rollen-/Mitgliedsänderungen) | `public.audit_log`                         | Nachvollziehbarkeit         | Household-Mitglieder (RLS)                         |

**Nicht** gespeichert: Gesundheits-, Bewegungs-, Ernährungs- oder Verhaltensdaten (folgen in
späteren Phasen und dann datensparsam). Keine Kalorien/Mengen/Gewicht/Geodaten (security §18.8).

## Logging

`src/lib/logging` – nur technische, personenfreie Kurzmeldungen. In Produktion nur `warn`/`error`.
**Nie** protokolliert: Auth-Tokens, E-Mail-Adressen, vollständige Nutzerobjekte, Formulardaten.
Kein externes Tracking/Telemetrie-SDK, keine Analytics, kein Session-Replay.

## Zugriff, Export, Löschung

- **Zugriff:** ausschließlich RLS-gescoped auf das eigene Household/Profil.
- **Export/Löschung (DSGVO):** Konzept in security-and-privacy §18.7 (kaskadierende
  Hard-Deletes bei Account-/Household-Löschung; JSON-Export). Vollständige UI/RPC dafür folgt in
  einer späteren Phase; die Datenstruktur (Kaskaden, Soft/Hard-Delete) ist darauf vorbereitet.

## Risiken (Phase 2) & Gegenmaßnahmen

- **Fremdzugriff auf Household-Daten** → RLS auf allen Tabellen, serverseitige
  Mitgliedschaftsprüfung (getestet).
- **Rollen-/Mitgliedschaftsmanipulation** → kein Client-Schreibpfad; nur `SECURITY DEFINER`-RPCs.
- **Drittes Mitglied** → DB-Trigger + Unique-Index + RPC-Prüfung.
- **Leak über Cache** → Query-Cache wird bei Logout geleert; SW cached keine privaten Antworten.
- **Externe Requests** → System-Fonts, keine CDNs/Tracker; CSP für Deployment dokumentiert.
