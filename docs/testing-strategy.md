# Teststrategie

Testpyramide: viele **Unit-Tests** (Domain-Logik), gezielte **Integrationstests**
(RPC/RLS/Belohnungsketten), wenige **E2E-Tests** (Kern-Flows), plus
**Accessibility-Tests** auf allen Ebenen. Werkzeuge: Vitest + React Testing Library,
Playwright, axe-core.

Grundsatz: Die **kritische Belohnungslogik** wird auf **Domain-** und **DB-Ebene**
getestet (nicht nur über die UI), weil sie serverseitig autoritativ ist
([ADR-0005](./decisions/0005-server-side-rewards.md)).

---

## 22.1 Unit-Tests (Domain Layer, framework-frei)

Zielabdeckung Domain-Logik: **≥ 95 %**.

- **XP-Berechnung:** Dauer-Tabelle, Typ-Gewichte, Intensität, Regeneration-Sonderfall,
  Rundung; Grenzfälle (5 min, 300 min, > 120 min Deckel).
- **Levelberechnung:** `req(L)`, kumulierte Schwellen, Level aus XP-Summe (persönlich/Stadt).
- **Ressourcenzuteilung:** `round(xp×0,4)`, Gemeinschaft-Sonderquellen, Baumaterial-
  `min(...)`-Formel.
- **Doppelzählung:** gemeinsame Aktivität → Stadt-XP einmal; ein Ernährungs-/
  Handlungs-Eintrag je Tag; primäre Kategorie-Regel.
- **Tageslimits:** Deckel je Bereich; Überschuss wird gekappt, nicht verloren.
- **Balance:** Balancewert-Formel (0..1), Ausgewogen-Schwelle (≥ 0,6 + jeder Bereich > 0),
  Balance-Bonus, Langzeit-Balance-Serie.
- **Missionsfortschritt:** Aggregation je Zieltyp; „bereits erfüllt"-Ausschluss;
  Wiederholungs-/Erschöpfungsregeln (deterministisch testbar).
- **Zielfortschritt:** je Zieltyp/Zeitraum; gemeinsamer Fortschritt; Teilerfolg/Überschreitung.
- **Gebäudefortschritt:** eingezahlt/benötigt, Fertigstellung, Refund 100 %.
- **Wochenwechsel:** Fortschreibung offener Projekte, Wochensummen, Bonusvergabe.
- **Monatswechsel:** Monatsmissionen/-ziele Periodenwechsel.
- **Zeitzonen:** Tages-/Wochengrenzen in `Europe/Berlin`; rückwirkende Erfassung dem
  richtigen Tag zugeordnet; DST-Übergänge.

## 22.2 Integrationstests (Supabase: RPC, RLS, DB)

Ausgeführt gegen eine lokale Supabase-Instanz (Docker) mit Test-Fixtures.

- **Aktivität erzeugt Belohnung:** `record_activity` schreibt Eintrag + XP-Ledger +
  Ressourcen-Ledger + Fortschritte atomar; Aufschlüsselung stimmt mit Domain überein.
- **Mission aktualisiert sich:** Fortschritt nach passender Erfassung.
- **Ziel aktualisiert sich:** Fortschritt/Abschluss; gemeinsames Ziel zählt beide.
- **Wochenprojekt erhält Fortschritt:** Ressourcen fließen ein; Fertigstellung baut.
- **Gebäude wird freigeschaltet/gebaut:** Stadtlevel-Voraussetzung, Kostenabbuchung,
  City Event.
- **Löschen korrigiert Fortschritt:** Soft-Delete → XP/Ressourcen/Ziele konsistent zurück.
- **Bearbeiten korrigiert Fortschritt:** Neuberechnung (alt zurück, neu vergeben).
- **Gemeinsame Aktivität zählt korrekt:** je Person persönliche XP, Stadt-XP einmal.
- **Idempotenz:** doppelter `idempotency_key` erzeugt keine Doppelwirkung (Outbox-Replay).
- **RLS schützt Household-Daten:** Nutzer aus Household B kann A weder lesen noch
  schreiben; `resources`/`*_transactions` clientseitig nicht schreibbar; Rollen-/
  Einladungsregeln (2-Personen-Limit) erzwungen.

## 22.3 E2E-Tests (Playwright)

Auf Desktop- und mobilem Viewport, gegen laufende App + Test-Supabase.

- **Login** (Registrierung/Anmeldung).
- **Morgen-Check-in** → Missionen erscheinen.
- **Aktivität erfassen** → Belohnung sichtbar, Optimistik → Serverwert.
- **Abend-Check-in**.
- **Ziel erstellen** und Fortschritt sehen.
- **Wochenprojekt auswählen**.
- **Gebäude bauen** → erscheint in Stadt + Stadtgeschichte.
- **Rückblick öffnen** (inkl. Balance).
- **Mobile Navigation** (Tab-Bar, +-Button, Sheets).
- **Tastaturbedienung** eines Kern-Flows (ohne Maus).

## 22.4 Accessibility-Tests

- **Automatisiert:** axe-core in Komponententests und in E2E je Kernseite (keine
  kritischen Verstöße).
- **Tastatur:** Playwright-Durchlauf nur mit Tastatur (Fokusreihenfolge, Fokusfalle,
  Escape).
- **Screenreader-Struktur:** Snapshot des Accessibility-Trees je Kernseite (Rollen,
  Labels, Überschriften).
- **Fokus:** sichtbarer Fokus vorhanden und kontraststark.
- **Kontrast:** Token-Kontrastprüfung (Light/Dark) als Test.
- **Reduced Motion:** mit `prefers-reduced-motion` gesetzt – keine nicht-essentiellen
  Animationen; statische Zustände vorhanden.
- **Alternative Stadtansicht:** Strukturansicht vollständig bedienbar und
  informationsgleich zur Karte.

## 22.5 Test-Datenstrategie & CI

- **Fixtures/Factories** für Households, Nutzer, Referenzdaten (Aktivitätstypen,
  Rituale, Gebäude).
- **Deterministische Zeit:** Uhr injizierbar (fixe „heute"), damit Tages-/Wochen-/
  Monatslogik reproduzierbar ist.
- **CI-Pipeline:** Lint → Typecheck → Unit → Integration (lokales Supabase) → Build →
  E2E → a11y → Lighthouse-CI (Budgets, siehe performance-and-green-code §21.1).
- **Definition of Done je Feature:** relevante Unit- + Integration-Tests grün,
  a11y-Prüfung grün, Budgets eingehalten.

## Phase 4 · Ziele, Rituale & Rückblicke

Unit (Domäne: Perioden, Fortschritt/Überschreitung, Status, Ritualplanung, Check-in- und Ziel-
Validierung, neutrale Rückblicktexte), Accessibility (Fortschrittsbalken, Balance), pgTAP
(`supabase/tests/goals_rituals.test.sql`), E2E-Routenschutz (`e2e/goals.spec.ts`) sowie eine
Live-Postgres-Validierung des gesamten RPC-Schreibpfads. Details:
[goals-and-rituals-testing.md](./goals-and-rituals-testing.md).
