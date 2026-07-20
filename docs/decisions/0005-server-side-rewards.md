# ADR-0005: Serverseitige Belohnungslogik

**Status:** Akzeptiert · **Bezug:** [technical-architecture.md](../technical-architecture.md) §15.2

## Kontext

Belohnungen (XP, Ressourcen, Level, Gebäude, Boni) sind spielentscheidend. Clientseitige
Berechnung allein ist manipulierbar und bei Offline-Retries/Outbox nicht verlässlich
konsistent.

## Entscheidung

**Kritische Belohnungen werden serverseitig autoritativ berechnet** – über
`SECURITY DEFINER`-**PostgreSQL-Funktionen (RPC)**, die Erfassung + XP + Ressourcen +
Ziel-/Missions-/Balance-Fortschritt **atomar und idempotent** durchführen
(Idempotenzschlüssel = client-generierte Eintrags-ID).

- Der **Client** berechnet mit **derselben Domain-Logik** nur eine **optimistische
  Vorschau**; bei Abweichung gewinnt immer der Server.
- **Ledger** (`experience_transactions`, `resource_transactions`) macht jede Änderung
  nachvollziehbar und korrigierbar.
- **Trigger** ergänzen nur einfache Invarianten (`updated_at`, Ledger-Konsistenz), nicht
  die Kernbelohnung.
- **RLS** verbietet direktes Schreiben in Ledger/Ressourcen durch Clients.

## Alternativen

- **Rein clientseitig:** verworfen (Manipulation, Inkonsistenz).
- **Nur Trigger:** unpraktisch für Mehrschritt-Vorgänge mit Rückgabe der
  Belohnungsaufschlüsselung; schlechter komponier-/testbar.
- **Externer Backend-Service (eigener Node-Server):** unnötige Komplexität; Supabase
  RPC genügt und hält die Architektur schlank.

## Konsequenzen

- **Positiv:** manipulationssicher, konsistent (auch bei Retries/Offline), auditierbar,
  atomar.
- **Negativ/Abwägung:** Domain-Logik existiert an zwei Orten (TS-Vorschau + SQL-Autorität)
  → durch gemeinsame Testfälle und identische Formeln synchron gehalten; SQL-Funktionen
  sind integrationsgetestet.
