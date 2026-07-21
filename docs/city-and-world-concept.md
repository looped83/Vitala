# Stadt- und Weltkonzept

Die Stadt ist Fortschrittsanzeige, Langzeitarchiv, Motivationselement, Spielfeld und
gemeinsame Geschichte zugleich. Sie muss **technisch realistisch**, **hochwertig**,
**responsive** und **ohne 3D-Engine** umsetzbar sein.

---

## 9. Darstellungsform (Entscheidung)

Bewertete Varianten (Skala 1–5, höher = besser):

| Variante                               | Aufwand | Performance | Responsive | A11y  | Erweiterbar | Visuelle Qualität | Animation | Speicher | Wartbarkeit |
| -------------------------------------- | :-----: | :---------: | :--------: | :---: | :---------: | :---------------: | :-------: | :------: | :---------: |
| Isometrische 2D-Karte (Canvas/Sprites) |    2    |      4      |     3      |   2   |      4      |         5         |     4     |    3     |      3      |
| Top-down 2D-Karte (SVG-Kacheln)        |    4    |      4      |     5      |   4   |      5      |         4         |     4     |    4     |      5      |
| Reine Canvas-Welt                      |    2    |      5      |     3      |   1   |      3      |         4         |     5     |    4     |      2      |
| Illustrative Einzelbild-Stadt          |    5    |      5      |     4      |   3   |      1      |         1         |     2     |    4     |      3      |
| **SVG + CSS (top-down, modular)**      |  **4**  |    **4**    |   **5**    | **5** |    **5**    |       **4**       |   **4**   |  **4**   |    **5**    |

**Entscheidung** ([ADR-0001](./decisions/0001-world-rendering.md)): **Top-down,
modulare Kachelwelt auf Basis von inline-SVG + CSS**, ohne Canvas und ohne 3D.

Begründung:

- **Accessibility:** SVG-Elemente sind semantisch auszeichenbar (`role`, `aria-label`,
  `<title>`), fokussier- und per Tastatur bedienbar – Canvas nicht.
- **Responsive:** SVG skaliert verlustfrei; Kachelraster passt sich per CSS an.
- **Erweiterbarkeit/Wartbarkeit:** Jedes Gebäude ist eine wiederverwendbare SVG-
  Komponente mit Zuständen (Baustellen-/Ausbaustufen) – gut versionier- und testbar.
- **Performance:** Bei erwarteter Gebäudezahl (V1: Dutzende, langfristig < 200 sichtbare
  Elemente) bleibt der DOM überschaubar; Details in
  [performance-and-green-code.md](./performance-and-green-code.md).
- **Top-down statt isometrisch:** deutlich geringerer Zeichen-/Asset-Aufwand,
  einfacheres responsives Layout, gute visuelle Qualität ohne teure Perspektive.

Grenzen/Gegenmaßnahmen: Bei sehr vielen Elementen droht DOM-Last → Maßnahmen:
Viewport-Culling (nur sichtbare Kacheln rendern), Gruppierung statischer Ebenen zu
einem gecachten SVG-Layer, `content-visibility: auto` für Off-Screen-Bereiche.

---

## 9.1 Startzustand

Die Welt startet **einladend, nicht leer**:

- ein kleines gemeinsames **Haus** (Wohnhaus von Lutz und René),
- ein **zentraler Platz** mit Brunnen,
- **wenige Wege** vom Haus zum Platz,
- eine kleine **Grünfläche** mit ein paar Bäumen,
- ein sichtbarer **Fluss/See** am Rand,
- **eine erste freie Baufläche** (Baustellen-Marker als Einladung),
- unbebautes, angedeutetes **Umland** (Wiese/Wald am Rand).

Damit wirkt die Stadt vom ersten Moment lebendig und lädt zum ersten Bauprojekt ein.

---

## 9.2 Stadtbereiche

