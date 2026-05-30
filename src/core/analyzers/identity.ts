/**
 * Identity helpers shared by analyzers.
 *
 * Authors are de-duplicated by email (case-insensitive), falling back to name
 * when an email is missing. Keeping this in one place ensures every command
 * groups contributors consistently.
 */
import type { Identity } from '../models/types.js';

/** Stable grouping key for an identity. */
export function identityKey(identity: Identity): string {
  return identity.email.toLowerCase() || identity.name.toLowerCase();
}

/** Case-insensitive match of a query against an identity's name or email. */
export function identityMatches(identity: Identity, query: string): boolean {
  const needle = query.toLowerCase();
  return (
    identity.name.toLowerCase().includes(needle) || identity.email.toLowerCase().includes(needle)
  );
}
