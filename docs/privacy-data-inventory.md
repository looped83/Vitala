# Datenschutz – Datenbestand (Phase 2 + 3)

Interne Übersicht der verarbeiteten Daten. Grundhaltung: Datenminimierung,
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

## Zusätzliche Daten in Phase 3 (Aktivitätserfassung)

| Daten                                                           | Ort                                       | Zweck                          | Zugriff                               |
| --------------------------------------------------------------- | ----------------------------------------- | ------------------------------ | ------------------------------------- |
| Bewegungseinträge (Typ, Datum, Uhrzeit, Dauer, Intensität, Ort) | `public.activities`                       | persönliche Aktivitätshistorie | aktive Household-Mitglieder (RLS)     |
| Ernährungs-/Nachhaltigkeits-/Tierwohl-Handlungen                | `public.ritual_entries`                   | Handlungshistorie              | aktive Household-Mitglieder (RLS)     |
| Teilnehmerbezug gemeinsamer Einträge                            | `public.entry_participants`               | Zuordnung zu beiden Personen   | aktive Household-Mitglieder (RLS)     |
| Optionale **Notiz** (privater Freitext, ≤ 500 Zeichen)          | `activities.note` / `ritual_entries.note` | persönliche Erinnerung         | aktive Household-Mitglieder (RLS)     |
| Favoriten/Schnellaktionen (Vorlagen)                            | `public.entry_favorites`                  | schnelle Erfassung             | geteilt oder nur eigener Nutzer (RLS) |
| Katalog (Typen/Bausteine)                                       | `activity_types`/`ritual_definitions`     | Referenzdaten (keine PII)      | global lesbar                         |
| Erfassungs-/Löschprotokoll (ohne Notizinhalt)                   | `public.audit_log`                        | Nachvollziehbarkeit            | Household-Mitglieder (RLS)            |

**Notizen** sind private Verhaltensdaten: nie in Logs, nie in Fehlermeldungen, nie in
Analytics, nie an externe Dienste; keine HTML-/Rich-Text-Eingabe, sichere Textausgabe. Der
`audit_log`-`meta` enthält nur aggregierten Kontext (`area`, `is_shared`, Anzahl), **keinen**
Notiztext.

**Löschregeln:** Soft Delete (`deleted_at`) blendet Einträge aus und ermöglicht spätere
Korrektur; Hard Delete kaskadiert bei Household-/Account-Löschung
([ADR-0021](./decisions/0021-soft-delete-entries.md)). **Exportbedarf:** Aktivitäts-,
Ernährungs-, Nachhaltigkeits- und Tierwohldaten inkl. Teilnehmerbezug und Notizen gehören in
den späteren DSGVO-JSON-Export (security §18.7).

**Nicht** gespeichert: Kalorien, Mengen/Gramm, Makronährstoffe, Körpergewicht, Herzfrequenz,
GPS-Routen/Geodaten, Gesundheitsdiagnosen, Fotos, externe Tracking-IDs (security §18.8,
Aufgabe §34). Keine CO₂-/Umweltzahlen (keine erfundene Exaktheit).

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
