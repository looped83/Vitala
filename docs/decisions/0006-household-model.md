# ADR-0006: Household-Modell – zwei Personen, saubere Rollen

**Status:** Akzeptiert · **Bezug:** [security-and-privacy.md](../security-and-privacy.md) §17

## Kontext

Vitala wird ausschließlich von zwei Personen genutzt. Die Architektur soll **sauber
generalisiert**, aber nicht auf Skalierung optimiert sein und ungewollte Ausweitung
verhindern.

## Entscheidung

Ein **Household** mit **genau zwei aktiven Mitgliedern** (`household_members`, Rollen
`owner`/`member`). Beitritt nur über **Einladungs-RPC** mit gehashtem, kurzlebigem,
einmaligem Code. Ein **harter Constraint** (Trigger) begrenzt auf **max. 2 aktive
Mitglieder**. Gemeinsame Daten (Stadt, Ressourcen, gemeinsame Ziele/Missionen) gehören
dem Household; persönliche Beiträge sind je Mitglied ausgewiesen.

- **RLS** auf allen household-bezogenen Tabellen (Zugriff nur bei Mitgliedschaft).
- **Kritische Aktionen** (Einladen, Deaktivieren, Household löschen) nur `owner`.
- Datenexport und Account-/Household-Löschung DSGVO-konform.

## Alternativen

- **Kein Household, nur zwei fest verdrahtete User:** unsauber, schwer testbar, keine
  klare Datenisolation.
- **Offenes Mehr-Personen-Modell:** widerspricht dem Zweck; erhöht Risiko ungewollter
  Ausweitung und Komplexität.

## Konsequenzen

- **Positiv:** saubere Isolation, klare Rollen, einfache RLS, sichere Einladung,
  2-Personen-Garantie.
- **Negativ/Abwägung:** minimaler Overhead gegenüber „nur zwei User"; bewusst akzeptiert
  für Sauberkeit und Sicherheit.
