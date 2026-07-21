# ADR-0016: Formularstrategie – React Hook Form + Zod, doppelte Validierung

**Status:** Akzeptiert · **Bezug:** [technical-architecture.md](../technical-architecture.md) §15, [security-and-privacy.md](../security-and-privacy.md) §18.4

## Kontext

Formulare (Login, Profil, Onboarding, Einstellungen) brauchen konsistente Validierung, gute
Performance (wenige Re-Renders) und Barrierefreiheit. Grenzwerte müssen **auch serverseitig**
gelten.

## Entscheidung

- **React Hook Form** für Formularzustand (unkontrollierte Inputs, wenige Re-Renders).
- **Zod-Schemas** in `src/domain/**` als **einzige Validierungsquelle**, via `zodResolver`
  im Client eingebunden **und** an den externen Grenzen (RPC-Argumente, DB-Constraints)
  serverseitig erzwungen.
- **Barrierefreie Fehler:** `FormField` verdrahtet `aria-invalid`, `aria-describedby`,
  Label und feldnahe Fehlermeldung (Icon **und** Text, nie nur Farbe). Fokus springt auf das
  erste ungültige Feld.
- **Schutz vor Doppelsubmission** über den `isSubmitting`-Zustand (Button `loading`/disabled).

## Alternativen

- **Nur `useState`-Formulare:** mehr Boilerplate, mehr Re-Renders, uneinheitliche Validierung.
- **Formik:** schwerer, mehr Re-Renders als RHF.
- **Validierung nur clientseitig:** unsicher – DB/RPC erzwingen die Regeln zusätzlich.

## Konsequenzen

- **Positiv:** ein Schema-Satz für Client + Server, gute Performance, konsistente,
  zugängliche Fehler.
- **Negativ/Abwägung:** zwei Bibliotheken (RHF + Zod) – beide klein, gut gepflegt, klar
  begründet.
