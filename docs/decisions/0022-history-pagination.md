# ADR-0022: Historien-Pagination – vereinheitlichte `entry_feed`-View + Keyset

**Status:** Akzeptiert · **Bezug:** [activity-history.md](../activity-history.md),
[performance-and-green-code.md](../performance-and-green-code.md), Aufgabe §21/§36

## Kontext

Die gemeinsame Historie mischt zwei Tabellen (`activities` + gruppierte `ritual_entries`)
und muss bei ≥ 10.000 Einträgen flüssig, duplikatfrei und stabil paginiert werden – ohne
alle Zeilen zu laden.

## Entscheidung

- **Eine View `entry_feed`** vereint beide Quellen zu **einer Zeile je Eintrag**
  (Ritual-Check-in = aggregierte Gruppe). `with (security_invoker = true)` lässt die
  RLS-Policies der Basistabellen greifen (inkl. `deleted_at is null`) – kein Datenleck.
- **Keyset-Pagination** über das stabile Tupel `(occurred_on desc, created_at desc,
entry_id desc)`. Der Cursor ist dieses Tupel; neu eingefügte Einträge verschieben keine
  Seiten und erzeugen keine Duplikate.
- **Explizites „Mehr laden"** statt automatischem Infinite Scroll (bessere Accessibility,
  Aufgabe §21.5). TanStack `useInfiniteQuery` hält die Seiten.
- **Teilnehmer** werden je Seite in **einer** gebündelten Abfrage nachgeladen (kein N+1).
- **Filter/Suche** wirken clientseitig über die geladenen Seiten (Household-Maßstab: zwei
  Personen); die Datumsgruppierung erfolgt in der Household-Zeitzone (ADR-0024).

## Alternativen

- **Zwei getrennte Abfragen clientseitig mergen:** komplexer Cursor, Sortier-/Duplikatrisiko
  → verworfen.
- **OFFSET-Pagination:** instabil bei Einfügungen, langsam bei großen Offsets → verworfen.
- **Volltext-/Filter serverseitig:** derzeit unnötig komplex für zwei Personen; die View ist
  vorbereitet, falls später nötig.

## Konsequenzen

- **Positiv:** eine performante, RLS-sichere Quelle; stabile, duplikatfreie Pagination;
  gute A11y; kleine Payloads.
- **Negativ/Abwägung:** die UNION-View sortiert/materialisiert bei sehr großen Mengen – für
  den Zwei-Personen-Maßstab unkritisch; serverseitige Filter wären ein späterer Ausbau.
