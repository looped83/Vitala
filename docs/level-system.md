# Level-System

Zwei getrennte Ströme ([ADR-0003](./decisions/0003-xp-model.md)). Kurven progressiv und
flach; Level sinken nie. Generiert in `level_definitions` aus denselben Formeln wie
`src/domain/rewards/levels.ts`.

## Persönlich

`req(L) = 80 + 40·L` → `total(N) = 20·(N−1)·(N+4)`.

| Level | 1 | 2   | 3   | 4   | 5   | 10   | 20    | 50     |
| ----- | - | --- | --- | --- | --- | ---- | ----- | ------ |
| XP    | 0 | 120 | 280 | 480 | 720 | 2520 | 9120  | 52920  |

Titel: 1–4 Aufbruch · 5–9 Wegbereiter · 10–14 Gestalter · 15–19 Verbinder · 20–29
Zukunftspfleger · 30–39 Lebensraumgestalter · 40–49 Stadtentwickler · ab 50 Weltenhüter
(ruhig, erwachsen, nicht kompetitiv, nicht militärisch).

## Stadt

`req_city(L) = 200 + 120·L` → `total(N) = 20·(N−1)·(3N+10)`.

| Level | 1 | 2   | 3   | 4    | 10   | 30     |
| ----- | - | --- | --- | ---- | ---- | ------ |
| XP    | 0 | 320 | 760 | 1320 | 7200 | 58000  |

Titel: 1–2 Keimzelle · 3–4 Grüne Siedlung · 5–7 Lebendiges Viertel · 8–11 Nachhaltige
Stadt · 12–16 Vernetzte Stadt · 17–22 Grüne Metropole · 23–29 Lebenswerte Region · ab 30
Regenerative Welt.

## Levelaufstieg

Ruhig inszeniert (§21): neues Level, Titel, Fortschritt; dezent, keine Konfetti/Sounds/
Vollbild; Reduced Motion voll unterstützt; Meldung über Live Region. Keine Stadtgebäude,
solange Phase 6/7 offen sind.
