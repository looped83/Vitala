/**
 * Building project progress & build points (Phase 7, AP4).
 * Framework-free implementations for tracking construction progress.
 */

import type { ConstructionProject, ConstructionContribution } from './types';

/** Result of adding a build point contribution. */
export interface ContributionResult {
  projectId: string;
  contributionId: string;
  pointsAwarded: number;
  projectProgress: ProjectProgress;
}

/** Current progress status of a construction project. */
export interface ProjectProgress {
  projectId: string;
  status: string;
  buildPointsEarned: number;
  buildPointsRequired: number;
  progressPercent: number;
  canComplete: boolean;
}

/** Source of build points. */
export type ContributionSource =
  | 'activity'
  | 'ritual_checkin'
  | 'ritual_completion'
  | 'checkin'
  | 'goal_period'
  | 'mission'
  | 'balance'
  | 'backfill'
  | 'manual';

/**
 * Calculate progress percentage for a project.
 */
export function calculateProgressPercent(
  buildPointsEarned: number,
  buildPointsRequired: number,
): number {
  if (buildPointsRequired === 0) {
    return 100; // Instant builds (Phase 7) are always complete
  }
  return Math.round(
    (buildPointsEarned / buildPointsRequired) * 100,
  );
}

/**
 * Check if a project is complete (build points >= required).
 * Instant builds (buildPointsRequired = 0) are always complete.
 */
export function isProjectComplete(project: ConstructionProject): boolean {
  if (project.status === 'completed') {
    return true;
  }
  // Instant builds (0 required) are always "done"; otherwise check points
  return (
    project.buildPointsRequired === 0 ||
    project.buildPointsEarned >= project.buildPointsRequired
  );
}

/**
 * Check if a project can receive more contributions.
 */
export function canReceiveContribution(project: ConstructionProject): boolean {
  return !['completed', 'cancelled', 'failed'].includes(project.status);
}

/**
 * Calculate remaining build points needed to complete.
 */
export function getRemainingBuildPoints(
  project: ConstructionProject,
): number {
  const remaining = project.buildPointsRequired - project.buildPointsEarned;
  return Math.max(0, remaining);
}

/**
 * Create an idempotency key for a contribution (prevents double-counting).
 */
export function createContributionIdempotencyKey(
  projectId: string,
  sourceKind: string,
  sourceId: string,
): string {
  return `contribution:${projectId}:${sourceKind}:${sourceId}`;
}

/**
 * Validate a contribution against a project (used for client-side validation).
 */
export function validateContribution(
  project: ConstructionProject,
  buildPoints: number,
): { valid: boolean; reason?: string } {
  if (!canReceiveContribution(project)) {
    return {
      valid: false,
      reason: `Project is in ${project.status} state and cannot receive contributions`,
    };
  }

  if (buildPoints <= 0) {
    return { valid: false, reason: 'Build points must be positive' };
  }

  if (buildPoints > getRemainingBuildPoints(project)) {
    return {
      valid: false,
      reason: `Contribution of ${buildPoints} points exceeds ${getRemainingBuildPoints(project)} remaining`,
    };
  }

  return { valid: true };
}

/**
 * Sort contributions by event date (for display).
 */
export function sortContributionsByDate(
  contributions: readonly ConstructionContribution[],
): ConstructionContribution[] {
  return [...contributions].sort(
    (a, b) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  );
}

/**
 * Sum all build points from contributions.
 */
export function getTotalContributedPoints(
  contributions: readonly ConstructionContribution[],
): number {
  return contributions.reduce((sum, c) => sum + c.points, 0);
}
