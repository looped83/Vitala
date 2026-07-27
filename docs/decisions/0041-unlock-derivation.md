# ADR-0041: Freischaltungen deterministisch aus dem Stadtlevel ableiten

**Status:** Akzeptiert · **Datum:** 2026-07 · **Bezug:** [city-unlocks.md](../city-unlocks.md),
[city-database-schema.md](../city-database-schema.md), [ADR-0003](./0003-xp-model.md)

## Kontext

Freischaltungen von Stadtbereichen und Bauflächen müssen persistent, rückfallsicher und
**nicht clientseitig setzbar** sein (task §14/§47). Zugleich soll keine redundante
Datenhaltung entstehen. Das Stadtlevel wird bereits aus dem unveränderlichen Stadt-XP-Ledger
berechnet (ADR-0003/0032).

## Entscheidung

Freischaltungen werden **deterministisch aus dem aktuellen Stadtlevel abgeleitet** – es gibt
**keine** separate Freischaltungstabelle. Region/Slot ist freigeschaltet, wenn
`stadtlevel ≥ unlockLevel` (identische Formel in Client und Server).

Ergänzend hält `city_states` die **`highest_level`** (höchstes je erreichtes Stadtlevel).
Sie ist serverseitig **monoton** abgesichert:

- Die RPC `city_overview`/`city_ensure` hebt sie bei jedem Aufruf auf `max(highest_level,
aktuelles_level)`.
- Ein `BEFORE UPDATE`-Trigger verhindert jede Verringerung (Defense in Depth).

Da Stadt-XP nie sinkt, sinkt das Level nie – `highest_level` ist die zusätzliche Garantie
gegen jede (theoretische) Korrektur nach unten. Ungesehene Freischaltungen werden über
`city_view_preferences.seen_city_level` je Nutzer erkannt (kein eigenes Ack-Table).

## Alternativen

- **Separate `city_unlocks`-Tabelle:** verworfen – redundant zum Level, mehr Schreibpfade,
  mehr RLS-Fläche, ohne funktionalen Mehrwert.
- **Freischaltung im Client berechnet und gespeichert:** verworfen – verletzt §14/§47
  (Client darf Freischaltung nicht setzen).

## Konsequenzen

- **Positiv:** minimal, konsistent, keine Doppelfreischaltung möglich; „einmal frei bleibt
  frei" gilt strukturell; Client kann Level/Freischaltung nicht manipulieren (RLS: nur SELECT,
  Schreiben ausschließlich über SECURITY-DEFINER-RPCs).
- **Abwägung:** Zeitpunkt einer Freischaltung wird nicht historisiert. Für Phase 6 nicht
  nötig; City Events (Phase 7) können das später als Meilenstein ergänzen.
