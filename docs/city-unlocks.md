# Freischaltungen

## Berechnung (ADR-0041)

Freischaltungen werden **deterministisch aus dem aktuellen Stadtlevel abgeleitet** – es gibt
keine separate Freischaltungstabelle. Eine Region/Baufläche ist freigeschaltet, wenn
`stadtlevel ≥ unlockLevel`. Client und Server verwenden dieselbe Regel; der Client kann
Freischaltungen **nicht** setzen (RLS: nur SELECT; Schreiben nur über RPCs).

## Dauerhaftigkeit (§14/§2.4)

- Stadt-XP sinkt nie → Stadtlevel sinkt nie → Freischaltungen sinken nie.
- `city_states.highest_level` speichert das höchste je erreichte Level und ist
  serverseitig **monoton** abgesichert (RPC-Anhebung + `BEFORE UPDATE`-Trigger, der jede
  Verringerung blockiert). Damit bleibt „einmal frei bleibt frei" auch gegenüber
  theoretischen Korrekturen garantiert.

## Freischaltungstabelle (Regionen)

| Stadtlevel | Neu freigeschalteter Bereich  | Neue Bauflächen (Beispiele)         |
| :--------: | ----------------------------- | ----------------------------------- |
|     1      | Stadtzentrum, Wohngebiet      | 2 Gemeinschafts-, 1 kleine Fläche   |
|     2      | Sportviertel                  | 1 mittlere, 1 kleine Fläche         |
|     3      | Garten- & Ernährungsviertel   | 1 große, 1 kleine Fläche            |
|     4      | Nachhaltigkeitsinfrastruktur  | 1 Infrastruktur-, 1 kleine Fläche   |
|     5      | Naturschutzgebiet             | 2 Naturprojektflächen               |
|     6      | Bildungs- & Kulturviertel     | 1 Gemeinschafts-, 1 mittlere Fläche |
|     7      | Wasser- & Waldgebiet          | 1 Naturprojektfläche                |
|     8      | Umland (Ausblick, reserviert) | 1 reservierte große Fläche          |

## Neu-freigeschaltet-Erkennung (§33)

Pro Nutzer speichert `city_view_preferences.seen_city_level` das zuletzt bestätigte Level.
Eine Region gilt als „neu", wenn `1 < unlockLevel ≤ currentLevel` und
`unlockLevel > seen_city_level`. Der ruhige Banner nennt die neuen Bereiche; „Verstanden"
ruft `acknowledge_city_level()` auf und setzt `seen_city_level` auf das aktuelle Level.
Kein Vollbild, keine automatische Kamerafahrt, keine wiederholte Meldung.

## Gesperrte Bereiche (§32)

Gesperrte Bereiche sind sichtbar, klar als „gesperrt" bezeichnet und nennen das benötigte
Stadtlevel („Wird auf Stadtlevel 5 freigeschaltet"). Sachlich darf zusätzlich der
verbleibende Stadt-XP-Wert im Header stehen. **Keine** Dringlichkeits- oder Kaufsprache
(kein „Jetzt freischalten", kein „Dir fehlen …").
