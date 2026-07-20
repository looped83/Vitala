# Die vier Lebensbereiche

Vitala kennt genau vier gleichwertige Lebensbereiche. Jeder Bereich hat eine
**primäre Ressource**, feste Kategorien, Aktivitäts- bzw. Ritualtypen, XP-Regeln mit
Deckelung und eine visuelle Wirkung auf die Stadt. Die numerischen Details (XP-Werte,
Deckel) sind zentral in [resources-and-xp.md](./resources-and-xp.md) definiert; hier
steht die inhaltliche und regelbezogene Ausgestaltung.

**Zentrale Anti-Doppelzählungs-Regel** (siehe [ADR-0004](./decisions/0004-double-counting.md)):
Jeder Eintrag hat **genau eine primäre Kategorie**, die volle XP und volle
Primärressource erzeugt. Optionale sekundäre Wirkungen erzeugen **keine zusätzliche
XP und keine zweite Ressource**, sondern höchstens einen kleinen, gedeckelten
visuellen Effekt in der Stadt.

---

## 4.1 Bewegung

**Primäre Ressource:** Energie · **Tagesdeckel Bewegung-XP:** 30 XP

### Kategorien & Aktivitätstypen

| Aktivitätstyp | Kategorie | Typ-Gewicht | Anmerkung |
|---------------|-----------|-------------|-----------|
| Krafttraining | Kraft | 1,1 | |
| Ausdauertraining | Ausdauer | 1,1 | Oberbegriff |
| Peloton | Ausdauer | 1,1 | |
| Fitnessstudio | Kraft/Ausdauer | 1,1 | Nutzer wählt Unterart |
| Laufen | Ausdauer | 1,1 | |
| Laufband | Ausdauer | 1,1 | |
| Yoga | Beweglichkeit | 1,0 | |
| Mobility | Beweglichkeit | 1,0 | Kurzformen zählen voll |
| Spaziergang | Alltagsbewegung | 1,0 | |
| Fahrrad (Sport) | Ausdauer | 1,1 | Abgrenzung zu Nachhaltigkeit s.u. |
| Gruppenkurs | Kurs | 1,05 | |
| Wandern | Ausdauer | 1,05 | |
| Regeneration | Regeneration | 1,0 | Fester Grundwert, siehe unten |
| Sonstige Bewegung | Sonstiges | 1,0 | Freitext-Notiz |

### Eingaben

**Pflicht:** Aktivitätstyp, Dauer (Minuten), Datum (Vorbelegung: heute).
**Optional:** Intensität (leicht/mittel/intensiv), Ort, „gemeinsam" (Flag), Notiz.

Begründung der Reduktion: Für die Belohnung sind nur Typ und Dauer notwendig.
Intensität ist bewusst optional und schwach gewichtet (±10 %), damit keine Belohnung
für Übertraining entsteht. Ort und Notiz dienen nur der persönlichen Erinnerung.

### XP-Regeln (Diminishing Returns)

Basis-Punkte nach Dauer (Tabelle, transparent und testbar):

| Dauer | Basis |
|-------|-------|
| ≤ 10 min | 4 |
| 11–20 min | 6 |
| 21–35 min | 9 |
| 36–55 min | 12 |
| 56–80 min | 14 |
| 81–120 min | 15 |
| > 120 min | 15 (Deckel) |

`Bewegung-XP = round(Basis × Typ-Gewicht × Intensitätsfaktor)`, Intensitätsfaktor ∈
{0,95 leicht · 1,0 mittel/keine Angabe · 1,10 intensiv}. Tagesdeckel 30 XP.

**Regeneration** hat einen **festen Grundwert von 6 XP** (unabhängig von Dauer,
maximal einmal pro Tag zählbar), damit Erholung „nicht wertlos" wirkt.

