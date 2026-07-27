# Visuelle Sprache der Stadt

Die Stadt soll naturverbunden, freundlich, erwachsen, ruhig und hochwertig wirken (§2.3) –
klar lesbar, nicht überladen.

## Perspektive & Form

Top-down-Draufsicht (ADR-0040), Regionen als abgerundete Rechtecke (rx 14) auf einem ruhigen
„Himmel"-Hintergrund. Dekorative Wege und ein Wasserlauf mildern die Rasterwirkung.

## Farbwelt (theme-aware, keine naive Invertierung, §40)

Jede Region hat ein Thema (`theme`) mit eigenen Tokens (`--region-fill`, `--region-stroke`,
`--region-ink`), definiert in `city.module.css` für Light **und** Dark getrennt:

- **Light:** warme, natürliche Pastellflächen, klare Wege, ausreichender Kontrast, keine
  überhellen Hintergründe.
- **Dark:** gedämpfte Abendstimmung (kein Nacht-Simulationsmodus), interaktive Elemente klar
  sichtbar, Wasser/Wege/Bauflächen unterscheidbar, WCAG-konforme Textkontraste, keine extrem
  dunkle, unlesbare Karte.

Die Themen orientieren sich an den Lebensbereichs-Farben (Bewegung=blau, Ernährung=grün,
Nachhaltigkeit=warm, Tierwohl/Natur=grün, Gemeinschaft=violett) – Farbe ist jedoch nie der
alleinige Informationsträger (§56.7).

## Zustände sichtbar machen

- **gesperrt:** gedämpfte Fläche + gestrichelter Rand + Schloss-Label „Ab Stadtlevel N".
- **neu:** ruhiger Akzentrahmen + „neu"-Badge (statisch, keine pulsierende Animation).
- **verfügbar:** Themenfarbe + Sublabel mit Anzahl freier Bauflächen.

## Dekorative Grundelemente (§37)

Wege, Wasser und Landschaftsakzente sind rein dekorativ, gruppiert und `aria-hidden`,
performanceoptimiert (kombinierte Pfade statt vieler Einzelknoten). Tiere sind in Phase 6
nicht animiert umgesetzt; die Asset-Struktur bleibt für spätere Phasen vorbereitet (§38).

## Animationen (§39)

Erlaubt sind nur dezente Transitions (Fokus/Hover, sanftes Einblenden). Nicht erlaubt:
permanente Bewegung, Kamerafahrten ohne Nutzeraktion, Parallax, Partikel, Konfetti,
blinkende Flächen, Autoplay. Reduced Motion entfernt alle nicht notwendigen Animationen.

## Frühe Zustände (§61)

Schon auf Stadtlevel 1 wirkt die Stadt einladend: Stadtzentrum + Wohngebiet mit Wegen, eine
kleine Naturfläche, erste verfügbare Bauflächen und ein Wasserakzent – keine graue,
frustrierende Leere, keine übermäßige Anzahl von Schlössern.
