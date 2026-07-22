# Regelversionierung

Siehe [ADR-0033](./decisions/0033-reward-rule-versioning.md). Belohnungsregeln sind
versioniert (`reward_rule_versions`); Version 1 hält die Phase-5-Ausgangswerte.

## Felder

`version` (PK), `is_active`, `valid_from`, `description`, `params` (JSONB mit Kopplung,
Ertrag, Deckeln), `created_at`.

## Wirkung

- Jede Ledger-Zeile trägt ihre `rule_version` und behält Version **und** Wert.
- `app.rule_version_for(datum)` liefert die zum fachlichen Datum aktive Version; neue
  Einträge und Korrekturen bearbeiteter Alt-Einträge nutzen diese.
- Eine neue Version verändert vergangene Belohnungen **nicht** automatisch rückwirkend.

## Vorgehen bei künftiger Kalibrierung (Phase 9)

Neue Zeile in `reward_rule_versions` mit `valid_from` in der Zukunft anlegen und die
Parameter/Formeln in Domain **und** SQL synchron anpassen (gemeinsame Testfälle). Historie
bleibt unangetastet.