Prüfung der geforderten Fälle:
- 20 min Spaziergang → Basis 6 × 1,0 = **6 XP** (sinnvoll).
- 60 min Krafttraining → Basis 14 × 1,1 = **15 XP** (sinnvoll).
- 10 min Mobility → Basis 4 × 1,0 = **4 XP** (zählt spürbar).
- 3 h Sport (180 min) → Basis 15 (Deckel) → **max. 15–17 XP**, plus Tagesdeckel 30 XP
  über mehrere Einheiten → **nicht dreimal so viel** wie eine normale Einheit.

### Schutz vor Farming / Doppelzählung

- **Tagesdeckel 30 XP** und **Deckel pro Aktivität** (Basis 15) begrenzen lange/viele
  Einheiten.
- **Mindestdauer 5 min**; Einträge < 5 min werden abgelehnt.
- **Plausibilitätsprüfung:** Summe der Aktivitätsdauern eines Tages > 8 h wird
  markiert und nicht über den Tagesdeckel belohnt.
- **Maximale Erfassungsdauer pro Eintrag: 300 min** (harte Obergrenze im Formular).
- **Fahrrad:** Als Sport (Bewegung) *oder* als Nachhaltigkeit („Fahrrad statt Auto")
  erfassbar, aber pro Fahrt nur **eine** primäre Kategorie (siehe 4.3).

### Mögliche Gebäude / visuelle Wirkung

Trainingsraum, Fitnessstudio, Laufstrecke, Yogastudio, Sportpark, Fahrradstation,
Regenerationszentrum, Bewegungszentrum. Visuell: belebte Wege, Sportflächen,
Menschen in Bewegung. Details in [building-system.md](./building-system.md).

---

## 4.2 Gesunde vegane Ernährung

**Primäre Ressource:** Nahrung · **Tagesdeckel Ernährung-XP:** 12 XP

> **Kein Kalorien-Tracker.** Keine Mengen, keine Kalorien, keine Defizite, keine
> Gewichtsziele. Keine moralische Lebensmittelbewertung, keine „Cheat Days", keine
> Verbotslogik, keine Belohnung fürs Auslassen von Mahlzeiten.

### Check-in-Modell (Entscheidung)

Bewertete Varianten:

| Variante | Aufwand | Aussagekraft | Bewertung |
|----------|---------|--------------|-----------|
| Einzelne Mahlzeit erfassen | hoch | granular | zu aufwändig, fördert Zählen |
| Tageszusammenfassung mit Bausteinen | **sehr gering** | ausreichend | **gewählt** |
| Mehrere Mahlzeiten + Makros | sehr hoch | zu granular | widerspricht Vision |

**Entscheidung:** **Ein tägliches Ernährungs-Check-in als Baustein-Auswahl** (Chips),
maximal einmal pro Tag wertbar, mit Tagesdeckel. Kein Mahlzeit-Logging.

### Ernährungsbausteine (auswählbare Chips)

Ausgewogene vegane Hauptmahlzeit · selbst gekocht · ausreichend Gemüse · ausreichend
Obst · Hülsenfrüchte · Vollkorn · gute Proteinquelle · ausreichend getrunken ·
bewusst gegessen · Lebensmittelverschwendung vermieden · neues veganes Rezept
ausprobiert · saisonale Lebensmittel · regionale Lebensmittel.

### XP-Regeln

- Jeder ausgewählte Baustein = **2 XP**, **Tagesdeckel 12 XP** (≈ 6 Bausteine).
- Der Deckel verhindert, dass „alles abhaken" den Bereich dominiert.
- Es gibt **keinen Bonus** für Auslassen, Verzicht oder Restriktion.
- „Ausgewogene vegane Hauptmahlzeit" und „selbst gekocht" sind separate Bausteine,
  aber innerhalb des Tagesdeckels – kein Multiplikator.

### Schutz vor Farming / Doppelzählung

- **Ein Ernährungs-Check-in pro Tag** (Unique-Constraint auf `(household, user, tag)`).
- **Tagesdeckel 12 XP** unabhängig von der Anzahl gewählter Bausteine.
- Rückwirkende Bearbeitung erlaubt (siehe Flows), aber kein zweiter Check-in am selben Tag.

### Abgrenzung zu Tierwohl (wichtig)

Eine vegane Mahlzeit erzeugt **Ernährungs-XP**, **nicht zusätzlich** Tierwohl- oder
Nachhaltigkeits-XP. Der explizite „veganer Tag"-Beitrag zum Tierwohl ist eine
**separate, eigenständige** Handlung mit eigener Regel (siehe 4.4).

### Mögliche Gebäude / visuelle Wirkung

Gemüsebeet, Gemeinschaftsgarten, Gewächshaus, Obstgarten, Wochenmarkt, veganes Café,
Kochstudio, Versorgungszentrum. Visuell: blühende Gärten, Marktstände, Grünflächen.

---

## 4.3 Nachhaltigkeit

**Primäre Ressource:** Natur (Zweig „Umwelt/Kreislauf") · **Tagesdeckel:** 10 XP

### Handlungen: täglich zählbar vs. besondere Aktion

**Täglich zählbare Alltagshandlungen** (je 2 XP, Tagesdeckel 10 XP):
Fahrrad statt Auto · ÖPNV genutzt · zu Fuß gegangen · Mehrweg verwendet · Food Waste
vermieden · saisonal eingekauft · regional eingekauft · nachhaltige Alternative
gewählt · pflanzliche Alternative gewählt · Strom gespart · Wasser gespart · Müll
korrekt getrennt · Sharing-Angebot genutzt.

**Besondere Aktionen** (seltener, höherer Einzelwert 5 XP, nicht täglich, außerhalb
des Tagesdeckels bis zu 1×/Tag):
Second-Hand gekauft · repariert statt ersetzt · unnötigen Kauf vermieden · Lebensmittel
gerettet (größere Menge) · Gegenstand weitergegeben.

### XP-Regeln & Anti-Trivialisierung

- Alltagshandlungen sind bewusst niedrig bewertet (2 XP) und gedeckelt (10 XP/Tag),
  damit **triviales Abhaken** nicht dominiert.
- Besondere Aktionen benötigen eine kurze Notiz (was?) und sind auf **1 pro Tag**
  begrenzt.
- **Keine falsche wissenschaftliche Genauigkeit:** Es werden **keine konkreten
  CO₂-Einsparungen** behauptet. Die Sprache bleibt qualitativ („nachhaltig
  gehandelt"), nie „X kg CO₂ gespart".

### Schutz vor Farming / Doppelzählung

- Jede Handlung ist pro Tag nur **einmal** wählbar.
- **Fahrrad/ÖPNV/zu Fuß:** entweder Bewegung *oder* Nachhaltigkeit als primäre
  Kategorie pro Weg – nicht beides (siehe ADR-0004).
- **Maximale Erfassung:** Auswahl aus fixer Liste, kein Freitext-Farming.

### Mögliche Gebäude / visuelle Wirkung

Solardächer, Solarpark, Windpark, Regenwasserspeicher, Recyclingzentrum,
Reparaturwerkstatt, Sharing-Station, begrüntes Dach, autofreies Quartier,
Energiezentrum. Visuell: Solardächer, Radwege, begrünte Dächer, saubere Infrastruktur.

---

## 4.4 Tierwohl und Biodiversität

**Primäre Ressource:** Natur (Zweig „Leben/Biodiversität") · **Tagesdeckel:** 10 XP

### Handlungen: täglich zählbar vs. besondere Aktion

**Täglich zählbar** (je 2 XP, Tagesdeckel 10 XP):
veganer Tag · Tierprodukt bewusst ersetzt · tierfreundlich eingekauft (ohne
Tierversuche geachtet) · heimische Pflanzen gepflegt · insektenfreundliche Pflanzen
gepflegt · Vogeltränke gepflegt · Tierwohlwissen vertieft.

**Besondere Aktionen** (5 XP, max. 1×/Tag, außerhalb Tagesdeckel):
Tier- oder Naturschutz unterstützt · Tierheim unterstützt · Lebensraum verbessert ·
Wildblumen gepflanzt · Müll aus der Natur entfernt · Tier-/Naturschutzaktion durchgeführt.

### Abgrenzung zur veganen Ernährung (Doppelzählung)

Bewertete Modelle (Entscheidung als [ADR-0004](./decisions/0004-double-counting.md)):

| Modell | Beschreibung | Bewertung |
|--------|--------------|-----------|
| A: Volle Mehrfach-XP | Vegane Mahlzeit → volle XP in Ernährung + Nachhaltigkeit + Tierwohl | verworfen: Farming, Balance kaputt |
| B: Primär + reduzierte Sekundär-XP | Primär voll, sekundär z. B. 30 % | verworfen: intransparent, schwer testbar |
| C: Primär + nur visuelle Nebenwirkung | Genau eine primäre Kategorie erhält XP+Ressource; sekundär nur kosmetisch | **gewählt** |
| D: Freie Zuordnung ohne Regel | Nutzer wählt beliebig | verworfen: manipulierbar |

**Gewähltes Modell C:** Jeder Eintrag hat **genau eine primäre Kategorie** (volle XP,
volle Primärressource). Sekundäre Effekte erzeugen **keine XP, keine zweite
Ressource** – nur eine kleine, gedeckelte **visuelle Nebenwirkung** (z. B. ein
zusätzlicher Vogel/Baum in der Stadt), die den Balancewert nicht verändert.

Konkret: „veganer Tag" als **Tierwohl-Beitrag** ist eine *eigenständige* Handlung,
getrennt vom Ernährungs-Check-in. Wer den veganen Tag bereits als Tierwohl-Handlung
wählt, erhält dafür Tierwohl-XP; das Ernährungs-Check-in bleibt davon unberührt und
umgekehrt. Es gibt **nie** doppelte XP für denselben qualitativen Fakt innerhalb
desselben Bereichs.

### Schutz vor Farming / Doppelzählung

- Jede Handlung pro Tag nur einmal; „veganer Tag" max. 1×/Tag.
- Besondere Aktionen brauchen kurze Notiz und sind auf 1/Tag begrenzt.

### Mögliche Gebäude / visuelle Wirkung

Wildblumenwiese, Schmetterlingsgarten, Vogelreservat, Igelgarten, Feuchtbiotop,
Waldkorridor, Tierauffangstation, Bildungszentrum für Tierwohl,
Naturbeobachtungsstation. Visuell: Tiere, Blühflächen, Feuchtgebiete, Wildnis.

---

## Zusammenfassung: Tagesdeckel & Ressourcen

| Bereich | Primäre Ressource | XP je Einheit | Tagesdeckel XP | Besondere Aktion |
|---------|-------------------|---------------|----------------|------------------|
| Bewegung | Energie | 4–15 (Dauer) | 30 | – |
| Ernährung | Nahrung | 2 je Baustein | 12 | – |
| Nachhaltigkeit | Natur (Umwelt) | 2 (Alltag) | 10 | 5 XP, 1×/Tag |
| Tierwohl & Biodiversität | Natur (Leben) | 2 (Alltag) | 10 | 5 XP, 1×/Tag |

Die Deckel sind so gewählt, dass Bewegung nicht dauerhaft dominiert, obwohl sie den
höchsten Einzeldeckel hat: Ernährung/Nachhaltigkeit/Tierwohl sind mit sehr geringem
Aufwand (Sekunden) erreichbar, Bewegung erfordert echte Zeit. Über die Balance-Bonus-
Mechanik ([game-system.md](./game-system.md)) lohnt sich die Nutzung **aller** Bereiche.
