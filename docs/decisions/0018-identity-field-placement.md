# ADR-0018: Verortung der Identitätsfelder (Abweichung/Präzisierung zu data-model)

**Status:** Akzeptiert · **Bezug:** [data-model.md](../data-model.md) §16.1, [household-model.md](../household-model.md)

## Kontext

Die Phase-2-Aufgabe (§8.3) listet für `profiles` u. a. _bevorzugte Sprache, Zeitzone,
Theme-Präferenz_. Das verbindliche [data-model.md](../data-model.md) verortet diese Felder
jedoch differenziert: **`user_preferences`** (theme, reduced_motion, locale) und
**`household_settings`** (timezone, week_start). Zudem nennt data-model `profiles.level` und
`profiles.title` als _abgeleitete_ Werte des noch nicht existierenden XP-Systems.

## Entscheidung

Wir folgen dem **data-model** (verbindlich) und präzisieren:

- **`profiles`**: `id`, `display_name`, `accent_color`, `avatar_motif`, Zeitstempel.
- **`user_preferences`**: `theme`, `reduced_motion`, `locale` (nur `de`),
  `week_start_override`, `notification_opt_in`.
- **`household_settings`**: `timezone`, `week_start`, `theme_default`,
  `reduced_motion_default`.
- **`profiles.level` / `profiles.title` werden in Phase 2 NICHT angelegt**: Sie sind aus XP
  abgeleitet, das XP-System existiert noch nicht, und das Anlegen würde „Fake-Level"
  begünstigen (Aufgabe §38). Sie kommen mit dem XP-System in einer späteren Phase hinzu.

## Alternativen

- **Alle Felder in `profiles`** (wörtlich nach Aufgabe §8.3): widerspricht dem verbindlichen
  data-model und mischt geräte-/household-bezogene Einstellungen ins Profil.
- **`level`/`title` jetzt anlegen (Default 1):** Gefahr, in Ansichten fiktiven Fortschritt zu
  zeigen; verfrüht ohne XP-System.

## Konsequenzen

- **Positiv:** konsistent mit dem verbindlichen Datenmodell; klare Trennung Profil vs.
  Einstellungen; keine verfrühten Spielfelder.
- **Negativ/Abwägung:** minimale Abweichung von der wörtlichen Aufgabenformulierung – hier
  dokumentiert; UI (Profil/Einstellungen) bündelt die Felder für die Nutzer dennoch sinnvoll.
