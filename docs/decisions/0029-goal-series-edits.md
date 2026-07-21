# ADR-0029: Bearbeitung wiederkehrender Ziele (Serien)

**Status:** Akzeptiert · **Bezug:** [goal-status-and-lifecycle.md](../goal-status-and-lifecycle.md),
Aufgabe §8/§15

## Kontext

Beim Bearbeiten eines wiederkehrenden Ziels muss klar sein, welche Perioden betroffen sind.
Vergangene, abgeschlossene Perioden dürfen nicht rückwirkend verfälscht werden; die laufende
und zukünftige Perioden sollen die neue Definition übernehmen (§8/§15).

## Entscheidung

- **Bearbeitung wirkt „ab jetzt":** `save_goal` (Update) ändert den Serienkopf und setzt den
  Zielwert der **aktuellen aktiven Periode** neu. Bereits **eingefrorene** Perioden
  (`final_value`, Status `completed`/`expired`) bleiben unverändert – die Historie ist stabil.
- **Systemische Felder gesperrt:** `id`, `household_id`, `created_by` sowie historische
  Periodenergebnisse sind clientseitig nicht änderbar (nur SELECT-Grant; Schreiben über RPC).
- **Neuberechnung:** nach dem Update läuft `sync_goal_periods()`; die laufende Periode wird
  live neu bewertet. Kein separater „Serien-Editor" mit drei Optionen (nur diese Periode /
  diese + zukünftige / gesamte Serie) – für V1 genügt „ab jetzt", was verständlich und
  überraschungsarm ist.
- **Atomarität:** Ziel- und Periodenänderung laufen in einer RPC-Transaktion; keine
  Teilzustände.

## Alternativen

- **Vollständiger Serien-Editor** mit „nur aktuelle / aktuelle + zukünftige / gesamte Serie":
  mächtiger, aber komplex und fehleranfällig; die Aufgabe erlaubt die kleinste konsistente
  Lösung → für V1 verworfen. Der Serienkopf bleibt so modelliert, dass diese Optionen später
  ergänzbar sind (Perioden tragen ihren eigenen `target_value`-Snapshot).
- **Rückwirkende Änderung aller Perioden:** würde Historie verfälschen → ausgeschlossen.

## Konsequenzen

- **Positiv:** vorhersehbares Verhalten, Historie bleibt korrekt, atomar, wartbar.
- **Negativ/Abwägung:** feingranulare Serienbearbeitung ist noch nicht möglich; die
  Datenstruktur (Snapshot je Periode) hält den Weg dorthin offen.
