# ADR-0027: Ritualinstanzen & Abschlüsse

**Status:** Akzeptiert · **Bezug:** [rituals-domain.md](../rituals-domain.md),
Aufgabe §18–§28

## Kontext

Rituale sind kleine wiederkehrende Handlungen (kein Ziel, keine Aktivität). Pro Ritualinstanz
(Ritual + lokaler Tag) darf es höchstens einen Abschluss geben; „übersprungen" darf nie
negativ bewertet werden; gemeinsame Rituale zeigen, wer abgeschlossen hat (§26/§28).

## Entscheidung

- **Definition getrennt von Abschluss:** `rituals` (Definition inkl. Wiederholung, Wochentage,
  bevorzugte Tageszeit, Status) und `ritual_completions` (ein Ergebnis je Instanz).
- **Instanz = Ritual + `occurred_on`:** `unique(ritual_id, occurred_on)` verhindert doppelte
  Abschlüsse. Gemeinsame Rituale werden **einmal** pro Household und Tag abgeschlossen;
  `user_id` hält fest, **wer** es getan hat.
- **Status ohne Wertung:** `done` · `skipped` · `not_relevant`; „open" ist einfach das Fehlen
  einer Zeile. `complete_ritual` ist ein Upsert (erneuter Abschluss ändert dieselbe Zeile),
  `clear_ritual_completion` setzt auf „open" zurück.
- **Planung als einfache Regel, keine Kalender-Engine:** `isRitualScheduledOn`
  (daily/weekly-Wochentage/monthly-Tag/flexible) bestimmt, ob ein Ritual an einem Tag fällig
  ist. Flexible Rituale sind immer verfügbar.
- **Berechtigung:** persönliche Rituale schließt nur der Eigentümer ab; gemeinsame beide
  Mitglieder. Schreibpfad ausschließlich über SECURITY-DEFINER-RPCs (ADR-0020).
- **Keine Belohnung:** Rituale erzeugen in dieser Phase keine XP/Ressourcen und keine Push-
  Erinnerung (bevorzugte Tageszeit ist reine Anzeige).

## Alternativen

- **Vorab-Materialisierung aller Instanzen:** unnötige Datenmengen, Kalender-Engine → verworfen;
  Instanzen entstehen erst beim Abschluss.
- **Getrennte Abschluss-Tabellen je Ritualart:** unnötige Komplexität → eine generische Tabelle
  mit optionalem `value_num`/`note`.

## Konsequenzen

- **Positiv:** kein Doppelabschluss, klare Sichtbarkeit „wer", flexibles Überspringen ohne
  Strafe, schlanke Planung.
- **Negativ/Abwägung:** rückwirkende/vorausschauende Instanzen sind bewusst simpel gehalten;
  komplexe Ausnahme-Editoren gibt es nicht (§27).
