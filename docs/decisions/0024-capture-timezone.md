# ADR-0024: Zeit- & Tagesgrenzen bei der Erfassung

**Status:** Akzeptiert · **Bezug:** [data-model.md](../data-model.md),
household-model, Aufgabe §30

## Kontext

Der **fachliche Aktivitätstag** (`occurred_on`) muss aus Nutzersicht eindeutig sein. Eine
UTC-Konvertierung darf einen abends erfassten Eintrag nie auf den Vortag schieben. Technische
Zeitstempel bleiben UTC.

## Entscheidung

- **`occurred_on` ist ein lokales Kalenderdatum** (`date`) in der **Household-Zeitzone**
  (`household_settings.timezone`, Default `Europe/Berlin`), kein UTC-Datum.
- **„Heute" / Zukunftsprüfung** serverseitig über `app.household_today(household)`
  (`now() at time zone <tz>`); zukünftige Daten werden abgelehnt (`invalid_date`).
- **Clientseitig** liefern `todayInZone`/`isoDateInZone` (date-fns-tz) dieselbe lokale
  Semantik; DST-Wechsel (Frühjahr/Herbst) sind abgedeckt.
- **Historiengruppierung** („Heute", „Gestern", ältere) rechnet in der Household-Zeitzone.
- Technische Felder `created_at`/`updated_at`/`deleted_at` bleiben `timestamptz` (UTC).
- **Rückdatierung** erlaubt (bis 2020-01-01); **keine** Zukunftseinträge in Phase 3.

## Alternativen

- **`occurred_on` als UTC-Datum:** verschiebt Abendeinträge → verworfen.
- **Zeitzone pro Nutzer statt Household:** die App teilt einen Household/Ort; eine
  Household-Zeitzone ist einfacher und konsistent (data-model §16.1) → gewählt.

## Konsequenzen

- **Positiv:** eindeutige Tagesgrenzen, DST-sicher, konsistent Client + Server; Basis für
  spätere Tages-/Wochenlogik (Phase 4/5).
- **Negativ/Abwägung:** Datumslogik existiert an zwei Orten (TS + SQL) – durch
  Zeitzonen-Tests (§30) synchron gehalten.
