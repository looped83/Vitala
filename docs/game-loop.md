# Kernloop – täglich und wöchentlich

Der Kernloop ist bewusst **kurz, freiwillig und druckfrei**. Kein Schritt ist Pflicht;
die App bleibt auch bei ausgelassenen Schritten sinnvoll. Alle Check-ins respektieren
die Zeitbudgets aus [product-principles.md](./product-principles.md) (§2.6).

```
              ┌─────────────────── Täglicher Loop ───────────────────┐
              │                                                       │
  Morgen-Check-in (≤1 min) ──► Tagesmissionen ──► Aktivität/Ritual erfassen
              │                                          │
              │                                          ▼
              │                                    Belohnung (XP, Ressourcen,
              │                                    Ziel-/Missions-/Stadtbeitrag)
              │                                          │
              └──────────────► Abend-Check-in (≤1 min) ◄─┘

  ┌──────────────────────── Wöchentlicher Loop ────────────────────────┐
  Wochenstart ──► Bauprojekt wählen ──► Beiträge sammeln ──► Wochenabschluss
        ▲                                                        │
        └──────────── Fortschreibung offener Projekte ◄──────────┘
```

---

## 5.1 Morgen-Check-in (max. 1 Minute)

**Zweck:** Tagesform erfassen, passende Missionen generieren, Fokus setzen.

**Eingaben:**

| Feld                       | Pflicht? | Werte                                                         |
| -------------------------- | -------- | ------------------------------------------------------------- |
| Energielevel               | optional | niedrig / mittel / hoch                                       |
| Verfügbare Zeit            | optional | wenig / normal / viel                                         |
| Gewünschte Tagesintensität | optional | ruhig / ausgewogen / aktiv                                    |
| Heutiger Fokus             | optional | Bewegung / Ernährung / Nachhaltigkeit / Tierwohl / kein Fokus |
| Tageswunsch (Freitext)     | optional | kurze Notiz                                                   |

**Es gibt kein Pflichtfeld.** Ein Ein-Klick-„Los geht's" ohne Angaben ist erlaubt und
erzeugt Standardmissionen.

**Ableitung von Missionen:** Aus Energielevel + verfügbarer Zeit + Fokus wählt die
Missionslogik passende Vorschläge (siehe [missions-and-goals.md](./missions-and-goals.md)):

- „ruhig"/niedrige Energie → sanfte Missionen (Mobility, Spaziergang, Regeneration).
- „aktiv"/hohe Energie → fordernde, aber realistische Missionen.
- Fokus-Bereich wird bevorzugt, **außer** dieser Bereich ist diese Woche bereits
  überrepräsentiert (Balance-Regel).

**Wiederholungsvermeidung:** Missionen der letzten 3 Tage werden nicht identisch
wiederholt; die Missionslogik führt eine Ausschlussliste pro Person.

---

## 5.2 Tagesmissionen

Pro Tag werden erzeugt:

- **1 persönliche Mission für Lutz**
- **1 persönliche Mission für René**
- **1 gemeinsame Mission** (Household)

**Interaktionen:**

- **Austauschen:** Jede persönliche Mission kann 1× pro Tag gegen einen Alternativ­
  vorschlag getauscht werden (Bereich bleibt balancegerecht).
- **Überspringen:** Missionen können ohne Konsequenz übersprungen werden.
- **Keine Strafe bei Nichterfüllung.** Nicht erfüllte Missionen verfallen still.

**Berücksichtigt werden:**

- Die letzten Tage (keine Wiederholung, Erholung nach intensiven Tagen).
- Balance (Bereiche mit wenig Beiträgen werden sanft bevorzugt).
- Tagesform (Morgen-Check-in).

Details der Auswahllogik: [missions-and-goals.md](./missions-and-goals.md).

---

## 5.3 Aktivität oder Ritual erfassen

**Erfassungswege:**

- **Manuelle Erfassung** über ein schlankes Formular (Typ + Dauer + Datum).
- **Schnellaktionen:** Ein-Tap-Buttons für die häufigsten Aktivitäten.
- **Wiederkehrende Favoriten:** persönlich konfigurierbare Vorlagen.
- **Gemeinsam absolvierte Aktivität:** Flag „gemeinsam" erfasst die Aktivität für
  beide Personen (siehe Doppelzählungsschutz unten).
