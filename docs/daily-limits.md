# Tageslimits & abnehmende Erträge

Deckel je `(Nutzer, Bereich, lokaler Tag)` in Household-Zeitzone verhindern Punktefarming
(§8/§9). Werte (Regelversion 1): Bewegung 30 · Ernährung 12 · Nachhaltigkeit 10 (+5 Sonder)
· Tierwohl 10 (+5 Sonder) · Rituale 6 · Check-ins 2. Das theoretische Tagesmaximum liegt so
bei ~74 XP (die per-Bereich-Deckel dominieren jedes höhere Gesamtlimit).

## Verhalten bei Überschreitung

Der Eintrag bleibt **vollständig gültig** und in der Historie; Ziel-/Missionsfortschritt
zählt weiter; nur XP wird bis zum Deckel vergeben. UI (sachlich, nicht wertend):

> „Das tägliche XP-Limit für diesen Bereich wurde erreicht. Der Eintrag bleibt vollständig
> dokumentiert."

## Abnehmende Erträge

- **Bewegung:** Basis steigt ab 81 min nicht weiter; keine lineare Belohnung über 2 h.
- **Regeneration:** fest 6 XP, max 1×/Tag.
- **Sonderaktionen (Nachhaltigkeit/Tierwohl):** je 5 XP, max 5 XP/Tag über dem Deckel.
- **Kleinstaktionen/identische Einträge:** durch die Bereichsdeckel begrenzt; weitere
  identische Handlungen dürfen dokumentiert werden, erzeugen aber keine zusätzlichen XP.

Umsetzung: Der Reconcile-Durchlauf berechnet den Tag in stabiler Reihenfolge mit
laufenden Summen und wendet Deckel und Sonder-Budgets in einem Durchgang an.