| Bereich                      | Freischaltung (Stadtlevel) | Lebensbereich  | Visuelle Identität          | Funktion                |
| ---------------------------- | :------------------------: | -------------- | --------------------------- | ----------------------- |
| Wohngebiet                   |           Start            | –              | warme Häuser, Gärten        | Ausgangspunkt, Wohnhaus |
| Stadtzentrum                 |           Start            | –              | Platz, Brunnen, Rathaus     | zentrale Orientierung   |
| Sportviertel                 |             2              | Bewegung       | Sportflächen, Wege          | Bewegungsgebäude        |
| Garten- & Ernährungsviertel  |             3              | Ernährung      | Beete, Markt, Gewächshäuser | Ernährungsgebäude       |
| Nachhaltigkeitsinfrastruktur |             4              | Nachhaltigkeit | Solar, Radwege, Recycling   | Nachhaltigkeitsgebäude  |
| Naturschutzgebiet            |             5              | Tierwohl       | Blühflächen, Tiere, Biotope | Biodiversitätsgebäude   |
| Bildungs- & Kulturviertel    |             6              | Gemeinschaft   | Bibliothek, Kulturhaus      | Gemeinschaftsgebäude    |
| Wasser- & Waldgebiet         |             7              | übergreifend   | Wald, Feuchtgebiete, Ufer   | Natur, Erholung         |
| Umland / vernetzte Region    |             8+             | übergreifend   | Nachbarorte, Bahn           | Fernziel, Expansion     |

**Freischaltreihenfolge** folgt dem Stadtlevel und spiegelt die vier Lebensbereiche in
ausgewogener Reihenfolge wider (erst Bewegung/Ernährung als „Grundversorgung", dann
Nachhaltigkeit/Tierwohl, dann Gemeinschaft/Natur, zuletzt Expansion).

**Voraussetzungen:** Ein Stadtbereich wird durch das Stadtlevel freigeschaltet; einzelne
höherstufige Gebäude können zusätzlich Beiträge in allen vier Bereichen voraussetzen
(sanfter Balance-Hebel, siehe game-system §6.5).

---

## 9.3 Reaktion der Welt

Die Welt reagiert **sichtbar und dauerhaft positiv** auf Fortschritt.

| Veränderung                              | Auslöser                                       |                Dauerhaft?                |
| ---------------------------------------- | ---------------------------------------------- | :--------------------------------------: |
| Neues Gebäude / Ausbaustufe              | Bauprojekt fertiggestellt                      |                dauerhaft                 |
| Mehr Bäume / dichtere Vegetation         | Natur-Ressource / Tierwohl-Gebäude             |                dauerhaft                 |
| Blühende Flächen                         | Tierwohl-Gebäude, Frühling (Saison)            |              teils saisonal              |
| Saubereres Wasser                        | Nachhaltigkeits-Gebäude                        |                dauerhaft                 |
| Mehr Tiere (Vögel, Igel, Schmetterlinge) | Biodiversitäts-Gebäude, sekundäre Nebenwirkung | dauerhaft (Bestand), saisonale Aktivität |
| Mehr Fuß-/Radwege                        | Nachhaltigkeits-Gebäude                        |                dauerhaft                 |
| Solar-/Gründächer                        | Nachhaltigkeits-Gebäude                        |                dauerhaft                 |
| Lebendigere Plätze (Bewohner)            | Stadtlevel, Gemeinschaftsgebäude               |                dauerhaft                 |
| „Ruhigere" Stimmung                      | schwächere Wochen                              |          temporär, nie Verfall           |

**Verbindliche Regel:** Die Welt **verfällt nie**. Bei schwächeren Wochen wirkt sie
höchstens **ruhiger** (weniger Bewegung/Belebung in der Szene, gedämpftere
Tageszeit-Stimmung), verliert aber **kein** Gebäude und **keine** Vegetation.

Klassifikation der Veränderungen:

- **Durch Gebäude:** konkrete Bauwerke und ihr direktes Umfeld (dauerhaft).
- **Durch Level:** Freischaltung neuer Bereiche, Bewohner-Belebung (dauerhaft).
- **Durch Langzeit-Balance:** besondere „Blüh"-Zustände, dichtere Natur (dauerhaft ab
  erreicht).
- **Temporär:** Tageszeit, Wetter, Saison, Belebungsgrad (rein stimmungsbildend, nie
  fortschrittsrelevant).

---

## 9.4 Alternative strukturierte Ansicht (Accessibility)

Die Stadt muss **auch ohne visuelle Karte** vollständig bedienbar sein. Es gibt eine
gleichwertige **Listen-/Strukturansicht** (siehe [accessibility.md](./accessibility.md)):

- Stadtbereiche als aufklappbare Abschnitte,
- Gebäude als Liste mit Name, Zustand, Nutzen, Baudatum, Freischaltgrund,
- Fortschritt und Freischaltungen als Text/Fortschrittsbalken,
- vollständige Tastatur- und Screenreader-Bedienung.

Diese Ansicht ist kein Zusatz, sondern **gleichwertiger Zugang** zur selben Datenbasis.

---

## 9.5 Datenmodellbezug

