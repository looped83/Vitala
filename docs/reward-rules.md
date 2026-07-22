# Belohnungsregeln – Balancing-Referenz (Regelversion 1)

Alle Werte spiegeln `src/domain/rewards` und die SQL-Funktionen exakt (ADR-0005). Rundung
überall `round()` (halb weg von null). Bindend aus
[resources-and-xp.md](./resources-and-xp.md) §2/§5.

## Bewegung

`xp = round(Basis(Dauer) × Gewicht × Intensität)`, Regeneration fest 6 XP (max 1×/Tag).

| Dauer (min) | ≤10 | 11–20 | 21–35 | 36–55 | 56–80 | ≥81 |
| ----------- | --- | ----- | ----- | ----- | ----- | --- |
| Basis       | 4   | 6     | 9     | 12    | 14    | 15  |

Gewicht: Kraft/Ausdauer 1,10 · Kurs 1,05 · Mobility/Alltag/Sonstiges 1,00.
Intensität: leicht 0,95 · mittel 1,00 · intensiv 1,10. Tagesdeckel 30.

## Ernährung / Nachhaltigkeit / Tierwohl

2 XP je Alltagsbaustein; 5 XP je Sonderaktion (max 1×/Tag über den Deckel). Tagesdeckel:
Ernährung 12; Nachhaltigkeit 10 (+5 Sonder); Tierwohl 10 (+5 Sonder). Ein normaler veganer
Tag erzeugt keine wiederholbaren Tierwohl-XP.

## Stadt-XP & Ressourcen

`stadt_xp = round(0,5 × zugeteilte_xp)` (bei gemeinsamem Eintrag einmalig).
`ressource = round(0,4 × zugeteilte_xp)` der Primärressource (Bewegung→Energie,
Ernährung→Nahrung, Nachhaltigkeit/Tierwohl→Natur). Gemeinschaft: +2 je Person bei
gemeinsamem Eintrag (max 3/Tag/Person), +1 je Check-in.

## Rituale & Check-ins

Ritualabschluss: erster 2 XP, weitere je 1, max 6/Tag; gemeinsames Ritual +1 Gemeinschaft
(max 2/Tag). Check-in: 1 XP je (max 2/Tag), +1 Gemeinschaft; kein Bonus für Freitext.

## Missionen (je Beteiligtem)

| Mission            | pers. XP | Stadt-XP | Ressourcen               |
| ------------------ | -------- | -------- | ------------------------ |
| Persönlich · Tag   | 8        | 4        | 1 passend                |
| Gemeinsam · Tag    | 6        | 10       | 1 passend + 1 Gemeinsch. |
| Persönlich · Woche | 20       | 10       | 2 passend                |
| Gemeinsam · Woche  | 15       | 30       | 3 passend + 2 Gemeinsch. |

Deckel: max 12 persönliche Missions-XP/Tag. Details:
[mission-rewards.md](./mission-rewards.md).

## Ziele (bei Periodenabschluss)

Persönlich: 15 XP, 8 Stadt-XP, 2 passende Ressourcen. Gemeinsam: 10 XP je Mitglied,
20 Stadt-XP, 2 passende Ressourcen + 2 Gemeinschaft. Nur einmal je abgeschlossener Periode.

## Balancebonus

Siehe [balance-system.md](./balance-system.md). Regelversionierung:
[reward-rule-versioning.md](./reward-rule-versioning.md).
