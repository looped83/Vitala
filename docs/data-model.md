# Datenmodell

Relationales PostgreSQL-Modell (Supabase). Grundsätze ([ADR-0009](./decisions/0009-data-model.md)):
normalisiert, RLS-isoliert nach Household, Append-only-Ledger für Ressourcen/XP,
JSONB nur für definierte Flexfelder, Idempotenz und Doppelzählungsschutz per Constraints.

Konventionen: PK = `id uuid default gen_random_uuid()`; Zeitstempel `created_at`,
`updated_at timestamptz`; Soft-Delete via `deleted_at timestamptz null` bei
nutzererfassten Einträgen; alle household-bezogenen Tabellen tragen `household_id`.

---

## 16. Entitäten

### 16.1 Identität & Household

**`households`** — id, name, created_at, updated_at.
**`household_settings`** — household_id (PK/FK), timezone (default `Europe/Berlin`),
week_start (default 1=Montag), theme_default, reduced_motion_default, created/updated.
**`household_members`** — id, household_id FK, user_id (Supabase auth.users) FK,
role (`owner`|`member`), status (`active`|`deactivated`), joined_at.
- Unique(household_id, user_id); **Constraint: max. 2 aktive Mitglieder** (per Trigger,
  siehe security-and-privacy).
**`profiles`** — id = user_id, display_name, accent_color, avatar_motif, level (abgeleitet
/ gecacht), title, created/updated.
**`user_preferences`** — user_id (PK/FK), theme, reduced_motion, week_start_override(null),
notification_opt_in(bool, default false), created/updated.
**`household_invites`** — id, household_id FK, code (unique, hashed), created_by,
expires_at, accepted_at(null), created_at.

### 16.2 Aktivitäten & Rituale

**`activity_types`** — id, key (slug), name, category (`movement`), type_weight,
base_rule (Verweis, konstant im Code/Config), is_active. *(Referenzdaten, kein
Household)*
**`activities`** — id, household_id FK, user_id FK, activity_type_id FK, duration_min,
intensity (`light`|`medium`|`intense`|null), occurred_on (date, Household-Zeit),
location(null), note(null), activity_group_id (uuid null, für gemeinsame Aktivität),
idempotency_key (unique je household), created/updated/deleted_at.
- Index(household_id, occurred_on); Index(activity_group_id).
**`activity_participants`** — id, activity_group_id, user_id, household_id.
*(verknüpft gemeinsame Aktivität; Stadt-XP nur einmal je Gruppe – erzwungen in RPC.)*
**`ritual_definitions`** — id, key, area (`nutrition`|`sustainability`|`animal_welfare`),
name, kind (`daily_block`|`special_action`), base_xp, is_special, is_active.
*(Referenzdaten: Ernährungsbausteine, Nachhaltigkeits-/Tierwohl-Handlungen.)*
**`ritual_entries`** — id, household_id FK, user_id FK, ritual_definition_id FK,
occurred_on (date), note(null), idempotency_key, created/updated/deleted_at.
- **Unique(household_id, user_id, ritual_definition_id, occurred_on)** → verhindert
  doppeltes Abhaken derselben Handlung am selben Tag.
**`daily_check_ins`** — id, household_id FK, user_id FK, kind (`morning`|`evening`),
check_in_date (date), energy(null), available_time(null), intensity_wish(null),
focus_area(null), mood(null), moment_note(null), created/updated.
- **Unique(household_id, user_id, kind, check_in_date)** → ein Check-in je Art/Tag.

> **Ernährungs-Check-in** wird als Menge von `ritual_entries` mit `area='nutrition'`
> modelliert (Bausteine). Der „ein Check-in pro Tag"-Charakter ergibt sich aus der
> Unique-Regel je Baustein/Tag + Tagesdeckel in der RPC.

### 16.3 XP, Level, Ressourcen (Ledger)

**`experience_transactions`** — id, household_id FK, user_id FK, scope (`personal`|`city`),
amount (int, kann negativ sein bei Korrektur), reason (`activity`|`ritual`|`mission`|
`goal`|`balance_bonus`|`week_bonus`|`checkin`|`correction`), source_id (uuid, verweist
auf Ursprung), occurred_on, created_at. *(Append-only; Level = Aggregat.)*
- Index(household_id, scope), Index(user_id, scope).
**`level_definitions`** — scope (`personal`|`city`), level, cumulative_xp, title(null).
*(Referenzdaten; generiert aus Formel resources-and-xp §3/§4.)*
**`resources`** — household_id FK + resource_key (`energy`|`food`|`nature`|`community`|
`building_material`); balance (int ≥ 0), updated_at. PK(household_id, resource_key).
**`resource_transactions`** — id, household_id FK, resource_key, amount (int, +/−),
reason (`grant`|`spend_build`|`refund`|`week_material`|`balance_bonus`|`correction`),
source_id, created_by(user_id null), idempotency_key, created_at. *(Append-only Ledger;
`resources.balance` = Summe, per Trigger konsistent gehalten oder als Materialized/RPC.)*
- **Unique(idempotency_key)** → Idempotenz gegen Doppelbuchung.

