# Spielsystem

Dieses Dokument beschreibt das Spielsystem als Ganzes. Die Mathematik ist in
[resources-and-xp.md](./resources-and-xp.md) definiert; hier stehen Struktur,
Zusammenhänge und die Balance-Mechanik. Leitlinie: **bewusst schlank** – jedes
Element muss einen klaren Zweck erfüllen und darf den täglichen Aufwand nicht erhöhen.

---

## 6.1 Punkte und Erfahrung (Überblick)

Zwei XP-Ströme (Detail siehe resources-and-xp §1):

- **Persönliche XP** → persönliches Level (individuell, kosmetisch).
- **Stadt-XP** → Stadtlevel (gemeinsam, Kern der Motivation).

Quellen, Deckel und Boni: siehe resources-and-xp §2 und §7. Zusammenfassung der
Bonus-Arten: Wochenbonus, Missionsbonus, gemeinsame-Missions-Bonus, Balance-Bonus,
Langzeit-Balance-Bonus. **Keine** Boni für Intensität, Länge oder Häufigkeit über die
Deckel hinaus.

**Levelkurve:** progressiv (`req(L)=80+40·L` persönlich, `req_city(L)=200+120·L` Stadt);
begründete Entscheidung in [ADR-0003](./decisions/0003-xp-model.md).

---

## 6.2 Ressourcen (Überblick)

5 aktiv verdiente Ressourcen (**Energie, Nahrung, Natur, Gemeinschaft**) + abgeleitetes
**Baumaterial**. Vollständige Vergabe-, Speicher- und Ausgabelogik: resources-and-xp §5.
Entscheidungsgrundlage: [ADR-0002](./decisions/0002-resource-model.md).

Warum nicht mehr: „Wissen" und „Erfahrung/XP" als eigene Ressourcen wurden verworfen,
um die kognitive Last gering zu halten (Prinzip 2.6). Baumaterial ist die einzige
„Baustoff"-Währung – das hält Bauprojekte verständlich.

---

## 6.3 Persönliche Level

**Bedeutung:** Persönliche Anerkennung der eigenen Regelmäßigkeit – **nicht**
kompetitiv, nie im Vergleich zur anderen Person dargestellt.

**Fortschritt:** progressive Kurve (resources-and-xp §3).

