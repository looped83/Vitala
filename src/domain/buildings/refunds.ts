/**
 * Building project refund logic (Phase 7, AP3).
 * Framework-free implementations for cancellation, ledger verification, and error recovery.
 */

import type { ResourceKey } from '@/domain/rewards/constants';
import type { ConstructionProject, ConstructionProjectStatus } from './types';

/** Result of a refund operation. */
export interface RefundResult {
  projectId: string;
  status: 'cancelled';
  refundedResourceCount: number;
  refundedResources: Readonly<Record<ResourceKey, number>>;
}

/** Ledger consistency check result. */
export interface LedgerConsistencyIssue {
  isConsistent: boolean;
  resourceKey: ResourceKey;
  expectedBalance: number;
  actualBalance: number;
}

/** Double-spend violation. */
export interface DoubleSpendViolation {
  dedupKey: string;
  transactionCount: number;
  affectedResources: string;
}

/** Preview of what would be refunded. */
export interface RefundPreview {
  canCancel: boolean;
  status: ConstructionProjectStatus;
  resources: Readonly<Record<ResourceKey, number>>;
}

/** Correction transaction record. */
export interface CorrectionResult {
  originalId: string;
  correctionId: string;
  resourceKey: ResourceKey;
  originalAmount: number;
  correctionAmount: number;
  reason: string;
}

/**
 * Check if a project can be cancelled (not in a terminal state).
 * Terminal states: completed, cancelled, failed.
 */
export function canCancelProject(project: ConstructionProject): boolean {
  return (
    project.status !== 'completed' &&
    project.status !== 'cancelled' &&
    project.status !== 'failed'
  );
}

/**
 * Calculate total refund amount across all resources.
 */
export function getTotalRefund(
  resources: Readonly<Record<ResourceKey, number>>,
): number {
  return Object.values(resources).reduce((sum, amount) => sum + amount, 0);
}

/**
 * Validate refund snapshot matches project costs (used for UI verification).
 */
export function validateRefundSnapshot(
  project: ConstructionProject,
  refundSnapshot: Readonly<Record<ResourceKey, number>>,
): boolean {
  const keys: ResourceKey[] = [
    'energy',
    'food',
    'nature',
    'community',
    'building_material',
  ];
  return keys.every((key) => project.costSnapshot[key] === refundSnapshot[key]);
}

/**
 * Create an idempotency key for refund operation (prevents double-refund).
 */
export function createRefundIdempotencyKey(
  projectId: string,
  timestamp: string,
): string {
  return `refund:${projectId}:${timestamp}`;
}
