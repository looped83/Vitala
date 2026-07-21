import { describe, expect, it } from 'vitest';
import { normalizeSupabaseError } from './errors';

describe('normalizeSupabaseError', () => {
  it('maps RPC business codes to friendly messages', () => {
    const result = normalizeSupabaseError({ message: 'household_full', code: 'P0001' });
    expect(result.kind).toBe('conflict');
    expect(result.code).toBe('household_full');
    expect(result.message).toMatch(/vollständig/);
  });

  it('maps not_owner to a permission error', () => {
    const result = normalizeSupabaseError({ message: 'not_owner', code: 'P0001' });
    expect(result.kind).toBe('permission');
  });

  it('maps an RLS violation (42501) to permission', () => {
    const result = normalizeSupabaseError({ message: 'permission denied', code: '42501' });
    expect(result.kind).toBe('permission');
  });

  it('maps a unique violation (23505) to conflict', () => {
    const result = normalizeSupabaseError({ message: 'duplicate', code: '23505' });
    expect(result.kind).toBe('conflict');
  });

  it('falls back to a server error for unknown Postgrest codes', () => {
    const result = normalizeSupabaseError({ message: 'boom', code: 'XX000' });
    expect(result.kind).toBe('server');
  });
});
