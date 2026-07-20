# ADR-0002: Ressourcenmodell – 5 aktive Ressourcen + abgeleitetes Baumaterial

**Status:** Akzeptiert · **Bezug:** [resources-and-xp.md](../resources-and-xp.md)

## Kontext

Das Spiel braucht Ressourcen für Gebäude, ohne kognitiv zu überfordern (Prinzip 2.6).
Vorgabe: maximal vier bis fünf aktiv verwaltete Ressourcen. Kandidaten laut Konzept:
Energie, Nahrung, Natur, Gemeinschaft, Wissen, Baumaterial, Erfahrung.

## Entscheidung

**5 aktiv verdiente Ressourcen:** Energie (Bewegung), Nahrung (Ernährung), Natur
(Nachhaltigkeit + Tierwohl), Gemeinschaft (gemeinsame Handlungen/Rituale/Check-ins).
Dazu **1 abgeleitete** Ressource **Baumaterial**, die nur beim Wochenabschluss
balanceabhängig aus den anderen entsteht (`min(...)`-Formel).

- **Wissen** wird **verworfen** (schwach genutzter Zähler); Wissensaspekte fließen in
  „Gemeinschaft" (z. B. „Tierwohlwissen vertieft").
- **Erfahrung** ist **keine** Ressource, sondern der separate XP-Strom (ADR-0003).
- **Natur** ist eine geteilte Ressource für zwei Lebensbereiche; die **Vier-Bereiche-
  Balance** bleibt über **getrennte XP-/Balance-Zähler** erhalten.

## Alternativen

- **7 Ressourcen (alle Kandidaten):** zu komplex, verstößt gegen 2.6.
- **Je Lebensbereich eine Ressource (4) ohne Gemeinschaft:** verliert die kooperative
  Dimension (Gemeinschaft als gemeinsame Währung).
- **Baumaterial als direkt gefarmte 6. Ressource:** würde Balance-Hebel schwächen und
  eine weitere aktiv zu verwaltende Ressource bedeuten.

## Konsequenzen

- **Positiv:** überschaubare Ökonomie; Baumaterial als Balance-Hebel ohne Bestrafung;
  Gemeinschaft belohnt Kooperation.
- **Negativ/Risiko:** „Natur" bündelt zwei Bereiche → Balance muss über getrennte
  XP-Zähler sichergestellt werden (in Domain-Logik + Anzeige umgesetzt).
