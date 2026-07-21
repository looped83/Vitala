# Missionen und Ziele

Missionen sind **system-generierte, kurzfristige Vorschläge**; Ziele sind
**nutzerdefinierte, längerfristige Vorhaben**. Beide sind **freiwillig** und erzeugen
nie Druck oder Strafe.

---

## 7. Missionssystem

### 7.1 Missionsarten

| Art                      | Zeitraum    | Anzahl          | Erzeugung                                   |
| ------------------------ | ----------- | --------------- | ------------------------------------------- |
| Persönliche Tagesmission | 1 Tag       | 1 pro Person    | automatisch (Morgen-Check-in oder Standard) |
| Gemeinsame Tagesmission  | 1 Tag       | 1 pro Household | automatisch                                 |
| Wochenmission            | 1 Woche     | 1–2             | automatisch (Wochenstart)                   |
| Monatsmission            | 1 Monat     | 1               | automatisch (Monatsstart)                   |
| Saisonale Mission        | Saison      | 1–2             | automatisch (Saisonwechsel, spätere Phase)  |
| Freie Ziele              | beliebig    | unbegrenzt      | manuell (siehe §8)                          |
| Adaptive Mission         | 1 Tag/Woche | –               | Regelbasiert an Tagesform/Balance angepasst |

### 7.2 Missionsdefinition (Datenfelder)

Jede Mission besitzt:

- **Titel** (kurz, freundlich)
- **Beschreibung** (ein Satz, konkret)
- **Kategorie** (Bewegung / Ernährung / Nachhaltigkeit / Tierwohl / gemeinsam)
- **Zieltyp** (`activity_count`, `duration_minutes`, `checkin`, `distinct_days`,
  `resource_amount`, `custom`)
- **Zielwert** (numerisch)
- **Zeitraum** (Tag/Woche/Monat/Saison, mit Start/Ende)
- **Belohnung** (XP-/Ressourcen-Bonus, siehe resources-and-xp §7)
- **Status** (`offered`, `active`, `completed`, `skipped`, `expired`)
- **Austauschbarkeit** (`swappable: bool`, max. 1 Tausch/Tag)
- **Fortschrittsberechnung** (serverseitig aus zugehörigen Einträgen abgeleitet)

### 7.3 Auswahllogik (adaptiv, regelbasiert)

Die Missionslogik ist **deterministisch und regelbasiert** (kein ML, kein externer
Dienst). Eingaben: Morgen-Check-in, Beiträge der letzten 3 Tage, Wochen-Balance,
Ausschlussliste.

Regeln (Priorität von oben):

1. **Erschöpfungsschutz:** War der Vortag intensiv (Bewegung-XP am Deckel), schlägt die
   persönliche Mission heute **keine** fordernde Bewegung vor, sondern Regeneration/
   Mobility/Ernährung/Nachhaltigkeit.
2. **Balance-Lenkung:** Bereiche mit den **wenigsten** Wochenbeiträgen werden bevorzugt.
   Ein Bereich, der diese Woche bereits überrepräsentiert ist, wird **nicht** erneut
   als Mission gewählt.
3. **Tagesform:** „ruhig/niedrige Energie" → sanfte Missionen; „aktiv/hohe Energie" →
   fordernde, aber realistische Missionen (Zielwert an bisherige Gewohnheiten gekoppelt,
   nie > 1,5× des persönlichen Wochendurchschnitts).
4. **Fokuswunsch:** Der im Check-in gewählte Fokus wird bevorzugt, sofern er Regel 2
   nicht verletzt.
5. **Wiederholungsvermeidung:** Keine identische Mission wie in den letzten 3 Tagen.
6. **Keine Doppelbelohnung bereits erledigter Dinge:** Eine Mission, deren Zielwert am
   Erstellungszeitpunkt schon erfüllt wäre, wird nicht angeboten.

### 7.4 Regeln gegen unerwünschte Muster

- **Gegen Wiederholung:** Ausschlussliste der letzten 3 Tage pro Person.
- **Gegen unrealistische Ziele:** Zielwert ≤ 1,5× persönlicher Wochendurchschnitt des
  jeweiligen Zieltyps (bei fehlender Historie konservative Startwerte).
