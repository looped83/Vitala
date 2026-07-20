# ADR-0009: Datenmodell – normalisiert relational mit Ledgern

**Status:** Akzeptiert · **Bezug:** [data-model.md](../data-model.md)

## Kontext

Das Modell muss Doppelzählung verhindern, Belohnungen auditierbar/korrigierbar machen,
performant abfragbar sein und spätere Erweiterungen (Saison, weitere Gebäude) ohne
Migration erlauben – ohne in „zu viele Tabellen" oder „zu generisch" zu verfallen (R14/R15).

## Entscheidung

- **Normalisiert relational** in PostgreSQL, RLS-isoliert nach Household.
- **Append-only-Ledger** für XP (`experience_transactions`) und Ressourcen
  (`resource_transactions`); Salden sind Aggregate/gecacht → Korrektur & Audit möglich.
- **Konsolidierung:** Ernährungs-/Nachhaltigkeits-/Tierwohl-Handlungen in generischen
  `ritual_definitions`/`ritual_entries` (`area`-Diskriminator); Bewegung separat
  (eigene Felder/Regel).
- **JSONB gezielt** nur für strukturell variable **Konfiguration** (`reward`,
  `unlock_condition`, `build_cost`, `stages`, `position`, `meta`); **nie** für
  abfrage-/aggregationsrelevante Werte (diese als typisierte, indizierte Spalten).
- **Idempotenz & Doppelzählung** über Unique-Constraints + `idempotency_key` +
  `activity_group_id`.
- **Saison/Tageszeit berechnet**, nicht gespeichert → spätere Aktivierung ohne Migration.

## Alternativen

- **Stark generisches EAV-Modell:** flexibel, aber schwer abfragbar/validierbar,
  Performance-Risiko – verworfen.
- **Eine Tabelle pro Handlungstyp (viele Tabellen):** Duplikation, mehr Wartung –
  verworfen.
- **JSONB-lastig (Salden/Fortschritt in JSONB):** verliert Constraints/Indizes –
  verworfen.

## Konsequenzen

- **Positiv:** klare Constraints, gute Abfragen/Indizes, Auditierbarkeit, kontrollierte
  Flexibilität, migrationsarme Erweiterbarkeit.
- **Negativ/Abwägung:** Ledger-Salden benötigen konsistente Pflege (Trigger/RPC) →
  integrationsgetestet.
