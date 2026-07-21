import { z } from 'zod';

/** The four equal life-area accents usable as a profile colour. */
export const ACCENT_COLORS = ['movement', 'nutrition', 'sustainability', 'animal_welfare'] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export const ACCENT_LABELS: Record<AccentColor, string> = {
  movement: 'Bewegung (Blau)',
  nutrition: 'Ernährung (Grün)',
  sustainability: 'Nachhaltigkeit (Terrakotta)',
  animal_welfare: 'Tierwohl (Violett)',
};

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Bitte gib einen Anzeigenamen ein.')
  .max(60, 'Der Anzeigename darf höchstens 60 Zeichen haben.');

export const profileSchema = z.object({
  display_name: displayNameSchema,
  accent_color: z.enum(ACCENT_COLORS),
  avatar_motif: z
    .string()
    .trim()
    .max(40, 'Das Motiv darf höchstens 40 Zeichen haben.')
    .optional()
    .or(z.literal('')),
});
export type ProfileInput = z.infer<typeof profileSchema>;
