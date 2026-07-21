# Technische Architektur

## 15. Technologiestack

### Kern-Stack (gesetzt)

| Technologie                               | Zweck                                   |
| ----------------------------------------- | --------------------------------------- |
| **React 18 + TypeScript**                 | UI, typsichere Komponenten              |
| **Vite**                                  | Build/Dev-Server, schnelle HMR          |
| **Supabase** (PostgreSQL, Auth, RPC, RLS) | Backend-as-a-Service, Datenbank, Auth   |
| **TanStack Query**                        | Server-State, Caching, Invalidierung    |
| **React Router**                          | Routing                                 |
| **Zod**                                   | Validierung (Client + geteilte Schemas) |
| **Vitest + React Testing Library**        | Unit-/Komponententests                  |
| **Playwright**                            | E2E-Tests                               |
| **PWA** (Vite PWA Plugin / Workbox)       | Installierbarkeit, Offline-Cache        |

### Zusätzlich geprüfte Bibliotheken (mit Begründung)

| Bibliothek                | Entscheidung         | Begründung                                                                                                                                                                                          |
| ------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zustand**               | **Ja, minimal**      | Nur für lokalen UI-State (z. B. offene Sheets, Erfassungs-Draft, Outbox-Status). Serverstate bleibt bei TanStack Query. Sehr klein (~1 kB). Siehe [ADR-0007](./decisions/0007-state-management.md). |
| **React Hook Form**       | **Ja**               | Performante Formulare mit wenig Re-Renders; integriert mit Zod-Resolver. Erfassungs-/Zielformulare profitieren.                                                                                     |
| **date-fns**              | **Ja**               | Zeitzonen-/Datumsberechnung (Tages-/Wochengrenzen). Tree-shakebar, nur benötigte Funktionen. `date-fns-tz` für Zeitzone.                                                                            |
| **SVG-Rendering (nativ)** | **Ja**               | Stadtwelt (ADR-0001). Keine Extra-Lib; React rendert SVG direkt.                                                                                                                                    |
| **Canvas**                | **Nein**             | Verworfen (A11y, siehe ADR-0001).                                                                                                                                                                   |
| **CSS-basierte Welt**     | **Teilweise**        | CSS für Layout/Animation der SVG-Welt; keine separate Lib.                                                                                                                                          |
| **Framer Motion**         | **Ja, eng begrenzt** | Nur für definierte Micro-Interaktionen (Belohnung, Levelaufstieg). Reduced-Motion-Pflicht. Lazy-geladen. Siehe [ADR-0010](./decisions/0010-animations.md).                                          |

**Vermeidung unnötiger Abhängigkeiten:** Keine UI-Komponentenbibliothek (eigenes,
schlankes Designsystem, siehe design-system.md); kein zusätzlicher Charting-Lib in V1
(einfache Diagramme mit SVG selbst gebaut, siehe accessibility/dataviz); keine
Moment.js, keine Lodash (native/date-fns genügen).

---

## 15.1 Architekturprinzipien

### Schichtenmodell (Layer)

```
┌───────────────────────────────────────────────┐
│ UI Layer (React-Komponenten, Routen, Views)    │  nur Darstellung + Interaktion
├───────────────────────────────────────────────┤
│ Application Layer (Hooks, TanStack Query,       │  Orchestrierung, Query Keys,
│  Zustand-UI-Stores, Formlogik)                  │  Cache-Invalidierung
├───────────────────────────────────────────────┤
│ Domain Layer (reine TS-Funktionen: XP, Level,   │  Berechnung, Regeln, Zod-Schemas
│  Ressourcen, Balance, Missionen, Ziele)         │  (framework-frei, testbar)
├───────────────────────────────────────────────┤
│ Data Access Layer (Supabase-Client, RPC-        │  Persistenz, Auth, RLS
│  Wrapper, Repository-Funktionen)                │
└───────────────────────────────────────────────┘
             │
             ▼
   Supabase / PostgreSQL (RLS, RPC, Trigger)  ← Wahrheitsquelle für kritische Werte
```

### Feature-basierte Ordnerstruktur

```
src/
├── app/                 # App-Shell, Router, Provider
├── features/
│   ├── today/           # Heute + Check-ins
│   ├── activities/      # Erfassung Bewegung
│   ├── nutrition/       # Ernährungs-Check-in
│   ├── sustainability/  # Nachhaltigkeit
│   ├── animal-welfare/  # Tierwohl
│   ├── city/            # Stadt (SVG + Struktur), Gebäude, Bauprojekte
│   ├── goals/           # Ziele
│   ├── missions/        # Missionen
│   ├── review/          # Rückblick, Stadtgeschichte
│   └── settings/        # Profil, Household, Datenschutz
├── domain/              # reine Berechnungslogik + Zod-Schemas (shared)
│   ├── xp/  resources/  balance/  missions/  goals/  time/
├── data/                # Supabase-Client, Repositories, RPC-Wrapper, Query Keys
├── ui/                  # Designsystem-Primitive (Button, Card, Chip, …)
└── lib/                 # Utils (date, format, a11y helpers)
```

### Weitere Prinzipien

- **Trennung Berechnung/Darstellung:** Der Domain Layer enthält **keine** React-/
  Supabase-Abhängigkeit → identisch client- und (via Portierung) serverseitig testbar.
