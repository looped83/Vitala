import type { GoalUnit } from './types';
import { unitLabel } from './types';

/**
 * Progress presentation — always positive, never a failure state (spec §12).
 * The bar fills to at most 100 %; the real value may exceed the target and is
 * shown as "übertroffen". No red error states, no "nur 2 von 3", no "verfehlt".
 */
export interface ProgressView {
  /** Raw achieved value. */
  value: number;
  /** Target for the current period. */
  target: number;
  /** Bar fill, clamped to [0, 100]. */
  percent: number;
  /** True once value ≥ target. */
  reached: boolean;
  /** True when value > target (celebrated as "übertroffen", not farmed). */
  exceeded: boolean;
}

export function computeProgress(value: number, target: number): ProgressView {
  const safeTarget = target > 0 ? target : 1;
  const percent = Math.min(100, Math.round((value / safeTarget) * 100));
  return {
    value,
    target,
    percent: Number.isFinite(percent) ? percent : 0,
    reached: value >= target,
    exceeded: value > target,
  };
}

/** Format a value without a trailing ".00" (targets are numeric(10,2)). */
export function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

/**
 * Neutral, appreciative progress line (spec §12). Examples:
 *   "2 von 3 Einheiten erreicht"
 *   "4 von 3 Einheiten – übertroffen"
 *   "150 von 150 Minuten erreicht"
 * Never negative ("nur …", "verfehlt", "gescheitert").
 */
export function progressLine(value: number, target: number, unit: GoalUnit): string {
  const view = computeProgress(value, target);
  const base = `${formatValue(value)} von ${formatValue(target)} ${unitLabel(unit, target)}`;
  if (view.exceeded) return `${base} – übertroffen`;
  if (view.reached) return `${base} – erreicht`;
  return `${base} erreicht`;
}

/** Accessible label for a progress bar (name + value, not colour — a11y §46). */
export function progressAriaLabel(title: string, value: number, target: number): string {
  return `${title}: ${formatValue(value)} von ${formatValue(target)}`;
}
