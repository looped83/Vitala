# Balance-System (Phase 5)

Die vier Lebensbereiche (Bewegung, Ernährung, Nachhaltigkeit, Tierwohl) sind gleichwertig.
Pro Kalenderwoche (Household-Zeitzone, Wochenstart aus `household_settings`) wird
ausgewertet, in wie vielen Bereichen ein **qualifizierender** Eintrag vorliegt. Es gibt
**keine Note** und **keine negative Stufe**. Entscheidung:
[ADR-0037](./decisions/0037-balance-bonus.md).

## Stufen (neutral)

| Aktive Bereiche | Bezeichnung          |
| --------------- | -------------------- |
| 0               | Noch offen           |
| 1               | Schwerpunktwoche     |
| 2               | Vielseitige Woche    |
| 3               | Ausgewogene Woche    |
| 4               | Ganzheitliche Woche  |

## Snapshot

`weekly_balance_snapshots` (eine Zeile je Household + Woche) hält die Zählungen je Bereich,
die aktive Bereichszahl, ob **beide** Mitglieder beigetragen haben und ob der Bonus schon
vergeben wurde. `app.touch_weekly_balance` aktualisiert den Snapshot bei jeder relevanten
Mutation (billiger Upsert).

## Bonus (additiv, max. 1×/Woche, verlustfrei)

- **3 Bereiche:** +10 Stadt-XP, +1 Gemeinschaft.
- **4 Bereiche:** zusätzlich +10 Stadt-XP, +1 Natur, +1 Gemeinschaft (gesamt: 20 Stadt-XP,
  1 Natur, 2 Gemeinschaft).
- **beide beigetragen:** zusätzlich +5 persönliche XP je Mitglied (Stufe ≥ 3).

Die Vergabe ist inkrementell über Dedup-Keys je `(Household, Woche, Stufe)` — beim
erstmaligen sicheren Erreichen der Stufe, ohne Doppelvergabe. Direkte Baumaterial-
Produktion aus dem Wochen-`min(...)` (resources-and-xp §5.2) ist auf den Wochenabschluss
der Phase 6/7 verschoben.
