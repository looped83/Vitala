# Stadt – Row Level Security

Migration `20260723090200_city_rls.sql`. Grundsatz: **deny-by-default**, SELECT nur für
Berechtigte, **alle Schreibvorgänge ausschließlich über SECURITY-DEFINER-RPCs** (§47/§69).

## Privilegien

| Tabelle                 | anon | authenticated (SELECT) | Schreiben      |
| ----------------------- | :--: | :--------------------: | -------------- |
| `city_layout_versions`  |  ✅  |           ✅           | nie (Referenz) |
| `city_states`           |  –   |    ✅ (eigenes HH)     | nur via RPC    |
| `city_view_preferences` |  –   |   ✅ (eigene Zeile)    | nur via RPC    |

RLS ist auf allen drei Tabellen aktiv. Es gibt **keine** INSERT/UPDATE/DELETE-Policy →
direkte Client-Schreibversuche scheitern (permission denied / keine Policy).

## Policies

- `city_layout_versions_select` – global lesbar (`using (true)`).
- `city_states_select` – `using (app.is_active_member(household_id))`.
- `city_view_preferences_select` – `using (user_id = auth.uid())`.

## Lesen (§47)

Aktive Household-Mitglieder dürfen ihre Stadt, ihren Bauflächenstatus (abgeleitet) und ihre
eigene Präferenz lesen. Fremde Nutzer lesen nichts. Deaktivierte Mitglieder verlieren den
Zugriff (`is_active_member` = false; `current_household` liefert null → RPCs werfen
`not_in_household`).

## Ändern (§47)

Aktive Mitglieder dürfen über RPCs:

- `rename_city(p_name)` – Stadtname (validiert, XSS-geschützt),
- `set_city_view_mode(p_mode)` – eigene Ansichtseinstellung,
- `acknowledge_city_level()` – Freischaltung als gesehen markieren.

Sie dürfen **nicht**: Stadtlevel/`highest_level` direkt setzen, Bereiche/Slots direkt
freischalten, Layoutversion beliebig manipulieren oder fremde Städte lesen/ändern. Alle
RPCs sind `security definer` mit `set search_path = ''`, prüfen `auth.uid()` und die
Household-Mitgliedschaft und vertrauen **keiner** clientseitigen Household-ID.

## Tests (pgTAP)

`supabase/tests/city.test.sql` prüft u. a.: fremdes Household liest keine Stadt, direkter
Client-Write wird abgelehnt (42501), Nutzer liest nur eigene Präferenz, deaktiviertes
Mitglied kann die Stadt nicht öffnen. Siehe [city-testing.md](./city-testing.md).
