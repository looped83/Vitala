# Stadt-Erfahrung (Stadt-XP)

Der Household besitzt gemeinsames Stadt-XP als Grundlage des Stadtlevels und – ab Phase
6/7 – der Freischaltung von Stadtbereichen und Gebäuden.

## Entstehung

`stadt_xp = round(0,5 × zugeteilte_persönliche_xp) + Boni`
([ADR-0003](./decisions/0003-xp-model.md)). Quellen: Aktivitäten beider Nutzer, gemeinsame
Einträge, gemeinsame Ziele, Missionen, Wochenmissionen, Balanceboni, langfristige Nutzung.

## Keine Doppelvergabe

Bei einem **gemeinsamen** Eintrag wird Stadt-XP **genau einmal** vergeben (nur im
Reconcile-Durchlauf der erfassenden Person, `scope='city'`, `user_id null`), während beide
Beteiligten persönliche XP erhalten können. Missionen/Ziele vergeben Stadt-XP einmalig
über Dedup-Keys.

## Zustand

`city_reward_status` liefert Stadt-XP-Summe, Stadtlevel, Titel und Fortschritt.
Sichtbar auf der Heute- und Stadt-Seite (gemeinsamer Fortschrittsbereich). Level sinken
nie.
