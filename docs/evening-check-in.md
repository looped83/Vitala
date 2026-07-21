# Abend-Check-in

Ein kurzer, **privater** persönlicher Rückblick (typisch ≤ 1 Minute, alles optional). Verbindlich:
[ADR-0028](./decisions/0028-check-in-privacy.md), game-loop §5.5.

## Eingaben (alle optional)

| Feld                                      | Werte                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Tagesgefühl                               | schwierig · ruhig · in Ordnung · gut · sehr gut (1–5, neutral, nicht medizinisch) |
| Positiver Tagesmoment                     | optionaler Freitext (≤ 280 Zeichen)                                               |
| Was hat heute gutgetan?                   | optionale Reflexion                                                               |
| Was möchte ich morgen leichter gestalten? | optionale Reflexion                                                               |

Keine Pflicht zur Reflexion. Der Abend-Check-in ist ein ruhiger Rückblick, keine Dateneingabe.

## Tagesabschluss

Der Tagesrückblick ([daily-review.md](./daily-review.md)) zeigt sachlich: erfasste Aktivitäten,
erfüllte Rituale, Zielbeiträge, gemeinsame Beiträge – **ohne** Bewertung ausgelassener Punkte.

## Regeln (Aufgabe §24)

- Max. **ein** Abend-Check-in pro Nutzer und lokalem Tag; am selben Tag bearbeitbar (Upsert).
- Kein Pflichtabschluss, keine negative Darstellung bei fehlendem Eintrag, keine automatische
  psychologische Interpretation, keine Gesundheitsdiagnose, keine Sentimentanalyse, keine
  externe KI-Verarbeitung.
- Freitext niemals in Logs.

## Datenschutz & Technik

Wie der Morgen-Check-in strikt privat (RLS `user_id = auth.uid()`), gleiche Tabelle
`daily_check_ins` mit typisierten Detailfeldern. UI: `src/features/checkins/CheckInDialog.tsx`.
