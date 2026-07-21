# Performance und Green Code

Ressourcenschonung ist Teil der Produktvision (Nachhaltigkeit). Effiziente Software =
weniger Energie, bessere mobile Performance, längere Gerätelebensdauer.

---

## 21. Verbindliche Prinzipien

- **Geringe Bundle-Größe:** schlanke Abhängigkeiten, Tree-Shaking, keine schwere
  UI-Lib; Framer Motion und Diagramm-Extras lazy.
- **Sparsame Abhängigkeiten:** jede Lib begründet (technical-architecture §15); keine
  Duplikate (nur date-fns für Datum, kein moment/lodash).
- **Keine unnötigen Re-Renders:** React Hook Form (unkontrollierte Inputs),
  memoisierte Selektoren, stabile Query Keys, `React.memo` gezielt.
- **Keine permanenten Hintergrundprozesse:** kein Polling; TanStack Query mit
  bedarfsgerechtem `staleTime`; PWA-Sync nur bei Reconnect/Fokus.
- **Effiziente DB-Abfragen:** indizierte Filter (household_id, Datum), Aggregate
  serverseitig; **keine N+1-Abfragen** (Joins/RPC statt Einzelabfragen pro Zeile).
- **Gezielte Cache-Invalidierung:** nur betroffene Keys nach Mutation, nicht global.
- **Komprimierte Assets:** SVG minimiert/optimiert (SVGO), Bilder als optimierte SVG,
  Schriften selbst gehostet + `font-display: swap`, Brotli/Gzip.
- **Performante SVGs:** Viewport-Culling, statische Ebenen gruppiert/gecached,
  `content-visibility: auto` für Off-Screen-Bereiche der Stadt.
- **Reduzierte Animationen:** CSS-first, GPU-freundlich (transform/opacity),
  Reduced-Motion-Pflicht.
- **Lazy Loading nur bei echtem Nutzen:** Route-Level-Code-Splitting (Stadt,
  Rückblick, Settings), nicht Mikro-Splitting.
- **Keine unnötigen Netzwerkabfragen:** Batch/Prefetch der „Heute"-Daten in **einer**
  Query; Optimistik statt Refetch-Sturm.
- **Mobile Performance:** primäres Zielgerät iPhone-Browser/PWA; getestet auf
  Mittelklasse-Bedingungen (gedrosselt).
- **Offline-Fallback:** App-Shell + Read-Cache offline nutzbar; Erfassung via Outbox
  (ADR-0008).

---

## 21.1 Performance-Budgets (verbindlich)

| Metrik                                           | Budget               | Messpunkt                             |
| ------------------------------------------------ | -------------------- | ------------------------------------- |
| **Initiales JavaScript** (gzip, kritischer Pfad) | **≤ 180 kB**         | Erststart „Heute"                     |
| Gesamt-JS initial route                          | ≤ 250 kB gzip        | „Heute"-Route                         |
| **Largest Contentful Paint (LCP)**               | **≤ 2,5 s**          | Mobil, gedrosselt (4G, Mid-Tier)      |
| **Interaction to Next Paint (INP)**              | **≤ 200 ms**         | Kern-Interaktionen                    |
| First Input Delay / Blocking                     | TBT ≤ 200 ms         | Lighthouse mobil                      |
| Cumulative Layout Shift (CLS)                    | ≤ 0,1                | alle Kernseiten                       |
| **Datenbankabfragen je Kernansicht**             | **≤ 3**              | „Heute", „Stadt", „Rückblick"         |
| DB-Antwortzeit (p95)                             | ≤ 150 ms             | RPC/Query                             |
| **Weltansicht: DOM-Knoten**                      | **≤ 1.500 sichtbar** | Stadt (Culling aktiv)                 |
| **Gleichzeitig animierte Elemente**              | **≤ 12**             | Stadt/Belohnung; 0 bei Reduced Motion |
| PWA-Cache-Größe                                  | ≤ 8 MB               | App-Shell + Assets                    |

Budgets werden in CI (Lighthouse-CI + Bundle-Analyse) geprüft; Überschreitung = Fehler.

## 21.2 Datenbank-/Query-Strategie

- „Heute" lädt Missionen, Tages-Einträge, Ressourcen, Stadtimpuls in **einer**
  gebündelten Query/RPC.
- Aggregate (Ziel-/Missions-/Balance-Fortschritt) serverseitig, nicht pro Zeile im Client.
- Indizes gemäß data-model §16.8; keine ungefilterten Tabellen-Scans.

## 21.3 Weltansicht-Performance

- Nur sichtbare Kacheln/Elemente im DOM (Culling).
- Statische Natur-/Wegeebenen als ein zusammengesetztes, gecachtes SVG.
- Animationen ausschließlich `transform`/`opacity`; Limit ≤ 12 gleichzeitig; abschaltbar.

## 21.4 Monitoring (datenschutzkonform)

- Kein externes RUM/Tracking in V1. Performance wird über **Lab-Messungen**
  (Lighthouse-CI, Playwright-Traces) im Build sichergestellt.
- Optionales, späteres, **selbst gehostetes** und anonymes Monitoring nur mit Opt-in –
  in V1 nicht enthalten.

## 21.5 Aktivitätserfassung & Historie (Phase 3)

- **Vereinheitlichte `entry_feed`-View** + **Keyset-Pagination** (`useInfiniteQuery`):
  lädt nie alle Einträge; „Mehr laden" statt Dauer-Refetch (ADR-0022).
- **Kein N+1:** Teilnehmer einer Seite werden in **einer** gebündelten Abfrage geladen; Typen/
  Bausteine kommen aus zwischengespeicherten Katalogen (`staleTime` 1 h).
- **Gezielte Spaltenauswahl** in allen Abfragen (kein `select *`); partielle Indizes auf
  `(household_id, occurred_on desc) where deleted_at is null`.
- **Cache:** Mutationen invalidieren gezielt den `entries`-/`favorites`-Teilbaum, keine globale
  Leerung; Referenzkataloge bleiben lange frisch.
- **Bundle:** keine neue Laufzeit-Abhängigkeit; Erfassen/Historie sind lazy geladene Routen
  (~3–4 kB gzip je Chunk). Icons als Inline-SVG, keine Bild-Assets.
- **Reduced Motion:** Karten/Übergänge nur via CSS `transform`/`opacity`; keine Funktion hängt
  von Animation ab.
- **Skalierung:** Die Historie ist für ≥ 10.000 Einträge über mehrere Jahre ausgelegt; die
  Datumsgruppierung/-filterung wirkt auf geladene Seiten (Zwei-Personen-Maßstab).
