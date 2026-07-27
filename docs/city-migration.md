# Stadt – Migration & Serverfunktionen

## Serverfunktionen (§48)

Alle in `20260723090100_city_functions.sql`, `security definer`, `set search_path = ''`,
`auth.uid()`-basiert, mit Mitgliedschaftsprüfung und idempotent.

### Private Helfer (`app`)

- `city_layout_current()` – aktuelle Layoutversion.
- `city_total_xp(hh)` / `city_current_level(hh)` – Stadt-XP-Summe bzw. abgeleitetes Level.
- `city_ensure(hh)` – legt die Stadt an (falls fehlt) und hebt `highest_level` auf das
  aktuelle Level (nie nach unten).

### Öffentliche RPCs (`authenticated`)

- `city_overview()` – **die** autoritative Lese-RPC: initialisiert die Stadt (§48), sichert
  `highest_level`, legt bei Bedarf die Präferenzzeile an und liefert Household-Zustand +
  Nutzerpräferenz.
- `rename_city(p_name)` – Stadtname validieren + setzen (Länge, keine spitzen Klammern).
- `set_city_view_mode(p_mode)` – Ansicht (`map`/`list`/`system`) je Nutzer.
- `acknowledge_city_level()` – `seen_city_level = aktuelles Level` (monoton).
- `repair_city()` – sichere Reparatur/Diagnose (§67): re-derived Zustand, korrigiert eine
  ungültige Layoutversion, **ändert keine XP und keine Ressourcen**; gibt das frische
  Overview zurück.

## Migration bestehender Households (§50)

Die Funktions-Migration enthält am Ende einen **idempotenten Backfill**:

```sql
insert into public.city_states (household_id, layout_version, highest_level)
select h.id, app.city_layout_current(), app.city_current_level(h.id)
from public.households h
on conflict (household_id) do nothing;
```

- Jedes bestehende Household erhält eine Stadt mit korrekter Layoutversion und aus dem
  aktuellen Stadtlevel abgeleiteter `highest_level`.
- **Keine** XP- oder Ressourcenänderung; keine doppelte Benachrichtigung (die
  Neu-freigeschaltet-Erkennung basiert auf `seen_city_level`, das bei neuen Präferenzzeilen
  0 ist – für bestehende Nutzer wird die erste Ansicht der Stadt ohnehin als Startzustand
  erlebt, nicht als Flut von Meldungen, da die Meldung ruhig und einmalig quittierbar ist).
- Neue Households erhalten ihre Stadt **lazy** beim ersten `city_overview()`-Aufruf.

### Dry Run / Konsistenzprüfung

- Dry Run: `select h.id, app.city_current_level(h.id) from public.households h left join
public.city_states cs on cs.household_id = h.id where cs.household_id is null;` zeigt
  Households ohne Stadt.
- Konsistenz: `select household_id, highest_level, ... from public.city_states` gegen
  `app.city_current_level` prüfen; `repair_city()` gleicht Abweichungen sicher an.
- Rollback/Reparatur: `repair_city()` ist idempotent und verändert keine Fortschrittsdaten.

## Reparaturstrategie (§67)

Für inkonsistente Zustände: `repair_city()` (Stadt neu ableiten, Layoutversion validieren,
Freischaltungen neu berechnen). Reparaturen ändern nie XP/Ressourcen, löschen keine Daten
und überschreiben nichts still.
