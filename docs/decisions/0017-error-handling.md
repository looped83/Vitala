# ADR-0017: Fehlerbehandlung – normalisiertes `AppError`-Modell

**Status:** Akzeptiert · **Bezug:** [information-architecture.md](../information-architecture.md) §13.5, [security-and-privacy.md](../security-and-privacy.md) §18

## Kontext

Fehler dürfen Nutzer nie mit rohen Supabase-/Netzwerktexten oder Stacktraces konfrontieren.
Meldungen müssen freundlich, handlungsorientiert und datenschutzfreundlich sein; technische
Details gehören nur ins Log.

## Entscheidung

- Ein zentrales, normalisiertes **`AppError`** mit `kind`
  (`auth | permission | not_found | validation | network | conflict | rate_limited | server |
unknown`), einer **freundlichen deutschen Meldung** und einem optionalen, nicht angezeigten
  `cause`.
- **`normalizeSupabaseError`** bildet Auth-/PostgREST-/RPC-Fehler auf `AppError` ab; die
  RPC-Exceptions verwenden **stabile Codes** (`household_full`, `not_owner`, …), die auf feste
  Meldungen gemappt werden. Ein generischer `normalizeUnknownError` fängt den Rest
  (u. a. Netzwerk).
- **Globale `AppErrorBoundary`** fängt Render-Fehler und zeigt einen freundlichen
  Wiederherstellungs-Screen; eine zweite Boundary umschließt den Hauptinhalt, damit die
  Navigation nutzbar bleibt.
- **Logging** (`src/lib/logging`) protokolliert nur technische, personenfreie Kurzmeldungen;
  keine Tokens, E-Mails, Formulardaten.
- **TanStack Query** wiederholt `auth`/`permission`/`validation`/`not_found`/`conflict`
  nicht; Mutationen werden nicht blind wiederholt.

## Alternativen

- **Rohe Fehler bis in die UI:** Datenschutz-/UX-Risiko.
- **Nur try/catch pro Aufruf ohne Normalisierung:** inkonsistente Meldungen, doppelte Logik.

## Konsequenzen

- **Positiv:** konsistente, freundliche, datenschutzfreundliche Fehler; ein Ort für Mapping
  und Logging; testbar.
- **Negativ/Abwägung:** Mapping-Tabelle muss bei neuen RPC-Codes gepflegt werden – zentral und
  getestet.
