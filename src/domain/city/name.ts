import { z } from 'zod';

/**
 * City name validation (§21/§69). Plain text only — no HTML, controlled length,
 * changeable by any active household member. Renaming never touches ids or data
 * relationships (it only updates the `name` column).
 */

export const CITY_NAME_MIN = 2;
export const CITY_NAME_MAX = 40;

/** Neutral default when a household has not chosen a city name yet (§21). */
export const DEFAULT_CITY_NAME = 'Unsere Stadt';

/** Reject angle brackets outright so no markup can ever reach the DOM (§69). */
const NO_MARKUP = /^[^<>]*$/;

export const cityNameSchema = z
  .string()
  .trim()
  .min(CITY_NAME_MIN, `Der Stadtname braucht mindestens ${CITY_NAME_MIN} Zeichen.`)
  .max(CITY_NAME_MAX, `Der Stadtname darf höchstens ${CITY_NAME_MAX} Zeichen haben.`)
  .regex(NO_MARKUP, 'Der Stadtname darf keine spitzen Klammern enthalten.');

export type CityNameInput = z.infer<typeof cityNameSchema>;

/** Validate + normalise a proposed city name. Throws a ZodError on failure. */
export function parseCityName(value: string): string {
  return cityNameSchema.parse(value);
}

/** Non-throwing check for inline form feedback. */
export function isValidCityName(value: string): boolean {
  return cityNameSchema.safeParse(value).success;
}
