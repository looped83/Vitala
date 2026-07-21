import { describe, expect, it } from 'vitest';
import {
  dayBucket,
  dayGroupLabel,
  isFutureDay,
  isValidIsoDate,
  isoDateInZone,
  todayInZone,
} from './day';

const BERLIN = 'Europe/Berlin';

describe('isoDateInZone', () => {
  it('keeps a late-evening local instant on the same local day (no UTC shift)', () => {
    // 2024-06-15 23:30 Berlin (CEST, +02:00) is 21:30 UTC the same date.
    const instant = new Date('2024-06-15T21:30:00Z');
    expect(isoDateInZone(instant, BERLIN)).toBe('2024-06-15');
  });

  it('maps an after-midnight-UTC instant back to the correct local day', () => {
    // 2024-01-10 00:30 Berlin (CET, +01:00) is 2024-01-09 23:30 UTC.
    const instant = new Date('2024-01-09T23:30:00Z');
    expect(isoDateInZone(instant, BERLIN)).toBe('2024-01-10');
  });

  it('handles the spring DST switch (28 → 31 March 2024)', () => {
    // 02:30 local does not exist on the switch day; 00:30 UTC = 01:30 CET still 31 Mar.
    const instant = new Date('2024-03-31T00:30:00Z');
    expect(isoDateInZone(instant, BERLIN)).toBe('2024-03-31');
  });

  it('handles the autumn DST switch (27 October 2024)', () => {
    // 00:30 UTC on 27 Oct is 02:30 CEST → still 27 Oct locally.
    const instant = new Date('2024-10-27T00:30:00Z');
    expect(isoDateInZone(instant, BERLIN)).toBe('2024-10-27');
  });
});

describe('todayInZone', () => {
  it('returns the Berlin calendar date for a given now', () => {
    expect(todayInZone(BERLIN, new Date('2024-12-31T23:00:00Z'))).toBe('2025-01-01');
  });
});

describe('isValidIsoDate', () => {
  it('accepts a real date and rejects malformed / impossible ones', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true); // leap year
    expect(isValidIsoDate('2023-02-29')).toBe(false);
    expect(isValidIsoDate('2024-13-01')).toBe(false);
    expect(isValidIsoDate('2024-06-31')).toBe(false); // June has 30 days
    expect(isValidIsoDate('15.06.2024')).toBe(false);
  });

  it('is timezone-independent: today in the household zone is always valid', () => {
    // Regression: parsing to a local Date shifted the day back in UTC+ zones
    // (e.g. Europe/Berlin), wrongly rejecting every date in the movement form.
    for (const tz of ['Europe/Berlin', 'UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      const today = todayInZone(tz);
      expect(isValidIsoDate(today)).toBe(true);
    }
    expect(isValidIsoDate('2026-07-21')).toBe(true);
  });
});

describe('isFutureDay', () => {
  it('is true only for days after the local today', () => {
    const now = new Date('2024-06-15T10:00:00Z');
    expect(isFutureDay('2024-06-16', BERLIN, now)).toBe(true);
    expect(isFutureDay('2024-06-15', BERLIN, now)).toBe(false);
    expect(isFutureDay('2024-06-14', BERLIN, now)).toBe(false);
  });
});

describe('dayBucket / dayGroupLabel', () => {
  const now = new Date('2024-06-15T10:00:00Z');
  it('classifies today, yesterday and older', () => {
    expect(dayBucket('2024-06-15', BERLIN, now)).toBe('today');
    expect(dayBucket('2024-06-14', BERLIN, now)).toBe('yesterday');
    expect(dayBucket('2024-06-01', BERLIN, now)).toBe('older');
  });
  it('labels relative days in German and formats older dates', () => {
    expect(dayGroupLabel('2024-06-15', BERLIN, now)).toBe('Heute');
    expect(dayGroupLabel('2024-06-14', BERLIN, now)).toBe('Gestern');
    expect(dayGroupLabel('2024-06-01', BERLIN, now)).toContain('Juni');
  });
});
