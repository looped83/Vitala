import { z } from 'zod';

export const householdNameSchema = z
  .string()
  .trim()
  .min(1, 'Bitte gib einen Namen für euren Household ein.')
  .max(80, 'Der Name darf höchstens 80 Zeichen haben.');

export const createHouseholdSchema = z.object({
  name: householdNameSchema,
});
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

/** Invite codes are 10 hex characters (see create_household_invite RPC). */
export const inviteCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase().replace(/\s+/g, ''))
  .pipe(
    z.string().regex(/^[0-9A-F]{10}$/, 'Der Einladungscode besteht aus 10 Zeichen (0–9, A–F).'),
  );

export const acceptInviteSchema = z.object({
  code: inviteCodeSchema,
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
