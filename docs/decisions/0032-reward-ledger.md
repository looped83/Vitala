# ADR-0032: Append-only Reward-Ledger als Wahrheit, Bestände als Projektion

**Status:** Akzeptiert · **Bezug:** [reward-ledger.md](../reward-ledger.md), [data-model.md](../data-model.md) §16.3

## Kontext

XP und Ressourcen müssen nachvollziehbar, auditierbar und korrigierbar sein (Prinzip 2.1).
Ein frei überschreibbarer Zählerstand („balance = 42") verliert die Historie und ist
manipulierbar.

## Entscheidung

**`experience_transactions` und `resource_transactions` sind append-only Ledger** und
die alleinige Wahrheit. Jede Belohnung, jeder Bonus und jede Korrektur ist eine Zeile
mit Betrag (auch negativ), Grund, Quelle (`source_kind` + `source_id`), Regelversion,
fachlichem Datum und optionalem Korrekturbezug.

- **Ressourcenbestände** (`resources.balance`) sind eine **gecachte Projektion**, die im
  selben atomaren Vorgang wie die Ledger-Zeile fortgeschrieben wird.
- **Persönliches Level / Stadtlevel** sind Aggregate der Ledger-Summe (keine gespeicherte
  Zahl), gelesen über die Status-Views.
- Ledger-Zeilen werden **nie** verändert oder gelöscht (RLS entzieht Clients jedes
  Schreibrecht; Korrekturen sind neue Zeilen).

## Alternativen

- **Nur Zählerstände:** verworfen — keine Historie, manipulierbar, nicht korrigierbar.
- **Nur Ledger ohne Cache:** korrekt, aber jede Ressourcenanzeige wäre eine Aggregation;
  der gepflegte Bestand hält häufige Reads billig (Performance §63).

## Konsequenzen

- **Positiv:** vollständige Auditierbarkeit; verlustfreie Korrekturen; keine Doppelvergabe
  (Dedup-Keys + Reconcile); Bestände bleiben durch atomare Pflege konsistent.
- **Abwägung:** Bestand und Ledger müssen konsistent gehalten werden → geschieht
  ausschließlich in denselben `SECURITY DEFINER`-Funktionen; eine Konsistenzprüfung
  vergleicht `balance` gegen `sum(amount)`.
