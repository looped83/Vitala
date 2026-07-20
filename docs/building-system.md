# Gebäudesystem

Gebäude sind der greifbare, dauerhafte Ausdruck des Fortschritts. Dieses Dokument
definiert die Gebäude-Taxonomie, ihre Felder und die V1-Auswahl.

---

## 10. Gebäudemodell

Jedes Gebäude (Definition in `building_definitions`, Instanz in `buildings`) besitzt:

| Feld | Beschreibung |
|------|--------------|
| `id` | eindeutige, stabile Kennung (slug, z. B. `community_garden`) |
| `name` | Anzeigename (DE) |
| `category` | Bewegung / Ernährung / Nachhaltigkeit / Tierwohl / Gemeinschaft |
| `description` | kurze Beschreibung + funktionaler Nutzen |
| `unlock_condition` | Freischaltbedingung (Stadtlevel, ggf. Balance-/Bereichsvoraussetzung) |
| `build_cost` | Baukosten je Ressource (Baumaterial + Primärressource des Bereichs) |
| `build_progress` | Baufortschritt (eingezahlt / benötigt); kein Echtzeit-Timer |
| `stages` | Entwicklungsstufen (1–3) mit je eigenen Kosten und visuellem Zustand |
| `visual_states` | Baustelle → Stufe 1 → Stufe 2 → Stufe 3 (SVG-Zustände) |
| `functional_benefit` | funktionaler Nutzen (z. B. leichter Bonus, s. u.) |
| `bonuses` | mögliche Boni (klein, gedeckelt; siehe unten) |
| `history_note` | narrativer Text für City Event / Stadtgeschichte |
| `position` | Kachelposition im Stadtraster |
| `a11y_description` | strukturierte Beschreibung für Screenreader/Listenansicht |

**Baufortschritt statt Bauzeit:** Es gibt **keine Echtzeit-Wartezeit** (kein „warte 4
Stunden"-Muster, das Druck erzeugt). Ein Gebäude ist fertig, sobald die benötigten
Ressourcen eingezahlt sind – der Fortschritt ist reine Ressourcen-Akkumulation, meist
im Rahmen eines Wochenprojekts.

**Boni (bewusst schwach):** Funktionale Boni sind klein und dienen der Vielfalt, nicht
der Optimierung – z. B. „+5 % Energie aus Bewegung, gedeckelt" oder „schaltet einen
neuen Missionstyp frei". Boni dürfen die Balance nicht kippen (max. +5 % je Bonus,
maximal ein aktiver Ressourcenbonus je Ressource). Kein Bonus erzeugt Zwang oder
Verlust.

**Entwicklungsstufen:** Gebäude können bis zu drei Ausbaustufen haben (z. B. Gemüsebeet
→ Gemeinschaftsgarten → Gewächshaus als Stufen desselben Strangs *oder* als separate
Gebäude). Höhere Stufen setzen ein Mindest-Stadtlevel und höhere Ressourcen voraus.

---

## 10.1 Bewegung

| ID | Name | Stufen | V1? |
|----|------|:------:|:---:|
| `training_room` | Trainingsraum | 1 | ✅ |
| `gym` | Fitnessstudio | 2 | ✅ |
| `running_track` | Laufstrecke | 1 | ✅ |
| `yoga_studio` | Yogastudio | 1 | ✅ |
| `sports_park` | Sportpark | 2 | – |
| `bike_station` | Fahrradstation | 1 | ✅ (Brücke zu Nachhaltigkeit) |
| `recovery_center` | Regenerationszentrum | 1 | – |
| `movement_hub` | Bewegungszentrum | 3 | – |

## 10.2 Ernährung

| ID | Name | Stufen | V1? |
|----|------|:------:|:---:|
| `veg_bed` | Gemüsebeet | 1 | ✅ |
| `community_garden` | Gemeinschaftsgarten | 2 | ✅ |
| `greenhouse` | Gewächshaus | 2 | – |
| `orchard` | Obstgarten | 1 | ✅ |
| `farmers_market` | Wochenmarkt | 2 | ✅ |
| `vegan_cafe` | Veganes Café | 1 | – |
| `cooking_studio` | Kochstudio | 1 | – |
| `supply_center` | Versorgungszentrum | 3 | – |

## 10.3 Nachhaltigkeit

| ID | Name | Stufen | V1? |
|----|------|:------:|:---:|
| `solar_roofs` | Solardächer | 1 | ✅ |
| `solar_park` | Solarpark | 2 | – |
| `wind_park` | Windpark | 2 | – |
| `rainwater_store` | Regenwasserspeicher | 1 | ✅ |
| `recycling_center` | Recyclingzentrum | 2 | ✅ |
| `repair_workshop` | Reparaturwerkstatt | 1 | ✅ |
| `sharing_station` | Sharing-Station | 1 | – |
| `green_roof` | Begrüntes Dach | 1 | ✅ |
| `car_free_quarter` | Autofreies Quartier | 3 | – |
| `energy_center` | Energiezentrum | 3 | – |

