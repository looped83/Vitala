# ADR-0035: Reward-Verarbeitung – Reconcile-to-Target in den Schreib-RPCs

**Status:** Akzeptiert · **Bezug:** [reward-system.md](../reward-system.md), ADR-0005/0020

## Kontext

Belohnungen müssen atomar, idempotent und zeitzonensicher entstehen (ADR-0005). Zugleich
soll keine teure Neuberechnung der gesamten Historie bei jeder Mutation nötig sein
(Performance §63) und keine schwer testbare Triggerkette (§48).

## Entscheidung

**Die bestehenden `SECURITY DEFINER`-Schreib-RPCs aus Phase 3/4 lösen die
Belohnungsberechnung im selben Vorgang aus.** Kein separater Backend-Dienst, keine reinen
Reward-Trigger.

Kernmechanik: **Reconcile-to-Target.** Für die betroffene Einheit `(Nutzer, Bereich,
lokaler Tag)` werden alle **lebenden** Einträge in stabiler Reihenfolge neu bewertet
(Tagesdeckel, abnehmende Erträge, gemeinsame Boni in einem Durchgang). Für jede logische
Belohnungsidentität wird die bisherige Ledger-Summe des Tages ermittelt und nur die
**Differenz** als eine Zeile geschrieben.

- **Idempotent:** erneuter Aufruf → Differenz 0 → keine Zeile.
- **Korrekturen** (Bearbeiten/Löschen/Verschieben) sind gewöhnliche Zielverschiebungen;
  ein „Sweep" nullt Belohnungen von Einträgen, die aus der lebenden Menge fallen.
- **Datумsbezogen:** die Identität ist auf den fachlichen Tag begrenzt, damit ein
  verschobener Eintrag seine Belohnung mit sich nimmt (§43).
- **Einmal-Belohnungen** (Missionen, Ziele, Balancebonus) nutzen **Dedup-Keys** mit
  Unique-Constraint statt Reconcile (§15).

## Alternativen

- **Reine Datenbanktrigger:** verworfen — mehrschrittige Rückgaben schlecht abbildbar,
  Triggerketten schwer testbar, Doppelverarbeitung mit dem Client möglich.
- **Externer Application-Service:** verworfen — unnötige Komplexität (ADR-0005).
- **Voll-Neuberechnung aller Tage:** verworfen — teuer; Reconcile ist auf einen
  (Nutzer, Bereich, Tag) begrenzt und damit O(Einträge des Tages).

## Konsequenzen

- **Positiv:** atomar, idempotent, korrekt bei Edit/Delete/Move, ohne globale
  Neuberechnung; eine einzige nachvollziehbare Codebahn; gegen Race Conditions durch die
  Transaktion der RPC geschützt.
- **Abwägung:** die Reward-Logik liegt (wie in ADR-0005 akzeptiert) doppelt vor —
  TS-Vorschau + SQL-Autorität — und wird durch identische Formeln und gemeinsame
  Testfälle synchron gehalten.
