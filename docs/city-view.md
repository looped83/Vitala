# Stadtansicht (Phase 6)

Die Stadtansicht (`/city`) ist die erste real nutzbare, datengetriebene Visualisierung der
gemeinsamen Stadt von Lutz und René. Sie ersetzt die abstrakte Stadtfortschrittsseite und
schafft die visuelle wie technische Grundlage für die Gebäudekonstruktion in Phase 7.

## Aufbau der Seite (§22)

1. **Stadt-Header** – Stadtname (`<h1>`), Stadtlevel + Entwicklungsstufe, Fortschritt zum
   nächsten Level, nächste Freischaltung, Umschaltung Karte/Liste, „Umbenennen".
2. **Freischaltungsmeldung** – ruhiger Banner für neu freigeschaltete Bereiche (§33).
3. **Interaktive Kartenansicht** oder **gleichwertige Listenansicht** (umschaltbar).
4. **Detailpanel** – Stadtbereich- bzw. Bauflächendetails (Desktop: Seitenpanel; Mobil:
   Bottom Sheet).
5. **Ressourcen der Stadt** – die vier Ressourcen + Bezug zu den Vierteln (§34/§64).
6. **Weltstatus** – kompakter, faktischer Überblick (§36).
7. **Diese Woche** – dezente Wochenbalance (§63).

## Datenfluss

- `city_overview()` (RPC) initialisiert die Stadt beim ersten Aufruf, sichert
  `highest_level` und liefert Household-Zustand + Nutzerpräferenz.
- Aus `currentLevel` + `seenLevel` baut `buildCityModel()` (Domain) das vollständige
  Darstellungsmodell (`CityModel`): Regionen mit Status + Slots, Entwicklungsstufe,
  nächste Freischaltung, neu Freigeschaltetes, Weltstatus-Zahlen und die
  Screenreader-Zusammenfassung.
- Ressourcen und Wochenbalance kommen aus dem bestehenden Reward-System (Phase 5).

## Prinzipien (§2)

- **Sichtbarer gemeinsamer Fortschritt**, kein Statistik-Dashboard.
- **Kooperation statt Besitz** – die Stadt gehört dem Household, keine privaten Grundstücke.
- **Kein Rückschritt** – Freischaltungen und Stufen gehen nie verloren; Inaktivität
  verschlechtert nichts.
- **Ruhe & Wertigkeit** – naturverbunden, klar lesbar, nicht überladen.
- **Performance vor Überladung** – keine Game-Engine, keine Renderloop, dezente Transitions.

## Was Phase 6 **nicht** tut (Abgrenzung)

Keine baubaren Gebäude, keine Ressourcenausgaben, keine Gebäudeproduktion, keine
Fake-Gebäude. Verfügbare Bauflächen verweisen ausdrücklich auf Phase 7.

## Verwandte Dokumente

[city-regions.md](./city-regions.md) · [city-development-stages.md](./city-development-stages.md)
· [city-unlocks.md](./city-unlocks.md) · [building-slots.md](./building-slots.md) ·
[city-layout.md](./city-layout.md) · [city-map-accessibility.md](./city-map-accessibility.md)
· [city-map-interactions.md](./city-map-interactions.md) ·
[city-database-schema.md](./city-database-schema.md) · [city-rls.md](./city-rls.md) ·
[city-migration.md](./city-migration.md) · [city-performance.md](./city-performance.md) ·
[city-testing.md](./city-testing.md) · [city-visual-language.md](./city-visual-language.md) ·
[city-asset-strategy.md](./city-asset-strategy.md) ·
[city-layout-versioning.md](./city-layout-versioning.md)
