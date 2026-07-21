# Favoriten & Schnellaktionen

Grundlage: [ADR-0023](./decisions/0023-favorites.md). Häufige Einträge mit einem Tipp –
vor dem Speichern anpassbar, nie automatisch gespeichert (Aufgabe §18).

## Datenmodell (`entry_favorites`)

`area`, `label`, Bewegungsvorlage (`activity_type_id`, `duration_min`, `intensity`) **oder**
`ritual_definition_ids`, `is_shared`, `owner_user_id` (`null` = household-weit, sonst
persönlich), `sort_order`. Check-Constraint erzwingt eine gültige Bereichsform.

## Bedienung

- **Ausführen** öffnet das vorbefüllte Erfassungs-Sheet → Nutzer bestätigt/ändert → speichert.
- **Anlegen/Bearbeiten** über `FavoriteDialog` (Bereich, Name, Typ/Bausteine, Intensität,
  gemeinsam, persönlich/geteilt).
- **Löschen** aus dem Kontextmenü.
- Alle Schreibvorgänge über `save_favorite`/`delete_favorite` (ADR-0020); RLS zeigt sowohl
  geteilte als auch eigene Favoriten.

## Beispiele (Seed)

„30 Min Krafttraining" (geteilt, Bewegung), „Ausgewogene Mahlzeit" (persönlich, Ernährung).

## Bewusst schlank

Keine Ordner, keine verschachtelten Vorlagen, keine Automatik. „Zuletzt erfasst" auf dem
Erfassen-Hub ergänzt Favoriten mit echten letzten Einträgen (keine Fake-Daten).
