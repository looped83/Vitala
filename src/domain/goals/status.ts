import type { GoalStatus } from './types';

/**
 * Goal lifecycle transitions (spec §13). Mirrors the server validation in
 * `set_goal_status`; the UI uses it to show only valid actions. Invalid
 * transitions are impossible from both sides (defence in depth).
 */
const ALLOWED: Record<GoalStatus, GoalStatus[]> = {
  draft: ['active', 'archived'],
  active: ['paused', 'completed', 'archived'],
  paused: ['active', 'archived', 'completed'],
  completed: ['archived', 'active'],
  expired: ['active', 'archived'],
  archived: [],
};

export function canTransition(from: GoalStatus, to: GoalStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

/** Actions offered for a goal in a given status (excludes the current status). */
export function availableTransitions(from: GoalStatus): GoalStatus[] {
  return ALLOWED[from];
}

/** Is a goal currently "live" (counts toward Today / active list)? */
export function isLiveStatus(status: GoalStatus): boolean {
  return status === 'active';
}
