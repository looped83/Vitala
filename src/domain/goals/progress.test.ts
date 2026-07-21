import { describe, expect, it } from 'vitest';
import { computeProgress, progressLine } from './progress';

describe('computeProgress', () => {
  it('clamps the bar to 100% but keeps the real value', () => {
    const p = computeProgress(4, 3);
    expect(p.percent).toBe(100);
    expect(p.value).toBe(4);
    expect(p.reached).toBe(true);
    expect(p.exceeded).toBe(true);
  });

  it('shows partial progress without failure', () => {
    const p = computeProgress(2, 3);
    expect(p.percent).toBe(67);
    expect(p.reached).toBe(false);
    expect(p.exceeded).toBe(false);
  });

  it('handles a zero target defensively', () => {
    const p = computeProgress(0, 0);
    expect(p.percent).toBe(0);
  });
});

describe('progressLine', () => {
  it('phrases partial progress positively (never "nur …")', () => {
    expect(progressLine(2, 3, 'units')).toBe('2 von 3 Einheiten erreicht');
    expect(progressLine(2, 3, 'units')).not.toMatch(/nur|verfehlt|gescheitert/i);
  });

  it('marks reached and exceeded states', () => {
    expect(progressLine(3, 3, 'units')).toBe('3 von 3 Einheiten – erreicht');
    expect(progressLine(4, 3, 'units')).toBe('4 von 3 Einheiten – übertroffen');
  });

  it('uses singular units where appropriate', () => {
    expect(progressLine(0, 1, 'meals')).toBe('0 von 1 Mahlzeit erreicht');
    expect(progressLine(150, 150, 'minutes')).toBe('150 von 150 Minuten – erreicht');
  });
});
