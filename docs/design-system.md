# Designsystem

Anmutung: hochwertig, erwachsen, warm, freundlich, naturverbunden, ruhig, modern,
motivierend – **nicht** kindlich, kitschig oder überladen. **Farbe ist nie der einzige
Informationsträger** (WCAG, siehe accessibility.md).

Das Designsystem wird als **eigene, schlanke Primitiv-Bibliothek** (`src/ui/`) umgesetzt
(keine schwere UI-Framework-Abhängigkeit, siehe technical-architecture §15).

---

## 18. Design-Tokens

### 18.1 Farbsystem

Basis: gedämpfte, natürliche Töne. Alle Kombinationen erfüllen **WCAG 2.2 AA**
(Text ≥ 4,5:1, große Texte/UI ≥ 3:1).

**Markenfarben (naturverbunden):**

| Token                    | Light                         | Dark      | Verwendung              |
| ------------------------ | ----------------------------- | --------- | ----------------------- |
| `--color-primary`        | `#2F6F4E` (Moosgrün)          | `#5FB98A` | primäre Aktionen, Marke |
| `--color-primary-strong` | `#255C40`                     | `#7BD1A3` | Hover/aktiv             |
| `--color-accent`         | `#C9762F` (warmes Terrakotta) | `#E0975A` | Akzente, Highlights     |
| `--color-bg`             | `#F7F5F0` (warmes Off-White)  | `#14171A` | Seitenhintergrund       |
| `--color-surface`        | `#FFFFFF`                     | `#1C2126` | Karten                  |
| `--color-surface-2`      | `#EFEBE3`                     | `#232A30` | eingebettete Flächen    |
| `--color-text`           | `#1E241F`                     | `#E9ECEA` | Fließtext               |
| `--color-text-muted`     | `#5A625B`                     | `#A7B0AA` | Sekundärtext            |
| `--color-border`         | `#E0DCD2`                     | `#2E353B` | Trennlinien             |

**Semantische Farben (immer mit Icon/Text kombiniert):**

| Token               | Light     | Bedeutung                                               |
| ------------------- | --------- | ------------------------------------------------------- |
| `--color-success`   | `#3E8E5A` | Erfolg/erledigt (+ Häkchen-Icon)                        |
| `--color-info`      | `#3C7A99` | Hinweis (+ Info-Icon)                                   |
| `--color-warning`   | `#B8862A` | sanfter Hinweis (+ Icon) – **kein** Alarmrot            |
| `--color-attention` | `#B5533E` | nur echte Fehler (Validierung); gedämpft, mit Icon+Text |

**Lebensbereichs-Farben** (für Balance/Diagramme; qualitativ getrennt, WCAG-tauglich):

| Bereich        | Light                  | Dark      | Zusatz-Marker                 |
| -------------- | ---------------------- | --------- | ----------------------------- |
| Bewegung       | `#3C7A99` (Blau)       | `#6FB2D0` | Bewegungs-Icon + Muster A     |
| Ernährung      | `#3E8E5A` (Grün)       | `#6FC38C` | Blatt-Icon + Muster B         |
| Nachhaltigkeit | `#C9762F` (Terrakotta) | `#E0975A` | Kreislauf-Icon + Muster C     |
| Tierwohl       | `#7A5EA6` (Violett)    | `#A98BD1` | Pfoten/Blüten-Icon + Muster D |

> Die vier Bereichsfarben sind zusätzlich durch **Icon und Musterung** (Diagramme)
> unterscheidbar, damit sie **nicht allein über Farbe** kodiert sind.

### 18.2 Typografie

- **Schrift:** system-nahe, gut lesbare humanistische Sans (z. B. „Inter"), selbst
  gehostet (kein Google-Fonts-CDN → Datenschutz/Performance).
- **Skala (rem, 1rem=16px):** 0,75 / 0,875 / 1 / 1,125 / 1,25 / 1,5 / 1,875 / 2,25.
- **Line-Height:** Body 1,5; Headlines 1,2.
- **Gewichte:** 400 (Body), 500 (Labels), 600 (Headlines). Keine Ultra-Bold-Spielereien.

### 18.3 Abstände, Grid, Radien, Schatten

- **Spacing-Skala (px):** 2, 4, 8, 12, 16, 24, 32, 48, 64.
- **Grid:** 4-px-Basis; Content-Max-Breite 1200 px (Desktop); Mobile: 16-px-Ränder.
- **Radien:** `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 20px` (Karten weich,
  aber nicht verspielt).
- **Schatten:** dezent, zweistufig (`--shadow-sm`, `--shadow-md`); im Dark Mode
  reduziert, stattdessen Border-Kontrast.

### 18.4 Komponenten (Primitive)

| Komponente              | Anmerkungen                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Card**                | Grundcontainer; Surface + Radius + optionaler Header         |
| **Button**              | Varianten: primary / secondary / ghost / quiet; ≥ 44 px Höhe |
| **Formulare**           | Label immer sichtbar; Fehler feldnah, mit Icon+Text          |
| **Chip / Toggle**       | Ernährungsbausteine, Handlungen; `aria-pressed`              |
| **Badge**               | Titel, Meilensteine; dezent                                  |
| **Fortschrittsanzeige** | Balken + numerischer Wert (nicht nur Farbe)                  |
| **Ressourcenanzeige**   | Icon + Menge + Name; Änderungen als „+X" mit Vorzeichen      |
| **Diagramme**           | einfache SVG-Balken/Ringe, mit Datentabellen-Alternative     |
| **Illustrationen**      | ruhige, flache Naturmotive; keine Comic-Übertreibung         |
| **Gebäudezustände**     | Baustelle → Stufe 1–3 als SVG-Zustände, klar unterscheidbar  |
| **Kartenansicht**       | SVG-Stadt; fokussierbare Elemente mit `aria-label`           |
| **Icons**               | konsistentes, lineares Set (self-hosted SVG-Sprite)          |

### 18.5 Light Mode / Dark Mode

- Beide gleichwertig; Umschaltung in Einstellungen + Respekt für
  `prefers-color-scheme`. Persistiert in `user_preferences.theme`.
- Alle Tokens haben Light/Dark-Werte; Kontraste in beiden Modi AA-geprüft.

### 18.6 Reduced Motion

- `prefers-reduced-motion: reduce` deaktiviert nicht-essentielle Animationen
  (Belohnungs-, Level-, Saison-Effekte) und ersetzt sie durch statische Zustände.
- Auch als manuelle Einstellung (`user_preferences.reduced_motion`).
- Details: [accessibility.md](./accessibility.md), [ADR-0010](./decisions/0010-animations.md).

### 18.7 Tonalität (Text/Voice)

- Warm, ermutigend, respektvoll, nie belehrend oder schuldzuweisend.
- „Ihr habt …", „Dein Beitrag …", „Ein ruhiger Tag ist auch gut."
- Keine Ausrufezeichen-Flut, keine Dringlichkeit, keine Superlative.

### 18.8 Umsetzung als Tokens

Alle Werte als **CSS Custom Properties** in `:root` und `[data-theme="dark"]`, plus
ein TypeScript-Token-Objekt für JS-seitige Nutzung. Keine harten Farbwerte in
Komponenten – nur Tokens. Das sichert Konsistenz und leichte Anpassung im Balancing.