**Freischaltungen (rein kosmetisch/persönlich):**
- Persönliche **Titel** (siehe unten).
- Persönliche **Akzentfarbe** und **Avatar-Motive** (naturverbunden).
- Persönliche **Statistik-Widgets** im Profil (z. B. „aktivste Tageszeit").

Keine Freischaltung eines persönlichen Levels beeinflusst das Spiel der anderen Person
oder die Stadt-Mechanik.

**Beispielhafte Titel** (erwachsen, freundlich, nicht albern, nicht militärisch,
nicht leistungsaggressiv):

| Levelbereich | Titel |
|--------------|-------|
| 1–3 | „Ankommend" |
| 4–6 | „Im Rhythmus" |
| 7–10 | „Verwurzelt" |
| 11–15 | „Ausgeglichen" |
| 16–20 | „Verbunden" |
| 21–30 | „Bewahrend" |
| 31+ | „Weitblick" |

Titel sind wählbar (nicht erzwungen); erreichte Titel bleiben dauerhaft verfügbar.

---

## 6.4 Stadtlevel

**Bedeutung:** Der zentrale gemeinsame Fortschritt.

**Stadt-XP-Quellen:** 50 % jeder persönlichen Handlung + Boni (resources-and-xp §1, §7).

**Balance-Berücksichtigung:** Der Balance-Bonus (unten §6.5) ist eine der stärksten
Stadt-XP-Quellen – so wird gemeinsame Ausgewogenheit strukturell belohnt, ohne
Einseitigkeit zu bestrafen.

**Freischaltung von Stadtbereichen** über Stadtlevel (Details:
[city-and-world-concept.md](./city-and-world-concept.md)):

| Stadtlevel | Freigeschalteter Bereich |
|-----------|--------------------------|
| 1 | Wohngebiet, zentraler Platz (Start) |
| 2 | Sportviertel |
| 3 | Garten- & Ernährungsviertel |
| 4 | Nachhaltigkeitsinfrastruktur |
| 5 | Naturschutzgebiet |
| 6 | Bildungs- & Kulturviertel |
| 7 | Wasser- & Waldgebiet |
| 8+ | Umland / vernetzte Region |

**Zusammenhang Stadtlevel ↔ Gebäudelevel:** Stadtlevel schaltet Kategorien/Gebäude
**frei**; gebaut und ausgebaut wird über **Ressourcen**. Gebäude-Ausbaustufen können
zusätzlich ein Mindest-Stadtlevel voraussetzen (siehe building-system).

**Sichtbarkeit von Aufstiegen:** Ein Stadt-Levelaufstieg löst eine ruhige, kurze
Animation aus (Reduced-Motion-fähig), ein City Event und eine neue Freischaltung.

**Entwicklungsstufen (Namensgebung, geprüft & verbessert):**

| Stufe | Vorgeschlagen | Gewählt | Begründung |
|-------|---------------|---------|------------|
| 1 | Keimzelle | **Keimzelle** | passend, bildhaft |
| 2 | kleine Siedlung | **Siedlung** | knapper |
| 3 | lebendiges Viertel | **Lebendiges Viertel** | beibehalten |
| 4 | grüne Stadt | **Grüne Stadt** | beibehalten |
| 5 | nachhaltige Metropole | **Blühende Stadt** | „Metropole" wirkt zu groß/urban für die warme Tonalität |
| 6 | vernetzte Region | **Vernetzte Region** | beibehalten als Fernziel |

---

## 6.5 Balance-System

**Ziel:** Alle vier Lebensbereiche gemeinsam berücksichtigen, **ohne Zwang, ohne
Bestrafung, ohne Fortschrittsverlust**. Einseitige Wochen sind erlaubt; langfristige
Balance wird stärker belohnt.

Bewertete Modelle:

| Modell | Beschreibung | Bewertung |
|--------|--------------|-----------|
| Vier getrennte Balken | rein visuell | gut als Anzeige, aber kein Anreiz |
| Mindestbeitrag pro Bereich | Pflicht → Bestrafung bei Nichterfüllung | verworfen (Prinzip 2.2) |
| Starre Perfektion | nur exakte Gleichverteilung zählt | verworfen (unrealistisch) |
| **Wöchentlicher Balancewert + Bonus** | weicher Bonus bei Ausgewogenheit | **gewählt** |

**Gewählte Mechanik – dreiteilig:**

1. **Anzeige:** Vier getrennte Wochen-Fortschrittsbalken (Bewegung, Ernährung,
   Nachhaltigkeit, Tierwohl) im „Rückblick" – reine, wertfreie Information.

2. **Balancewert der Woche** (0–1): Sei `x_i` der XP-Anteil des Bereichs `i` an der
   Wochen-XP. Der Balancewert ist normalisiert über die Abweichung vom Gleichgewicht
   (0,25 je Bereich):

   ```
   balance = 1 − ( Σ_i |x_i − 0,25| ) / 1,5
   ```

   `balance = 1` bei perfekter Gleichverteilung, `balance → 0` bei völliger
   Einseitigkeit. (Der Nenner 1,5 ist die maximal mögliche Summe der Abweichungen.)

3. **Balance-Bonus:** Gilt eine Woche als **ausgewogen**, wenn **jeder** Bereich
   mindestens **einen** Beitrag hat **und** `balance ≥ 0,6`. Dann:
   - **+30 Stadt-XP** und **+10 Baumaterial** (resources-and-xp §7).
   - Zusätzlich fließt der `min(...)`-Term in die Baumaterial-Erzeugung (resources-and-xp §5.2),
     wodurch ausgewogene Wochen ohnehin mehr Baumaterial liefern.

4. **Langzeit-Balance:** Vier ausgewogene Wochen in Folge → **+50 Stadt-XP** (einmalig
   je Serie). Die Serie „bricht" ohne Strafe – sie pausiert nur und kann neu beginnen.

**Gebäudevoraussetzungen als sanfter Balance-Hebel:** Einige höherstufige Gebäude
setzen voraus, dass in allen vier Bereichen *überhaupt* Beiträge existieren (nicht in
welcher Höhe). Das lenkt langfristig zur Vielfalt, ohne Wochendruck.

**Was ausdrücklich nicht passiert:** Kein Verfall bei Einseitigkeit, keine roten
Warnungen, kein Countdown, kein Entzug von Ressourcen oder XP. Eine einseitige Woche
ist ein vollständig gültiger, positiver Beitrag.

---

## 6.6 Zusammenspiel (Systemübersicht)

```
 Handlung (Aktivität/Ritual/Check-in)
     │
     ├─► persönliche XP ──► persönliches Level ──► kosmetische Freischaltung
     │        │
     │        └─►(×0,5)─► Stadt-XP ──► Stadtlevel ──► Stadtbereich-Freischaltung
     │
     ├─► Primärressource (Energie/Nahrung/Natur/Gemeinschaft)
     │        │
     │        └─► Wochenprojekt / (Wochenende) Baumaterial ──► Gebäude ──► Stadtwandel
     │
     ├─► Zielfortschritt (persönlich/gemeinsam)
     │
     └─► Missionsfortschritt (persönlich/gemeinsam)

 Wochenende ─► Balancewert ─► Balance-Bonus (Stadt-XP + Baumaterial)
```

Alle fett gekoppelten Berechnungen (XP, Ressourcen, Level, Balance, Baumaterial)
laufen **serverseitig** ([ADR-0005](./decisions/0005-server-side-rewards.md)).
