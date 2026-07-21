import { z } from 'zod';
import { CHECKIN_TEXT_MAX } from './types';

/**
 * Check-in validation (spec §21/§22/§23/§24). Everything is optional — a
 * one-tap check-in with no fields is valid (game-loop §5.1). Free text has a
 * clear character limit, no rich text, and is never analysed or logged.
 */
const text = z
  .string()
  .trim()
  .max(CHECKIN_TEXT_MAX, `Höchstens ${CHECKIN_TEXT_MAX} Zeichen.`)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const morningCheckInSchema = z.object({
  energy_level: z.number().int().min(1).max(5).optional(),
  available_time: z.enum(['minimal', 'quarter', 'half', 'hour', 'flexible']).optional(),
  intensity: z.enum(['recovery', 'light', 'balanced', 'active']).optional(),
  focus: z
    .enum([
      'movement',
      'nutrition',
      'sustainability',
      'animal_welfare',
      'recovery',
      'shared',
      'none',
    ])
    .optional(),
  wish_text: text,
});
export type MorningCheckInValues = z.output<typeof morningCheckInSchema>;

export const eveningCheckInSchema = z.object({
  day_feeling: z.number().int().min(1).max(5).optional(),
  positive_moment: text,
  reflection_good: text,
  reflection_easier: text,
});
export type EveningCheckInValues = z.output<typeof eveningCheckInSchema>;