- **Gegen Missionen trotz Erschöpfung:** Erschöpfungsschutz (Regel 1).
- **Gegen überrepräsentierte Bereiche:** Balance-Lenkung (Regel 2).
- **Gegen Doppelbelohnung Erledigtes:** Regel 6.

### 7.5 Interaktion

- **Austauschen:** 1×/Tag pro persönlicher Mission (Alternative aus balancegerechtem Pool).
- **Überspringen:** jederzeit, ohne Folge.
- **Keine Strafe** bei Nichterfüllung; nicht erfüllte Missionen laufen still ab
  (Status `expired`).

---

## 8. Ziele

Ziele sind **nutzerdefiniert** und flexibler als Missionen. Es gibt **persönliche** und
**gemeinsame** Ziele.

### 8.1 Zielarten (Zieltypen)

Aktivitäten (Anzahl) · aktive Tage · Trainingsminuten · Krafttraining (Anzahl) ·
Ausdauer (Anzahl/Minuten) · Mobility (Anzahl) · Spaziergänge (Anzahl) · gemeinsame
Aktivitäten (Anzahl) · gesunde vegane Mahlzeiten (Bausteine/Tage) · selbst gekocht
(Tage) · Nachhaltigkeitsaktionen (Anzahl) · Tierwohlaktionen (Anzahl) · ausgeglichene
Wochen (Anzahl) · frei definiertes Ziel (`custom`, manueller Fortschritt).

### 8.2 Zeiträume

Tag · Woche · Monat · Quartal · benutzerdefiniert (freies Start-/Enddatum).

### 8.3 Zielfelder

- **Titel, Beschreibung**
- **Zieltyp** (siehe 8.1) und **Zielwert**
- **Zeitraum** (Typ + Start/Ende)
- **Bereichszuordnung** (für Balance-Anzeige)
- **Gemeinsam?** (`is_shared: bool`)
- **Wiederkehrend?** (`recurrence: none | weekly | monthly | quarterly`)
- **Status** (`active`, `paused`, `completed`, `archived`)
- **Fortschritt** (serverseitig berechnet)

### 8.4 Fortschrittsberechnung

- Der Fortschritt wird **serverseitig** aus den zugrunde liegenden Einträgen
  (Aktivitäten/Rituale/Check-ins) im Zeitraum aggregiert – **nicht** clientseitig
  „hochgezählt" (verhindert Manipulation und Drift).
- **Gemeinsamer Fortschritt:** Bei `is_shared=true` zählen die Beiträge **beider**
  Personen; individuelle Anteile werden additiv ausgewiesen.
- **Teilerfolg:** Fortschritt < 100 % wird als Prozent/Balken gezeigt; kein „Scheitern".
- **Überschreitung:** Fortschritt > 100 % ist erlaubt und wird als „übertroffen"
  positiv dargestellt (kein Abschneiden).

### 8.5 Lebenszyklus

- **Wiederkehrende Ziele:** Bei `recurrence` startet nach Ablauf automatisch eine neue
  Periode; abgeschlossene Perioden werden archiviert (Historie bleibt).
- **Einmalige Ziele:** enden mit Ablauf oder Abschluss.
- **Anpassung:** Zielwert/Zeitraum änderbar, solange `active` (Änderungshistorie im
  `audit_log`).
- **Pausierung:** `paused` friert Fortschritt ein, ohne ihn zu verlieren.
- **Archivierung:** `archived` blendet aus, erhält aber Daten und Historie.

### 8.6 Abgrenzung Mission vs. Ziel

|              | Mission              | Ziel                                    |
| ------------ | -------------------- | --------------------------------------- |
| Erzeugung    | automatisch, adaptiv | manuell                                 |
| Zeithorizont | Tag–Saison           | Tag–Quartal/frei                        |
| Zweck        | tägliche Impulse     | selbstgesetzte Vorhaben                 |
| Anzahl       | begrenzt (kuratiert) | unbegrenzt                              |
| Belohnung    | Bonus-XP/Ressourcen  | Anerkennung + optionaler Abschlussbonus |

Beide speisen denselben Fortschritt (dieselben Einträge zählen für Mission **und** Ziel
**und** Balance – das ist **keine** Doppelzählung im XP-Sinn, weil XP nur **einmal** aus
der Ursprungshandlung entsteht; Missionen/Ziele werten nur **aus**, sie erzeugen nur
den definierten Bonus).