## 10.4 Tierwohl und Biodiversität

| ID | Name | Stufen | V1? |
|----|------|:------:|:---:|
| `wildflower_meadow` | Wildblumenwiese | 1 | ✅ |
| `butterfly_garden` | Schmetterlingsgarten | 1 | ✅ |
| `bird_reserve` | Vogelreservat | 2 | ✅ |
| `hedgehog_garden` | Igelgarten | 1 | ✅ |
| `wetland` | Feuchtbiotop | 2 | – |
| `forest_corridor` | Waldkorridor | 2 | – |
| `animal_rescue` | Tierauffangstation | 2 | – |
| `animal_welfare_edu` | Bildungszentrum für Tierwohl | 2 | – |
| `nature_observatory` | Naturbeobachtungsstation | 1 | – |

## 10.5 Gemeinschaft und Kultur

| ID | Name | Stufen | V1? |
|----|------|:------:|:---:|
| `town_hall` | Rathaus | 1 | ✅ (Start, vorhanden) |
| `library` | Bibliothek | 1 | ✅ |
| `community_house` | Gemeinschaftshaus | 2 | ✅ |
| `culture_center` | Kulturzentrum | 2 | – |
| `viewpoint` | Aussichtspunkt | 1 | – |
| `event_square` | Veranstaltungsplatz | 1 | – |
| `mobility_hub` | Bahnhof / Mobilitätszentrum | 3 | – |

---

## 10.6 V1-Auswahl (verbindlich)

Für Version 1 (Phasen 6–7) sind genau diese Gebäude notwendig – je Bereich einige,
damit alle vier Bereiche und Gemeinschaft repräsentiert sind, ohne Überkomplexität:

- **Bewegung:** Trainingsraum, Fitnessstudio, Laufstrecke, Yogastudio, Fahrradstation.
- **Ernährung:** Gemüsebeet, Gemeinschaftsgarten, Obstgarten, Wochenmarkt.
- **Nachhaltigkeit:** Solardächer, Regenwasserspeicher, Recyclingzentrum,
  Reparaturwerkstatt, Begrüntes Dach.
- **Tierwohl:** Wildblumenwiese, Schmetterlingsgarten, Vogelreservat, Igelgarten.
- **Gemeinschaft:** Rathaus (Start), Bibliothek, Gemeinschaftshaus.

Alle übrigen Gebäude sind **definiert**, aber erst in späteren Phasen baubar. Die
Datenstruktur ist identisch, sodass keine spätere Migration nötig ist – nur neue
Definitionszeilen und SVG-Assets.

---

## 10.7 Baukosten-Schema (Beispiel)

Kosten skalieren mit Bereichsressource + Baumaterial; höhere Stufen kosten mehr.

| Gebäude | Baumaterial | Bereichsressource | Voraussetzung |
|---------|:-----------:|-------------------|---------------|
| Gemüsebeet (Stufe 1) | 10 | 15 Nahrung | Stadtlevel 3 |
| Gemeinschaftsgarten (Stufe 2) | 25 | 40 Nahrung | Stadtlevel 3, Gemüsebeet gebaut |
| Trainingsraum | 10 | 15 Energie | Stadtlevel 2 |
| Solardächer | 15 | 20 Natur | Stadtlevel 4 |
| Wildblumenwiese | 10 | 15 Natur | Stadtlevel 5 |
| Bibliothek | 20 | 25 Gemeinschaft | Stadtlevel 6 |

Diese Werte sind Startkalibrierung für das Balancing in **Phase 9** und liegen als
Daten (nicht als Code) vor, damit sie ohne Deployment justierbar sind.

---

## 10.8 Bau-Ablauf & Integrität

1. Ein freigeschaltetes Gebäude wird als **Wochenprojekt** gewählt (oder direkt gebaut,
   wenn Ressourcen vorhanden).
2. Ressourcen werden **serverseitig** reserviert/abgebucht (RPC, idempotent).
3. Bei Fertigstellung: `buildings`-Instanz mit Zustand „gebaut", City Event, ggf.
   neue visuelle Elemente.
4. **Abbruch vor Fertigstellung:** 100 % Refund (resources-and-xp §5.4).
5. **Keine Zerstörung/Rückbau** von fertigen Gebäuden in V1 (Prinzip „Fortschritt
   bleibt"). Umpositionieren ist erlaubt (reine Darstellungsänderung).
