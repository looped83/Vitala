# ADR-0007: State Management – TanStack Query + minimal Zustand

**Status:** Akzeptiert · **Bezug:** [technical-architecture.md](../technical-architecture.md) §15

## Kontext

Die App hat viel **Serverstate** (Aktivitäten, Ressourcen, Ziele, Stadt) und wenig,
klar abgegrenzten **lokalen UI-State** (offene Sheets, Erfassungs-Draft, Outbox-Status,
Theme vor Persistenz).

## Entscheidung

- **Serverstate:** **TanStack Query** (Caching, Invalidierung, Optimistik, Persist für
  Offline-Read). Zentrale Query-Key-Factory; gezielte Invalidierung nach Mutation.
- **Lokaler UI-State:** **Zustand** (minimal, ~1 kB) für explizit UI-bezogene, nicht
  serverpersistente Zustände. **Kein** Spiegeln von Serverdaten in Zustand.

Klare Grenze: Was vom Server kommt, lebt in Query; was rein UI ist, in Zustand.

## Alternativen

- **Redux (Toolkit):** zu schwer/zeremoniell für diesen Umfang; dupliziert Serverstate.
- **Nur Context/useState:** unzureichend für Cache/Invalidierung/Optimistik.
- **Nur TanStack Query (kein Zustand):** möglich, aber UI-State in Query zu pressen ist
  umständlich; Zustand ist leichtgewichtiger und klarer.

## Konsequenzen

- **Positiv:** klare Trennung, wenig Boilerplate, gute Performance (weniger Re-Renders),
  einfache Offline-Integration.
- **Negativ/Abwägung:** zwei State-Werkzeuge – durch die harte Grenze (Server vs. UI)
  aber eindeutig und wartbar.
