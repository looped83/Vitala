# Layoutversionierung

## Ziel (§44)

Das Kartenlayout muss sich später erweitern lassen (neue Bereiche, Slots, Positionen), ohne
bestehende Städte zu beschädigen oder Slot-Referenzen ungültig zu machen.

## Modell

- **`LAYOUT_VERSION`** (TypeScript-Konstante) ist die aktuell gültige Version der
  Definitionen in `src/domain/city/layout.ts`.
- **`city_layout_versions`** (DB-Referenztabelle) enthält alle gültigen Versionen; genau
  eine ist `is_current` (per partiellem Unique-Index erzwungen).
- **`city_states.layout_version`** referenziert per FK eine gültige Version. Jede Stadt
  weiß damit eindeutig, welche Layoutversion für sie gilt.

## Aktuelle Version

Version **1** – initiales kuratiertes 3×3-Layout (Phase 6).

## Migrationsstrategie

- Neue Version: Definitionen im Code erweitern, `LAYOUT_VERSION` erhöhen, in einer Migration
  eine Zeile in `city_layout_versions` einfügen und `is_current` umsetzen.
- Bestehende Städte werden über eine idempotente Migration + `repair_city()` auf die aktuelle
  Version gehoben (`app.city_ensure` / gezielte `UPDATE`).
- **Abwärtskompatibilität:** Slot-/Region-IDs bleiben stabil; bereits (in Phase 7) bebaute
  Slots dürfen nicht verschwinden – neue Versionen fügen hinzu oder verschieben Positionen,
  entfernen aber keine belegten IDs.
- **Keine zufällige Neuanordnung** bestehender Städte.

## Schutz vor ungültigen Referenzen

- FK `city_states.layout_version → city_layout_versions.version`.
- `repair_city()` korrigiert eine (theoretisch) verwaiste Layoutversion auf die aktuelle,
  ohne XP oder Ressourcen zu verändern.
