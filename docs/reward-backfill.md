# Reward-Backfill historischer Daten

Phase 3/4 können bereits reale Einträge enthalten. Da Belohnungen aus den Einträgen
**abgeleitet** werden (Reconcile-to-Target, [ADR-0035](./decisions/0035-reward-processing.md)),
ist der Backfill schlicht ein Reconcile über den vorhandenen Zeitraum – wiederholbar ohne
Doppelvergabe.

## Strategie

- **Regelversion 1** für alle Bestandsdaten; historische **Tagesdeckel** gelten (der
  Reconcile berechnet je Tag mit laufenden Summen).
- Bestehende gültige Einträge werden einmalig verarbeitet: pro `(Household, Tag)`
  `app.reward_sync_movement` und `app.reward_sync_ritual` je Bereich aufrufen.
- Bereits abgeschlossene **Ziele** einmalig belohnen (`app.reward_pending_goals`).
- **Keine** rückwirkenden Tagesmissionen; offene Wochenmissionen/-ziele aktualisieren sich
  regulär.
- Gemeinsame Einträge: Stadt-XP einmal, persönliche XP je Beteiligtem (durch die
  Reconcile-Logik automatisch).

## Eigenschaften

Idempotent (erneuter Lauf → Differenz 0, Dedup-Keys), in Batches je Tag, auditierbar über
`reward_processing_log`. **Dry-Run**: gegen eine Kopie/Transaktion mit `ROLLBACK` laufen
lassen und die erzeugten Ledger-Summen prüfen. **Konsistenzprüfung** nach dem Lauf:
`resources.balance == Σ resource_transactions` und Level-Totals == Σ XP je Scope.

Der lokale Seed (`supabase/seed.sql`) demonstriert genau dieses Vorgehen: Rewards werden
aus den geseedeten Einträgen reconciled, nie als Rohzeilen gesetzt.
