/** Canonical check-in domain enums (framework-free; mirrored by database.types). */
export type CheckInType = 'morning' | 'evening';
export type TimeBudget = 'minimal' | 'quarter' | 'half' | 'hour' | 'flexible';
export type DayIntensity = 'recovery' | 'light' | 'balanced' | 'active';
export type DayFocus =
  'movement' | 'nutrition' | 'sustainability' | 'animal_welfare' | 'recovery' | 'shared' | 'none';

export const CHECKIN_TEXT_MAX = 280;

/** A private daily check-in (morning or evening). Never leaves the owner. */
export interface CheckIn {
  id: string;
  householdId: string;
  userId: string;
  checkInType: CheckInType;
  businessDate: string;
  timezone: string;
  energyLevel: number | null;
  availableTime: TimeBudget | null;
  intensity: DayIntensity | null;
  focus: DayFocus | null;
  wishText: string | null;
  dayFeeling: number | null;
  positiveMoment: string | null;
  reflectionGood: string | null;
  reflectionEasier: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Energy scale — five neutral, non-medical steps (spec §21.1). No illness
 * wording; "very calm" is a valid, positive state.
 */
export const ENERGY_LABEL: Record<number, string> = {
  1: 'Sehr ruhig',
  2: 'Eher ruhig',
  3: 'Ausgeglichen',
  4: 'Energiegeladen',
  5: 'Sehr energiegeladen',
};

export const TIME_BUDGET_LABEL: Record<TimeBudget, string> = {
  minimal: 'Kaum Zeit',
  quarter: 'Etwa 15 Minuten',
  half: 'Etwa 30 Minuten',
  hour: 'Etwa 60 Minuten',
  flexible: 'Flexibel',
};

export const DAY_INTENSITY_LABEL: Record<DayIntensity, string> = {
  recovery: 'Regeneration',
  light: 'Leicht',
  balanced: 'Ausgewogen',
  active: 'Aktiv',
};

export const DAY_FOCUS_LABEL: Record<DayFocus, string> = {
  movement: 'Bewegung',
  nutrition: 'Ernährung',
  sustainability: 'Nachhaltigkeit',
  animal_welfare: 'Tierwohl',
  recovery: 'Erholung',
  shared: 'Gemeinsamer Alltag',
  none: 'Kein besonderer Fokus',
};

/** Evening day-feeling scale — neutral, non-medical (spec §23.1). */
export const DAY_FEELING_LABEL: Record<number, string> = {
  1: 'Schwierig',
  2: 'Ruhig',
  3: 'In Ordnung',
  4: 'Gut',
  5: 'Sehr gut',
};

export const ENERGY_STEPS = [1, 2, 3, 4, 5] as const;
export const DAY_FEELING_STEPS = [1, 2, 3, 4, 5] as const;
export const TIME_BUDGET_STEPS: TimeBudget[] = ['minimal', 'quarter', 'half', 'hour', 'flexible'];
export const DAY_INTENSITY_STEPS: DayIntensity[] = ['recovery', 'light', 'balanced', 'active'];
export const DAY_FOCUS_STEPS: DayFocus[] = [
  'movement',
  'nutrition',
  'sustainability',
  'animal_welfare',
  'recovery',
  'shared',
  'none',
];
