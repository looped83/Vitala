# Produktprinzipien

Diese Prinzipien sind **verbindlich**. Jede Design-, Spiel- und
Architekturentscheidung wird an ihnen gemessen. Bei Konflikten gilt die Reihenfolge:
Gesundheit & Wohlbefinden > Kooperation > Positive Verstärkung > Balance >
Langzeitfortschritt > geringer Bedienaufwand.

---

## 2.1 Kooperation statt Wettbewerb

**Grundsatz:** Vitala kennt keinen Gewinner und keinen Verlierer.

Verbindliche Regeln:

- **Kein Ranking, keine Punkte-Gegenüberstellung** als Wettkampf. Persönliche
  Beiträge sind sichtbar, aber nie als Sieger/Verlierer-Vergleich.
- **Der wichtigste Fortschritt gehört beiden gemeinsam** (Stadt-XP, Stadtlevel,
  Gebäude). Persönliche Level sind sekundär und rein individuell/kosmetisch.
- **Keine gegeneinander gerichteten Missionen.** Gemeinsame Missionen und
  persönliche Missionen existieren; sie richten sich nie gegen die andere Person.
- **Keine Leistungsbewertung des Partners.** Niemand bewertet, kommentiert oder
  benotet die Aktivität der anderen Person.
- Individuelle Beiträge werden **additiv und wertschätzend** dargestellt
  („Ihr habt gemeinsam …", „Dein Beitrag diese Woche …"), nie subtraktiv.

**Konsequenz für die Umsetzung:** Kein Feature darf einen Zustand erzeugen, in dem
eine Person „vorne" oder „hinten" liegt. Vergleichende Zahlen werden nur als
gemeinsame Summe oder als individuelle Selbstreflexion gezeigt.

---

## 2.2 Positive Verstärkung

**Grundsatz:** Vitala belohnt, es bestraft nie.

Verbindliche Regeln:

- **Keine Bestrafung für ausgelassene Tage.** Ein leerer Tag ist neutral.
- **Keine verlorenen Streaks.** Streaks als Verlustmechanik sind verboten. Erlaubt
  sind höchstens sanfte, verlustfreie „Serien"-Anerkennungen ohne Countdown.
- **Keine aggressiven Warnfarben** (kein alarmierendes Rot als Grundstimmung),
  keine „Du hast X verpasst"-Kommunikation.
- **Keine Schuldzuweisungen, keine abwertenden Formulierungen.**
- **Keine künstliche Verknappung** (keine „nur noch heute!"-Timer, keine
  ablaufenden Belohnungen als Druckmittel).
- **Keine tägliche Pflichtnutzung.** Die App funktioniert auch bei
  unregelmäßiger Nutzung sinnvoll.
- **Erreichter Fortschritt bleibt bestehen.** Gebäude, Level und Ressourcen werden
  nie zurückgesetzt oder entzogen (außer bei expliziter Korrektur durch die Person).

---

## 2.3 Balance statt Maximierung

**Grundsatz:** Die vier Lebensbereiche sind **gleichwertig**.

Die vier Bereiche:

1. **Bewegung**
2. **Vegane und gesunde Ernährung**
3. **Nachhaltigkeit**
4. **Tierwohl und Biodiversität**

Verbindliche Regeln:

- Kein Bereich darf **dauerhaft die optimale Punktequelle** sein. Die XP-Deckelung
  pro Bereich und Tag ist so kalibriert, dass kein Bereich pro Zeiteinheit dauerhaft
  überlegen ist (siehe [resources-and-xp.md](./resources-and-xp.md)).
- Ausgewogene Wochen werden **zusätzlich** belohnt (Balance-Bonus), einseitige
  Wochen werden **nicht bestraft**.
- Gebäude und Stadtbereiche verteilen sich über alle vier Bereiche, damit langfristig
  alle Bereiche „gebraucht" werden.

---

## 2.4 Gesundheit statt Überforderung

**Grundsatz:** Vitala schützt vor ungesunden Anreizen.

Verbindliche Regeln:

- **Kleine Aktivitäten zählen** spürbar (10 Minuten Mobility sind wertvoll).
- **Regeneration zählt** als eigenständige, positiv bewertete Aktivität.
- **Leichte Tage zählen.** Ein ruhiger Tag ist ein guter Tag.
- **Intensität wird nicht automatisch stärker belohnt.** Intensität ist ein
  optionaler, gedeckelter Modifikator (±10 %), kein Multiplikator.
- **Lange Aktivitäten erzeugen keine unbegrenzten Punkte** (Diminishing Returns +
  harte Deckel pro Aktivität und pro Tag).
- **Kein Belohnungssystem für Übertraining.** Tagesdeckel begrenzen die maximale XP.
- **Kein Belohnungssystem für restriktives Essen.** Es gibt keine Belohnung für
  Auslassen von Mahlzeiten, Kaloriendefizite oder Gewichtsabnahme.
- **Keine Gewichtsabnahme als Ziel.** Gewicht wird nicht erfasst und nicht belohnt.

---

## 2.5 Sichtbarer Langzeitfortschritt

**Grundsatz:** Fortschritt ist dauerhaft, bedeutungsvoll und erzählbar.

Verbindliche Regeln:

- Die Stadt wächst über **Monate und Jahre**.
- **Gebäude bleiben dauerhaft erhalten** und verfallen nie.
- Entwicklungsschritte sind später **nachvollziehbar** (Stadtgeschichte / City Events).
- **Freischaltungen haben Bedeutung** – sie sind an echte, dokumentierte Beiträge
  gebunden und werden narrativ verankert.
- Die **gemeinsame Geschichte** bleibt sichtbar und abrufbar.

---

## 2.6 Geringer Bedienaufwand

**Grundsatz:** Vitala respektiert die Zeit seiner Nutzer.

Verbindliche Zeitbudgets:

- **Morgen-Check-in: maximal 1 Minute.**
- **Abend-Check-in: maximal 1 Minute.**
- **Aktivitätserfassung: möglichst unter 30 Sekunden.**

Verbindliche Regeln:

- Keine unnötigen Eingabefelder; jedes Pflichtfeld muss begründet sein.
- Keine komplexe tägliche Datenerfassung.
- **Kein vollständiges Kalorien- oder Makrotracking.**
- Schnellaktionen und wiederkehrende Favoriten reduzieren den Aufwand.

---

## Anwendung der Prinzipien (Checkliste für spätere Phasen)

Vor jedem Feature-Merge ist zu prüfen:

- [ ] Erzeugt das Feature Wettbewerb oder Vergleich zwischen den Personen? → verboten
- [ ] Kann das Feature Schuld, Druck oder Verlust erzeugen? → verboten
- [ ] Wird ein Lebensbereich dadurch dauerhaft optimal? → nachjustieren
- [ ] Belohnt es Intensität, Länge, Restriktion oder Gewicht überproportional? → verboten
- [ ] Bleibt erreichter Fortschritt erhalten? → Pflicht
- [ ] Überschreitet die Bedienung die Zeitbudgets? → vereinfachen
