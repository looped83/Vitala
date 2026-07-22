# ADR-0034: Korrekturstrategie bei Bearbeitung, Löschung und Finalisierung

**Status:** Akzeptiert · **Bezug:** [reward-corrections.md](../reward-corrections.md)

## Kontext

Aktivitäten und Check-ins können bearbeitet, verschoben oder gelöscht werden (Phase 3/4).
Die daraus entstandenen Belohnungen müssen konsistent bleiben, ohne bestehende
Ledger-Zeilen zu überschreiben (ADR-0032) und ohne Strafcharakter (Prinzip 2.5).

## Entscheidung

**Korrekturen sind Datenkorrekturen, keine Strafen.** Umgesetzt über Reconcile-to-Target
(ADR-0035): Beim Ändern/Löschen wird der betroffene Tag neu berechnet und die Differenz
als **Korrekturzeile** (positiv oder negativ) geschrieben.

Regeln je Quelle:

- **Direkte Eintragsbelohnung** (Aktivität / Check-in / Ritual-Baustein): wird immer auf
  den aktuellen Stand des Eintrags korrigiert; Löschung → Korrektur auf 0.
- **Abgeschlossene Missionen:** eine einmal vergebene Missionsbelohnung wird **nicht**
  entzogen, wenn ein zugrunde liegender Eintrag später geändert wird — der Abschluss war
  zum Zeitpunkt gültig. Nur die direkte Eintragsbelohnung wird korrigiert.
- **Abgeschlossene Zielperioden:** analog — eine finalisierte Periodenbelohnung bleibt
  bestehen; nur die zugrunde liegenden Eintrags-XP werden korrigiert.

## Alternativen

- **Alt-Belohnung überschreiben:** verworfen (verletzt Append-only, keine Auditierbarkeit).
- **Missions-/Zielabschlüsse rückabwickeln:** verworfen als Standard — fühlte sich wie
  Bestrafung an; nur bei objektiver Ungültigkeit denkbar (bewusst nicht automatisiert).

## Konsequenzen

- **Positiv:** verlustfrei, auditierbar, transparent; keine Straf-Semantik.
- **Abwägung:** In seltenen Fällen bleibt eine Missions-/Zielbelohnung bestehen, obwohl der
  Auslöser nachträglich verändert wurde — bewusst zugunsten von Ruhe und Fairness.
- **Bekannte Kleinstgrenze:** ein vollständig tagesgedeckelter, gemeinsamer Check-in, der
  ausschließlich Gemeinschaft erzeugte und danach gelöscht wird, behält bis zu 2
  Gemeinschaft (loss-free-Überschuss, nie ein Nutzerverlust).
