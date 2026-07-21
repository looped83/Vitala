# ADR-0028: Privatsphäre persönlicher Check-ins

**Status:** Akzeptiert · **Bezug:** [morning-check-in.md](../morning-check-in.md),
[evening-check-in.md](../evening-check-in.md), [privacy-data-inventory.md](../privacy-data-inventory.md),
Aufgabe §24/§39.5/§49

## Kontext

Morgen- und Abend-Check-ins enthalten sensible, subjektive Daten (Energie, Tagesgefühl,
persönliche Wünsche, Reflexionen). Diese dürfen weder ausgewertet noch dem Partner
offengelegt werden, sofern Phase 1 dies nicht ausdrücklich vorsieht.

## Entscheidung

- **Strikt privat:** `daily_check_ins` ist per RLS ausschließlich für die eigene Person
  lesbar (`user_id = auth.uid()`). Der Partner sieht **keine** Check-in-Inhalte – auch keine
  strukturierten Werte.
- **Ein Modell, typisierte Felder:** eine Basistabelle mit `check_in_type` und typisierten
  Detailspalten (kein JSONB). `unique(user_id, check_in_type, business_date)` sichert genau
  einen Check-in je Typ, Nutzer und lokalem Tag.
- **Alles optional:** ein Ein-Tap-Check-in ohne Angaben ist gültig; kein Pflichtfeld, keine
  negative Darstellung bei fehlendem Check-in.
- **Keine Auswertung:** keine Sentimentanalyse, keine psychologische Profilbildung, keine
  medizinische Interpretation, keine externe KI-Verarbeitung.
- **Kein Logging von Freitext:** Freitexte erscheinen nie in Logs oder Fehlerberichten
  (allgemeine Fehlerbehandlung ADR-0017 rendert nur neutrale Meldungen).
- **Schreibpfad:** nur über `save_check_in` (SECURITY DEFINER); `business_date` wird
  serverseitig gegen `household_today` geprüft (keine Zukunft).

## Alternativen

- **Strukturierte Werte teilen, nur Freitext privat:** erhöht Komplexität und Risiko einer
  versehentlichen Offenlegung; für ein Zwei-Personen-Produkt bringt geteilte Tagesform wenig
  Mehrwert gegenüber dem Datenschutzrisiko → **alles privat** gewählt.
- **JSONB-Detailfeld:** verhindert DB-Constraints (max. ein Check-in, Wertebereiche) → typisierte
  Spalten gewählt.

## Konsequenzen

- **Positiv:** klare, einfache Datenschutzgarantie; DB-seitig durchsetzbare Eindeutigkeit;
  wenig Angriffsfläche.
- **Negativ/Abwägung:** gemeinsame Tagesinformation (falls je gewünscht) müsste separat und
  bewusst modelliert werden; heute bewusst nicht.
