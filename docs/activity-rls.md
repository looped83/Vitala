# Row Level Security – Aktivitäten & Rituale

Ergänzt [row-level-security.md](./row-level-security.md) um die Phase-3-Tabellen. Grundlage:
[ADR-0012](./decisions/0012-rls-helper-functions.md), [ADR-0020](./decisions/0020-entry-write-path-rpc.md).

## Prinzip

RLS ist auf **allen** neuen Tabellen aktiv (deny-by-default). Mitgliedschaftsprüfungen laufen
über die `SECURITY DEFINER`-Helper im privaten Schema `app` (`is_active_member`,
`current_household`). **Schreiben ausschließlich über RPCs** – Clients haben nur `SELECT`.

## Lesen

- **`activity_types`, `ritual_definitions`**: global lesbar (auch `anon`, für Login/Offline),
  nur `is_active`. Keine Schreibpolicy.
- **`activities`, `ritual_entries`**: `SELECT` nur für aktive Mitglieder des eigenen
  Households **und** `deleted_at is null` (Soft-Delete-Ausblendung doppelt abgesichert).
- **`entry_participants`**: lesbar für aktive Mitglieder des Teilnehmer-Households.
- **`entry_favorites`**: aktive Mitglieder sehen geteilte (`owner_user_id is null`) + eigene.
- **`entry_feed`** (View, `security_invoker`): erbt die Policies der Basistabellen.

## Schreiben (nur RPC)

Kein INSERT/UPDATE/DELETE-Grant für Clients. Die RPCs leiten die Household-ID aus `auth.uid()`
ab und prüfen:

- Ersteller ist aktives Mitglied; Teilnehmer sind aktive Mitglieder **desselben** Households;
  max. zwei Teilnehmer; keine Fremdzuordnung.
- Typ/Bereich konsistent; Dauer/Datum gültig; Datum nicht in der Zukunft (Household-Zeit).
- Deaktivierte Mitglieder erhalten keine neuen Einträge (`not_in_household`).
- Ersteller/Household-ID sind nicht clientseitig manipulierbar (Mass-Assignment-Schutz).

## Rechte im Detail

- **Bearbeiten:** nur `created_by`.
- **Löschen:** jedes aktive Mitglied (Soft Delete, Auslöser im `audit_log`).

## Tests (`supabase/tests/activity.test.sql`)

Owner/Member lesen; Outsider liest nichts; fremder Partner, dritter Teilnehmer, ungültiger
Typ, Typ-Bereich-Mismatch, ungültige Dauer, Zukunftsdatum, `duplicate_ritual`, deaktiviertes
Mitglied, Fremd-Update/-Löschung abgelehnt; gemeinsamer Eintrag atomar; Soft Delete.
