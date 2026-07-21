# Testabdeckung – Phase 3 (Erfassung)

Ergänzt [testing-strategy.md](./testing-strategy.md) / [testing-implementation.md](./testing-implementation.md).

## Unit (Vitest)

- `src/lib/dates/day.test.ts` — Zeitzonen/DST, „heute", Zukunftsprüfung, Tages-Buckets (§30).
- `src/domain/activity/schemas.test.ts` — Bewegung/Ritual/Favorit-Validierung, Dauergrenzen,
  Pflicht-Partner bei „gemeinsam", leere Auswahl.
- `src/domain/activity/history.test.ts` — Filter (Bereich/Person/Beteiligung/Zeitraum/
  Intensität), Suche, Gruppierung nach Tag, Duplikatshinweis.
- `src/data/mappers/activity.test.ts` — DB-Row → Domain, Titel/Zusammenfassung, Teilnehmer.

## Komponente + Accessibility (Vitest + vitest-axe)

- `src/features/capture/MovementForm.test.tsx` — Labels, Axe, Dauergrenze, gültiger Submit.
- `src/features/capture/RitualForm.test.tsx` — Chips als Toggle-Buttons, Axe, leere Auswahl,
  Speichern eines Check-ins.

## Datenbank + RLS (pgTAP, `supabase test db`)

- `supabase/tests/activity.test.sql` — 22 Prüfungen: gültiger persönlicher/gemeinsamer
  Eintrag, fremder Partner/dritter Teilnehmer/ungültiger Typ/Typ-Bereich-Mismatch/ungültige
  Dauer/Zukunftsdatum/Duplikat abgelehnt, deaktiviertes Mitglied, Owner/Member/Outsider-Reads,
  Fremd-Update/-Löschung abgelehnt, atomarer gemeinsamer Eintrag, Soft Delete.

## E2E (Playwright)

- `e2e/capture.spec.ts` — Route-Guards für `/capture` und `/history` (backend-unabhängig; die
  vollständigen Flows benötigen ein geseedetes Supabase und werden über Komponenten- +
  pgTAP-Tests abgedeckt).

## Ausführung

`npm run test` (Unit/Komponente/A11y) · `npm run test:e2e` · `npm run test:rls` ·
`npm run check` (Format, Lint, Typecheck, Test, Build).
