# ADR-0012: RLS-Hilfsfunktionen – privates Schema, SECURITY DEFINER, fixer search_path

**Status:** Akzeptiert · **Bezug:** [row-level-security.md](../row-level-security.md), [security-and-privacy.md](../security-and-privacy.md) §18.2

## Kontext

RLS-Policies müssen die Household-Mitgliedschaft prüfen. Prüft eine Policy die Tabelle
`household_members` selbst, entsteht **Policy-Rekursion**. Zudem dürfen Policies nicht auf
vom Client übergebene Household-IDs vertrauen – die Mitgliedschaft muss serverseitig
festgestellt werden.

## Entscheidung

- Mitgliedschafts-Checks laufen über **`SECURITY DEFINER`-Hilfsfunktionen** im **privaten
  Schema `app`** (`is_active_member`, `is_owner`, `shares_active_household`,
  `active_member_count`).
- Das Schema `app` ist **nicht über die API exponiert** (`config.toml` → `[api].schemas`
  enthält nur `public`).
- Jede Funktion setzt einen **fixen `search_path = ''`** und qualifiziert alle Objekte
  vollständig (Schutz vor search_path-Angriffen).
- Ausführungsrechte werden von `public` entzogen und nur `authenticated`/`service_role`
  gewährt.
- Da die Funktionen als Definer laufen, **umgehen sie RLS** und beenden damit die Rekursion,
  ohne selbst eine Vertrauenslücke zu öffnen (sie lesen nur die Mitgliedschaftstabelle).

## Alternativen

- **Policies referenzieren `household_members` direkt:** Rekursion, fehleranfällig.
- **Mitgliedschaft aus JWT-Claims lesen:** Claims sind nicht autoritativ für
  Household-Zugehörigkeit; müsste serverseitig gepflegt werden.

## Konsequenzen

- **Positiv:** rekursionsfreie, konsistente Policies; ein zentraler, getesteter Ort für die
  Mitgliedschaftslogik; kein Client-Vertrauen.
- **Negativ/Abwägung:** Definer-Funktionen erfordern Sorgfalt (search_path, minimale Rechte)
  – per Konvention und Test abgesichert.
