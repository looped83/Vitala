# Missionssystem (Phase 5)

Missionen sind **kuratierte, zeitlich begrenzte, freiwillige Impulse** – keine Pflichten,
nie mit Strafe. Siehe auch [missions-and-goals.md](./missions-and-goals.md) §7,
[mission-selection.md](./mission-selection.md), [mission-rewards.md](./mission-rewards.md).

## Arten

| Art                       | Zeitraum | Anzahl            |
| ------------------------- | -------- | ----------------- |
| Persönliche Tagesmission  | Tag      | 1 pro Person      |
| Gemeinsame Tagesmission   | Tag      | 1 pro Household   |
| Persönliche Wochenmission | Woche    | 1 pro Person      |
| Gemeinsame Wochenmission  | Woche    | 1 pro Household   |

Monats-/Saisonmissionen sind für spätere Phasen vorbereitet (Enum-Erweiterbarkeit), in
Phase 5 **nicht** aktiv. Die „max eine aktive"-Regeln sind als partielle Unique-Indizes
erzwungen (`mission_one_personal_live_idx`, `mission_one_shared_live_idx`).

## Definition (`mission_definitions`)

Referenzdaten mit stabiler `key`, Titel, Beschreibung, Bereich, Scope (personal/shared),
Periode (day/week), Messmethode (`activity_count`, `duration_minutes`, `active_days`,
`ritual_count`, `shared_count`, `distinct_areas`), Zielwert, Schwierigkeit (leicht /
normal / gemeinschaftlich – **nie** „hart/extrem/Elite"), optionale Filter
(activity_type_keys / ritual_definition_keys), `min_minutes`, `demanding`, explizite
Belohnung und Regelversion.

## Zuweisung

`public.sync_missions()` läuft beim Öffnen der Reward-Flächen: abgelaufene Missionen
werden auf `expired` gesetzt, fehlende Perioden-Missionen deterministisch nachbesetzt
(`app.pick_mission`, siehe [ADR-0036](./decisions/0036-mission-selection.md)). Eingaben:
Wochen-Balance, aktive Ziele, Cooldown der letzten Zuweisungen, Erschöpfungsschutz und die
**strukturierten** Morgen-Check-in-Felder (Energie, Zeitbudget, Fokus, Regenerationswunsch)
— niemals Freitext.

## Interaktion

- **Tauschen:** 1×/Tag je Mission, kostenlos, ohne XP-Verlust; liefert garantiert eine
  **andere** Mission (`swap_mission`, `swaps_used` begrenzt). Wird zur Wiederholungs­
  vermeidung protokolliert (`mission_exchanges`).
- **Überspringen:** jederzeit, ohne Folge; neutrale Formulierung „Mission für heute
  übersprungen." (`skip_mission`).
- **Ablaufen:** nicht erfüllte Missionen laufen still ab (`expired`), keine Strafe.

## Fortschritt & Abschluss

Fortschritt wird serverseitig aus lebenden Einträgen abgeleitet (`app.mission_progress`),
zeitzonen- und periodensicher, Doppelzählung vermieden, Bearbeitung/Löschung
berücksichtigt. `public.mission_board()` liefert die Missionen der aufrufenden Person mit
Live-Fortschritt und `can_complete`. `public.complete_mission()` prüft den Zielwert, setzt
atomar `completed`, schreibt `mission_completions` und vergibt die Belohnung **genau
einmal** (Dedup-Keys). Gemeinsame Missionen: Stadt-XP und Ressourcen einmal, persönliche
XP je aktivem Mitglied. Persönliche Missions-XP sind auf 12/Tag gedeckelt.
