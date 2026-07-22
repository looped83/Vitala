# Belohnungssystem (Phase 5)

Das vollständige, nachvollziehbare und faire Belohnungs- und Fortschrittssystem von
Vitala. Alle kritischen Werte werden **serverseitig autoritativ** berechnet
([ADR-0005](./decisions/0005-server-side-rewards.md)); der Client zeigt nur an und
berechnet mit denselben Formeln optionale Vorschauen.

Verwandte Dokumente: [personal-experience.md](./personal-experience.md),
[city-experience.md](./city-experience.md), [level-system.md](./level-system.md),
[resource-system.md](./resource-system.md), [reward-rules.md](./reward-rules.md),
[reward-ledger.md](./reward-ledger.md), [reward-corrections.md](./reward-corrections.md),
[daily-limits.md](./daily-limits.md), [mission-system.md](./mission-system.md),
[balance-system.md](./balance-system.md), [reward-rls.md](./reward-rls.md),
[reward-database-schema.md](./reward-database-schema.md),
[reward-backfill.md](./reward-backfill.md).

---

## 1. Produktprinzipien

- **Nachvollziehbarkeit:** Jede Belohnung erklärt Handlung, Regel, Betrag, Ressourcen,
  Limit, gemeinsamen Bonus, Balancebonus (keine Blackbox). Jede Änderung liegt als
  Ledger-Zeile vor.
- **Kooperation:** persönlicher Fortschritt ist sichtbar, gemeinsamer wichtiger als
  Vergleich; keine Ranglisten, keine Gewinner/Verlierer.
- **Balance:** die vier Bereiche sind gleichwertig; kein Bereich ist dauerhaft die
  effizienteste Quelle (XP pro investierter Minute ist vergleichbar).
- **Gesundheitsschutz:** abnehmende Erträge, keine Belohnung für Mahlzeitenauslassen,
  Restriktion, Gewichtsverlust oder Übertraining; Regeneration und kleine Aktivitäten
  zählen.
- **Kein Verlust:** XP werden nie als Strafe entfernt, Level sinken nicht, Ressourcen
  verfallen nicht; Korrekturen bei Bearbeitung/Löschung sind Datenkorrekturen, keine
  Strafen ([ADR-0034](./decisions/0034-reward-corrections.md)).

## 2. Zwei XP-Ströme

`stadt_xp = round(0,5 × persönliche_xp) + Boni` ([ADR-0003](./decisions/0003-xp-model.md)).

- **Persönliche XP** → persönliches Level (individuell, kosmetisch, pro Person).
- **Stadt-XP** (Household) → Stadtlevel; bei gemeinsamen Einträgen **genau einmal**.

## 3. XP-Grundwerte (Regelversion 1)

Bindend aus [resources-and-xp.md](./resources-and-xp.md) §2 (nicht die „empfohlenen"
Alternativwerte der Aufgabenstellung). Details: [reward-rules.md](./reward-rules.md).

| Quelle          | XP-Regel                                     | Tagesdeckel |
| --------------- | -------------------------------------------- | ----------- |
| Bewegung        | `round(Basis(Dauer) × Gewicht × Intensität)` | 30          |
| Ernährung       | 2 je Baustein                                | 12          |
| Nachhaltigkeit  | 2 je Alltagsaktion / 5 je Sonderaktion       | 10 (+5)     |
| Tierwohl        | 2 je Alltagsaktion / 5 je Sonderaktion       | 10 (+5)     |
| Ritualabschluss | erster 2, weitere je 1                       | 6           |
| Check-in        | je 1                                         | 2           |

Bewegungsbasis nach Dauer: ≤10→4, 11–20→6, 21–35→9, 36–55→12, 56–80→14, ab 81→15.
Gewichte: Kraft/Ausdauer 1,10 · Kurs 1,05 · sonst 1,00. Intensität: leicht 0,95 · mittel
1,00 · intensiv 1,10 (nie stärker als die Dauerstufe). Regeneration: fester Wert 6 XP,
max 1×/Tag. Rundung überall `round()` (kaufmännisch, halb weg von null).

