# Gemeinsame Einträge

Grundlage: [ADR-0019](./decisions/0019-activity-capture-model.md). Ziel: eine gemeinsame
Handlung wird **einmal** gespeichert und **beiden** Personen zugeordnet – ohne Doppelzählung
und ohne doppelte Historie (Aufgabe §6.4/§7.4).

## Modell

- Eine **Basiszeile** (`activities` bzw. eine `ritual_entries`-Gruppe), `created_by` =
  `user_id` = Ersteller, `is_shared = true`, `group_id`/`entry_group_id` gesetzt.
- **Teilnehmer** in `entry_participants` (`entry_kind`, `group_id`, `user_id`): genau die
  beiden aktiven Household-Mitglieder. Unique `(entry_kind, group_id, user_id)` schließt
  Doppel-Teilnehmer aus; die RPC lehnt fremde/dritte Teilnehmer ab.

## Regeln

- **Sichtbarkeit:** beide Profile sehen den Eintrag (RLS: Household-Scope).
- **Bearbeiten:** nur der Ersteller (`created_by`).
- **Löschen:** jedes aktive Mitglied; wirkt auf die **eine** Gruppe (Dialog weist darauf hin).
- **Historie:** genau **ein** Kartenobjekt, gekennzeichnet „Gemeinsam · Name & Name" mit
  Personen-Icon (nicht nur Farbe).
- **Phase 5:** `group_id` erlaubt, Stadt-XP je Gruppe **einmal** zu vergeben (ADR-0004) –
  in Phase 3 noch ohne Wirkung.

## Bedienung

Ein „Gemeinsam mit <Name>"-Schalter im Formular. Bei genau zwei Personen wird die zweite
Person automatisch als Teilnehmer gesetzt. Ohne zweite aktive Person ist die Option deaktiviert
mit erklärendem Hinweis.