- **Nachträgliche Erfassung:** Datum frei wählbar (bis zu 7 Tage rückwirkend).
- **Bearbeitung / Löschung:** jederzeit möglich; Belohnungen werden serverseitig
  korrekt zurückgerechnet (siehe [technical-architecture.md](./technical-architecture.md)).

**Schutz vor doppelter Belohnung:**

- **Gemeinsame Aktivität** erzeugt für jede Person **ihren eigenen** Aktivitätseintrag
  und persönliche XP, aber der **Stadt-XP-Beitrag wird nur einmal** gezählt (Verweis
  auf eine gemeinsame `activity_group_id`). So wird eine gemeinsame Einheit nicht
  doppelt für die Stadt gewertet, beide erhalten aber ihre persönliche Anerkennung.
- Idempotenz über eindeutige Eintrags-IDs; erneutes Absenden erzeugt keinen zweiten
  Eintrag (siehe [ADR-0005](./decisions/0005-server-side-rewards.md)).

---

## 5.4 Belohnung

Nach jeder Erfassung wird **transparent** angezeigt:

- **Erfahrungspunkte** (persönliche XP und Stadt-XP getrennt ausgewiesen).
- **Ressourcen** (welche Ressource wie viel; siehe [resources-and-xp.md](./resources-and-xp.md)).
- **Zielbeitrag** (welche persönlichen/gemeinsamen Ziele wie weit vorangekommen sind).
- **Missionsbeitrag** (welche Mission erfüllt/vorangekommen ist).
- **Wochenprojektbeitrag** (welche Ressource ins aktuelle Bauprojekt fließt).
- **Stadtfortschritt** (Stadt-XP-Balken, ggf. Levelaufstieg / Freischaltung).

**Nachvollziehbarkeit:** Jede Belohnung zeigt ihre Herkunft als kurze Aufschlüsselung
(„6 XP Basis × 1,1 Kraft = 7 XP", „+2 Energie"). Keine undurchsichtige Punktelogik.

---

## 5.5 Abend-Check-in (max. 1 Minute)

**Inhalte (alle optional):**

- Erledigte Missionen bestätigen (Häkchen; auch spätere Bestätigung möglich).
- Tagesgefühl (Emoji-Skala, rein persönlich, keine Auswertung nach „gut/schlecht").
- Positiver Tagesmoment (kurzer Freitext, optional).
- Kurze Reflexion (optional).
- **Zusammenfassung:** Ressourcen des Tages, Stadtveränderung, Ausblick auf morgen.

Der Abend-Check-in ist primär ein **ruhiger Rückblick**, keine Dateneingabe. Er darf
komplett übersprungen werden.

---

## 5.6 Wochenzyklus

**Wochenstart (Montag, konfigurierbar):**

- Rückblick auf die Vorwoche (Beiträge, Balance, Highlights).
- **Auswahl eines gemeinsamen Bauprojekts** aus verfügbaren, freigeschalteten Projekten.
- Anzeige des **Ressourcenbedarfs** des gewählten Projekts.

**Während der Woche:**

- Aktivitäten und Rituale erzeugen Ressourcen, die (teilweise) ins Bauprojekt fließen.
- **Fortschrittsanzeige** des Projekts (benötigt / vorhanden je Ressource).
- **Individuelle und gemeinsame Beiträge** werden additiv sichtbar gemacht.

**Wochenabschluss (Sonntagabend):**

- **Rückblick:** erreichte Ziele, Balance-Bewertung, Highlights, Stadtveränderungen.
- **Balance-Bonus** bei ausgewogener Woche (siehe [game-system.md](./game-system.md)).
- Fertiggestellte Projekte werden dauerhaft gebaut und als City Event archiviert.

**Fortschreibung offener Projekte (verbindliche Regel):**

- **Nicht abgeschlossene Projekte gehen nie verloren.** Der bisherige Fortschritt
  (eingezahlte Ressourcen) bleibt vollständig erhalten.
- Zu Wochenbeginn kann dasselbe Projekt **fortgesetzt** oder pausiert werden; ein
  pausiertes Projekt behält seinen Fortschritt unbegrenzt.
- Ressourcen, die für ein Projekt eingezahlt wurden, sind reserviert, aber auf Wunsch
  vor Fertigstellung **zurückholbar** (Refund, siehe [resources-and-xp.md](./resources-and-xp.md)).

Diese Fortschreibungslogik ist **fair**: Wer eine schwächere Woche hatte, verliert
nichts, sondern setzt in der Folgewoche einfach fort.
