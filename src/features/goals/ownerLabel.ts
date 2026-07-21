import type { Goal } from '@/domain/goals/types';

/** "Gemeinsam" for shared goals, "Persönlich · Name" for personal ones. */
export function goalOwnerLabel(goal: Goal, namesById: Map<string, string>): string {
  if (goal.ownerType === 'shared') return 'Gemeinsam';
  const name = goal.ownerUserId ? namesById.get(goal.ownerUserId) : undefined;
  return name ? `Persönlich · ${name}` : 'Persönlich';
}
