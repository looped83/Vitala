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
| [0019](./0019-activity-capture-model.md)          | Aktivitäts- & Ritual-Erfassungsmodell (entry_participants)  | Akzeptiert |
| [0020](./0020-entry-write-path-rpc.md)            | Schreibpfad für Einträge (nur SECURITY-DEFINER-RPCs)        | Akzeptiert |
| [0021](./0021-soft-delete-entries.md)             | Löschung (Soft Delete, Löschrecht für Mitglieder)           | Akzeptiert |
| [0022](./0022-history-pagination.md)              | Historien-Pagination (entry_feed-View, Keyset)              | Akzeptiert |
| [0023](./0023-favorites.md)                       | Favoriten / Schnellaktionen (Vorlagen ohne Auto-Speichern)  | Akzeptiert |
| [0024](./0024-capture-timezone.md)                | Zeit- & Tagesgrenzen bei der Erfassung                      | Akzeptiert |
| [0025](./0025-goal-progress-calculation.md)       | Fortschrittsberechnung von Zielen (Server, live)            | Akzeptiert |
| [0026](./0026-recurring-goals-and-periods.md)     | Wiederkehrende Ziele & Zielperioden (Roll ohne Cron)        | Akzeptiert |
| [0027](./0027-ritual-instances.md)                | Ritualinstanzen & Abschlüsse (ein Abschluss je Instanz)     | Akzeptiert |
| [0028](./0028-check-in-privacy.md)                | Privatsphäre persönlicher Check-ins (strikt privat)         | Akzeptiert |
| [0029](./0029-goal-series-edits.md)               | Bearbeitung wiederkehrender Ziele (ab jetzt, Historie fix)  | Akzeptiert |
| [0030](./0030-review-aggregation.md)              | Rückblickaggregation & neutrale Sprache                     | Akzeptiert |
| [0031](./0031-archive-and-delete.md)              | Archivierung & Löschung (Soft Delete, Historie erhalten)    | Akzeptiert |

Status-Werte: `Vorgeschlagen`, `Akzeptiert`, `Abgelöst durch ADR-XXXX`.

**Phase 2** ergänzte ADR-0011 bis ADR-0018 (technische Projektgrundlage).
**Phase 3** ergänzte ADR-0019 bis ADR-0024 (manuelle Erfassung der vier Lebensbereiche).
**Phase 4** ergänzte ADR-0025 bis ADR-0031 (Ziele, Rituale, Check-ins, Rückblicke).
