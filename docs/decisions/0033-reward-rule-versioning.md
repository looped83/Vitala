# ADR-0033: Regelversionierung der Belohnungslogik

**Status:** Akzeptiert · **Bezug:** [reward-rule-versioning.md](../reward-rule-versioning.md)

## Kontext

Belohnungswerte werden in Phase 9 kalibriert (ADR-0003). Eine spätere Anpassung darf
vergangene Belohnungen nicht rückwirkend verändern (Prinzip 2.5 – kein Verlust).

## Entscheidung

Jede Ledger-Zeile trägt die **Regelversion**, mit der sie berechnet wurde
(`reward_rule_versions`). Version 1 hält die Phase-5-Ausgangswerte
([resources-and-xp.md](../resources-and-xp.md) §2/§5).

- Vergangene Transaktionen behalten ihre ursprüngliche Version **und** ihren Wert.
- Eine neue Version gilt nur für neue fachliche Daten ab ihrem `valid_from`.
- **Korrektur bearbeiteter Alt-Einträge:** anhand der zum **ursprünglichen fachlichen
  Datum** gültigen Regelversion (die Reconcile-Funktion liest `rule_version_for(datum)`).

## Alternativen

- **Keine Versionierung:** verworfen — eine Balancing-Änderung würde die gesamte Historie
  verzerren.
- **Neuberechnung aller Alt-Transaktionen bei Regeländerung:** verworfen — teuer,
  intransparent, verstößt gegen „kein Verlust".

## Konsequenzen

- **Positiv:** stabile Historie; zukünftiges Balancing ohne Rückwirkung; transparente
  Herkunft jedes Werts.
- **Abwägung:** Reconcile muss datumsabhängig die richtige Version wählen — als reine
  Funktion `app.rule_version_for(date)` gekapselt und getestet.
