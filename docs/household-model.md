# Household-Modell

Umsetzung von [ADR-0006](./decisions/0006-household-model.md) und
[data-model.md](./data-model.md) §16.1. Ein Household hat **genau zwei aktive Mitglieder**;
die Grenze ist **serverseitig hart** abgesichert.

## Entitäten (Phase 2)

| Tabelle              | Zweck / wichtige Felder                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `households`         | `id`, `name`, `status`, `max_members` (=2, Check), `created_by`, Zeitstempel.                                   |
| `household_settings` | 1:1; `timezone` (Default `Europe/Berlin`), `week_start`, `theme_default`, `reduced_motion_default`.             |
| `household_members`  | `id`, `household_id`, `user_id`, `role` (`owner`\|`member`), `status` (`active`\|`deactivated`), `joined_at`.   |
| `profiles`           | `id` = `auth.users.id`; `display_name`, `accent_color`, `avatar_motif`. **Keine E-Mail** (nur in `auth.users`). |
| `user_preferences`   | `theme`, `reduced_motion`, `locale` (`de`), `week_start_override`, `notification_opt_in`.                       |
| `household_invites`  | `code_hash` (SHA-256), `expires_at`, `accepted_at/by`. Klartext wird nur einmal von der RPC zurückgegeben.      |
| `audit_log`          | kritische Mutationen (Household-/Rollen-/Mitgliedsänderungen).                                                  |

Feldverortung siehe [ADR-0018](./decisions/0018-identity-field-placement.md).

## Zwei-Personen-Garantie (mehrschichtig)

1. **`households.max_members = 2`** (Check-Constraint).
2. **Trigger `enforce_active_member_limit`** (BEFORE INSERT/UPDATE auf `household_members`):
   verhindert ein drittes **aktives** Mitglied → Exception `household_full`.
3. **Partieller Unique-Index** `household_members_one_active_per_user`: ein Nutzer ist in
   höchstens **einem** Household aktiv.
4. **RPC-Prüfungen** in `create_household_invite` / `accept_household_invite`
   (`active_member_count < 2`).

Deaktivierte Mitgliedschaften bleiben als Historie erhalten (Status-Flag, reversibel).

## Lebenszyklus (nur über RPCs)

Client-Rollen haben **kein** direktes INSERT/UPDATE/DELETE auf `household_members` /
`household_invites`. Alle Änderungen laufen über `SECURITY DEFINER`-RPCs:

| RPC                               | Wer                        | Wirkung                                                                                                                  |
| --------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `create_household(name)`          | jeder Angemeldete          | erstellt Household + Settings + Owner-Mitgliedschaft; **idempotent** (bestehender aktiver Household wird zurückgegeben). |
| `create_household_invite()`       | **Owner**                  | erzeugt einmaligen, gehashten Code (7 Tage gültig); vorherige offene Einladungen werden entwertet.                       |
| `accept_household_invite(code)`   | Angemeldete ohne Household | validiert Hash/Ablauf, prüft 2-Personen-Grenze, fügt als `member` hinzu.                                                 |
| `deactivate_household_member(id)` | **Owner**                  | deaktiviert das andere Mitglied (nicht sich selbst).                                                                     |

## Rollen & Rechte

| Aktion                                         | owner | member |
| ---------------------------------------------- | :---: | :----: |
| Eigene Einträge/Profil bearbeiten              |  ✅   |   ✅   |
| Gemeinsamen Household sehen                    |  ✅   |   ✅   |
| Nicht-kritische Household-Einstellungen ändern |  ✅   |   ✅   |
| Einladen / Mitglied deaktivieren               |  ✅   |   ❌   |
| Household löschen                              |  ✅   |   ❌   |

Domain-Helfer: `src/domain/household/roles.ts` (`canManageMembers`, `canAddMember`,
`MAX_ACTIVE_MEMBERS`).
