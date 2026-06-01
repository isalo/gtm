import { describe, expect, it } from 'vitest';
import { parseLocalParts } from '../src/core/analyzers/activityAnalyzer';

describe('parseLocalParts', () => {
  it('reads weekday/hour/month from the commit-local wall clock', () => {
    // 2026-06-01 is a Monday (weekday 1).
    const parts = parseLocalParts('2026-06-01T14:30:00+02:00');
    expect(parts).toEqual({ weekday: 1, hour: 14, month: '2026-06' });
  });

  it('uses the local hour as written, ignoring the offset for the hour field', () => {
    const parts = parseLocalParts('2026-06-01T23:05:00-07:00');
    expect(parts?.hour).toBe(23);
  });

  it('returns null for non-ISO input', () => {
    expect(parseLocalParts('garbage')).toBeNull();
    expect(parseLocalParts('')).toBeNull();
  });
});
