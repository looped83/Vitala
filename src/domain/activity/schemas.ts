import { z } from 'zod';
import { isValidIsoDate, isFutureDay } from '@/lib/dates/day';
import {
  DURATION_MAX,
  DURATION_MIN,
  INTENSITIES,
  LABEL_MAX,
  LOCATION_MAX,
  NOTE_MAX,
} from './types';
import { LIFE_AREAS } from './areas';

/**
 * Single source of validation for the four capture forms (ADR-0016). Used by
 * `zodResolver` in the client AND mirrored by the DB check constraints + RPC
 * guards on the server — the client is never the only line of defence.
 */

const optionalTrimmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const dateField = z
  .string()
  .refine(isValidIsoDate, 'Bitte ein gültiges Datum wählen.')
  .refine((value) => !isFutureDay(value), 'Das Datum darf nicht in der Zukunft liegen.');

const uuid = z.string().uuid();

const noteField = optionalTrimmed(NOTE_MAX, `Die Notiz darf höchstens ${NOTE_MAX} Zeichen haben.`);

// --- Movement -------------------------------------------------------------
export const movementFormSchema = z
  .object({
    activity_type_id: uuid.describe('Aktivitätstyp'),
    occurred_on: dateField,
    duration_min: z
      .number({ invalid_type_error: 'Bitte eine Dauer in Minuten angeben.' })
      .int('Bitte ganze Minuten angeben.')
      .min(DURATION_MIN, `Mindestens ${DURATION_MIN} Minuten.`)
      .max(DURATION_MAX, `Höchstens ${DURATION_MAX} Minuten.`),
    intensity: z.enum(INTENSITIES).optional(),
    started_at_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Bitte eine gültige Uhrzeit angeben.')
      .optional()
      .or(z.literal('')),
    location: optionalTrimmed(LOCATION_MAX, `Höchstens ${LOCATION_MAX} Zeichen.`),
    note: noteField,
    custom_label: optionalTrimmed(LABEL_MAX, `Höchstens ${LABEL_MAX} Zeichen.`),
    is_shared: z.boolean().default(false),
    partner_user_id: uuid.optional(),
  })
  .refine((v) => !v.is_shared || Boolean(v.partner_user_id), {
    path: ['partner_user_id'],
    message: 'Bitte die zweite Person auswählen.',
  });
export type MovementFormInput = z.input<typeof movementFormSchema>;
export type MovementFormValues = z.output<typeof movementFormSchema>;

// --- Ritual (nutrition / sustainability / animal welfare) -----------------
export const ritualFormSchema = z
  .object({
    area: z.enum(['nutrition', 'sustainability', 'animal_welfare']),
    definition_ids: z.array(uuid).min(1, 'Bitte mindestens einen Baustein auswählen.'),
    occurred_on: dateField,
    meal_label: optionalTrimmed(LABEL_MAX, `Höchstens ${LABEL_MAX} Zeichen.`),
    note: noteField,
    custom_label: optionalTrimmed(LABEL_MAX, `Höchstens ${LABEL_MAX} Zeichen.`),
    is_shared: z.boolean().default(false),
    partner_user_id: uuid.optional(),
  })
  .refine((v) => !v.is_shared || Boolean(v.partner_user_id), {
    path: ['partner_user_id'],
    message: 'Bitte die zweite Person auswählen.',
  });
export type RitualFormInput = z.input<typeof ritualFormSchema>;
export type RitualFormValues = z.output<typeof ritualFormSchema>;

// --- Favorite -------------------------------------------------------------
export const favoriteFormSchema = z
  .object({
    area: z.enum(LIFE_AREAS as unknown as [string, ...string[]]),
    label: z.string().trim().min(1, 'Bitte einen Namen angeben.').max(LABEL_MAX),
    activity_type_id: uuid.optional(),
    duration_min: z.number().int().min(DURATION_MIN).max(DURATION_MAX).optional(),
    intensity: z.enum(INTENSITIES).optional(),
    ritual_definition_ids: z.array(uuid).default([]),
    is_shared: z.boolean().default(false),
    personal: z.boolean().default(false),
  })
  .refine(
    (v) =>
      v.area === 'movement' ? Boolean(v.activity_type_id) : v.ritual_definition_ids.length > 0,
    { path: ['label'], message: 'Bitte den Favoriten vervollständigen.' },
  );
export type FavoriteFormValues = z.output<typeof favoriteFormSchema>;
