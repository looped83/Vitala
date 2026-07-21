# Heute-Seite

Die zentrale Tagesansicht (`src/features/today/TodayPage.tsx`) ersetzt den bisherigen
Platzhalter. Ruhig, fokussiert, schnell erfassbar (Aufgabe §29).

## Aufbau

1. **Begrüßung:** Anzeigename + lokales Datum + neutrale Tageszeit-Begrüßung (keine übertriebene
   Motivation).
2. **Check-ins:** zwei Karten (Morgen/Abend) mit Status „Erledigt" und „Starten / Ansehen oder
   ändern"; jederzeit zugänglich, unabhängig von der Tageszeit.
3. **Heutige Ziele:** aktive Ziele kompakt (`GoalCard compact`) mit Fortschritt, verständlicher
   Einheit, ohne negative Bewertung.
4. **Heutige Rituale:** heute fällige Rituale (`ritualsDueOn`) mit Abschluss/Überspringen,
   persönlicher/gemeinsamer Kennzeichnung und „Verwalten" (RitualsManager).
5. **Heute erfasst:** die heutigen Einträge (Review-Daten des Tagesfensters) über `EntryCard`,
   plus Schnellzugriff „Erfassen".

## Verhalten

- Keine überladene Dashboard-Ansicht; keine XP/Ressourcen.
- Datum/Tageszeit werden aus der Household-Zeitzone abgeleitet (`Europe/Berlin`), **keine**
  sekündlichen Updates (Performance §51).
- Alle Aktionen sind Tastatur- und Screenreader-bedienbar (Buttons, Dialoge mit Fokusmanagement).

## Daten

Kombiniert Ziele (`useGoalsOverview`), Rituale (`useRituals` + `useRitualCompletions`), Check-ins
(`useCheckIn`) und Tageseinträge (`useReviewData`). Mutationen invalidieren gezielt die
`today`-, `goals`-, `rituals`- und `reviews`-Teilbäume (query-keys, Aufgabe §43).
