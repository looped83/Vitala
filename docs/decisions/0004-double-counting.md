# ADR-0004: Doppelzählung – genau eine primäre Kategorie je Eintrag

**Status:** Akzeptiert · **Bezug:** [life-areas.md](../life-areas.md) §4.4

## Kontext

Eine Handlung kann mehrere Bereiche berühren (z. B. eine vegane Mahlzeit: Ernährung,
Nachhaltigkeit, Tierwohl; eine Radfahrt: Bewegung, Nachhaltigkeit). Ohne Regel entstünde
Mehrfach-XP → Farming, kaputte Balance, Intransparenz.

## Entscheidung

**Modell C:** Jeder Eintrag hat **genau eine primäre Kategorie**, die **volle XP und
volle Primärressource** erzeugt. Sekundäre Wirkungen erzeugen **keine zusätzliche XP und
keine zweite Ressource** – nur eine kleine, gedeckelte **visuelle Nebenwirkung** in der
Stadt (die den Balancewert nicht verändert).

Konkrete Regeln:

- Vegane Mahlzeit → **Ernährung** (Check-in). „Veganer Tag" als **Tierwohl**-Beitrag ist
  eine **eigenständige** Handlung; nie beides für denselben Fakt im selben Bereich.
- Radfahrt → entweder **Bewegung** (Sport) **oder** **Nachhaltigkeit** (statt Auto),
  pro Fahrt genau eine primäre Kategorie.
- Gemeinsame Aktivität → je Person persönliche XP, **Stadt-XP nur einmal** (via
  `activity_group_id`).

Technische Durchsetzung: Unique-Constraints (data-model §16.8), `activity_group_id`,
serverseitige RPC-Prüfung.

## Alternativen

- **A – volle Mehrfach-XP:** verworfen (Farming, Balance).
- **B – Primär voll + reduzierte Sekundär-XP (z. B. 30 %):** verworfen – intransparent
  („warum 30 %?"), schwerer testbar, öffnet Optimierungs-Rechnereien.
- **D – freie Zuordnung ohne Regel:** verworfen (manipulierbar, inkonsistent).

## Konsequenzen

- **Positiv:** transparent, testbar, farming-resistent, balance-neutral; die Welt darf
  trotzdem „reicher" reagieren (visuelle Nebenwirkung).
- **Negativ/Abwägung:** Nutzer müssen gelegentlich eine primäre Kategorie wählen (z. B.
  Radfahrt) → durch klare Defaults und kurze Erklärung im UI abgefedert.
