import { describe, expect, it } from 'vitest';
import { availableTransitions, canTransition } from './status';

describe('goal status transitions', () => {
  it('allows the documented lifecycle moves (spec §13)', () => {
    expect(canTransition('active', 'paused')).toBe(true);
    expect(canTransition('paused', 'active')).toBe(true);
    expect(canTransition('active', 'completed')).toBe(true);
    expect(canTransition('active', 'archived')).toBe(true);
    expect(canTransition('expired', 'active')).toBe(true); // verlängern
    expect(canTransition('completed', 'archived')).toBe(true);
  });

  it('rejects invalid moves', () => {
    expect(canTransition('archived', 'active')).toBe(false);
    expect(canTransition('completed', 'paused')).toBe(false);
    expect(canTransition('draft', 'completed')).toBe(false);
  });

  it('treats a no-op as valid', () => {
    expect(canTransition('active', 'active')).toBe(true);
  });

  it('archived is terminal', () => {
    expect(availableTransitions('archived')).toEqual([]);
  });
});
