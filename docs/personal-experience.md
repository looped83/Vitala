# Persönliche Erfahrung (XP)

Persönliche XP drücken **Teilnahme, individuelle Entwicklung, Vielfalt sowie Ziel- und
Missionsfortschritt** aus – **nicht** Gesundheit, Fitness, moralischen Wert, Disziplin oder
Überlegenheit gegenüber dem Partner.

## Zustand

Pro Person: aktueller Gesamt-XP-Wert (Summe der persönlichen Ledger-Zeilen), aktuelles
Level und Titel, XP bis zum nächsten Level – geliefert über `personal_reward_status` und
clientseitig aus derselben Kurve (`levelForXp`) berechnet.

## Transaktionen

Jede Änderung ist eine Zeile in `experience_transactions` (`scope='personal'`) mit Betrag,
Grund, Bereich, Quelle (`source_kind`+`source_id`), Regelversion, fachlichem Datum und
optionalem Korrekturbezug ([reward-ledger.md](./reward-ledger.md)). Der XP-Verlauf ist auf
der Profilseite sichtbar (paginiert, ohne technische Metadaten).

## Sichtbarkeit

Die eigene persönliche Historie ist einsehbar; die **einzelnen** XP-Zeilen des Partners
sind es nicht (nicht-kompetitiv, [reward-rls.md](./reward-rls.md)). Die aggregierte
Levelinformation des Partners ist sichtbar (gemeinsamer, wertschätzender Fortschritt).
