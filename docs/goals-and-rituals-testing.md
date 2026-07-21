# Tests: Ziele, Rituale & Check-ins (Phase 4)

## Unit (Vitest) – framework-freie Domäne

- `src/domain/goals/periods.test.ts` – Wochenbeginn, Monats-/Quartalsgrenzen, Periodenindizes,
  laufende Periode (mittwochs erstelltes Wochenziel).
- `src/domain/goals/progress.test.ts` – Überschreitung (Balken 100 %, Wert darüber), neutrale
  Sprache, Singular-Einheiten.
- `src/domain/goals/status.test.ts` – gültige/ungültige Statusübergänge.
- `src/domain/goals/schemas.test.ts` – Ziel-Validierung (Einheit/Messmethode, boolean-Zielwert,
  Wiederholung/Zeitraum, custom-Enddatum, Filter-Shape, persönlich/gemeinsam).
- `src/domain/rituals/schedule.test.ts` – Ritualplanung (daily/weekly/monthly/flexible, Grenzen).
- `src/domain/checkins/schemas.test.ts` – Check-in-Validierung (alles optional, Wertebereiche,
  Freitextlänge).
- `src/domain/review/aggregate.test.ts` – neutrale Zusammenfassung/Balance/Vergleichstexte.

## Accessibility (vitest-axe)

`src/test/a11y.test.tsx` – Fortschrittsbalken (Name/Wert, keine reine Farbe) und die
Balance-Darstellung (Textwerte, keine Violations).

## Datenbank & RLS (pgTAP)

`supabase/tests/goals_rituals.test.sql` (`supabase test db`, 22 Assertions): Ziel anlegen
(persönlich/gemeinsam), negativer Zielwert/Einheit-Mismatch/Ritualfilter/fremder Eigentümer
abgelehnt, direkter goal-UPDATE verweigert (42501), Pausieren/Fortsetzen, manueller Fortschritt
nur für manuelle Ziele, Ritualabschluss + Upsert (kein Doppelabschluss), Check-in max. 1/Tag,
Zukunft abgelehnt, Partner liest keinen privaten Check-in, Außenstehende lesen keine
Ziele/Rituale.

## E2E (Playwright)

`e2e/goals.spec.ts` – Routenschutz (goals/review/today → Login). Die vollständigen
authentifizierten Flows laufen im CI-Job mit seeded Supabase.

## Live-DB-Validierung (durchgeführt)

Zusätzlich wurden alle Migrationen + Seeds gegen eine echte Postgres-16-Instanz mit einem
minimalen Supabase-Stub (auth/roles/uid) angewandt und der komplette RPC-Schreibpfad geprüft:
Periodenroll & Freeze (Historie erhalten, genau eine aktive Periode), Live-Fortschritt aus
Phase-3-Einträgen, Doppelzählungsschutz (gemeinsamer Eintrag einmal), Pausieren/Fortsetzen,
Ritual-Upsert, Check-in-Upsert/Eindeutigkeit, Zukunftsablehnung, RLS-Isolation und
Check-in-Privatsphäre. Dabei wurde ein Enum-Cast-Fehler in `sync_goal_periods` gefunden und
behoben.

## Seeds

`supabase/seed.sql` (Phase-4-Abschnitt): persönliche Tages-/Wochenziele, gemeinsames Monatsziel,
wiederkehrendes Ziel mit Periodenhistorie, pausiertes/abgeschlossenes/archiviertes Ziel,
persönliche + gemeinsame Rituale, Ritualabschlüsse (done/skipped), Morgen-/Abend-Check-ins inkl.
privater Reflexion. Fremd-Household bleibt für RLS-Tests isoliert.
