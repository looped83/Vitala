# ADR-0036: Deterministische, regelbasierte Missionsauswahl

**Status:** Akzeptiert · **Bezug:** [mission-selection.md](../mission-selection.md), missions-and-goals §7.3

## Kontext

Missionen sollen zur Tagesform, Balance und Historie passen, aber ohne externe KI, ohne
Analyse sensibler Freitexte (ADR-0028) und reproduzierbar (Server = mögliche Vorschau).

## Entscheidung

**Rein regelbasierte, deterministische Auswahl** aus einem kuratierten Pool
(`mission_definitions`). Harte Filter + additives Scoring, in TS
(`src/domain/missions/selection.ts`) und SQL (`app.pick_mission`) identisch:

1. **Erschöpfungsschutz** – fordernde Bewegung entfällt nach einem am Bewegungsdeckel
   erschöpften Vortag.
2. **Wiederholungsvermeidung** – nichts aus dem jüngsten Cooldown-Fenster.
3. **Tagesform** – wenig Zeit filtert lange Missionen; Regenerationswunsch filtert
   fordernde Missionen (nur strukturierte Check-in-Felder, **nie** Freitext).
4. **Balance-Lenkung** – am wenigsten abgedeckte Bereiche zuerst.
5. **Fokuswunsch / aktive Ziele** – milde Bevorzugung.
6. **Schwierigkeitspassung** – ruhig bei niedriger, voller bei hoher Energie.

Gleichstände werden über einen stabilen, tagesrotierenden Hash gebrochen (kein Zufall).
Tausch schließt die aktuelle Definition aus und liefert garantiert eine andere.

## Alternativen

- **KI/ML-Auswahl:** verworfen (Datenschutz §61, keine externen Dienste, nicht
  reproduzierbar).
- **Zufällige Auswahl:** verworfen (nicht nachvollziehbar, ignoriert Balance/Tagesform).

## Konsequenzen

- **Positiv:** nachvollziehbar, testbar, datensparsam, identisch auf Client und Server.
- **Abwägung:** Qualität hängt am kuratierten Pool — bewusst klein gehalten und
  versioniert erweiterbar.
