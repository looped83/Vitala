# Zielarten, Messmethoden & Einheiten

Jedes Ziel besitzt **genau eine** primäre Messmethode (Aufgabe §5). Freie Formeln gibt es in
V1 nicht.

## Messmethoden (`goal_measurement`)

| Messmethode        | Bedeutung                                                     | Bereich                                 |
| ------------------ | ------------------------------------------------------------- | --------------------------------------- |
| `entry_count`      | Anzahl passender Einträge (Aktivitäten bzw. Ritual-Check-ins) | alle                                    |
| `duration_minutes` | Summe der Bewegungsdauer                                      | nur Bewegung                            |
| `active_days`      | Anzahl lokaler Tage mit passendem Eintrag                     | alle                                    |
| `shared_count`     | Anzahl gemeinsamer Einträge (einmal gezählt)                  | alle                                    |
| `distinct_types`   | Anzahl verschiedener Aktivitätstypen / Ritual-Bausteine       | alle                                    |
| `manual`           | manuell bestätigter Wert                                      | alle (nur wo nicht automatisch messbar) |
| `boolean`          | erledigt / offen (Zielwert = 1)                               | alle                                    |

**Ritual-Semantik von `entry_count`:** Ohne Baustein-Filter zählen **Check-ins** (Gruppen);
mit Filter zählen die passenden Bausteinzeilen (z. B. „ausgewogene Mahlzeit"). Dadurch bildet
„fünf ausgewogene vegane Mahlzeiten pro Woche" die Mahlzeiten korrekt ab.

## Einheiten (`goal_unit`)

`units` · `minutes` · `days` · `meals` · `actions` · `shared_activities`.
Prozent ist **nur Darstellung**, nie Eingabe. Nicht zulässig: freie Einheitentexte, Kalorien,
Körpergewicht, BMI, exakte CO₂-Werte (Aufgabe §6).

**Einheit ↔ Messmethode:** DB-Check + Zod + RPC erzwingen die strikten Paare
`duration_minutes ↔ minutes` und `active_days ↔ days`; die übrigen Kombinationen sind frei,
aber sinnvoll vorbelegt (`src/features/goals/GoalForm.tsx`).

## Manuell bestätigte Ziele

`manual`/`boolean` sind nur für Ziele gedacht, die sich nicht zuverlässig aus Einträgen
berechnen lassen (z. B. „Reparaturprojekt abschließen"). Der Wert wird ausschließlich über
`set_goal_manual_progress` gesetzt und ist für automatisch messbare Ziele gesperrt
(`invalid_measurement`) – so entsteht keine Doppelzählung (Aufgabe §4.7/§50).

## Beispiele (Vorlagen)

Siehe `goal_templates` (Migration `20260721100100`): dreimal Bewegung/Woche, 150 Minuten/Woche,
fünf ausgewogene Mahlzeiten/Woche, fünf nachhaltige Wege/Woche, ein Biodiversitätsprojekt/Monat
(`boolean`), vier gemeinsame Aktivitäten/Monat (`shared_count`) u. a. **Keine** Vorlagen für
Gewichtsverlust, Kaloriendefizit, Fasten oder extreme Trainingsmengen (Aufgabe §17).
