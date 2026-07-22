# Missionsauswahl

Deterministisch und regelbasiert ([ADR-0036](./decisions/0036-mission-selection.md)); kein
ML, kein externer Dienst, **keine** Freitextanalyse. Identisch in
`src/domain/missions/selection.ts` (Vorschau/Tests) und `app.pick_mission` (Server).

## Harte Filter

1. Erschöpfungsschutz – fordernde Bewegung entfällt nach am Bewegungsdeckel erschöpftem
   Vortag.
2. Wiederholungsvermeidung – nichts aus dem jüngsten Cooldown-Fenster (Tag: 3 Tage,
   Woche: 14 Tage).
3. Tagesform – wenig Zeit (`min_minutes` > Budget) filtert lange Missionen;
   Regenerationswunsch filtert `demanding`.

## Scoring (additiv)

4. Balance-Lenkung – am wenigsten abgedeckter Bereich der Woche zuerst.
5. Fokuswunsch (Morgen-Check-in) und aktive Zielbereiche – milde Bevorzugung.
6. Schwierigkeitspassung – leicht bei niedriger, voller bei hoher Energie.

Gleichstand: stabiler, tagesrotierender Hash, dann Key (kein Zufall). Tausch übergibt die
aktuelle Definition als Ausschluss und liefert garantiert eine andere Mission.

## Tagesform-Quellen (nur strukturiert)

Energie (1–5), Zeitbudget (minimal/quarter/half/hour/flexible), Fokus (Bereich/recovery/
shared/none), Intensitätswunsch (recovery ⇒ Regeneration). Check-in-Freitexte werden
**niemals** ausgewertet ([ADR-0028](./decisions/0028-check-in-privacy.md)).
