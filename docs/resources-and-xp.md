# Ressourcen, XP und Level – Mathematik

Dieses Dokument definiert die **gesamte Spielmathematik** nachvollziehbar und testbar.
Alle kritischen Berechnungen erfolgen serverseitig ([ADR-0005](./decisions/0005-server-side-rewards.md)).
Rundung überall: **kaufmännisch auf ganze Zahlen** (`round`, .5 → auf), sofern nicht anders angegeben.

---

## 1. XP-Modell

Es gibt **zwei getrennte XP-Ströme** ([ADR-0003](./decisions/0003-xp-model.md)):

- **Persönliche XP** (`experience_transactions`, pro Person) → **persönliches Level**.
- **Stadt-XP** (Household) → **Stadtlevel**.

Regel: **Jede belohnte Handlung erzeugt persönliche XP; ein Teil davon fließt als
Stadt-XP an die gemeinsame Stadt.**

`stadt_xp = round(0,5 × persönliche_xp) + Boni`

Begründung: Persönlicher Fortschritt bleibt spürbar individuell, aber die Stadt (das
gemeinsame Herzstück) wächst nur, wenn _beide_ beitragen – 50 % Kopplung sorgt dafür,
dass gemeinsame Regelmäßigkeit stärker wirkt als individuelle Spitzen.

---

## 2. XP-Quellen und Tagesdeckel

| Quelle                            | XP-Regel                                | Tagesdeckel (persönlich) |
| --------------------------------- | --------------------------------------- | ------------------------ |
| Bewegung                          | Basis(Dauer) × Typ-Gewicht × Intensität | 30                       |
| Ernährung                         | 2 je Baustein                           | 12                       |
| Nachhaltigkeit (Alltag)           | 2 je Handlung                           | 10                       |
| Nachhaltigkeit (besondere Aktion) | 5, max 1×/Tag                           | +5 (über Deckel)         |
| Tierwohl (Alltag)                 | 2 je Handlung                           | 10                       |
| Tierwohl (besondere Aktion)       | 5, max 1×/Tag                           | +5 (über Deckel)         |
| Morgen-/Abend-Check-in            | je 1 (nur als sanfter Impuls)           | 2 gesamt                 |

**Maximale persönliche XP/Tag (theoretisch):** 30 + 12 + 15 + 15 + 2 = **74 XP**.
Realistischer Alltagstag: 15–30 XP. Diese Obergrenze ist bewusst niedrig, damit
Regelmäßigkeit über Wochen mehr zählt als ein einzelner „Maximaltag".

### Bewegung – Basis nach Dauer

| Dauer    | Basis |
| -------- | ----- |
| ≤ 10 min | 4     |
| 11–20    | 6     |
| 21–35    | 9     |
| 36–55    | 12    |
| 56–80    | 14    |
| 81–120   | 15    |
| > 120    | 15    |

Typ-Gewichte: Kraft/Ausdauer 1,1 · Kurs 1,05 · Wandern 1,05 · Beweglichkeit/
Alltagsbewegung/Regeneration/Sonstiges 1,0. Intensität: leicht 0,95 · mittel 1,0 ·
intensiv 1,10. Regeneration: fester Wert **6 XP**, max 1×/Tag.

### Warum kein Bereich dauerhaft dominiert

Bewegung hat den höchsten Deckel (30), erfordert aber echte Zeit (≈ 60–90 min für den
Deckel). Ernährung/Nachhaltigkeit/Tierwohl sind in Sekunden erreichbar, aber niedriger
gedeckelt. **XP pro investierter Minute** ist über die Bereiche vergleichbar; wer
optimieren will, kommt am schnellsten durch **Balance** ans Ziel (Balance-Bonus, §7).

---

## 3. Levelkurve (persönlich)

Bewertete Modelle:

| Modell                     | Formel                 | Bewertung                           |
| -------------------------- | ---------------------- | ----------------------------------- |
| Linear                     | konstante XP pro Level | zu schnell „ausgelevelt", langweilt |
| Feste Schwellen (Tabelle)  | handgepflegt           | unflexibel, schwer erweiterbar      |
| **Progressiv (Inkrement)** | `req(L) = 80 + 40·L`   | **gewählt**: transparent, testbar   |
| Exponentiell               | `req(L)=a·b^L`         | zu steil, entmutigt langfristig     |

**Gewählt:** Progressive, linear ansteigende Kosten. XP, um von Level `L` auf `L+1` zu
kommen:

```
req(L) = 80 + 40 · L        (L = 1,2,3,…)
```

Kumulierte XP, um Level `N` zu erreichen (Start Level 1 bei 0 XP):

```
total(N) = Σ_{L=1}^{N-1} req(L) = 80·(N-1) + 40·((N-1)·N/2)
```

Beispiel-Schwellen:

| Level   | req(L→L+1) | Kumulierte XP bis Level |
| ------- | ---------- | ----------------------- |
| 1 → 2   | 120        | 0                       |
| 2 → 3   | 160        | 120                     |
| 3 → 4   | 200        | 280                     |
| 5 → 6   | 280        | 800                     |
| 10 → 11 | 480        | 3.480                   |
| 20 → 21 | 880        | 15.160                  |