Die Welt wird nicht als Bild gespeichert, sondern **datengetrieben** rekonstruiert:
`world_areas` (Bereiche), `world_elements` (statische Deko/Natur), `buildings`
(gebaute Instanzen mit Position/Zustand). Details: [data-model.md](./data-model.md).
So bleibt die Welt versionierbar, testbar und aus dem Zustand reproduzierbar.

---

## 11. Jahreszeiten und lebendige Welt (Konzept, spätere Umsetzung)

Diese Mechaniken werden erst in **Phase 8** implementiert. Hier wird nur der **Bedarf**
festgelegt, damit das Datenmodell und die Architektur sie nicht ausschließen.

### 11.1 Elemente

- **Jahreszeiten:** Frühling, Sommer, Herbst, Winter (kalendarisch, Household-Zeitzone).
- **Tag/Nacht:** an lokale Uhrzeit gekoppelt (Stimmung, Beleuchtung).
- **Wetter:** rein visuell/stimmungsbildend.
- **Tiere/Pflanzen:** saisonale Aktivität (mehr Schmetterlinge im Sommer, Zugvögel etc.).
- **Kleine Stadtbewohner:** belebende Figuren, an Stadtlevel gekoppelt.
- **Saisonale Events:** zeitlich begrenzte, freiwillige Themen-Missionen.

### 11.2 Datenmodellbedarf

- `season` und `daypart` sind **ableitbar** aus Datum/Uhrzeit + Household-Zeitzone –
  **keine** eigene Tabelle nötig; höchstens ein `household_settings.timezone`.
- Saisonale Events: als Sonderfall der `mission_definitions` mit Zeitraum (kein neues
  Schema).
- Tier-/Pflanzenbestände: aus `world_elements` + Gebäude ableitbar; saisonale Sichtbarkeit
  ist eine **Darstellungs**-Eigenschaft, kein persistenter Zustand.

### 11.3 Visuelle & technische Anforderungen, Grenzen

- Saison/Tageszeit ändern **nur** Farbstimmung, Beleuchtung und Belebungsgrad –
  **nie** Fortschritt.
- **Wetter darf nie negativ** auf Fortschritt oder Belohnung wirken (Prinzip 2.2).
- **Performancegrenze:** maximal die in [performance-and-green-code.md](./performance-and-green-code.md)
  definierte Zahl gleichzeitig animierter Elemente; Saison-Effekte sind
  Reduced-Motion-abschaltbar.
- **Accessibility:** Saison/Tageszeit werden auch textuell benannt (z. B. „Frühling,
  Nachmittag"), damit sie nicht rein visuell sind.

### 11.4 Spätere Erweiterbarkeit

Da Saison/Tageszeit **berechnet** statt gespeichert werden, ist die spätere Aktivierung
ein reines UI-Feature ohne Migration. Das erfüllt die Vorgabe „Architektur darf spätere
Erweiterungen nicht verhindern, aber nicht darauf optimieren".

---

## 12. Stadtgeschichte

Die Stadt dokumentiert langfristig bedeutsame Ereignisse als **City Events**
(`city_events`, siehe [data-model.md](./data-model.md)).

### 12.1 Gespeicherte Ereignisse

- Fertigstellung eines Gebäudes (wann, welches).
- Auslöser der Freischaltung (welche Ziele/Aktivitäten/Ressourcen beigetragen haben –
  als kurze, aggregierte Referenz, **keine** Roh-Verhaltensdaten).
- Erreichen eines Stadtlevels.
- Abgeschlossene besondere Ziele.
- Saisonale Ereignisse (spätere Phase).

### 12.2 Darstellung

Als **chronologische Zeitleiste** im Bereich „Rückblick → Stadtgeschichte", mit kurzem
narrativem Text pro Ereignis. Beispiel:

> „Der Gemeinschaftsgarten wurde am 14. September 2026 fertiggestellt, nachdem ihr
> gemeinsam zwölf ausgewogene vegane Mahlzeiten dokumentiert habt."

### 12.3 Datenschutz & Datenmenge

- City Events speichern **aggregierte, entpersonalisierbare Meilensteine** – keine
  einzelnen Gesundheitsdetails über das Nötige hinaus (Datenminimierung, siehe
  [security-and-privacy.md](./security-and-privacy.md)).
- **Begrenzte Menge:** Nur Meilensteine (Gebäude, Level, besondere Ziele) werden zu
  City Events – nicht jede Aktivität. Erwartete Größenordnung: wenige Einträge pro
  Woche, unproblematisch für Speicher und Performance.