### 16.4 Missionen & Ziele

**`mission_definitions`** — id, key, title, description, category, goal_type, goal_value,
period (`day`|`week`|`month`|`season`), reward (jsonb: {personal_xp, city_xp, resources}),
is_swappable, is_active. *(Referenz/Template-Pool.)*
**`mission_assignments`** — id, household_id FK, user_id(null bei gemeinsam),
mission_definition_id FK, scope (`personal`|`shared`), period_start, period_end,
status (`offered`|`active`|`completed`|`skipped`|`expired`), swapped_count, created/updated.
- Index(household_id, period_start).
**`mission_completions`** — id, mission_assignment_id FK, completed_at, progress_value,
reward_granted (bool), idempotency_key.
**`goals`** — id, household_id FK, owner_user_id(null bei gemeinsam), is_shared,
title, description, goal_type, goal_value, area, period_type, period_start, period_end,
recurrence (`none`|`weekly`|`monthly`|`quarterly`), status (`active`|`paused`|`completed`|
`archived`), created/updated.
**`goal_progress`** — id, goal_id FK, period_start, period_end, current_value,
is_completed, computed_at. *(Snapshot je Periode; Live-Wert wird zusätzlich aus Einträgen
aggregiert.)*

### 16.5 Stadt & Gebäude

**`building_definitions`** — id, key, name, category, description, unlock_condition (jsonb:
{min_city_level, requires_all_areas:bool}), build_cost (jsonb: {building_material, area_resource}),
stages (jsonb: Array von {stage, cost, min_city_level}), bonuses (jsonb), history_template,
a11y_description, is_v1. *(Referenzdaten.)*
**`buildings`** — id, household_id FK, building_definition_id FK, current_stage,
status (`in_progress`|`built`), position (jsonb {x,y}), built_at(null), created/updated.
**`building_progress`** — id, building_id FK, resource_key, invested (int),
required (int), updated_at. *(Fortschritt je Ressource; Refund = Summe invested.)*
**`world_areas`** — id, household_id FK, area_key, unlocked (bool), unlocked_at(null),
min_city_level. *(Stadtbereiche.)*
**`world_elements`** — id, household_id FK, element_key (`tree`|`water`|`path`|`animal`|…),
position (jsonb), origin (`start`|`building`|`level`|`balance`), permanent (bool),
created_at. *(Statische Deko/Natur; datengetriebene Weltrekonstruktion.)*
**`weekly_projects`** — id, household_id FK, building_id FK(null), week_start, week_end,
status (`active`|`completed`|`carried_over`|`paused`), created/updated.
**`city_events`** — id, household_id FK, event_type (`building_built`|`city_level_up`|
`goal_completed`|`seasonal`), title, narrative, occurred_at, meta (jsonb: aggregierter
Kontext, **keine** Roh-Gesundheitsdaten). *(Stadtgeschichte.)*

### 16.6 Auszeichnungen & Audit

**`achievements`** — id, key, name, description, condition (jsonb), scope
(`personal`|`household`). *(Referenzdaten; optionale Meilenstein-Abzeichen, freundlich.)*
**`achievement_progress`** — id, household_id FK, user_id(null), achievement_id FK,
progress, unlocked_at(null).
**`audit_log`** — id, household_id FK, user_id(null), action, entity, entity_id,
before (jsonb null), after (jsonb null), created_at. *(kritische Mutationen: Rollen,
Household-Änderungen, Löschungen, manuelle Korrekturen.)*

---

## 16.7 Konsolidierung & JSONB-Entscheidungen

**Zusammengelegt / generisch:**
- Ernährungs-, Nachhaltigkeits-, Tierwohl-Handlungen teilen **eine** Tabelle
  (`ritual_definitions`/`ritual_entries`) mit `area`-Diskriminator → weniger Tabellen,
  gemeinsame Logik. Bewegung bleibt separat (`activities`), da eigene Felder (Dauer,
  Intensität) und Diminishing-Returns-Regel.
- XP-Ströme (persönlich/Stadt) in **einer** `experience_transactions` mit `scope`.
- Ressourcen in **einer** `resources`/`resource_transactions` mit `resource_key`.

