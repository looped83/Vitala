# Kern-User-Flows

Jeder Flow ist mit Startpunkt, Schritten, Entscheidungen, Fehlerfällen, Erfolg,
Accessibility-Hinweisen und mobilen Besonderheiten dokumentiert. Grundhaltung:
druckfrei, verlustfrei, ≤ Zeitbudgets aus product-principles §2.6.

Legende: **S** = Schritt, **E** = Entscheidung, **F** = Fehlerfall, **✓** = Erfolg,
**A11y** = Accessibility, **📱** = mobile Besonderheit.

---

## 14.1 Erster App-Start

- **Start:** App wird zum ersten Mal geöffnet (kein Konto).
- S1: Willkommen-Screen (Vision in einem Satz).
- S2: Registrierung (E-Mail + Passwort via Supabase Auth).
- E: Neues Household erstellen **oder** Einladung annehmen (Deep-Link/Code).
- S3: Bei „neu": Household-Erstellung (siehe 14.2). Bei „Einladung": Beitritt (14.3).
- ✓: Landung auf „Heute" mit einladendem Startzustand der Stadt.
- F: E-Mail bereits vergeben → Hinweis + „Anmelden"; ungültige Einladung → Hinweis.
- A11y: Formulare vollständig beschriftet, Fehlermeldungen mit Feld verknüpft.
- 📱: PWA-Installationshinweis dezent nach erstem erfolgreichem Login.

## 14.2 Household-Erstellung

