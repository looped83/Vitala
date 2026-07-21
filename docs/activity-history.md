# Aktivitäts-Historie

Gemeinsame, chronologische Historie aller Einträge (`/history`). Grundlage:
[ADR-0022](./decisions/0022-history-pagination.md).

## Quelle: `entry_feed`-View

Eine Zeile je Eintrag (Bewegung; Ritual-Check-in als aggregierte Gruppe),
`security_invoker = true` → RLS der Basistabellen greift, `deleted_at is null` inklusive.

## Darstellung

- Nach **Household-lokalem Tag** gruppiert (Aufgabe §21.4): „Heute", „Gestern", sonst
  Datumsüberschrift (`<h2>` je Gruppe, semantische Struktur).
- Karten (mobil) mit Bereichs-Badge (Icon + Text, nicht nur Farbe), Titel, Zusammenfassung
  (Dauer/Intensität oder Bausteine), Teilnehmer, Notiz-Flag, Aktionsmenü.
- Neueste zuerst; innerhalb eines Tages nach Erstellzeit absteigend.

## Pagination

Keyset-Cursor `(occurred_on, created_at, entry_id)`, `useInfiniteQuery`, **explizites**
„Mehr laden" (A11y-freundlich, Aufgabe §21.5). Teilnehmer werden je Seite gebündelt
nachgeladen (kein N+1). Stabil bei neu eingefügten Einträgen, keine Duplikate.

## Suche & Filter (Aufgabe §22)

- **Suche** in Titel/Typ, eigener Bezeichnung (`custom_label`), Mahlzeitbezeichnung und Notiz.
- **Filter**: Lebensbereich (Chips), Person, Beteiligung (alle/gemeinsam/persönlich),
  Intensität (Bewegung), Zeitraum. Aktive Filter sichtbar, „Zurücksetzen", mobile
  Filter-Schublade.
- Leere Zustände unterscheiden „noch keine Einträge" vs. „keine Treffer für Filter".

## Detail / Bearbeiten / Löschen

- **Detail-Dialog** zeigt alle relevanten Felder (keine internen IDs), plus Ersteller und
  Zeitstempel.
- **Bearbeiten** (nur Ersteller) öffnet das vorbefüllte Formular; atomare Aktualisierung,
  Cache-Invalidierung, keine doppelten Historieneinträge.
- **Löschen** (jedes aktive Mitglied) mit bewusster Bestätigung; Soft Delete
  ([ADR-0021](./decisions/0021-soft-delete-entries.md)).
