# Stadt – Teststrategie

## Unit-Tests (Domain, §70.1)

`src/domain/city/*.test.ts` – 56 Tests, framework-frei:

- **layout.test.ts** – alle geforderten Bereiche vorhanden, IDs/Order eindeutig, Regionen im
  Canvas und **nicht überlappend**, Slot-IDs eindeutig, Slots innerhalb ihrer Region,
  Slot-Level ≥ Region-Level, Erweiterungsfläche nicht baubar, ab Level 1 mind. ein Slot.
- **stages.test.ts** – Stadtlevel → Entwicklungsstufe, → freigeschaltete Bereiche, →
  verfügbare Slots, Bereichs-/Slotstatus, neu freigeschaltete Bereiche, nächste
  Freischaltung, Aggregatzahlen.
- **model.test.ts** – vollständiges Darstellungsmodell, Level-1-Zustand, nächste
  Freischaltung, Neu-Erkennung, Zusammenfassung.
- **a11y.test.ts** – Bereichs-/Slot-Beschriftungen, Kartenzusammenfassung, Ressourcensatz.
- **name.test.ts** – Stadtname-Validierung inkl. XSS-/Längen-Grenzen.
- **view.test.ts** – Ansichtsmodus-Auflösung.

## Komponententests (§70.2)

`src/features/city/*.test.tsx` – 17 Tests:

- **CityMap** – Regionen als beschriftete Buttons, gesperrte Region nennt ihr Level,
  Auswahl per Klick **und** Tastatur (Enter), Slots nur für freigeschaltete Bereiche,
  zugänglicher Kartenname mit Hinweis auf die Listenansicht.
- **CityList / CityDetail** – vollständige Liste, Karte-/Listen-Äquivalenz, Auswahl von
  Bereich und Baufläche, **Axe ohne Verstöße**, Slotdetail verweist auf Phase 7,
  gesperrter Bereich erklärt sein Level ohne Drängen.
- **CityHeader / UnlockBanner / RenameCityDialog** – Level + Stufe + nächste Freischaltung,
  Ansichtsumschaltung (`aria-pressed`), ruhige Freischaltungsmeldung + Quittierung,
  Stadtname-Validierung (Markup abgelehnt) und erfolgreiches Umbenennen.

## Datenbank- & RLS-Tests (§70.4/§70.5)

`supabase/tests/city.test.sql` – **19 pgTAP-Assertions**, lokal auf PostgreSQL verifiziert:

- Initialisierung + Default-Name, Start auf Level 1, **genau eine Stadt je Household**,
  Idempotenz von `city_overview`.
- Stadtname: gültig / Markup abgelehnt / zu kurz abgelehnt.
- Ansichtseinstellung gesetzt + unbekannter Modus abgelehnt.
- **Level-Ableitung** aus dem XP-Ledger, `highest_level` wird angehoben, **fällt nie**
  (auch nicht bei entfernter XP), Trigger blockiert direktes Herabsetzen.
- **RLS**: fremdes Household liest keine Stadt, direkter Client-Write wird abgelehnt
  (42501), Nutzer liest nur die eigene Präferenz, deaktiviertes Mitglied hat keinen Zugriff.

Ausführung: `npm run test:rls` (`supabase test db`).

## E2E (§70.6)

`e2e/city.spec.ts` – backend-unabhängig wie die übrigen E2E-Specs: die `/city`-Route und
ein Deep-Link sind geschützt und leiten zum Login um. Die vollständigen authentifizierten
Flows (Karte, Liste, Auswahl, Zoom, Umbenennen, Freischaltungsmeldung, Tastatur, Dark Mode,
Reduced Motion) sind durch Komponententests + pgTAP abgedeckt (siehe
[testing-strategy.md](./testing-strategy.md) zur Schichtenaufteilung).

## Accessibility (§70.7)

Axe-Prüfung der Listenansicht, Rollen-/Namenstests der Karte und Slots, Tastaturaktivierung,
Fokusverhalten des Detailpanels (Dialog/Drawer-Kontrakt), Karten-/Listen-Äquivalenz. Siehe
[city-map-accessibility.md](./city-map-accessibility.md).

## Performance (§70.8)

Bundle-Analyse über `npm run build`: die Stadtseite ist ein eigenes Lazy-Chunk (~11 KB gzip).
Budgets und Maßnahmen: [city-performance.md](./city-performance.md).
