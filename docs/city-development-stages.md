# Entwicklungsstufen der Stadt

Die visuelle Stadtentwicklung wird deterministisch durch das **Stadtlevel** gesteuert
(ADR-0041). Jedes Level entspricht einer narrativen Entwicklungsstufe. Die Stufennamen
übernehmen die Beispiele aus task §13, an die verbindliche Phase-1-Freischaltreihenfolge
angepasst (Bewegung ab Level 2, nicht 3).

## Stufentabelle

| Stadtlevel | Stufe (Titel)      | Was sichtbar wird                                                 |
| :--------: | ------------------ | ----------------------------------------------------------------- |
|     1      | Keimzelle          | Stadtzentrum + Wohngebiet, erste Wege, kleine Grünfläche          |
|     2      | Erste Bewegung     | Sportviertel freigeschaltet                                       |
|     3      | Grüne Versorgung   | Garten- & Ernährungsviertel freigeschaltet                        |
|     4      | Nachhaltige Wege   | Nachhaltigkeitsinfrastruktur freigeschaltet                       |
|     5      | Lebensräume        | Naturschutzgebiet freigeschaltet                                  |
|     6      | Lebendiges Viertel | Bildungs- & Kulturviertel freigeschaltet                          |
|     7      | Wald & Wasser      | Wasser- & Waldgebiet zugänglich                                   |
|     8      | Vernetzte Region   | Umland erschlossen                                                |
|    9–12    | Verdichtete Stadt  | Verdichtung, zusätzliche Slots/Deko – keine automatischen Gebäude |
|    13+     | Wachsende Welt     | Struktur bleibt skalierbar für spätere Erweiterungen              |

Umgesetzt in `developmentStageForLevel(level)` (`src/domain/city/stages.ts`), abgesichert
durch Unit-Tests.

## Regeln (§4/§13/§14)

- **Kein Rückschritt:** Da Stadt-XP nie sinkt, sinkt das Level nie; `highest_level` ist
  serverseitig zusätzlich monoton gesichert.
- **Keine erfundenen Inhalte:** Für Level 9+ werden keine neuen, in Phase 1 nicht
  definierten Bereiche erfunden – nur Verdichtung + Ausblick.
- **Dezente Veränderung:** Höhere Stufen bringen mehr freie Bauflächen und Deko, nie
  Verfall, Müll, abgestorbene Natur oder Strafzustände (§19).

## Zusammenspiel mit Phase 5

Ein neues Stadtlevel entsteht ausschließlich über das XP-Ledger (Phase 5). Die Stadtansicht
liest das Level über `city_overview()`; eine Levelerhöhung schaltet Bereiche + Slots
konsistent frei und bereitet die Freischaltungsmeldung vor – ohne eigene Clientlogik.
