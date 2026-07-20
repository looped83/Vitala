# Implementierungs-Roadmap (Phasen 1–10)

Jede Phase: Ziel · Umfang · Abhängigkeiten · Risiken · Ergebnis · Definition of Done
(DoD). Ab Phase 2 wird produktiver Code implementiert. Kritische Belohnungslogik immer
serverseitig zuerst, dann UI.

---

## Phase 1 – Produktvision, Spielsystem, UX & Architektur *(abgeschlossen)*

- **Ziel:** vollständige Konzept- und Architekturgrundlage, keine Konzeptlücken.
- **Umfang:** alle Dokumente in `docs/` + ADRs; keine produktive Codebasis.
- **Abhängigkeiten:** keine.
- **Risiken:** unvollständige/ widersprüchliche Konzepte → durch Querverweise und ADRs
  minimiert.
- **Ergebnis:** dieses Dokumentationsset.
- **DoD:** siehe Abschlusskriterien in [README.md](./README.md) und Vision/Prinzipien;
  kein produktiver Anwendungscode; keine Platzhalter.

## Phase 2 – Projektgrundlage, Supabase, Auth, Designsystem

- **Ziel:** lauffähiges Grundgerüst mit Auth, Household, Designsystem-Primitiven.
- **Umfang:** Vite/React/TS-Setup, Ordnerstruktur (technical-architecture §15.1),
  Supabase-Projekt, Auth-Flows, `households`/`members`/`profiles`/Settings + RLS,
  Einladungs-RPC (2-Personen-Limit), Design-Tokens + Kernkomponenten, PWA-Grundgerüst,
  CI-Pipeline (Lint/Typecheck/Test/Build/Lighthouse).
- **Abhängigkeiten:** Phase 1.
- **Risiken:** RLS-Fehlkonfiguration (R13/R22) → RLS-Tests von Anfang an.
- **Ergebnis:** Nutzer können sich registrieren, Household bilden, zweite Person einladen.
- **DoD:** Login/Household/Einladung getestet (inkl. RLS), Designsystem dokumentiert
  und in Storybook/Beispielseite sichtbar, Budgets grün.

## Phase 3 – Aktivitäten, Ernährung, Nachhaltigkeit, Tierwohl

- **Ziel:** Erfassung aller vier Lebensbereiche mit serverseitiger Belohnung.
- **Umfang:** `activities`/`ritual_*`/`daily_check_ins` + RPCs (`record_*`), Domain-Logik
  (XP, Ressourcen, Deckel, Doppelzählung), Erfassungs-UIs + Schnellaktionen/Favoriten,
  optimistische Belohnungsanzeige, Bearbeiten/Löschen mit Korrektur.
- **Abhängigkeiten:** Phase 2.
- **Risiken:** Farming/Doppelzählung (R3/R4), Client≠Server (R12) → Domain- + Integrationstests.
- **Ergebnis:** vollständige, konsistente Erfassung + Belohnung.
- **DoD:** alle Erfassungs-Flows + Belohnungsketten getestet (Unit+Integration),
  Zeitzonenlogik getestet, a11y der Formulare grün.

## Phase 4 – Ziele, Rituale, Tagesablauf, Rückblicke

- **Ziel:** täglicher/wöchentlicher Loop und Ziele funktionsfähig.
- **Umfang:** Morgen-/Abend-Check-in, Tagesübersicht „Heute", `goals`/`goal_progress`
  + Ziel-Flows, Rückblick (Tag/Woche/Monat), erste Balance-Anzeige.
- **Abhängigkeiten:** Phase 3.
- **Risiken:** Aufwand zu hoch (R2) → Zeitbudget-Messung; Fortschritts-Aggregation
  (Performance R10) → serverseitige Aggregate.
- **Ergebnis:** vollständiger Kernloop ohne Missionen/Stadt.
- **DoD:** Kernloop end-to-end (E2E), Zielfortschritt korrekt (auch gemeinsam),
  Rückblick barrierefrei.

## Phase 5 – Punkte, Level, Ressourcen, Missionen

- **Ziel:** vollständige Spielökonomie inkl. Missionen und Balance-Bonus.
- **Umfang:** Level (persönlich/Stadt), Ressourcen-Ledger + Anzeige, Missionssystem
  (`mission_*`, adaptive Auswahl), Balance-Bonus/ Langzeit-Balance, Boni.
- **Abhängigkeiten:** Phasen 3–4.
- **Risiken:** Einseitigkeit (R5), Balancing (R19) → Werte als Daten; Missionsregeln
  deterministisch testbar.
