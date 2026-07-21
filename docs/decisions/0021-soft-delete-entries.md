# ADR-0021: Löschung von Einträgen – Soft Delete mit Löschrecht für Mitglieder

**Status:** Akzeptiert · **Bezug:** [data-model.md](../data-model.md) §16.9, Aufgabe §25/§13.4

## Kontext

data-model §16.9 legt **Soft Delete** (`deleted_at`) für nutzererfasste Einträge fest, um
spätere Fortschrittskorrektur (Phase 5) und eine nachvollziehbare Historie zu ermöglichen.
Offen war, **wer** löschen darf und wie sich das auf gemeinsame Einträge auswirkt.

## Entscheidung

- **Soft Delete:** `delete_entry` setzt `deleted_at = now()`. RLS-Policies und alle Abfragen
  filtern `deleted_at is null`; gelöschte Einträge sind unsichtbar, bleiben aber gespeichert.
- **Löschrecht:** **jedes aktive Household-Mitglied** darf einen Eintrag des eigenen
  Households löschen (zwei vertraute Personen, Aufgabe §13.4 „anderes Mitglied darf löschen,
  wenn Produktkonzept dies vorsieht"). Der Auslöser wird im `audit_log` festgehalten.
- **Bearbeiten** bleibt dem **Ersteller** vorbehalten (`created_by`), da Bearbeitung
  Identitäts-/Detailfelder berührt.
- **Gemeinsamer Eintrag:** Löschen entfernt die **eine** Gruppe für beide; der Lösch-Dialog
  weist darauf hin.
- **Harte Löschung** nur bei Household-/Account-Löschung (DSGVO, kaskadierend) – wie bisher.

## Alternativen

- **Nur Ersteller darf löschen:** widerspricht dem kooperativen Zwei-Personen-Konzept und
  erschwert das Aufräumen versehentlicher Einträge → verworfen.
- **Hard Delete sofort:** verhindert spätere korrekte XP-Korrektur (Phase 5) → verworfen.

## Konsequenzen

- **Positiv:** nachvollziehbar, korrigierbar, kooperativ; einfache, verständliche Regel.
- **Negativ/Abwägung:** gelöschte Zeilen verbrauchen Speicher (vernachlässigbar bei zwei
  Personen); partielle Unique-Indizes und Policies müssen `deleted_at is null` konsequent
  berücksichtigen – per Test abgesichert.
