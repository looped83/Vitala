# Ressourcensystem

Fünf aktiv verdiente + eine abgeleitete Ressource
([ADR-0002](./decisions/0002-resource-model.md)). In Phase 5 werden Ressourcen **verdient
und angezeigt**, aber noch nicht ausgegeben (Ausgabe ab Phase 7).

| Ressource        | Symbol | Quelle                                     | Spätere Verwendung            |
| ---------------- | ------ | ------------------------------------------ | ----------------------------- |
| Energie          | ⚡     | Bewegung                                   | Sport-/Mobilitätsgebäude      |
| Nahrung          | 🌱     | Ernährung                                  | Garten-/Versorgungsgebäude    |
| Natur            | 🌿     | Nachhaltigkeit + Tierwohl                  | Parks, Biotope, Lebensräume   |
| Gemeinschaft     | 🤝     | gemeinsame Handlungen, Rituale, Check-ins  | Gemeinschafts-/Kulturgebäude  |
| Baumaterial      | 🧱     | abgeleitet (Wochenabschluss, Phase 6/7)    | universeller Baustoff         |

## Vergabe

`ressource = round(0,4 × zugeteilte_xp)` der Primärressource je Eintrag. Gemeinschaft
zusätzlich: +2 je Person bei gemeinsamem Eintrag (max 3/Tag/Person), +1 je Check-in, +1 je
gemeinsamem Ritual (max 2/Tag). Missionen/Ziele/Balancebonus vergeben Ressourcen laut
[reward-rules.md](./reward-rules.md). Alle Beträge sind ganze, nicht-negative Zahlen.

## Speicherung

`resources` hält den gecachten Bestand (`balance ≥ 0`, `total_earned`, `total_spent`); jede
Änderung liegt als Zeile in `resource_transactions` (append-only Ledger,
[reward-ledger.md](./reward-ledger.md)). Der Bestand ist eine Projektion, nie frei vom
Client schreibbar (RLS). Historie mit Grund, Quelle und Vorzeichen ist vollständig
sichtbar.
