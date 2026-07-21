import { describe, expect, it } from 'vitest';
import {
  currentPeriodBounds,
  currentPeriodIndex,
  periodEndFromStart,
  periodStart,
  periodStartForIndex,
} from './periods';

describe('periodStart', () => {
  it('returns the day itself for day periods', () => {
    expect(periodStart('day', '2026-03-18')).toBe('2026-03-18');
  });

  it('aligns weeks to Monday by default (week_start = 1)', () => {
    // 2026-03-18 is a Wednesday.
    expect(periodStart('week', '2026-03-18', 1)).toBe('2026-03-16');
  });

  it('aligns weeks to Sunday when week_start = 0', () => {
    expect(periodStart('week', '2026-03-18', 0)).toBe('2026-03-15');
  });

  it('aligns months to the first', () => {
    expect(periodStart('month', '2026-03-18')).toBe('2026-03-01');
  });

  it('aligns quarters to Jan/Apr/Jul/Oct', () => {
    expect(periodStart('quarter', '2026-03-18')).toBe('2026-01-01');
    expect(periodStart('quarter', '2026-05-01')).toBe('2026-04-01');
    expect(periodStart('quarter', '2026-11-30')).toBe('2026-10-01');
  });
});

describe('periodEndFromStart', () => {
  it('computes week/month/quarter ends inclusively', () => {
    expect(periodEndFromStart('day', '2026-03-18')).toBe('2026-03-18');
    expect(periodEndFromStart('week', '2026-03-16')).toBe('2026-03-22');
    expect(periodEndFromStart('month', '2026-02-01')).toBe('2026-02-28');
    expect(periodEndFromStart('month', '2024-02-01')).toBe('2024-02-29'); // leap year
    expect(periodEndFromStart('quarter', '2026-01-01')).toBe('2026-03-31');
  });
});

describe('currentPeriodIndex', () => {
  it('counts whole periods from the aligned series start', () => {
    expect(currentPeriodIndex('day', '2026-03-01', '2026-03-01')).toBe(0);
    expect(currentPeriodIndex('day', '2026-03-01', '2026-03-05')).toBe(4);
    expect(currentPeriodIndex('week', '2026-03-02', '2026-03-16')).toBe(2);
    expect(currentPeriodIndex('month', '2026-01-01', '2026-03-15')).toBe(2);
    expect(currentPeriodIndex('quarter', '2026-01-01', '2026-11-01')).toBe(3);
  });

  it('never returns a negative index', () => {
    expect(currentPeriodIndex('week', '2026-03-16', '2026-03-01')).toBe(0);
  });
});

describe('periodStartForIndex', () => {
  it('advances by the period cadence', () => {
    expect(periodStartForIndex('week', '2026-03-02', 3)).toBe('2026-03-23');
    expect(periodStartForIndex('month', '2026-01-01', 2)).toBe('2026-03-01');
    expect(periodStartForIndex('quarter', '2026-01-01', 2)).toBe('2026-07-01');
  });
});

describe('currentPeriodBounds', () => {
  it('returns the week containing a mid-week creation date', () => {
    const bounds = currentPeriodBounds('week', '2026-03-18', '2026-03-18', 1);
    expect(bounds).toEqual({ start: '2026-03-16', end: '2026-03-22' });
  });

  it('returns the running week for a goal created earlier', () => {
    const bounds = currentPeriodBounds('week', '2026-03-02', '2026-03-19', 1);
    expect(bounds).toEqual({ start: '2026-03-16', end: '2026-03-22' });
  });

  it('uses explicit bounds for custom periods', () => {
    const bounds = currentPeriodBounds('custom', '2026-03-01', '2026-03-10', 1, '2026-03-31');
    expect(bounds).toEqual({ start: '2026-03-01', end: '2026-03-31' });
  });
});