- **Start:** „Neues Household erstellen".
- S1: Household-Name (optional, Vorschlag „Vitala von Lutz & René").
- S2: Zeitzone (Standard `Europe/Berlin`) und Wochenstart (Standard Montag) bestätigen.
- S3: Startstadt wird angelegt (Wohnhaus, Platz, erste Baufläche).
- ✓: Ersteller ist Mitglied mit Rolle `owner`; Stadt sichtbar.
- F: kein Netz → lokal gehalten, später synchronisiert (Outbox).
- A11y: Auswahlfelder als native Selects, klare Labels.

## 14.3 Zweites Mitglied hinzufügen

- **Start:** Profil & Einstellungen → Household → „Person einladen" (nur `owner`).
- S1: Einladungslink/Code generieren (zeitlich begrenzt, siehe security-and-privacy).
- E: Teilen via beliebigem Kanal (kein integriertes Social-Sharing).
- S2: Zweite Person öffnet Link → Registrierung/Anmeldung → Beitritt.
- S3: Rolle `member`; Zugriff auf gemeinsame Stadt und Daten.
- ✓: Household hat zwei Mitglieder; gemeinsame Missionen/Ziele werden aktiv.
- F: Household bereits voll (2/2) → Einladung abgelehnt („Household ist vollständig.").
- F: Abgelaufener Code → neuen anfordern.
- A11y: Code als kopierbarer Text (nicht nur QR); Screenreader-lesbar.

## 14.4 Morgen-Check-in

- **Start:** „Heute" → Karte „Guten Morgen". (Alles optional, ≤ 1 min.)
- S1: Energielevel wählen (optional).
- S2: Zeit/Intensität/Fokus wählen (optional).
- E: „Los geht's" (auch ohne Eingaben).
- S3: System erzeugt Tagesmissionen (Regeln: missions-and-goals §7.3).
- ✓: Missionen sichtbar; +1 Gemeinschaft.
- F: Offline → Check-in lokal, Missionen aus zuletzt bekannten Regeln, Sync später.
- A11y: Auswahl per Radiogruppen, Tastatur bedienbar, kein Zeitdruck-Timer.
- 📱: als kompaktes Bottom-Sheet.

## 14.5 Mission ansehen

- **Start:** „Heute" → Missionskarten.
- S1: Mission antippen → Detail (Titel, Beschreibung, Fortschritt, Belohnung).
- E: Austauschen (1×/Tag) / Überspringen / offen lassen.
- ✓: bei Erfüllung automatischer Fortschritt aus erfassten Einträgen.
- A11y: Fortschritt als Text + Balken; Status per `aria-live` bei Aktualisierung.

## 14.6 Aktivität erfassen

- **Start:** „Erfassen → Bewegung" oder zentraler +-Button / Schnellaktion.
- S1: Aktivitätstyp wählen (oder Favorit/Schnellaktion → vorbefüllt).
- S2: Dauer eingeben; Datum (Standard heute); optional Intensität/Ort/Notiz.
- E: „gemeinsam"-Flag setzen (→ 14.7).
- S3: Speichern → **optimistische** Anzeige des Eintrags.
- ✓: Belohnung erscheint transparent (XP, Ressource, Ziel-/Missions-/Stadtbeitrag).
- F: Dauer < 5 oder > 300 min → Validierungshinweis. Offline → Outbox, später Sync;
  finale Belohnung nach Serverbestätigung.
- A11y: numerisches Feld mit Label + Einheit; Schnellaktionen als Buttons mit klarem Namen.
- 📱: Ziel unter 30 s; Schnellaktionen als große Kacheln.

## 14.7 Gemeinsame Aktivität erfassen

- **Start:** Aktivitätsformular mit „gemeinsam".
- S1: Erfassende Person füllt Typ/Dauer aus; zweite Person wird als Teilnehmer markiert.
- S2: Speichern erzeugt **einen Eintrag pro Person** (persönliche XP für beide) mit
  gemeinsamer `activity_group_id`.
- ✓: Stadt-XP wird **nur einmal** gewertet; beide erhalten +2 Gemeinschaft.
- F: zweite Person nicht im Household → nicht wählbar.
- A11y: Teilnehmerauswahl als beschriftete Checkbox/Toggle.

## 14.8 Ernährungsritual erfassen

- **Start:** „Erfassen → Ernährung".
- S1: Ernährungsbausteine als Chips auswählen (Mehrfachauswahl).
- S2: Speichern (max. 1 Check-in/Tag).
- ✓: bis 12 XP, +Nahrung; transparente Aufschlüsselung.
- F: bereits heute erfasst → Hinweis „Du kannst dein heutiges Ernährungs-Check-in
  bearbeiten" (kein zweiter Eintrag).
- A11y: Chips als Toggle-Buttons mit `aria-pressed`.

## 14.9 Nachhaltigkeitsaktion erfassen

- **Start:** „Erfassen → Nachhaltigkeit".
- S1: Alltagshandlungen (Chips, je 2 XP) und/oder besondere Aktion (1×/Tag, 5 XP, Notiz).
- S2: Speichern.
- ✓: bis 10 (+5) XP, +Natur.
- F: Handlung heute schon gewählt → ausgegraut.
- A11y: klare Gruppierung „Alltag" vs. „Besondere Aktion".

## 14.10 Tierwohlaktion erfassen

- **Start:** „Erfassen → Tierwohl & Biodiversität".
- Analog 14.9 (Chips + besondere Aktion). „Veganer Tag" hier als eigenständige
  Tierwohl-Handlung (getrennt vom Ernährungs-Check-in, siehe life-areas §4.4).
- ✓: bis 10 (+5) XP, +Natur.

## 14.11 Abend-Check-in

- **Start:** „Heute" → „Guten Abend" (alles optional, ≤ 1 min).
- S1: Missionen bestätigen; Tagesgefühl/Moment/Reflexion optional.
- S2: Zusammenfassung ansehen (Ressourcen, Stadtimpuls, Ausblick).
- ✓: +1 Gemeinschaft; ruhiger Abschluss.
- F: Offline → lokal, Sync später.
- A11y: keine Pflicht, kein Timer; Emoji-Skala mit Textlabels.

## 14.12 Wochenprojekt auswählen

- **Start:** „Stadt → Bauen" (Wochenstart).
- S1: Liste freigeschalteter Projekte mit Ressourcenbedarf und Nutzen.
- E: Projekt wählen **oder** offenes Projekt fortsetzen (Fortschritt bleibt).
- ✓: Projekt aktiv; Fortschrittsanzeige im „Heute".
- F: nichts freigeschaltet → Hinweis auf nächstes Stadtlevel + was dazu beiträgt.
- A11y: Projektkarten mit Namen, Kosten, Nutzen als strukturierte Liste.

## 14.13 Gebäude bauen

- **Start:** aktives Wochenprojekt / Gebäude mit ausreichenden Ressourcen.
- S1: „Bauen" → serverseitige Ressourcenprüfung/-abbuchung (RPC, idempotent).
- S2: Baufortschritt = eingezahlt/benötigt (keine Echtzeit-Wartezeit).
- ✓: bei 100 % → Gebäude erscheint, City Event, Stadtwandel, +Wochenbonus Stadt-XP.
- E: Abbruch vor Fertigstellung → 100 % Refund.
- F: Ressourcen reichen nicht → „Es fehlen noch X Baumaterial" (freundlich, kein Fehler).
- A11y: Bau-Bestätigung als Dialog mit Fokusfalle; Ergebnis per `aria-live` angekündigt.

## 14.14 Ziel erstellen

- **Start:** „Ziele → Ziel erstellen".
- S1: Titel, Zieltyp, Zielwert, Zeitraum, Bereich, gemeinsam?, wiederkehrend?.
- S2: Speichern.
- ✓: Ziel aktiv; Fortschritt serverseitig aus Einträgen berechnet.
- F: unplausibler Zielwert → Hinweis (keine harte Sperre außer Grenzwerten).
- A11y: mehrstufiges Formular mit klaren Labels; Zusammenfassung vor Speichern.

## 14.15 Ziel abschließen

- **Start:** Ziel erreicht (Fortschritt ≥ 100 %) oder manuell abgeschlossen (`custom`).
- S1: Abschluss-Anerkennung (freundlich), optionaler Abschlussbonus.
- E: wiederkehrend → neue Periode startet automatisch; sonst → archivieren.
- ✓: Historie bleibt; ggf. City Event bei besonderem Ziel.
- A11y: Erfolg als Text, nicht nur Farbe/Animation.

## 14.16 Rückblick ansehen

- **Start:** „Rückblick".
- S1: Zeitraum wählen (Tag/Woche/Monat/Quartal).
- S2: Balance-Balken, Beiträge, Highlights, Stadtveränderungen.
- ✓: wertfreie, positive Darstellung; kein „gut/schlecht".
- A11y: Diagramme mit Datentabellen-Alternative (siehe accessibility.md).

## 14.17 Historische Stadtentwicklung ansehen

- **Start:** „Rückblick → Stadtgeschichte".
- S1: chronologische Zeitleiste der City Events.
- S2: Ereignis antippen → narrativer Text + Kontext (welche Beiträge).
- A11y: Zeitleiste als geordnete Liste (`<ol>`), tastaturnavigierbar.

## 14.18 Aktivität bearbeiten

- **Start:** Aktivität in einer Liste → „Bearbeiten".
- S1: Felder ändern → Speichern.
- S2: Server **rechnet Belohnungen neu** (alte XP/Ressourcen zurück, neue vergeben) –
  transaktional, idempotent (siehe ADR-0005).
- ✓: konsistente Ziel-/Missions-/Wochen-/Balance-Werte.
- F: Bearbeitung außerhalb 7-Tage-Fensters → gesperrt mit Hinweis.
- A11y: Änderungen mit `aria-live` bestätigt.

## 14.19 Aktivität löschen

- **Start:** Aktivität → „Löschen".
- S1: Bestätigungsdialog (klar, ohne Alarmton).
- S2: Soft-Delete; Server **korrigiert** abgeleiteten Fortschritt (XP/Ressourcen/Ziele).
- ✓: Fortschritt konsistent; Eintrag aus Listen entfernt.
- E: Bereits ins Bauprojekt geflossene Ressourcen → anteilige, verlustfreie Korrektur
  (nie negatives Ressourcenkonto; Untergrenze 0 mit Ledger-Eintrag).
- A11y: Dialog mit Fokusfalle, „Abbrechen" als Standardfokus.

---

## Flow-übergreifende Prinzipien

- **Offline:** Erfassungs-Flows funktionieren offline (Outbox); Belohnung wird nach
  Sync serverseitig final bestätigt (ADR-0008).
- **Fehler nie schuldzuweisend**; immer mit klarer, verlustfreier Wiederherstellung.
- **Kein Flow erzwingt tägliche Nutzung** oder bestraft Auslassen.
