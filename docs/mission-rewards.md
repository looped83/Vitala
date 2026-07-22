# Missionsbelohnungen

Werte je Beteiligtem (Regelversion 1), gespeichert explizit je `mission_definitions`-Zeile
und identisch zu `missionReward()` in `src/domain/rewards/events.ts`.

| Mission            | pers. XP | Stadt-XP | passende Ressource | Gemeinschaft |
| ------------------ | -------- | -------- | ------------------ | ------------ |
| Persönlich · Tag   | 8        | 4        | 1                  | –            |
| Gemeinsam · Tag    | 6        | 10       | 1                  | 1            |
| Persönlich · Woche | 20       | 10       | 2                  | –            |
| Gemeinsam · Woche  | 15       | 30       | 3                  | 2            |

## Vergabe

`public.complete_mission` prüft den Zielwert (`app.mission_progress`), setzt atomar
`completed`, schreibt `mission_completions` und vergibt die Belohnung **genau einmal** über
Dedup-Keys (`mission:<id>:…`). Bei **gemeinsamen** Missionen: Stadt-XP und Ressourcen
einmal für den Household, persönliche XP je aktivem Mitglied; kein Doppelabschluss.

## Grenzen

Persönliche Missions-XP sind auf **12/Tag** je Person gedeckelt (`app.grant_mission_rewards`
klemmt den Betrag). Stadt-XP und Ressourcen sind durch die begrenzte Zahl aktiver
Missionen strukturell beschränkt.
