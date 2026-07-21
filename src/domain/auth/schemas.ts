import { z } from 'zod';

/**
 * Auth form schemas. Shared by the client forms (React Hook Form resolver);
 * the server enforces its own rules via Supabase Auth (security §18.4).
 * Framework-free so it is unit-testable in isolation.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Bitte gib deine E-Mail-Adresse ein.')
  .email('Bitte gib eine gültige E-Mail-Adresse ein.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Bitte gib dein Passwort ein.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordUpdateSchema = z
  .object({
    password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen haben.'),
    confirm: z.string().min(1, 'Bitte bestätige das Passwort.'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Die Passwörter stimmen nicht überein.',
    path: ['confirm'],
  });
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
