# Morgen-Check-in

Ein kurzer, **privater** persönlicher Check-in (typisch ≤ 1 Minute, alles optional). Verbindlich:
[ADR-0028](./decisions/0028-check-in-privacy.md), game-loop §5.1.

## Eingaben (alle optional)

| Feld                       | Werte (neutral, nicht medizinisch)                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Energielevel               | sehr ruhig · eher ruhig · ausgeglichen · energiegeladen · sehr energiegeladen (1–5)           |
| Verfügbare Zeit            | kaum Zeit · ~15 min · ~30 min · ~60 min · flexibel                                            |
| Gewünschte Tagesintensität | Regeneration · leicht · ausgewogen · aktiv                                                    |
| Tagesfokus                 | Bewegung · Ernährung · Nachhaltigkeit · Tierwohl · Erholung · gemeinsamer Alltag · kein Fokus |
| Kurzer Tageswunsch         | optionaler Freitext (≤ 280 Zeichen)                                                           |

Keine krankheitsbezogenen Aussagen, keine leistungsaggressiven Begriffe („maximal" o. Ä.).
Ein Ein-Tap-Check-in ohne Angaben ist gültig.

## Regeln (Aufgabe §22)

- Max. **ein** aktiver Morgen-Check-in pro Nutzer und lokalem Tag
  (`unique(user_id, check_in_type, business_date)`); am selben Tag bearbeitbar (Upsert).
- Keine Zukunftsdaten (`invalid_date`), keine negative Bewertung bei fehlendem Check-in, kein
  Streak-Verlust, keine Missionserzeugung, keine medizinische Interpretation, keine Weitergabe
  an externe Dienste.
- Nach Abschluss zeigt die Heute-Seite eine kurze Bestätigung sowie heutige Ziele/Rituale/
  Einträge – **keine** XP-/Ressourcenanzeige.

## Datenschutz

Strikt privat: nur die eigene Person liest ihre Check-ins (RLS `user_id = auth.uid()`). Freitexte
werden nie geloggt, nie ausgewertet (keine Sentimentanalyse/KI), nie an den Partner offengelegt.

## Technik

Domain: `src/domain/checkins/` (types, schemas). Daten: `repositories/checkins.ts`. Server:
`save_check_in` (Migration `20260721100400`). UI: `src/features/checkins/CheckInDialog.tsx`
(Fieldsets/Legends, Skalen als Radiogruppen, sichtbare Fokuszustände).
