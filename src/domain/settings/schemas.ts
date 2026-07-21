import { z } from 'zod';

export const themeChoiceSchema = z.enum(['system', 'light', 'dark']);
export type ThemeChoice = z.infer<typeof themeChoiceSchema>;

export const localeSchema = z.enum(['de']);
export type Locale = z.infer<typeof localeSchema>;

export const preferencesSchema = z.object({
  theme: themeChoiceSchema,
  reduced_motion: z.boolean(),
  locale: localeSchema,
});
export type PreferencesInput = z.infer<typeof preferencesSchema>;

/** Curated timezone options for the household settings (not an exhaustive DB). */
export const TIMEZONE_OPTIONS = [
  'Europe/Berlin',
  'Europe/London',
  'Europe/Zurich',
  'Europe/Vienna',
  'Europe/Madrid',
  'UTC',
] as const;

export const WEEK_START_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: 'Montag' },
  { value: 0, label: 'Sonntag' },
];

export const householdSettingsSchema = z.object({
  timezone: z.string().min(1),
  week_start: z.number().int().min(0).max(6),
});
export type HouseholdSettingsInput = z.infer<typeof householdSettingsSchema>;
