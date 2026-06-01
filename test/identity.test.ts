import { describe, expect, it } from 'vitest';
import { identityKey, identityMatches } from '../src/core/analyzers/identity';
import type { Identity } from '../src/core/models/types';

describe('identityKey', () => {
  it('keys by lowercased email when present', () => {
    const id: Identity = { name: 'Ivan Salo', email: 'Ivan@Example.COM' };
    expect(identityKey(id)).toBe('ivan@example.com');
  });

  it('falls back to lowercased name when email is missing', () => {
    const id: Identity = { name: 'Ivan Salo', email: '' };
    expect(identityKey(id)).toBe('ivan salo');
  });
});

describe('identityMatches', () => {
  const id: Identity = { name: 'Ivan Salo', email: 'ivan@example.com' };

  it('matches a case-insensitive name substring', () => {
    expect(identityMatches(id, 'ivan')).toBe(true);
    expect(identityMatches(id, 'SALO')).toBe(true);
  });

  it('matches a case-insensitive email substring', () => {
    expect(identityMatches(id, 'example.com')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(identityMatches(id, 'nobody')).toBe(false);
  });
});
