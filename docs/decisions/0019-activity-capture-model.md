# ADR-0019: Aktivitäts- & Ritual-Erfassungsmodell (Phase 3)

**Status:** Akzeptiert · **Bezug:** [data-model.md](../data-model.md) §16.2,
[ADR-0009](./0009-data-model.md), [ADR-0004](./0004-double-counting.md),
[activity-domain.md](../activity-domain.md)

## Kontext

Phase 3 erfasst die vier Lebensbereiche real. Das verbindliche Datenmodell (ADR-0009)
hält **Bewegung** getrennt (eigene Felder Dauer/Intensität) und fasst
**Ernährung/Nachhaltigkeit/Tierwohl** in generischen `ritual_definitions`/`ritual_entries`
mit `area`-Diskriminator zusammen. Gemeinsame Einträge müssen **einmal** gespeichert und
beiden Personen zugeordnet werden (Aufgabe §6.4/§7.4), ohne Doppelzählung (ADR-0004).

## Entscheidung

- **Zwei Basistabellen** wie in ADR-0009: `activities` (Bewegung) und `ritual_entries`
  (übrige drei Bereiche). Referenzkataloge: `activity_types`, `ritual_definitions`.
- **Ein Ernährungs-/Handlungs-Check-in = eine Gruppe** von `ritual_entries` (eine Zeile je
  gewähltem Baustein), verbunden über `entry_group_id`. Der Unique-Index
  `(household, user, ritual_definition_id, occurred_on)` auf **lebenden** Zeilen verhindert
  das doppelte Abhaken derselben Handlung am selben Tag.
- **Präzisierung zu data-model §16.2 (`activity_participants`):** Teilnehmer werden in einer
  **generischen** Tabelle `entry_participants` (`entry_kind`, `group_id`, `user_id`)
  gehalten, die Bewegung **und** Rituale bedient. Das vereinheitlicht die Teilnehmer-,
  Constraint- und RLS-Logik statt zweier paralleler Tabellen. `activities.group_id` und
  `ritual_entries.entry_group_id` teilen denselben Gruppen-Namensraum.
- **Gemeinsamer Eintrag = eine Basiszeile** (Ersteller = `user_id`/`created_by`) plus zwei
  `entry_participants`-Zeilen. Er erscheint **einmal** in der Historie. Für Phase 5 bleibt
  `group_id` der Anker, um Stadt-XP nur einmal je Gruppe zu vergeben (ADR-0004).
- **Stabile fachliche IDs**: `key`-Slugs (`strength`, `bike_instead_car`, …) sind die
  Domain-IDs; Anzeigetexte sind übersetzbar und nie Primärschlüssel (Aufgabe §3/§10).
- **Keine XP-/Ressourcenlogik** in Phase 3 (Aufgabe §20).

## Alternativen

- **Eine generische Eintragstabelle für alle vier Bereiche:** widerspricht ADR-0009
  (Bewegung braucht eigene Felder/Regel), erzwingt JSONB-Details → verworfen.
- **Gemeinsamer Eintrag als zwei Zeilen (je Person):** doppelte Historie, Löschen/Bearbeiten
  inkonsistent, Doppelzählungsgefahr → verworfen.
- **Zwei getrennte Teilnehmer-Tabellen (`activity_participants` + `ritual_participants`):**
  Duplikation der Logik/Policies → zugunsten `entry_participants` verworfen.

## Konsequenzen

- **Positiv:** konsistent mit ADR-0009; DRY-Teilnehmerlogik; gemeinsame Einträge einmalig;
  klare Doppelzählungs-Constraints; XP-fähig ohne spätere Migration.
- **Negativ/Abwägung:** `entry_participants` referenziert zwei Basistabellen über einen
  gemeinsamen Gruppen-Namensraum (keine harte FK auf eine einzelne Tabelle) → durch
  RPC-Schreibpfad (ADR-0020) und Tests abgesichert; Präzisierung zu data-model §16.2 hier
  dokumentiert.
