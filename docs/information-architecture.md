# Informationsarchitektur

## 13. App-Struktur

Vitala hat sechs Hauptbereiche in der primären Navigation, plus untergeordnete Seiten.

### Sitemap

```
Vitala
├── Heute (Start)
│   ├── Morgen-Check-in
│   ├── Tagesmissionen (persönlich × 2, gemeinsam)
│   ├── Schnellerfassung
│   ├── Tagesübersicht (XP, Ressourcen, Stadtimpuls)
│   └── Abend-Check-in
├── Stadt
│   ├── Kartenansicht (SVG)
│   ├── Strukturansicht (barrierefreie Liste)  ← gleichwertig
│   ├── Gebäudeübersicht (Katalog + Zustände)
│   └── Bauen / aktuelles Wochenprojekt
├── Erfassen
│   ├── Bewegung
│   ├── Ernährung (Check-in)
│   ├── Nachhaltigkeit
│   ├── Tierwohl & Biodiversität
│   └── Favoriten / Schnellaktionen
├── Ziele
│   ├── Persönliche Ziele
│   ├── Gemeinsame Ziele
│   └── Ziel erstellen / bearbeiten
├── Rückblick
│   ├── Tag
│   ├── Woche (inkl. Balance, Wochenprojekt-Abschluss)
│   ├── Monat / Quartal
│   └── Stadtgeschichte (Zeitleiste)
└── Profil & Einstellungen
    ├── Profil (Level, Titel, persönliche Statistik)
    ├── Household (Mitglieder, Einladung)
    ├── Einstellungen (Zeitzone, Wochenstart, Reduced Motion, Theme)
    ├── Datenschutz (Export, Löschung)
    └── Missionen (Übersicht/Verlauf)
```

**Zusätzlich geprüfte Bereiche und ihre Einordnung:**

- **Missionen:** primär im „Heute", vollständiger Verlauf unter „Profil & Einstellungen
  → Missionen" (kein eigener Top-Level-Punkt – reduziert Navigationslast).
- **Stadtgeschichte:** unter „Rückblick" (zeitlicher Kontext passt dort).
- **Gebäudeübersicht:** unter „Stadt".
- **Wochenprojekt:** unter „Stadt → Bauen" und als Karte im „Heute".

Begründung: Sechs Hauptbereiche halten die Navigation auf Mobilgeräten übersichtlich
(≤ 5–6 Ziele in der Tab-Bar). Selten genutzte Bereiche sind eine Ebene tiefer.

---

## 13.1 Mobile Navigation

- **Bottom-Tab-Bar** mit 5 Zielen: Heute · Stadt · **Erfassen (zentraler +-Button)** ·
  Ziele · Rückblick.
- „Profil & Einstellungen" über Avatar/Icon oben rechts (nicht in der Tab-Bar).
- Der zentrale **+-Button** öffnet die Schnellerfassung (häufigste Aktion → prominent).
- Touch-Ziele ≥ 44 × 44 px (siehe accessibility.md).

## 13.2 Desktop-Navigation

- **Seitliche Navigation (Sidebar)** links mit allen sechs Hauptbereichen + Unterpunkten.
- Inhalt zentriert, max. Breite ~1200 px; Stadtansicht nutzt verfügbare Breite.
- Persistente Kopfzeile mit Household-Kontext, Stadtlevel-Anzeige und Profil-Menü.

## 13.3 Seitenhierarchie (Ebenen)

1. **Hauptbereich** (Heute, Stadt, Erfassen, Ziele, Rückblick, Profil).
2. **Unterseite** (z. B. Erfassen → Bewegung).
3. **Detail/Formular** (z. B. Aktivität bearbeiten) – als Modal/Sheet auf Mobile,
   als Panel/Seite auf Desktop.

---

## 13.4 Kern-User-Flows (Übersicht)

Vollständige Flows in [user-flows.md](./user-flows.md). Kurzüberblick der wichtigsten:

- **Täglich:** Morgen-Check-in → Mission ansehen → Aktivität erfassen → Belohnung →
  Abend-Check-in.
- **Wöchentlich:** Wochenprojekt wählen → Beiträge → Wochenabschluss.
- **Punktuell:** Ziel erstellen/abschließen, Gebäude bauen, Rückblick/Stadtgeschichte.

---

## 13.5 Zustände (Empty / Error / Loading)

Für **jede** Liste/Ansicht sind drei Zustände definiert. Grundhaltung: freundlich,
nie schuldzuweisend (Prinzip 2.2).

### Leerzustände (Empty States)

| Ansicht | Leerzustand-Botschaft (Ton) |
|---------|-----------------------------|
| Heute (keine Einträge) | „Ein ruhiger Start. Erfasse etwas, wenn du magst." + Schnellaktionen |
| Aktivitätenliste | „Noch keine Aktivitäten heute – jede Bewegung zählt." |
| Ziele | „Noch keine Ziele. Ziele sind freiwillig – lege eins an, wenn du möchtest." |
| Stadt (Start) | einladender Startzustand (nie „leer"), erstes Bauprojekt hervorgehoben |
| Stadtgeschichte | „Eure Geschichte beginnt gerade. Das erste Kapitel schreibt ihr bald." |
| Rückblick (keine Daten) | „Noch nichts zu zeigen – kein Problem." |

### Fehlerzustände (Error States)

- **Netzwerkfehler:** „Verbindung unterbrochen. Deine Eingabe ist gesichert und wird
  gesendet, sobald du wieder online bist." (Outbox-Hinweis, siehe ADR-0008).
- **Serverfehler:** neutrale Meldung + „Erneut versuchen"; keine technischen Codes für
  Endnutzer, technische Details nur im Log.
- **Validierungsfehler:** feldnah, konkret, freundlich („Bitte eine Dauer zwischen 5
  und 300 Minuten angeben.").
- **Berechtigungsfehler:** „Diese Ansicht gehört zu einem anderen Household." (sollte
  durch RLS nie regulär auftreten).

### Ladezustände (Loading States)

- **Skeleton-Loader** für Listen und Karten (kein Springen des Layouts).
- **Optimistische UI** bei Erfassung: Eintrag erscheint sofort, Belohnung wird nach
  Serverbestätigung final gesetzt (siehe technical-architecture §15.1).
- **Reduced Motion:** Lade-/Skeleton-Animationen respektieren `prefers-reduced-motion`.
- Kein Vollbild-Spinner, der die ganze App blockiert; Bereiche laden unabhängig.