Bei ~20 XP/Tag erreicht eine Person Level 10 in ~6 Monaten – ein bewusst ruhiges Tempo.

---

## 4. Stadtlevel

Stadt-XP speist das **Stadtlevel** mit einer etwas flacheren, aber ebenfalls
progressiven Kurve, weil beide gemeinsam einzahlen:

```
req_city(L) = 200 + 120 · L
```

Stadtlevel schalten Stadtbereiche und Gebäudekategorien frei (siehe
[city-and-world-concept.md](./city-and-world-concept.md), §6.4). Ein Levelaufstieg der
Stadt wird als **City Event** archiviert und in der Stadtgeschichte sichtbar.

**Kopplung Stadtlevel ↔ Gebäudelevel:** Das Stadtlevel bestimmt, **welche** Gebäude
und Ausbaustufen verfügbar sind (Freischaltung). Gebäude selbst werden über Ressourcen
gebaut (nicht über XP). So bleibt XP „Wachstum/Fortschritt" und Ressourcen „konkreter
Bau" sauber getrennt.

---

## 5. Ressourcen

**Entscheidung** ([ADR-0002](./decisions/0002-resource-model.md)): **5 aktiv verdiente
Ressourcen** + **1 abgeleitete** (Baumaterial). „Wissen" wird als eigene Ressource
**verworfen** (es entstünde ein schwach genutzter Zähler); Wissensaspekte fließen
stattdessen in „Gemeinschaft". „Erfahrung" ist **keine** Ressource, sondern der
separate XP-Strom.

| Ressource        | Symbol | Quelle                                     | Verwendung                           |
| ---------------- | ------ | ------------------------------------------ | ------------------------------------ |
| **Energie**      | ⚡     | Bewegung                                   | Sportgebäude                         |
| **Nahrung**      | 🌱     | Ernährung                                  | Garten-/Versorgungsgebäude           |
| **Natur**        | 🌿     | Nachhaltigkeit + Tierwohl                  | Umwelt-/Biodiversitätsgebäude        |
| **Gemeinschaft** | 🤝     | gemeinsame Aktivitäten, Rituale, Check-ins | Gemeinschafts-/Kulturgebäude         |
| **Baumaterial**  | 🧱     | _abgeleitet_ (siehe §5.2)                  | universeller Baustoff aller Projekte |

> **Hinweis zur Kohärenz mit den Lebensbereichen:** Nachhaltigkeit und Tierwohl teilen
> sich die Ressource **Natur**, behalten aber **getrennte XP- und Balance-Zähler**
> (vier Bereiche bleiben für Balance eigenständig). Das hält die Ressourcenzahl bei 5,
> ohne die Vier-Bereiche-Balance aufzuweichen.

### 5.1 Vergabelogik (aktiv verdiente Ressourcen)

Jede belohnte Handlung erzeugt neben XP eine Primärressource:

```
ressourcen_menge = round(persönliche_xp_der_handlung × 0,4)
```

Zuordnung: Bewegung→Energie, Ernährung→Nahrung, Nachhaltigkeit→Natur, Tierwohl→Natur.
**Gemeinschaft** entsteht zusätzlich bei:

- gemeinsamer Aktivität: +2 Gemeinschaft je Person,
- erfüllter gemeinsamer Mission: +3 Gemeinschaft,
- Morgen-/Abend-Check-in: +1 Gemeinschaft.

Beispiel: 60 min Krafttraining → 15 XP → `round(15×0,4)=6` **Energie**.

### 5.2 Baumaterial (abgeleitet)

Baumaterial wird **nicht direkt gefarmt**, sondern nur beim Wochenabschluss aus den
gesammelten Ressourcen erzeugt – und zwar **balanceabhängig**:

```
baumaterial_woche = round( min(Energie, Nahrung, Natur, Gemeinschaft)_der_Woche × 0,5
                           + Balance_Bonus_Material )
```

Der `min(...)`-Term bewirkt, dass Baumaterial vor allem durch **ausgewogene** Wochen
entsteht: Wer nur einen Bereich bedient, erzeugt wenig Baumaterial. Das ist der zentrale
ökonomische Hebel für Balance, ohne Bestrafung (einseitige Wochen erzeugen trotzdem
etwas, nur weniger).

### 5.3 Speicherung, Deckelung, Rundung, Historie

- **Speicherung:** Ressourcenstände pro Household in `resources`; jede Änderung als
  Zeile in `resource_transactions` (Append-only Ledger, siehe [data-model.md](./data-model.md)).
- **Deckelung (Lager):** Weicher Lagerdeckel je Ressource = **500** in V1; darüber
  hinaus verdiente Ressourcen werden als „Überschuss" markiert und verfallen **nicht**,
  können aber erst nach Bau/Ausgabe wieder einfließen (kein Verlust – Prinzip 2.2).