- **Ergebnis:** Ökonomie steht; Stadt-XP wächst (noch ohne Weltansicht).
- **DoD:** XP/Level/Ressourcen/Missionen/Balance getestet; Boni idempotent.

## Phase 6 – Stadtansicht und Weltgrundlage

- **Ziel:** SVG-Weltansicht + barrierefreie Strukturansicht.
- **Umfang:** `world_areas`/`world_elements`, SVG-Renderer (top-down, Culling),
  Startzustand, Bereichsfreischaltung nach Stadtlevel, Strukturansicht,
  Karten-Accessibility.
- **Abhängigkeiten:** Phase 5 (Stadtlevel).
- **Risiken:** Stadtkomplexität/Performance (R9/R10) → früh Performance messen, Budgets.
- **Ergebnis:** sichtbare, wachsende Stadt (noch ohne baubare Gebäude).
- **DoD:** Weltansicht + Strukturansicht informationsgleich, Budgets (DOM ≤1500,
  animiert ≤12) eingehalten, a11y grün.

## Phase 7 – Gebäude, Bauprojekte, Stadtentwicklung

- **Ziel:** Gebäude bauen, Wochenprojekte, Stadtgeschichte.
- **Umfang:** `building_*`, `weekly_projects`, `city_events`, Bau-/Refund-RPC,
  Wochenzyklus (`start_week`/`close_week`, Fortschreibung), V1-Gebäudeauswahl,
  Stadtgeschichte-UI.
- **Abhängigkeiten:** Phasen 5–6.
- **Risiken:** Gebäudelogik-Wartbarkeit (R11), Wochenwechsel-Korrektheit → Tests.
- **Ergebnis:** vollständige Kern-Version (V1) spielbar.
- **DoD:** Bau/Refund/Wochenabschluss/Fortschreibung getestet; Stadtgeschichte korrekt;
  Fortschritt nie verloren.

## Phase 8 – Jahreszeiten, Tiere, lebendige Welt

- **Ziel:** stimmungsvolle, lebendige Welt ohne Fortschrittseinfluss.
- **Umfang:** berechnete Saison/Tageszeit/Wetter (kein neues Schema), saisonale
  Belebung (Tiere/Pflanzen/Bewohner), saisonale Missionen (als Mission-Definitionen),
  Reduced-Motion-Varianten.
- **Abhängigkeiten:** Phasen 6–7.
- **Risiken:** Performance (R10), reine Farbkodierung (A11y) → Textbenennung, Limits.
- **Ergebnis:** lebendige, saisonale Stadt.
- **DoD:** Saison/Tageszeit korrekt (Zeitzone), kein Fortschrittseinfluss, Wetter nie
  negativ, Budgets/ a11y grün.

## Phase 9 – Balancing, Langzeitmotivation, Spielökonomie

- **Ziel:** Feinabstimmung aller Werte für langfristige Motivation.
- **Umfang:** Kalibrierung von XP-/Ressourcen-/Baukosten-/ Balance-Werten (datenbasiert),
  Level-/Freischalt-Tempo, Missions-Schwierigkeit, Langzeit-Belohnungen; Simulation
  typischer Nutzungsprofile.
- **Abhängigkeiten:** Phasen 5–8.
- **Risiken:** Fehlkalibrierung (R19), Einseitigkeit (R5) → Simulation + Justierung.
- **Ergebnis:** stimmige, motivierende Ökonomie.
- **DoD:** dokumentierte Balancing-Werte, Simulationsergebnisse, keine dominante Strategie.

## Phase 10 – Tests, Accessibility, Performance, Finalisierung

- **Ziel:** Produktionsreife.
- **Umfang:** vollständige Testabdeckung (Unit/Integration/E2E/a11y), Kontrast-/
  Reduced-Motion-Audit, Performance-Budgets final, Datenexport/Löschung, Härtung der
  RLS/RPC, Fehler-/Leer-/Ladezustände final, PWA-Feinschliff.
- **Abhängigkeiten:** alle vorherigen.
- **Risiken:** Restlücken A11y/Performance/Datenschutz → Audits als Gate.
- **Ergebnis:** stabile, barrierefreie, performante V1 für Lutz & René.
- **DoD:** alle Budgets/ a11y-Kriterien grün, DSGVO-Flows getestet, Sicherheits-Checkliste
  abgehakt (security-and-privacy §18.9).

---

## Phasenübergreifende Definition of Done

Jede Phase gilt erst als fertig, wenn: relevante Tests grün · a11y-Kriterien erfüllt ·
Performance-Budgets eingehalten · kritische Logik serverseitig · Dokumentation der Phase
aktualisiert · Risikoregister überprüft.
