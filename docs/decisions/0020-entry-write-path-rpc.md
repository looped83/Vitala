# ADR-0020: Schreibpfad für Einträge – ausschließlich SECURITY-DEFINER-RPCs

**Status:** Akzeptiert · **Bezug:** [ADR-0005](./0005-server-side-rewards.md),
[ADR-0012](./0012-rls-helper-functions.md), [activity-rls.md](../activity-rls.md),
Aufgabe §14/§35

## Kontext

Ein gemeinsamer Eintrag ist ein **mehrteiliger** Schreibvorgang (Basiszeile +
Teilnehmer + ggf. mehrere Ritualzeilen). Er muss **atomar**, mit serverseitiger
Berechtigungs- und Konsistenzprüfung und ohne Mass-Assignment-Risiko erfolgen. Die
Household-ID darf nie vom Client vertraut werden.

## Entscheidung

- **Lesen:** direkte, RLS-gefilterte `SELECT`s (inkl. der `entry_feed`-View).
- **Schreiben (create/update/delete):** **ausschließlich** über `SECURITY DEFINER`-RPCs
  (`save_activity`, `save_ritual_checkin`, `delete_entry`, `save_favorite`,
  `delete_favorite`) mit fixem `search_path = ''`. Clients erhalten **keine**
  INSERT/UPDATE/DELETE-Rechte auf den Eintragstabellen.
- Jede RPC leitet die Household-ID aus `auth.uid()` ab (`app.current_household`), prüft
  Mitgliedschaft, Typ-/Bereichs-Konsistenz und Teilnehmer, schreibt atomar und protokolliert
  in `audit_log` (ohne private Notizinhalte).
- **Idempotenz:** `save_activity` akzeptiert einen `idempotency_key`; Wiedereinspielung
  liefert den ursprünglichen Datensatz (Offline-Outbox, ADR-0008).
- **Stabile Fehlercodes** (`invalid_type`, `invalid_participant`, `duplicate_ritual`, …)
  werden in `normalizeSupabaseError` auf freundliche Meldungen gemappt (ADR-0017).
- **Keine** XP-/Ressourcen-/Stadtwirkung in diesen RPCs (Phase 3).

## Alternativen

- **Direkte Client-Writes mit RLS `WITH CHECK` + Trigger:** Teilnehmer-Atomarität schwierig,
  Mass-Assignment-Feldschutz mühsam, kein einheitlicher Audit-Ort → verworfen.
- **Externer Backend-Service:** unnötige Komplexität (vgl. ADR-0005) → verworfen.

## Konsequenzen

- **Positiv:** atomar, manipulationssicher, mass-assignment-fest, ein Audit-/Validierungsort,
  konsistent mit ADR-0005/0012; leicht testbar (pgTAP).
- **Negativ/Abwägung:** mehr RPC-Oberfläche; Domain-Validierung existiert doppelt (Zod +
  SQL) und wird über gemeinsame Testfälle synchron gehalten.
