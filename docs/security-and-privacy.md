# Datenschutz und Sicherheit

Bewegungs- und Ernährungsdaten sind **private Gesundheits- und Verhaltensdaten** und
werden entsprechend **zurückhaltend** behandelt. Leitlinie: Datenminimierung,
Household-Isolation, serverseitige Integrität, keine externen Tracker.

---

## 17. Authentifizierungs- und Household-Konzept

### 17.1 Registrierung & erster Nutzer

- Registrierung über **Supabase Auth** (E-Mail + Passwort; optional Magic Link).
- Der erste Nutzer erstellt ein **Household** und wird `owner`.

### 17.2 Household-Erstellung & Einladung

- `owner` erzeugt eine **Einladung** (`household_invites`): zufälliger Code, **gehasht**
  gespeichert, mit `expires_at` (z. B. 7 Tage).
- Die zweite Person tritt über den Code via **RPC** `accept_invite(code)` bei; die
  Funktion prüft: Code gültig, nicht abgelaufen, Household hat < 2 aktive Mitglieder.
- Nach Beitritt: Rolle `member`.

### 17.3 Rollen & Zugriff

| Aktion                             | owner |        member        |
| ---------------------------------- | :---: | :------------------: |
| Aktivitäten/Rituale/Ziele erfassen |  ✅   |          ✅          |
| Gemeinsame Ressourcen/Stadt sehen  |  ✅   |          ✅          |
| Personen einladen                  |  ✅   |          ❌          |
| Mitglied deaktivieren/entfernen    |  ✅   |          ❌          |
| Household-Einstellungen ändern     |  ✅   | ✅ (nicht kritische) |
| Datenexport (eigene Daten)         |  ✅   |          ✅          |
| Household löschen                  |  ✅   |          ❌          |

### 17.4 Deaktivierung, Entfernung, Löschung

- **Deaktivierung:** `household_members.status='deactivated'` → kein Zugriff, Daten
  bleiben (reversibel).
- **Entfernung:** entfernt Mitgliedschaft; persönliche Einträge bleiben dem Household
  zugeordnet oder werden auf Wunsch anonymisiert/gelöscht.
- **Account-Löschung (DSGVO):** vollständige, kaskadierende Löschung der personenbezogenen
  Daten des Nutzers (`hard delete`); gemeinsame Stadtdaten bleiben, individuelle
  Beiträge werden anonymisiert.
- **Household-Löschung:** kaskadierende Hard-Deletes aller household-bezogenen Tabellen.

### 17.5 Missbrauchsschutz (verbindlich)

Verhindert werden:

- **Zugriff fremder Nutzer:** RLS (unten §18) auf jeder household-bezogenen Tabelle.
- **Unautorisierte Household-Wechsel:** Mitgliedschaft nur via RPC mit gültiger
  Einladung; kein direktes Schreiben von `household_members`.
- **Rollen-Manipulation:** `role` nur über RPC durch `owner` änderbar; RLS verbietet
  direktes Update.
- **Manipulation gemeinsamer Ressourcen:** `resources`/`*_transactions` clientseitig
  **nicht schreibbar** (nur RPC), Idempotenz + Ledger.
- **Unberechtigte weitere Einladungen:** `accept_invite` erzwingt max. 2 aktive
  Mitglieder (Trigger + RPC-Prüfung).

> Obwohl Vitala nur für zwei Personen gedacht ist, ist das Modell **sauber
> generalisiert** (Household mit Rollen), aber **hart auf 2 Mitglieder begrenzt**
> (Constraint), damit keine ungewollte Ausweitung möglich ist.

---

## 18. Datenschutz und Sicherheit

### 18.1 Kein externes Tracking

**Ausdrücklich nicht enthalten:** Google Analytics, Meta Pixel, Social Tracking,
Werbetracking, öffentliches Profil, Social Sharing, Verkauf oder Weitergabe von Daten.
Keine Third-Party-Skripte für Analytik/Werbung. Fehler-/Nutzungsmetriken (falls je nötig)
nur **selbst gehostet/anonym** und opt-in – in V1 **nicht** vorgesehen.

