# ADR-0037: Gestaffelter Wochen-Balancebonus, einmal pro Woche

**Status:** Akzeptiert · **Bezug:** [balance-system.md](../balance-system.md), [shared-bonuses.md](../shared-bonuses.md)

## Kontext

Die vier Lebensbereiche sind gleichwertig (Prinzip 2.3). Ein Anreiz zu Ausgewogenheit
soll motivieren, aber nie bestrafen und keine „Schulnote" vergeben (§36).

## Entscheidung

Pro Kalenderwoche wird ein **`weekly_balance_snapshots`**-Datensatz geführt (Zählung
qualifizierender Einträge je Bereich). Die Stufe ergibt sich aus der Anzahl aktiver
Bereiche; die Bezeichnungen sind neutral (Schwerpunkt- / Vielseitige / Ausgewogene /
Ganzheitliche Woche) — **keine** negative Stufe.

**Gestaffelter Bonus, additiv und maximal einmal pro Woche** (dieser Phase-spezifische
Wert ersetzt den Einzelbonus in resources-and-xp §7):

- 3 Bereiche: +10 Stadt-XP, +1 Gemeinschaft.
- 4 Bereiche: zusätzlich +10 Stadt-XP, +1 Natur, +1 Gemeinschaft (gesamt 20 / 1 / 2).
- optional +5 persönliche XP je Mitglied, wenn **beide** in der Woche beigetragen haben.

Die Vergabe erfolgt inkrementell über Dedup-Keys je `(Household, Woche, Stufe)` — beim
erstmaligen sicheren Erreichen der Stufe, verlustfrei, ohne Doppelvergabe.

## Alternativen

- **Einzelbonus nur bei 4 Bereichen** (resources-and-xp §7): verworfen für diese Phase —
  die Staffelung würdigt auch dreiseitige Wochen.
- **Bonus erst am Wochenende:** verworfen — „beim erstmaligen sicheren Erreichen" wirkt
  unmittelbarer und ist verlustfrei (kann nicht mehr aberkannt werden).
- **Direkte Baumaterial-Produktion:** auf den Wochenabschluss der Phase 6/7 verschoben.

## Konsequenzen

- **Positiv:** motiviert Ausgewogenheit ohne Druck; genau einmal pro Woche; verlustfrei.
- **Abwägung:** erreicht eine Woche zuerst Stufe 3 und später 4, werden beide Tranchen
  vergeben (Summe = Stufe-4-Bonus) — bewusst additiv statt „entweder/oder".
