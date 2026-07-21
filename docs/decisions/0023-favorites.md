# ADR-0023: Favoriten / Schnellaktionen – Vorlagen ohne Auto-Speichern

**Status:** Akzeptiert · **Bezug:** [favorites-and-quick-actions.md](../favorites-and-quick-actions.md),
Aufgabe §18

## Kontext

Häufige Einträge (z. B. „30 Min Krafttraining", „ausgewogene Mahlzeit") sollen schnell
erfassbar sein, ohne eine komplizierte Vorlagenverwaltung und ohne unbeabsichtigtes
Speichern.

## Entscheidung

- **`entry_favorites`** speichert eine Vorlage: `area`, `label`, Bewegungsfelder
  (`activity_type_id`, `duration_min`, `intensity`) **oder** `ritual_definition_ids`, plus
  `is_shared`. `owner_user_id` = `null` → household-weit, sonst persönlich.
- **Ausführen** öffnet das vorbefüllte Erfassungsformular; gespeichert wird **erst** nach
  sichtbarer Bestätigung (kein Auto-Insert, Aufgabe §18).
- **Verwalten:** Favoriten anlegen/bearbeiten/löschen über dieselben RPCs
  (`save_favorite`/`delete_favorite`, ADR-0020). RLS: Mitglieder sehen geteilte + eigene.
- Bewusst **schlank**: keine Ordner, keine Freigabe-Workflows, keine verschachtelten Vorlagen.

## Alternativen

- **Automatisch aus Häufigkeit abgeleitete Vorlagen:** intransparent, schwer steuerbar →
  ergänzend zeigt der Hub „zuletzt erfasst", aber Favoriten sind explizit.
- **Ein-Klick-Speichern ohne Formular:** Risiko unbeabsichtigter/fehlerhafter Einträge →
  verworfen (Bestätigung ist Pflicht).

## Konsequenzen

- **Positiv:** schnelle Erfassung, volle Kontrolle vor dem Speichern, geteilte oder private
  Schnellaktionen, minimaler Pflegeaufwand.
- **Negativ/Abwägung:** Favoriten sind statische Vorlagen (keine Automatik) – bewusst, um
  Komplexität und Fehlerfläche gering zu halten.
