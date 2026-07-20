# ADR-0008: Offline-Strategie – Read-Cache + Outbox, Server autoritativ

**Status:** Akzeptiert · **Bezug:** [technical-architecture.md](../technical-architecture.md) §15.1

## Kontext

Vitala wird mobil genutzt (iPhone-Browser/PWA); Erfassung soll auch ohne Netz möglich
sein. Gleichzeitig müssen Belohnungen konsistent und manipulationssicher bleiben
(ADR-0005).

## Entscheidung

- **Read:** TanStack Query mit **Persistenz** (App-Shell + zuletzt geladene Daten offline
  sichtbar).
- **Write:** **Outbox-Muster** – Mutationen werden lokal mit **Idempotenzschlüssel**
  in eine Warteschlange gelegt und **optimistisch** angezeigt. Beim Reconnect wird die
  Outbox **idempotent** gegen die RPCs abgespielt; danach betroffene Query Keys
  invalidiert.
- **Autorität:** Der **Server** berechnet die verbindliche Belohnung; die optimistische
  Vorschau wird durch den Serverwert ersetzt. Idempotenz verhindert Doppelbuchung bei
  Retries.
- **Konflikte:** Da Erfassung additiv und idempotent ist, sind Konflikte selten;
  bei Abweichung gewinnt der Server, der Client zeigt den korrigierten Wert.

## Alternativen

- **Voll-offline mit lokaler Autorität/CRDTs:** überkomplex für 2 Nutzer, riskiert
  Belohnungsmanipulation.
- **Kein Offline (nur online):** schlechte mobile UX; widerspricht „geringer Aufwand".

## Konsequenzen

- **Positiv:** gute mobile UX, robuste Synchronisation, keine Doppelbelohnung,
  Server bleibt Wahrheitsquelle.
- **Negativ/Abwägung:** Outbox-/Idempotenzlogik muss sorgfältig getestet werden (R21) →
  dedizierte Integrationstests.
