# Reward-Ledger

Siehe [ADR-0032](./decisions/0032-reward-ledger.md). `experience_transactions` und
`resource_transactions` sind append-only und die alleinige Wahrheit; `resources.balance`,
persönliches Level und Stadtlevel sind Projektionen/Aggregate.

## Transaktionstypen (XP)

`activity` · `ritual` · `checkin` · `goal` · `mission` · `balance_bonus` · `week_bonus` ·
`correction`. Negative Korrekturen entstehen nur durch Löschung, Änderung, Verschiebung,
Neuzuordnung oder Neubewertung einer Handlung – nie als Strafe.

## Transaktionstypen (Ressourcen)

`grant` · `balance_bonus` · `week_material` · `mission` · `goal` · `refund` ·
`spend_build` · `correction`. In Phase 5 existieren praktisch `grant`, `balance_bonus`,
`mission`, `goal` und `correction`; Ausgaben (`spend_build`/`refund`) sind ab Phase 7 aktiv.

## Idempotenz

Zwei Mechanismen: (1) **Reconcile-to-Target** für Eintragsbelohnungen (die datums- und
identitätsbezogene Ledger-Summe wird auf den Zielwert gebracht, erneuter Lauf → Differenz
0); (2) **Dedup-Keys** mit partiellem Unique-Index für Einmal-Belohnungen (Missionen,
Ziele, Balancebonus). Wiederholte Requests sind sicher.

## Konsistenzprüfung

`resources.balance == Σ resource_transactions.amount` je `(household, resource_key)`;
persönliches/städtisches Total == Σ `experience_transactions.amount` je Scope. Prüfbar
nach Backfill und in Tests.
