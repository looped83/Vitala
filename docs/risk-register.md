# Risikoregister

Bewertung: Eintrittswahrscheinlichkeit (W) und Auswirkung (A) je niedrig/mittel/hoch.
Restrisiko nach Gegenmaßnahme. Sortiert grob nach kombiniertem Schweregrad.

| #   | Risiko                                                         |    W    |    A    | Gegenmaßnahme                                                                                                              | Restrisiko |
| --- | -------------------------------------------------------------- | :-----: | :-----: | -------------------------------------------------------------------------------------------------------------------------- | ---------- |
| R1  | **Zu komplexes Spielsystem** (Überforderung, sinkende Nutzung) | mittel  |  hoch   | Bewusst schlank: 5 Ressourcen, 2 XP-Ströme, transparente Formeln; V1-Gebäudeauswahl begrenzt; Prinzip 2.6 als harte Grenze | niedrig    |
| R2  | **Zu hoher täglicher Eingabeaufwand**                          | mittel  |  hoch   | Zeitbudgets (≤1 min Check-in, ≤30 s Erfassung), Schnellaktionen/Favoriten, keine Pflichtfelder                             | niedrig    |
| R3  | **Punktefarming** (triviales Abhaken)                          | mittel  | mittel  | Tagesdeckel je Bereich, Diminishing Returns, 1×/Tag je Handlung, besondere Aktionen limitiert, serverseitige Prüfung       | niedrig    |
| R4  | **Doppelzählung** (Mehrfach-XP für einen Fakt)                 | mittel  |  hoch   | Modell C (eine primäre Kategorie), Unique-Constraints, `activity_group_id`, ADR-0004                                       | niedrig    |
| R5  | **Einseitige Nutzung** (ein Bereich dominiert)                 |  hoch   | mittel  | Balance-Bonus (nicht Zwang), Missions-Balance-Lenkung, Gebäudeverteilung über Bereiche                                     | mittel     |
| R6  | **Übermotivation / Übertraining**                              | niedrig |  hoch   | Deckel begrenzen Tages-XP, Intensität schwach gewichtet, Regeneration belohnt, Erschöpfungsschutz bei Missionen            | niedrig    |
| R7  | **Restriktives Essverhalten gefördert**                        | niedrig |  hoch   | Keine Kalorien/Mengen/Gewicht, keine Verzichts-Belohnung, qualitative Bausteine, Deckel                                    | niedrig    |
| R8  | **Moralischer Druck / Schuldgefühle**                          | mittel  | mittel  | Positive Verstärkung (2.2), keine Streaks/Warnfarben, freundliche Texte, kein CO₂-Moralisieren                             | niedrig    |
| R9  | **Technische Komplexität der Stadtansicht**                    | mittel  | mittel  | SVG statt 3D (ADR-0001), datengetriebene Welt, Culling, Performance-Budgets                                                | mittel     |
| R10 | **Schlechte mobile Performance**                               | mittel  |  hoch   | Budgets (§21.1), Lazy Loading, gebündelte Queries, Lighthouse-CI, mobile-first                                             | niedrig    |
| R11 | **Schwer wartbare Gebäudelogik**                               | mittel  | mittel  | Datengetriebene Definitionen (JSONB-Config), einheitliches Bau-/Refund-Schema, Tests                                       | niedrig    |
| R12 | **Inkonsistente Belohnungen** (Client ≠ Server)                | mittel  |  hoch   | Server autoritativ (ADR-0005), geteilte Domain-Logik, Optimistik nur Vorschau, Integrationstests                           | niedrig    |
| R13 | **Manipulation clientseitiger Daten**                          | niedrig |  hoch   | RLS, kein Client-Schreibpfad zu Ledgern, RPC + Idempotenz, Validierung server­seitig                                       | niedrig    |
| R14 | **Zu viele Tabellen** (Überkomplexität DB)                     | mittel  | mittel  | Konsolidierung (Rituale generisch, Ledger vereint), begründete Trennung (data-model §16.7)                                 | niedrig    |
| R15 | **Zu generisches Datenmodell** (unklar, langsam)               | niedrig | mittel  | Typisierte Spalten für Abfragewerte, JSONB nur für Config, Indizes                                                         | niedrig    |
| R16 | **Zu starres Datenmodell** (blockiert Phase 8+)                | niedrig | mittel  | Saison/Tageszeit berechnet statt gespeichert; erweiterbare Definitionen ohne Migration                                     | niedrig    |
| R17 | **Zu viel Gamification** (wirkt kindlich/manipulativ)          | mittel  | mittel  | Erwachsene Tonalität/Design (design-system), keine Dark Patterns, kein Verlust/Countdown                                   | niedrig    |
| R18 | **Zu wenig sichtbarer Fortschritt** (Motivation sinkt)         | mittel  | mittel  | Sofortige transparente Belohnung, wachsende Stadt, City-Events/Historie, Wochenprojekte                                    | niedrig    |
| R19 | **Balancing-Werte unpassend** (zu leicht/schwer)               |  hoch   | niedrig | Werte als Daten (nicht Code) → justierbar; dedizierte Balancing-Phase 9                                                    | niedrig    |
| R20 | **Zeitzonen-/DST-Fehler** (falsche Tagesgrenzen)               | mittel  | mittel  | Serverseitige Grenzen in Household-Zeitzone, date-fns-tz, dedizierte Tests                                                 | niedrig    |
| R21 | **Offline-Sync-Konflikte / Doppelbuchung**                     | mittel  | mittel  | Idempotenzschlüssel, Outbox-Replay, Server autoritativ (ADR-0008)                                                          | niedrig    |
| R22 | **Datenschutzverstoß** (sensible Gesundheitsdaten)             | niedrig |  hoch   | Datenminimierung, RLS, keine Tracker, Export/Löschung, keine CO₂/Gewichtsdaten                                             | niedrig    |

## Umgang mit den mittleren Restrisiken

- **R5 (Einseitige Nutzung):** bewusst akzeptiert – Einseitigkeit ist erlaubt (Prinzip
  2.3). Der Balance-Bonus ist ein Anreiz, kein Zwang; wird in Phase 9 feinkalibriert.
- **R9 (Stadtkomplexität):** durch frühe Prototyp-Performance-Messung (Phase 6) und
  Budgets kontrolliert; Fallback ist stärkeres Culling / weniger animierte Elemente.

Das Risikoregister wird pro Phase im Rahmen der Definition of Done aktualisiert.
