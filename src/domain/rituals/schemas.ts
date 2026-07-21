import { z } from 'zod';
import { isValidIsoDate } from '@/lib/dates/day';
import { LIFE_AREAS } from '@/domain/activity/areas';
import { RITUAL_DESCRIPTION_MAX, RITUAL_TITLE_MAX } from './types';

/** Ritual-form validation (spec §42). Mirrored by the `save_ritual` RPC. */
const dateField = z.string().refine(isValidIsoDate, 'Bitte ein gültiges Datum wählen.');

export const ritualFormSchema = z
  .object({
    owner_type: z.enum(['personal', 'shared']),
    owner_user_id: z.string().uuid().optional(),
    title: z.string().trim().min(1, 'Bitte einen Titel angeben.').max(RITUAL_TITLE_MAX),
    description: z
      .string()
      .trim()
      .max(RITUAL_DESCRIPTION_MAX, `Höchstens ${RITUAL_DESCRIPTION_MAX} Zeichen.`)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    life_area: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.enum(LIFE_AREAS as unknown as [string, ...string[]]).optional(),
    ),
    ritual_type: z.enum([
      'check',
      'choice',
      'scale',
      'reflection',
      'activity_link',
      'shared_checkin',
    ]),
    recurrence: z.enum(['daily', 'weekly', 'monthly', 'flexible']),
    preferred_time: z.enum(['morning', 'day', 'evening', 'flexible']),
    weekdays: z.array(z.number().int().min(0).max(6)).default([]),
    start_date: dateField,
    end_date: dateField.optional(),
    sort_order: z.number().int().default(100),
  })
  .superRefine((v, ctx) => {
    if (v.owner_type === 'personal' && !v.owner_user_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['owner_user_id'],
        message: 'Bitte die zuständige Person wählen.',
      });
    }
    if (v.recurrence === 'weekly' && v.weekdays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weekdays'],
        message: 'Bitte mindestens einen Wochentag wählen.',
      });
    }
    if (v.end_date && v.end_date < v.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'Das Enddatum darf nicht vor dem Start liegen.',
      });
    }
  });

export type RitualFormInput = z.input<typeof ritualFormSchema>;
export type RitualFormValues = z.output<typeof ritualFormSchema>;
