# Reward-Korrekturen

Siehe [ADR-0034](./decisions/0034-reward-corrections.md). Korrekturen sind
Datenkorrekturen, keine Strafen (Prinzip 2.5).

## Bearbeitung

`save_activity` / `save_ritual_checkin` rufen nach dem Schreiben `reward_sync_*` für den
**neuen** und – bei Datumswechsel – den **alten** fachlichen Tag. Der betroffene Tag wird
aus den lebenden Einträgen neu bewertet (Deckel, abnehmende Erträge, gemeinsame Boni) und
die Differenz je Identität als Korrekturzeile geschrieben. Beispiele: Dauer 60→30,
Datumswechsel, Teilnehmer entfernt, Bereich geändert, persönlich↔gemeinsam.

## Löschung

`delete_entry` soft-löscht den Eintrag und ruft `reward_sync_*`. Da nur lebende Einträge
zählen, sinkt die Belohnung auf den verbleibenden Stand; ein **Sweep** nullt Belohnungen
von Einträgen, die aus der lebenden Menge gefallen sind. Keine Ledger-Zeile wird physisch
entfernt.

## Rückwirkende Einträge

Es gilt die zum **fachlichen Datum** gültige Regelversion und dessen Tagesdeckel. Offene
Wochenziele/-missionen aktualisieren sich; abgelaufene, nicht erfüllte Tagesmissionen
werden **nicht** rückwirkend reaktiviert. So ist rückwirkendes Missionen-Farming
ausgeschlossen.

## Finalisierte Abschlüsse

Bereits vergebene **Missions-** und **Zielperioden**-Belohnungen bleiben bestehen, auch
wenn ein zugrunde liegender Eintrag später geändert wird; nur die direkte Eintrags-
belohnung wird korrigiert. Bekannte Kleinstgrenze (gemeinschafts-only Check-in): siehe
ADR-0034.
