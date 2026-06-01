import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatDate, relativeTime, toJson } from '../src/output/format';

describe('toJson', () => {
  it('pretty-prints with two-space indentation', () => {
    expect(toJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe('formatDate', () => {
  it('formats an ISO date as YYYY-MM-DD', () => {
    expect(formatDate('2026-01-15T09:30:00+02:00')).toBe('2026-01-15');
  });

  it('returns a dash for null/undefined/empty', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('')).toBe('-');
  });

  it('echoes back unparseable input', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('relativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "today" for sub-day differences', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    expect(relativeTime('2026-06-01T06:00:00Z')).toBe('today');
  });

  it('pluralizes days correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T00:00:00Z'));
    expect(relativeTime('2026-06-09T00:00:00Z')).toBe('1 day ago');
    expect(relativeTime('2026-06-05T00:00:00Z')).toBe('5 days ago');
  });

  it('switches to months then years', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    expect(relativeTime('2026-02-01T00:00:00Z')).toMatch(/months? ago/);
    expect(relativeTime('2024-01-01T00:00:00Z')).toMatch(/years? ago/);
  });

  it('returns a dash for missing input', () => {
    expect(relativeTime(null)).toBe('-');
  });
});
