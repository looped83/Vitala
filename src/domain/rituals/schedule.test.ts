import { describe, expect, it } from 'vitest';
import { isRitualScheduledOn, ritualsDueOn } from './schedule';
import type { Ritual } from './types';

function ritual(partial: Partial<Ritual>): Ritual {
  return {
    id: 'r1',
    householdId: 'h1',
    createdBy: 'u1',
    ownerType: 'personal',
    ownerUserId: 'u1',
    title: 'Test',
    description: null,
    lifeArea: null,
    ritualType: 'check',
    recurrence: 'daily',
    preferredTime: 'flexible',
    weekdays: [],
    startDate: '2026-01-01',
    endDate: null,
    status: 'active',
    sortOrder: 100,
    createdAt: '',
    updatedAt: '',
    pausedAt: null,
    archivedAt: null,
    ...partial,
  };
}

describe('isRitualScheduledOn', () => {
  it('daily rituals are due every day', () => {
    expect(isRitualScheduledOn(ritual({ recurrence: 'daily' }), '2026-03-18')).toBe(true);
  });

  it('paused/archived rituals are never due', () => {
    expect(isRitualScheduledOn(ritual({ status: 'paused' }), '2026-03-18')).toBe(false);
    expect(isRitualScheduledOn(ritual({ status: 'archived' }), '2026-03-18')).toBe(false);
  });

  it('respects start and end dates', () => {
    const r = ritual({ startDate: '2026-03-10', endDate: '2026-03-20' });
    expect(isRitualScheduledOn(r, '2026-03-09')).toBe(false);
    expect(isRitualScheduledOn(r, '2026-03-15')).toBe(true);
    expect(isRitualScheduledOn(r, '2026-03-21')).toBe(false);
  });

  it('weekly rituals honour weekdays (2026-03-18 is a Wednesday = 3)', () => {
    expect(isRitualScheduledOn(ritual({ recurrence: 'weekly', weekdays: [3] }), '2026-03-18')).toBe(
      true,
    );
    expect(isRitualScheduledOn(ritual({ recurrence: 'weekly', weekdays: [1] }), '2026-03-18')).toBe(
      false,
    );
  });

  it('monthly rituals recur on the start day-of-month, clamped to short months', () => {
    const r = ritual({ recurrence: 'monthly', startDate: '2026-01-31' });
    expect(isRitualScheduledOn(r, '2026-03-31')).toBe(true);
    expect(isRitualScheduledOn(r, '2026-02-28')).toBe(true); // clamped
    expect(isRitualScheduledOn(r, '2026-02-27')).toBe(false);
  });

  it('flexible rituals are always available', () => {
    expect(isRitualScheduledOn(ritual({ recurrence: 'flexible' }), '2026-07-04')).toBe(true);
  });
});

describe('ritualsDueOn', () => {
  it('orders by preferred time then sort order', () => {
    const morning = ritual({ id: 'm', preferredTime: 'morning', title: 'Morgen' });
    const evening = ritual({ id: 'e', preferredTime: 'evening', title: 'Abend' });
    const due = ritualsDueOn([evening, morning], '2026-03-18');
    expect(due.map((r) => r.id)).toEqual(['m', 'e']);
  });
});
