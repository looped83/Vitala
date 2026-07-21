# ADR-0003: XP-Modell – getrennte Ströme, progressive Levelkurve

**Status:** Akzeptiert · **Bezug:** [resources-and-xp.md](../resources-and-xp.md)

## Kontext

XP muss individuellen Fortschritt anerkennen **und** das gemeinsame Stadtwachstum
speisen, ohne Wettbewerb (Prinzip 2.1) und ohne Übermotivation (2.4).

## Entscheidung

**Zwei getrennte XP-Ströme:**

- **Persönliche XP** → persönliches Level (individuell, kosmetisch).
- **Stadt-XP** = `round(0,5 × persönliche XP) + Boni` → gemeinsames Stadtlevel.

**Levelkurve: progressiv, linear ansteigende Kosten.**

- Persönlich: `req(L) = 80 + 40·L`.
- Stadt: `req_city(L) = 200 + 120·L`.

Kritische Belohnungen serverseitig (ADR-0005). Tagesdeckel je Bereich begrenzen die
maximale XP/Tag (~74), damit Regelmäßigkeit > Einzelspitzen.

## Alternativen

- **Ein gemeinsamer XP-Topf:** verliert die persönliche Anerkennung.
- **Lineare Levelkurve:** zu schnell „ausgelevelt", langweilt langfristig.
- **Feste Schwellen-Tabelle:** unflexibel, schwer erweiterbar.
- **Exponentielle Kurve:** zu steil, entmutigend über Jahre.
- **100 % Kopplung Stadt = persönlich:** würde individuelle Spitzen zu stark auf die
  Stadt übertragen; 50 % betont **gemeinsame** Regelmäßigkeit.

## Konsequenzen

- **Positiv:** transparente, testbare Formeln; ruhiges Tempo (Level 10 ≈ 6 Monate bei
  ~20 XP/Tag); Kooperation strukturell betont.
- **Negativ/Risiko:** Werte müssen in Phase 9 kalibriert werden → als Daten gehalten.