### 18.2 Supabase RLS & Household-Isolation

- RLS auf **allen** household-bezogenen Tabellen; Zugriff nur bei Mitgliedschaft
  (`auth.uid()` ∈ `household_members` des Datensatzes).
- Schreibpfade für kritische Werte (XP, Ressourcen, Level, Gebäude) **ausschließlich**
  über `SECURITY DEFINER`-RPC, die Household-Zugehörigkeit und Idempotenz prüft.
- Referenzdaten global lesbar, nie clientseitig schreibbar.

### 18.3 Sichere Authentifizierung

- Passwörter/Sessions durch Supabase Auth (bcrypt/scrypt serverseitig, JWT).
- Einladungscodes **gehasht** gespeichert, kurzlebig, einmalig einlösbar.
- HTTPS erzwungen; sichere Cookies/Token-Handling gemäß Supabase-Defaults.

### 18.4 Eingabevalidierung

- **Doppelte Validierung:** Zod im Client **und** in der RPC (Server) – identische
  Domain-Schemas. Grenzwerte (Dauer 5–300, Enums, Datumsfenster) serverseitig erzwungen.

### 18.5 Schutz vor manipulierten Belohnungen

- Belohnungen werden **serverseitig** berechnet ([ADR-0005](./decisions/0005-server-side-rewards.md));
  Client-Werte sind nur optimistische Vorschau.
- Idempotenzschlüssel + Unique-Constraints verhindern Doppelbuchung.
- Ledger (`experience_transactions`, `resource_transactions`) macht jede Änderung
  nachvollziehbar und korrigierbar.

### 18.6 Serverseitige Transaktionen & Audit Log

- Kritische Mehrschritt-Mutationen atomar in einer RPC-Funktion.
- `audit_log` erfasst Rollen-/Household-Änderungen, Löschungen, manuelle Korrekturen
  (before/after als JSONB) – für Nachvollziehbarkeit, nicht für Verhaltensanalyse.

### 18.7 Sichere Löschung & Datenexport

- **Datenexport:** jede Person kann ihre Daten als **JSON** exportieren (eigene
  Aktivitäten, Rituale, Ziele, Check-ins) über eine RPC/Edge-Funktion.
- **Sichere Löschung:** Account-/Household-Löschung als kaskadierender Hard-Delete;
  Bestätigung mit Fokusfalle; irreversibel und klar kommuniziert.

### 18.8 Datenminimierung & Schutz sensibler Gesundheitsdaten

- **Minimal notwendige Speicherung:** keine Kalorien, keine Mengen, kein Gewicht, keine
  Geodaten (Ort nur als optionaler Freitext, keine Koordinaten).
- **Keine unbelegten Ableitungen:** keine CO₂-Zahlen, keine medizinischen Auswertungen.
- **City Events / Historie** speichern **aggregierte Meilensteine**, keine granularen
  Gesundheitsdetails über das Nötige hinaus.
- **Zweckbindung:** Daten dienen ausschließlich der App-Funktion für die zwei Nutzer;
  keine Sekundärnutzung.
- **Reflexionstexte/Tagesgefühl** sind rein persönlich, werden nicht ausgewertet und
  nicht in Boni/Balance verrechnet.

### 18.9 Sicherheits-Checkliste (für spätere Phasen)

- [ ] RLS-Policy-Tests pro Tabelle (Household A darf B nicht sehen).
- [ ] Kein clientseitiger Schreibpfad zu `resources`/`*_transactions`/`experience_*`.
- [ ] RPCs prüfen Mitgliedschaft, Rolle, Idempotenz, Grenzwerte.
- [ ] Einladungs-Flow: Ablauf, Einmaligkeit, 2-Personen-Limit getestet.
- [ ] Export/Löschung DSGVO-konform und getestet.
- [ ] Keine Third-Party-Tracker im Bundle (Build-Check).