## 4. Ressourcen

Fünf aktiv verdiente + eine abgeleitete ([ADR-0002](./decisions/0002-resource-model.md)):
Energie ⚡ (Bewegung), Nahrung 🌱 (Ernährung), Natur 🌿 (Nachhaltigkeit + Tierwohl),
Gemeinschaft 🤝 (gemeinsame Handlungen/Rituale/Check-ins), Baumaterial 🧱 (abgeleitet,
Phase 6/7). Vergabe je Eintrag: `round(0,4 × zugeteilte_xp)` der Primärressource.
Gemeinschaft: +2 je Person bei gemeinsamem Eintrag (max 3/Tag), +1 je Check-in.
Details: [resource-system.md](./resource-system.md).

## 5. Level

Progressive, flache Kurven ([ADR-0003](./decisions/0003-xp-model.md)):
persönlich `req(L)=80+40·L` → `total(N)=20·(N−1)·(N+4)`; Stadt `req_city(L)=200+120·L` →
`total(N)=20·(N−1)·(3N+10)`. Generiert in `level_definitions` (persönlich 1–60, Stadt
1–30) aus denselben Formeln wie der Client. Titel und Kurven:
[level-system.md](./level-system.md). Level sinken nie.

## 6. Architektur

Reconcile-to-Target in den bestehenden Schreib-RPCs
([ADR-0035](./decisions/0035-reward-processing.md)): beim Speichern/Ändern/Löschen wird
`(Nutzer, Bereich, lokaler Tag)` aus den lebenden Einträgen neu bewertet und die Differenz
als Ledger-Zeile geschrieben — atomar, idempotent, zeitzonensicher. Einmal-Belohnungen
(Missionen, Ziele, Balance) nutzen Dedup-Keys mit Unique-Constraint.

Serverfunktionen (Auszug, alle `SECURITY DEFINER`, `search_path=''`, Household aus
`auth.uid()`): `app.reward_sync_movement/ritual`, `app.reconcile_xp/resource`,
`app.touch_weekly_balance`, `public.sync_rewards`, `public.sync_missions`,
`public.mission_board`, `public.swap_mission/skip_mission/complete_mission`.

## 7. Tageslimits & abnehmende Erträge

Deckel je `(Nutzer, Bereich, lokaler Tag)` in Household-Zeitzone. Bei Überschreitung
bleibt der Eintrag gültig und dokumentiert; nur XP wird gedeckelt. Neutrale UI-Meldung:
„Das tägliche XP-Limit für diesen Bereich wurde erreicht. Der Eintrag bleibt vollständig
dokumentiert." Abnehmende Erträge: Bewegung über 2 h steigt nicht weiter; Regeneration und
Sonderaktion je 1×/Tag; identische Kleinstaktionen erzeugen keine unbegrenzten XP.
Details: [daily-limits.md](./daily-limits.md).

## 8. Missionen, Balance, Boni

Siehe [mission-system.md](./mission-system.md), [balance-system.md](./balance-system.md)
und [shared-bonuses.md](./shared-bonuses.md). Missionsbelohnungen, Zielbelohnungen und der
gestaffelte Balancebonus sind in [mission-rewards.md](./mission-rewards.md) und
[reward-rules.md](./reward-rules.md) vollständig aufgeführt.

## 9. Sicherheit & Datenschutz

Ledger sind für Clients unveränderlich (RLS: nur SELECT); Bestände nie direkt schreibbar;
keine fremde Household-ID vertraut; Dedup gegen Doppelvergabe; Race Conditions durch die
RPC-Transaktion abgesichert. Der Partner sieht die **Levelinformation**, nicht die
einzelnen persönlichen XP-Zeilen ([reward-rls.md](./reward-rls.md)). Keine externen
Analytics, keine Freitextanalyse für Missionen
([privacy-data-inventory.md](./privacy-data-inventory.md)).
