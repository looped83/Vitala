# ADR-0039: Statische Stadtstruktur als versionierte TypeScript-Definition

**Status:** Akzeptiert · **Datum:** 2026-07 · **Bezug:** [city-layout.md](../city-layout.md),
[city-layout-versioning.md](../city-layout-versioning.md), [building-slots.md](../building-slots.md)

## Kontext

Stadtbereiche und Bauflächen sind **feste, kuratierte** Strukturdaten (keine prozedurale
Zufallsgenerierung, task §5/§42). Sie brauchen stabile IDs, Positionen, Freischaltlevel,
Kategorien und eine Layoutversion. Die Frage ist, ob diese Definitionsdaten in der
Datenbank (Seed-Tabelle) oder im Code liegen.

## Entscheidung

Die Layout-Definitionen (Regionen + Slots) liegen als **versionierte TypeScript-Konfiguration**
in `src/domain/city/layout.ts`, gebündelt über `LAYOUT_VERSION`. Die Datenbank speichert
nur **Household-Zustand** (`city_states`, `city_view_preferences`) und eine
Referenztabelle gültiger Layoutversionen (`city_layout_versions`) für die FK-Validität.

Begründung:

- **Keine unnötigen DB-Abfragen:** Das statische Layout wird mit dem Bundle geladen; keine
  Roundtrips zum Rendern der Karte.
- **Testbarkeit:** Positionen, Nicht-Überlappung und Freischaltlogik sind reine
  Unit-Tests (deterministisch, kein DB-Setup).
- **Kontrollierte Versionierung:** Layoutänderungen sind Code-Reviews; `LAYOUT_VERSION`
  koppelt Definition und Migration.

## Alternativen

- **Definitionstabellen in der DB:** verworfen für Phase 6 – mehr Abfragen, aufwendigere
  Tests, kein Mehrwert, solange das Layout kuratiert und nicht nutzergeneriert ist.
- **Hybrid (DB + Code):** verworfen – doppelte Quelle, Sync-Risiko.

## Konsequenzen

- **Positiv:** schlank, testbar, keine Laufzeit-Datenlast; Slot-/Region-IDs stabil.
- **Abwägung:** Eine Layoutänderung erfordert ein Deployment. Das ist akzeptabel, weil die
  Struktur bewusst selten geändert wird; `city_layout_versions` + `repair_city` decken die
  Migration bestehender Haushalte ab ([city-migration.md](../city-migration.md)).
- **RLS:** Da keine Definitionsdaten pro Household in der DB liegen, entfällt dort eine
  eigene RLS-Fläche; `city_layout_versions` ist global lesbare Referenz.