**Getrennt gehalten:** Missionen vs. Ziele (unterschiedliche Erzeugung/Lebenszyklus,
missions-and-goals §8.6). Gebäudedefinition vs. Instanz. Bereichs- vs. Element-Weltdaten.

**JSONB gezielt genutzt** für: `reward`, `unlock_condition`, `build_cost`, `stages`,
`bonuses`, `position`, `meta` – strukturell variable, referenzartige Konfiguration.
**JSONB vermieden** für: alle abfrage-/aggregationsrelevanten Werte (XP, Ressourcenmengen,
Fortschritt, Status, Datumsfelder) → als typisierte Spalten, damit sie indizierbar und
constraint-fähig bleiben.

---

## 16.8 Schlüssel, Constraints, Indizes

- **Primärschlüssel:** durchgängig `uuid`.
- **Fremdschlüssel:** mit `on delete` je Semantik (Household-Kaskade bei Löschung des
  Households; ansonsten restriktiv).
- **Unique Constraints (Doppelzählungs-/Idempotenzschutz):**
  - `ritual_entries(household_id, user_id, ritual_definition_id, occurred_on)`
  - `daily_check_ins(household_id, user_id, kind, check_in_date)`
  - `activities(household_id, idempotency_key)`
  - `resource_transactions(idempotency_key)`
  - `mission_completions(idempotency_key)`
  - `household_members(household_id, user_id)`
  - `household_invites(code)`
- **Check Constraints:** `activities.duration_min between 5 and 300`;
  `resources.balance >= 0`; `intensity in (...)`; `status/scope`-Enums via Domain/Check.
- **Indizes:** je Tabelle auf `household_id` + häufige Filter (`occurred_on`,
  `period_start`, `scope`, `activity_group_id`).
- **Zeitstempel:** `created_at`/`updated_at` überall; `updated_at` per Trigger.

## 16.9 Löschung, Archivierung, Idempotenz

- **Soft Delete** (`deleted_at`) für nutzererfasste Einträge (Aktivitäten, Rituale) →
  ermöglicht korrekte Fortschrittskorrektur und Wiederherstellung.
- **Hard Delete** nur bei **Account-/Household-Löschung** (DSGVO, kaskadierend, siehe
  security-and-privacy).
- **Archivierung:** Ziele/Perioden via `status='archived'` (Daten bleiben).
- **Idempotenz:** clientseitig erzeugte `idempotency_key` je Mutation; Server ignoriert
  Duplikate → Schutz bei Retries/Outbox-Replay.
- **Schutz vor Doppelbelohnung:** Kombination aus Unique-Constraints (oben),
  `activity_group_id` (gemeinsame Aktivität einmal für Stadt) und
  Append-only-Ledger mit Idempotenzschlüssel.

## 16.10 RLS-Konzept (Überblick)

- **Jede** household-bezogene Tabelle: RLS aktiv; Policy erlaubt Zugriff nur, wenn
  `household_id` in den Households des `auth.uid()` liegt (via `household_members`).
- **`resources`/`resource_transactions`/`experience_transactions`:** **kein** direktes
  `INSERT/UPDATE` durch Clients → nur `SELECT`; Schreiben ausschließlich über
  `SECURITY DEFINER`-RPC-Funktionen (Manipulationsschutz).
- **Referenzdaten** (`activity_types`, `ritual_definitions`, `building_definitions`,
  `level_definitions`, `achievements`): global lesbar, nicht schreibbar durch Clients.
- **`household_invites`:** nur `owner` erstellt; Beitritt über RPC, die Rolle/Anzahl prüft.
- Details und Policies: [security-and-privacy.md](./security-and-privacy.md).

---

## 16.11 ER-Übersicht (vereinfacht)

```
households ──1:1── household_settings
    │
    ├──1:2── household_members ──*:1── auth.users ──1:1── profiles / user_preferences
    ├──1:*── activities ──*:1── activity_types
    │           └── activity_group_id ──*── activity_participants
    ├──1:*── ritual_entries ──*:1── ritual_definitions
    ├──1:*── daily_check_ins
    ├──1:*── experience_transactions        (Ledger, scope personal|city)
    ├──1:*── resources / resource_transactions (Ledger)
    ├──1:*── mission_assignments ──*:1── mission_definitions
    │           └──1:*── mission_completions
    ├──1:*── goals ──1:*── goal_progress
    ├──1:*── buildings ──*:1── building_definitions
    │           └──1:*── building_progress
    ├──1:*── weekly_projects
    ├──1:*── world_areas / world_elements
    ├──1:*── city_events
    ├──1:*── achievement_progress ──*:1── achievements
    └──1:*── audit_log
```
