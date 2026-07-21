# RLS: Ziele, Rituale & Check-ins (Phase 4)

Migration `20260721100300`. Deny-by-default auf allen neuen Tabellen; Schreiben ausschließlich
über RPCs (ADR-0020). Membership-Prüfung über die privaten Helfer aus ADR-0012
(`app.is_active_member`).

## Lese-Policies

| Tabelle              | SELECT für                                                                         |
| -------------------- | ---------------------------------------------------------------------------------- |
| `goals`              | aktive Household-Mitglieder (persönliche + gemeinsame Ziele), `deleted_at is null` |
| `goal_periods`       | aktive Household-Mitglieder                                                        |
| `rituals`            | aktive Household-Mitglieder, `deleted_at is null`                                  |
| `ritual_completions` | aktive Household-Mitglieder (zeigt, wer abgeschlossen hat)                         |
| `daily_check_ins`    | **nur die eigene Person** (`user_id = auth.uid()`)                                 |
| `goal_templates`     | anon + authenticated (aktive Referenzdaten)                                        |

Kein INSERT/UPDATE/DELETE-Grant oder -Policy für Clients (RPC-only).

## Datenschutz-Kernpunkt

Check-ins sind **strikt privat** ([ADR-0028](./decisions/0028-check-in-privacy.md)): der Partner
sieht **keine** Energie-, Stimmungs- oder Freitextdaten. Verifiziert per Live-DB-Test und pgTAP
(„partner cannot read a private check-in").

## Schreibpfad-Absicherung (in den RPCs)

- Household wird aus `auth.uid()` abgeleitet – **nie** aus einer Client-Household-ID.
- Eigentümer/Teilnehmer müssen aktive Mitglieder desselben Households sein
  (`invalid_owner`/`invalid_participant`).
- Statuswechsel serverseitig validiert (`invalid_status`).
- Fortschritt automatisch messbarer Ziele ist clientseitig nicht setzbar
  (`set_goal_manual_progress` nur für `manual`/`boolean`).
- Fester `search_path = ''`, `SECURITY DEFINER`, saubere Fehlercodes.

## Getestete Szenarien

Owner/Member lesen Household-Ziele; Außenstehende lesen nichts; persönliches Ziel nur für
gültigen Eigentümer; fremder Eigentümer scheitert; fremdes Ritual/Check-in unsichtbar; privater
Reflexionsschutz; direkter UPDATE auf `goals` verweigert (42501). Siehe
[goals-and-rituals-testing.md](./goals-and-rituals-testing.md).