- **Rundung:** immer auf ganze Einheiten; Teilbeträge werden pro Transaktion gerundet,
  nicht kumuliert (verhindert Rundungsdrift).
- **Transaktionshistorie:** Jede Vergabe/Ausgabe/Erstattung ist im Ledger mit Grund
  (`reason`), Quelle (`source_id`) und Vorzeichen erfasst → vollständige Auditierbarkeit.

### 5.4 Verwendung, Rückerstattung, Manipulationsschutz

- **Verwendung:** Ressourcen werden ausschließlich für **Bauprojekte** ausgegeben.
- **Rückerstattung (Refund):** Wird ein Bauprojekt vor Fertigstellung abgebrochen,
  werden **100 %** der eingezahlten Ressourcen zurückgebucht (verlustfreies Prinzip).
- **Manipulationsschutz:** Alle Vergaben/Abbuchungen laufen über serverseitige
  PostgreSQL-Funktionen mit Idempotenzschlüssel; der Client kann Ressourcenstände
  **nie direkt schreiben** (RLS: `resources`/`resource_transactions` nur via RPC).

---

## 6. Beispielhafte Berechnungen (End-to-End)

Annahmen: mittlere Intensität, keine Sonderboni außer angegeben.

| Szenario                              | Persönliche XP          | Stadt-XP (50 %)       | Primärressource                   |
| ------------------------------------- | ----------------------- | --------------------- | --------------------------------- |
| Kurze Aktivität (15 min Spaziergang)  | Basis 6 ×1,0 = **6**    | 3                     | +2 Energie                        |
| Normale Aktivität (45 min Yoga)       | Basis 12 ×1,0 = **12**  | 6                     | +5 Energie                        |
| Lange Aktivität (120 min Wandern)     | Basis 15 ×1,05 = **16** | 8                     | +6 Energie                        |
| Gemeinsames Training (50 min, beide)  | je **14** ×1,1 = 15     | **8 gesamt** (einmal) | je +6 Energie, je +2 Gemeinschaft |
| Ernährungstag (6 Bausteine)           | 12 (Deckel)             | 6                     | +5 Nahrung                        |
| Nachhaltigkeitsaktion (3 Alltag)      | **6**                   | 3                     | +2 Natur                          |
| Tierwohlaktion (besondere Aktion)     | **5**                   | 3 (round 2,5)         | +2 Natur                          |
| Abgeschlossene Woche (Beispiel unten) | –                       | +Balance-Bonus        | +Baumaterial                      |

**Gemeinsames Training – Detail:** Beide erfassen ihre Einheit (je 15 persönliche XP,
je 6 Energie, je 2 Gemeinschaft). Der **Stadt-XP** wird über die gemeinsame
`activity_group_id` **nur einmal** gewertet: `round(0,5 × 15) = 8` Stadt-XP (nicht 16).

**Abgeschlossene Woche – Beispiel:** Wochensummen Energie 90, Nahrung 60, Natur 70,
Gemeinschaft 40. Baumaterial = `round(min(90,60,70,40)×0,5) = round(20) = 20` + Balance-
Bonus-Material (siehe §7). War die Woche ausgewogen (alle vier Bereiche ≥ Mindestwert),
zusätzlich **+30 Stadt-XP** und **+10 Baumaterial**.

---

## 7. Boni

| Bonus                     | Bedingung                        | Wirkung                          |
| ------------------------- | -------------------------------- | -------------------------------- |
| **Wochenbonus**           | Wochenprojekt fertiggestellt     | +25 Stadt-XP                     |
| **Missionsbonus**         | persönliche Mission erfüllt      | +5 pers. XP                      |
| **Gemeinsame Mission**    | erfüllt                          | +8 Stadt-XP, +3 Gemeinschaft     |
| **Balance-Bonus (Woche)** | alle 4 Bereiche ≥ Mindestbeitrag | +30 Stadt-XP, +10 Baumaterial    |
| **Langzeit-Balance**      | 4 Wochen in Folge ausgewogen     | +50 Stadt-XP (einmalig je Serie) |

Alle Boni sind **additiv und verlustfrei**. Es gibt keinen Malus als Gegenstück.
Details zur Balance-Definition: [game-system.md](./game-system.md), §6.5.

---

## 8. Zeit- und Grenzlogik

- **Tag:** lokaler Kalendertag in der Household-Zeitzone (Standard `Europe/Berlin`).
  Tagesdeckel gelten pro lokalem Kalendertag.
- **Wochenwechsel:** Montag 00:00 Household-Zeit; offene Projekte werden fortgeschrieben.
- **Monatswechsel:** relevant für Monatsmissionen/-ziele; kalendarisch, Household-Zeit.
- **Rückwirkende Erfassung** (bis 7 Tage) wird dem **historischen** Tag zugeordnet und
  dessen Tagesdeckel unterworfen; Wochensummen werden serverseitig neu berechnet.

Details der Zeitzonenstrategie: [technical-architecture.md](./technical-architecture.md), §15.1.
