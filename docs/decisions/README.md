# Architecture Decision Records (ADRs)

Architektur- und Spielentscheidungen werden hier als ADRs dokumentiert. Format je ADR:
Status · Kontext · Entscheidung · Alternativen · Konsequenzen.

| ADR                                               | Titel                                                       | Status     |
| ------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| [0001](./0001-world-rendering.md)                 | Welt-Darstellung (SVG statt 3D/Canvas)                      | Akzeptiert |
| [0002](./0002-resource-model.md)                  | Ressourcenmodell (5 + Baumaterial)                          | Akzeptiert |
| [0003](./0003-xp-model.md)                        | XP-Modell (getrennt, progressiv)                            | Akzeptiert |
| [0004](./0004-double-counting.md)                 | Doppelzählung (eine primäre Kategorie)                      | Akzeptiert |
| [0005](./0005-server-side-rewards.md)             | Serverseitige Belohnungslogik                               | Akzeptiert |
| [0006](./0006-household-model.md)                 | Household-Modell (2 Personen, Rollen)                       | Akzeptiert |
| [0007](./0007-state-management.md)                | State Management (Query + Zustand)                          | Akzeptiert |
| [0008](./0008-offline-strategy.md)                | Offline-Strategie (Outbox)                                  | Akzeptiert |
| [0009](./0009-data-model.md)                      | Datenmodell (normalisiert, Ledger)                          | Akzeptiert |
| [0010](./0010-animations.md)                      | Animationen (CSS-first, Reduced Motion)                     | Akzeptiert |
| [0011](./0011-authentication-and-registration.md) | Authentifizierung & Registrierung (Invite, Self-Signup aus) | Akzeptiert |
| [0012](./0012-rls-helper-functions.md)            | RLS-Hilfsfunktionen (privates Schema, SECURITY DEFINER)     | Akzeptiert |
| [0013](./0013-theme-strategy.md)                  | Theme-Strategie (CSS-Variablen, flackerfrei)                | Akzeptiert |
| [0014](./0014-ui-component-strategy.md)           | UI-Komponenten- & Font-Strategie (eigene Primitive)         | Akzeptiert |
| [0015](./0015-pwa-caching.md)                     | PWA-Caching (App-Shell, keine privaten Antworten)           | Akzeptiert |
| [0016](./0016-form-strategy.md)                   | Formularstrategie (RHF + Zod)                               | Akzeptiert |
| [0017](./0017-error-handling.md)                  | Fehlerbehandlung (normalisiertes AppError)                  | Akzeptiert |
| [0018](./0018-identity-field-placement.md)        | Verortung Identitätsfelder (Präzisierung data-model)        | Akzeptiert |

Status-Werte: `Vorgeschlagen`, `Akzeptiert`, `Abgelöst durch ADR-XXXX`.

**Phase 2** ergänzte ADR-0011 bis ADR-0018 (technische Projektgrundlage).
