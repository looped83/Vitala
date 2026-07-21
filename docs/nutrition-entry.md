# Ernährungs-Erfassung

Einfaches, nicht restriktives **Ernährungs-Check-in** (Aufgabe §7, [life-areas.md](./life-areas.md)
§4.2). **Kein** Kalorien- oder Makrotracker.

## Modell

Ein Check-in = eine Gruppe von `ritual_entries` (area=`nutrition`) mit gemeinsamem
`entry_group_id` und Datum. Der Unique-Index `(household, user, definition, occurred_on)`
auf lebenden Zeilen verhindert widersprüchliche Doppelerfassung desselben Bausteins am selben
Tag; mehrere sinnvolle Bausteine gehören in **ein** Check-in.

## Bausteine (Chips, nichts vorausgewählt)

Ausgewogene vegane Hauptmahlzeit · selbst gekocht · Gemüse · Obst · Hülsenfrüchte · Vollkorn ·
vegane Proteinquelle · ausreichend getrunken · bewusst gegessen · neues veganes Rezept
ausprobiert · Lebensmittelverschwendung vermieden · saisonale/regionale Lebensmittel ·
gerettete Lebensmittel verwendet.

## Erfassung

Auswahl über zugängliche Toggle-Chips (echte Buttons mit `aria-pressed`), optionale
Mahlzeitbezeichnung, optional gemeinsame Mahlzeit, optionale Notiz. Keine Pflicht zur
täglichen Erfassung, keine vorausgewählten positiven Angaben, klares Abwählen.

## Sprache

Neutral und wertfrei – keine Begriffe wie „schlecht", „ungesund", „gesündigt", „verboten";
keine Schuld- oder Strafmechanik, kein Bonus fürs Auslassen von Mahlzeiten.

## Gemeinsame Mahlzeit

Einmal erfasst, beide Teilnehmer über `entry_participants`, in beiden Ansichten sichtbar,
**einmal** in der Haushaltshistorie ([shared-entries.md](./shared-entries.md)).
