# Vitala – Konzeption & technische Grundlage (Phase 1)

Vitala ist eine private, kooperative Gamification-Web-App für **genau zwei Personen**
. Sie verbindet Bewegung, gesunde vegane Ernährung, Nachhaltigkeit,
Tierwohl und Biodiversität mit dem gemeinsamen Aufbau einer nachhaltigen Stadt.

Dieses Verzeichnis enthält die **vollständige Konzept- und Architekturgrundlage**
(Phase 1). In dieser Phase wurde **kein produktiver Anwendungscode** implementiert –
ausschließlich Dokumentation, Modelle, Diagramme und Entscheidungsprotokolle.

## Dokumentenübersicht

| Dokument                                                         | Inhalt                                    |
| ---------------------------------------------------------------- | ----------------------------------------- |
| [product-vision.md](./product-vision.md)                         | Produktvision, Positionierung, Abgrenzung |
| [product-principles.md](./product-principles.md)                 | Verbindliche Produktprinzipien            |
| [life-areas.md](./life-areas.md)                                 | Die vier Lebensbereiche im Detail         |
| [game-loop.md](./game-loop.md)                                   | Täglicher und wöchentlicher Kernloop      |
| [game-system.md](./game-system.md)                               | Gesamtes Spielsystem, Balance             |
| [resources-and-xp.md](./resources-and-xp.md)                     | Ressourcen-, XP- und Level-Mathematik     |
| [missions-and-goals.md](./missions-and-goals.md)                 | Missionen und Ziele                       |
| [city-and-world-concept.md](./city-and-world-concept.md)         | Stadt- und Weltkonzept                    |
| [building-system.md](./building-system.md)                       | Gebäudetaxonomie und Bauprojekte          |
| [information-architecture.md](./information-architecture.md)     | Sitemap, Navigation, Zustände             |
| [user-flows.md](./user-flows.md)                                 | Kern-User-Flows                           |
| [technical-architecture.md](./technical-architecture.md)         | Stack, Layer, Berechnungslogik            |
| [data-model.md](./data-model.md)                                 | Relationales Datenmodell, RLS             |
| [security-and-privacy.md](./security-and-privacy.md)             | Datenschutz und Sicherheit                |
| [design-system.md](./design-system.md)                           | Designsystem, Farben, Typografie          |
| [accessibility.md](./accessibility.md)                           | Accessibility (WCAG 2.2 AA)               |
| [performance-and-green-code.md](./performance-and-green-code.md) | Performance-Budgets, Green Code           |
| [testing-strategy.md](./testing-strategy.md)                     | Teststrategie                             |
| [risk-register.md](./risk-register.md)                           | Risikoregister                            |
| [implementation-roadmap.md](./implementation-roadmap.md)         | Phasenplan 1–10                           |
| [decisions/](./decisions/)                                       | Architecture Decision Records (ADRs)      |

## Zentrale Entscheidungen (Kurzüberblick)

- **Welt-Darstellung:** SVG-basierte, top-down modulare Kachelwelt ohne 3D-Engine ([ADR-0001](./decisions/0001-world-rendering.md)).
- **Ressourcen:** 5 aktiv verwaltete Ressourcen + 1 abgeleitete Baumaterial-Ressource ([ADR-0002](./decisions/0002-resource-model.md)).
- **XP-Modell:** Getrennte persönliche XP und Stadt-XP, progressive Levelkurve ([ADR-0003](./decisions/0003-xp-model.md)).
- **Doppelzählung:** Ein Eintrag = eine primäre Kategorie = eine XP-Vergabe; sekundäre Wirkung nur visuell ([ADR-0004](./decisions/0004-double-counting.md)).
- **Belohnungslogik:** Kritische Belohnungen serverseitig über PostgreSQL-Funktionen/RPC ([ADR-0005](./decisions/0005-server-side-rewards.md)).
- **Household-Modell:** Ein Household, zwei Mitglieder, RLS-isoliert ([ADR-0006](./decisions/0006-household-model.md)).
- **State Management:** TanStack Query als Serverstate, Zustand nur für lokalen UI-State ([ADR-0007](./decisions/0007-state-management.md)).
- **Offline-Strategie:** Read-Cache + optimistische Erfassung mit Outbox, Server bleibt Wahrheitsquelle ([ADR-0008](./decisions/0008-offline-strategy.md)).
- **Datenmodell:** Normalisiert relational, JSONB nur für definierte Flexfelder ([ADR-0009](./decisions/0009-data-model.md)).
- **Animationen:** CSS-first, Framer Motion nur für definierte Fälle, Reduced-Motion-Pflicht ([ADR-0010](./decisions/0010-animations.md)).

## Lesereihenfolge

Für ein Verständnis von oben nach unten: `product-vision` → `product-principles`
→ `life-areas` → `game-loop` → `game-system` → `resources-and-xp`
→ `missions-and-goals` → `city-and-world-concept` → `building-system`
→ `information-architecture` → `user-flows` → `technical-architecture`
→ `data-model` → `security-and-privacy` → `design-system` → `accessibility`
→ `performance-and-green-code` → `testing-strategy` → `risk-register`
→ `implementation-roadmap`.
