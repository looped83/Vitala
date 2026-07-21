import { z } from 'zod';
import { isValidIsoDate } from '@/lib/dates/day';
import { LIFE_AREAS } from '@/domain/activity/areas';
import { GOAL_DESCRIPTION_MAX, GOAL_TARGET_MAX, GOAL_TITLE_MAX } from './types';

/**
 * Single source of goal-form validation (ADR-0016). Mirrored by the DB check
 * constraints + the `save_goal` RPC guards — the client is never the only line
 * of defence (spec §42). Percent is display-only and never an input unit.
 */

const measurement = z.enum([
  'entry_count',
  'duration_minutes',
  'active_days',
  'shared_count',
  'distinct_types',
  'manual',
  'boolean',
]);
const unit = z.enum(['units', 'minutes', 'days', 'meals', 'actions', 'shared_activities']);
const periodType = z.enum(['day', 'week', 'month', 'quarter', 'custom']);
const recurrence = z.enum(['none', 'daily', 'weekly', 'monthly', 'quarterly']);

const dateField = z.string().refine(isValidIsoDate, 'Bitte ein gültiges Datum wählen.');

export const goalFormSchema = z
  .object({
    owner_type: z.enum(['personal', 'shared']),
    owner_user_id: z.string().uuid().optional(),
    title: z.string().trim().min(1, 'Bitte einen Titel angeben.').max(GOAL_TITLE_MAX),
    description: z
      .string()
      .trim()
      .max(GOAL_DESCRIPTION_MAX, `Höchstens ${GOAL_DESCRIPTION_MAX} Zeichen.`)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    life_area: z.enum(LIFE_AREAS as unknown as [string, ...string[]]),
    measurement,
    target_value: z
      .number({ invalid_type_error: 'Bitte einen Zielwert angeben.' })
      .positive('Der Zielwert muss größer als 0 sein.')
      .max(GOAL_TARGET_MAX, 'Der Zielwert ist zu groß.'),
    unit,
    period_type: periodType,
    recurrence,
    activity_type_keys: z.array(z.string()).default([]),
    ritual_definition_keys: z.array(z.string()).default([]),
    start_date: dateField,
    end_date: dateField.optional(),
    template_key: z.string().optional(),
    manual_value: z.number().min(0).optional(),
  })
  .superRefine((v, ctx) => {
    // Unit ↔ measurement (mirrors goals_unit_measurement constraint).
    const minutesPair = (v.measurement === 'duration_minutes') === (v.unit === 'minutes');
    const daysPair = (v.measurement === 'active_days') === (v.unit === 'days');
    if (!minutesPair || !daysPair) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unit'],
        message: 'Die Einheit passt nicht zur Messmethode.',
      });
    }
    if (v.measurement === 'boolean' && v.target_value !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'Ja/Nein-Ziele haben immer den Zielwert 1.',
      });
    }
    if (v.measurement === 'duration_minutes' && v.life_area !== 'movement') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['measurement'],
        message: 'Minutenziele gelten nur für Bewegung.',
      });
    }
    // Period ↔ recurrence.
    const periodOk =
      v.recurrence === 'none' ||
      (v.recurrence === 'daily' && v.period_type === 'day') ||
      (v.recurrence === 'weekly' && v.period_type === 'week') ||
      (v.recurrence === 'monthly' && v.period_type === 'month') ||
      (v.recurrence === 'quarterly' && v.period_type === 'quarter');
    if (!periodOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recurrence'],
        message: 'Wiederholung passt nicht zum Zeitraum.',
      });
    }
    // Custom one-off needs a valid end date.
    if (v.period_type === 'custom' && v.recurrence === 'none') {
      if (!v.end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: 'Bitte ein Enddatum wählen.',
        });
      } else if (v.end_date < v.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: 'Das Enddatum darf nicht vor dem Start liegen.',
        });
      }
    }
    if (v.end_date && v.end_date < v.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'Das Enddatum darf nicht vor dem Start liegen.',
      });
    }
    // Personal goals need an owner.
    if (v.owner_type === 'personal' && !v.owner_user_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['owner_user_id'],
        message: 'Bitte die zuständige Person wählen.',
      });
    }
    // Area ↔ filter shape.
    if (v.life_area === 'movement' && v.ritual_definition_keys.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ritual_definition_keys'],
        message: 'Bewegungsziele nutzen keine Ritual-Bausteine.',
      });
    }
    if (v.life_area !== 'movement' && v.activity_type_keys.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activity_type_keys'],
        message: 'Dieser Bereich nutzt keine Bewegungstypen.',
      });
    }
  });

export type GoalFormInput = z.input<typeof goalFormSchema>;
export type GoalFormValues = z.output<typeof goalFormSchema>;