- **Zentrale Validierung:** Ein Satz **Zod-Schemas** in `domain/` wird sowohl im
  Formular (React Hook Form Resolver) als auch beim RPC-Aufruf validiert.
- **Fehlerbehandlung:** Einheitliche `Result`-/Error-Typen im Data Layer; UI zeigt
  nutzerfreundliche Meldungen (IA §13.5), technische Details nur ins Log.
- **Logging:** Strukturiertes Client-Log (Konsole/Sentry-frei in V1, kein externes
  Tracking, siehe security-and-privacy). Serverseitig: `audit_log` für kritische
  Mutationen.
- **Query Keys:** Hierarchisch, z. B. `['household', hid, 'activities', {day}]`.
  Zentrale Key-Factory in `data/queryKeys.ts`.
- **Cache-Invalidierung:** Nach Mutation gezielte Invalidierung betroffener Keys
  (Aktivität → `activities`, `resources`, `goals`, `missions`, `city`), nicht global.
- **Transaktionen:** Kritische Mehrschritt-Mutationen (Erfassung → XP → Ressourcen →
  Ziel-/Missionsfortschritt) laufen **serverseitig atomar** (eine PostgreSQL-Funktion).
- **Offline-Verhalten:** Read-Cache (TanStack Query Persist) + **Outbox** für Mutationen
  (ADR-0008). Server bleibt Wahrheitsquelle.
- **Synchronisation:** Beim Reconnect wird die Outbox idempotent abgespielt; danach
  betroffene Query Keys invalidiert.
- **Zeitzonenstrategie:** Alle Zeitstempel in DB als `timestamptz` (UTC). Tages-/Wochen-/
  Monatsgrenzen werden **serverseitig** in der `household_settings.timezone` (Standard
  `Europe/Berlin`) berechnet. Client nutzt `date-fns-tz` nur zur Anzeige. So sind
  Tagesdeckel und Wochenwechsel deterministisch und geräteunabhängig.

---

## 15.2 Berechnungslogik: Verortung

Grundsatz: **Kritische, belohnungsrelevante Berechnungen dürfen nicht ausschließlich
clientseitig erfolgen** ([ADR-0005](./decisions/0005-server-side-rewards.md)).

| Berechnung                   | Ausführungsort                   | Mechanismus                                          |
| ---------------------------- | -------------------------------- | ---------------------------------------------------- |
| XP je Handlung               | **Server** (autoritativ)         | PostgreSQL-Funktion via RPC                          |
| Level (persönlich/Stadt)     | **Server**                       | abgeleitet aus XP-Summe (Funktion/generierte Spalte) |
| Ressourcenvergabe            | **Server**                       | RPC + `resource_transactions` (Ledger)               |
| Ressourcenausgabe (Bau)      | **Server**                       | RPC, idempotent, transaktional                       |
| Missionsfortschritt          | **Server** (Anzeige auch Client) | Aggregat-Query / Funktion                            |
| Zielfortschritt              | **Server**                       | Aggregat-Query aus Einträgen                         |
| Wochenfortschritt/-abschluss | **Server**                       | geplante Funktion (RPC beim Wochenstart)             |
| Gebäudebau/-fortschritt      | **Server**                       | RPC, transaktional                                   |
| Balance-Wert & -Bonus        | **Server**                       | Funktion über Wochen-Aggregat                        |
| Doppelzählungs-Schutz        | **Server** (DB-Constraints)      | Unique Constraints, `activity_group_id`              |
| Tages-/Wochen-/Monatsgrenzen | **Server**                       | Funktion mit Household-Zeitzone                      |
| Vorschau/Optimistik          | **Client** (nur Anzeige)         | Domain-Funktion, **nie** autoritativ                 |

**Muster:** Der Client berechnet mit derselben Domain-Logik eine **optimistische
Vorschau** der Belohnung (schnelles Feedback). Der **Server** berechnet den
**verbindlichen** Wert und schreibt ihn; die UI ersetzt die Vorschau durch den
Serverwert. Bei Abweichung gewinnt immer der Server.

**Warum RPC statt reiner Trigger:** Erfassung ist ein **Mehrschritt-Vorgang** (Eintrag +
XP + Ressourcen + Fortschritte). Eine einzige `SECURITY DEFINER`-RPC-Funktion kapselt
das atomar und idempotent (Idempotenzschlüssel = Client-generierte Eintrags-ID).
Trigger werden ergänzend für einfache Invarianten genutzt (z. B. `updated_at`,
Ledger-Konsistenz), nicht für die Kernbelohnung.

**RPC-Kernfunktionen (Signaturen konzeptionell):**

- `record_activity(payload, idempotency_key)` → schreibt Aktivität, vergibt XP/Ressourcen,
  aktualisiert Ziele/Missionen/Balance, gibt Belohnungsaufschlüsselung zurück.
- `update_activity(id, payload)` / `delete_activity(id)` → korrigiert abgeleitete Werte.
- `record_nutrition_checkin` / `record_sustainability` / `record_animal_welfare`.
- `record_morning_checkin` / `record_evening_checkin`.
- `build_building(building_id, idempotency_key)` / `refund_building(instance_id)`.
- `start_week` / `close_week` (Wochenprojekt, Balance-Bonus, Fortschreibung).

Alle Funktionen sind **idempotent** (gleicher Idempotenzschlüssel → keine Doppelwirkung)
und **RLS-konform** (Household-Zugehörigkeit wird geprüft).
