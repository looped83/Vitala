# Reward-Tests

## Unit (Vitest · `src/domain/rewards`, `src/domain/missions`)

84 Tests: Bewegungs-XP je Dauerstufe, Intensität, Regeneration; Ernährungs-/Ritual-XP;
Tagesdeckel und Sonderaktions-Headroom; abnehmende Erträge; Ressourcenmapping; Stadt-XP-
Kopplung; Levelkurven + Titel (persönlich/Stadt); Balancestufen + gestaffelter Bonus;
Missionsauswahl (harte Filter, Scoring, Determinismus, Tausch); Missions-/Ziel-/Ritual-/
Check-in-Belohnungswerte; Korrekturdifferenzen; Rundung (halb weg von null, PG-Parität).

## Datenbank / RLS (pgTAP · `supabase/tests/rewards.test.sql`)

24 Assertions, gegen Postgres 16 verifiziert: 60-min-Bewegung → 15 XP / 8 Stadt-XP / 6
Energie; Idempotenz; Edit-Korrektur; Löschung nullt XP und Ressource; Ernährungsdeckel;
gemeinsamer Eintrag (Stadt-XP einmal, Partner erhält persönliche XP); Partner-XP-Zeilen
per RLS verborgen; direkter Ledger-`INSERT`/Bestands-`UPDATE` schlägt fehl (42501);
Level-Status-Views; Missions-Zuweisung/-Abschluss (einmal) /-Idempotenz; Balancebonus bei
vier Bereichen (einmal 20 Stadt-XP).

## Integration & E2E (Vitest/RTL, Playwright)

Erfassung → sichtbare Belohnung, Tageslimit-Hinweis, Missionen ansehen/tauschen/
überspringen/abschließen, gemeinsame Mission, Levelaufstieg, Ressourcenübersicht, XP-
Historie, Wochenbalance, Tages-/Wochenrückblick, mobile Nutzung, Tastatur, Dark Mode,
Reduced Motion.

## Accessibility & Performance

Axe über alle neuen Flächen; Fortschrittsbalken mit `role="progressbar"` + `aria-value*`;
Ressourcen/Boni als Icon **und** Text; Reduced Motion. Performance: paginierte Ledger-
Abfragen, gezielte Indizes, inkrementelle Korrekturen statt Voll-Neuberechnung, gezielte
Cache-Invalidierung.

Ausführung: `npm run test`, `npm run test:rls` (Supabase/pgTAP), `npm run test:e2e`.
