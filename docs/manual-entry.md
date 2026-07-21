# Manuelle Erfassung (Bewegung & Schnellaktionen)

Der Bereich **Erfassen** (`/capture`) ist der produktive Einstieg: vier gleichwertige
Bereichskarten (Icon + Farbe + Text + Beschreibung, Farbe nie allein), Schnellaktionen und
„zuletzt erfasst".

## Ablauf (mobil, < 30 s)

1. Bereich wählen → Erfassungs-Sheet (Dialog mit Fokusfalle).
2. Typ/Bausteine wählen, Details bestätigen.
3. **Speichern** oder **Speichern & weiter** (nächster Eintrag ohne Schließen).

## Bewegungsformular (`MovementForm`)

- **Pflicht:** Aktivitätstyp, Datum (Vorbelegung heute), Dauer (5–300 min).
- **Optional:** Intensität (leicht/moderat/intensiv), Uhrzeit, Ort/Anbieter, gemeinsam,
  Notiz; bei „Sonstige Bewegung" eine eigene Bezeichnung.
- **Validierung:** Zod (`movementFormSchema`) clientseitig + DB-Check + RPC serverseitig
  (ADR-0016/0020). Fokus springt auf das erste fehlerhafte Feld.
- **Duplikatshinweis:** bei ähnlichem Eintrag (gleicher Typ, gleicher Tag, gleiche Person)
  dezenter Hinweis mit „trotzdem speichern" – **keine** harte Sperre (Aufgabe §5).

## Nach dem Speichern (Aufgabe §20)

Sachliche Bestätigung („Bewegung wurde gespeichert."), Eintrag erscheint in der Historie,
Möglichkeit für einen weiteren Eintrag oder Wechsel zur Historie. **Keine** Punkte-, XP-,
Ressourcen- oder Stadtreaktion.

## Formular-Grundsätze (Aufgabe §19)

Echte Labels, Pflichtfelder markiert, verständliche Fehler (Icon + Text), Schutz vor
Doppelsubmission (`isSubmitting`), sichtbarer Ladezustand, kein Datenverlust bei
Validierungsfehler, lokale Zeitzone für Datum, Notizen als reiner Text (kein HTML, kein
`dangerouslySetInnerHTML`, Zeichenlimit 500).
