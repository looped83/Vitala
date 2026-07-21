# Row Level Security (RLS)

RLS ist **kein Nachtrag**: sie wird zusammen mit dem Schema angelegt und getestet. Umsetzung
von [security-and-privacy.md](./security-and-privacy.md) §18.2, [data-model.md](./data-model.md)
§16.10, [ADR-0012](./decisions/0012-rls-helper-functions.md).

## Grundsatz

- RLS ist auf **allen** household-bezogenen Tabellen aktiv – **deny by default** (ohne Policy
  kein Zugriff).
- **Grants** legen fest, welche Statements ein Client-Rolle **versuchen** darf; RLS ist das
  eigentliche Tor. Schreibgeschützte Tabellen (`household_members`, `household_invites`,
  `audit_log`) haben nur `SELECT` – alle Schreibvorgänge laufen über RPCs.
- Policies vertrauen **nie** einer vom Client übergebenen `household_id`; die Mitgliedschaft
  wird serverseitig über `SECURITY DEFINER`-Hilfsfunktionen geprüft.

## Hilfsfunktionen (privates Schema `app`)

`is_active_member`, `is_owner`, `shares_active_household`, `active_member_count` — alle
`SECURITY DEFINER`, `stable`, `set search_path = ''`, Ausführung nur für
`authenticated`/`service_role`. Sie umgehen RLS und verhindern damit **Policy-Rekursion**.

## Policies je Tabelle

| Tabelle              | SELECT                                                                  | INSERT                          | UPDATE           | DELETE  |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------- | ---------------- | ------- |
| `profiles`           | eigenes **oder** gleiches aktives Household (`shares_active_household`) | nur eigenes (`id = auth.uid()`) | nur eigenes      | –       |
| `user_preferences`   | nur eigenes                                                             | nur eigenes                     | nur eigenes      | –       |
| `households`         | aktives Mitglied                                                        | via RPC                         | aktives Mitglied | Owner   |
| `household_settings` | aktives Mitglied                                                        | via RPC                         | aktives Mitglied | –       |
| `household_members`  | aktives Mitglied liest Roster                                           | via RPC                         | via RPC          | via RPC |
| `household_invites`  | aktives Mitglied                                                        | via RPC                         | via RPC          | via RPC |
| `audit_log`          | aktives Mitglied des Households                                         | via RPC                         | –                | –       |

„via RPC" = kein Client-Schreibpfad; Änderungen nur durch `SECURITY DEFINER`-RPCs
(siehe [household-model.md](./household-model.md)).

## Getestete Fälle (`supabase/tests/rls.test.sql`, pgTAP)

- Nutzer liest/aktualisiert **eigenes** Profil.
- Household-Mitglied liest das **andere** Household-Profil.
- Fremder Nutzer kann Profile/Household/Members eines anderen Households **nicht** lesen.
- Member kann **keine** Owner-Rechte vergeben (kein Schreibpfad/Privileg).
- **Drittes aktives Mitglied** wird abgelehnt (Trigger `household_full`).
- Ein Nutzer kann **nicht** in zwei Households aktiv sein (Unique-Index).
- `create_household_invite` auf vollem Household → `household_full`.
- `accept_household_invite` durch bereits zugeordneten Nutzer → `already_in_household`.
- **Deaktiviertes** Mitglied verliert den Zugriff.
- Household-Löschung **kaskadiert** korrekt.

Diese Fälle wurden zusätzlich gegen ein reines PostgreSQL per SQL-Assertions verifiziert
(alle grün), bevor der pgTAP-Lauf in CI greift.

## Phase 4 · Ziele, Rituale & Check-ins

Neue Tabellen (Ziele, Perioden, Rituale, Abschlüsse, Vorlagen) sind für aktive Household-
Mitglieder lesbar; **Check-ins sind strikt privat** (nur die eigene Person,
[ADR-0028](./decisions/0028-check-in-privacy.md)). Schreiben ausschließlich über RPCs. Details:
[goals-and-rituals-rls.md](./goals-and-rituals-rls.md).
