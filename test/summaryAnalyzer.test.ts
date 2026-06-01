import { describe, expect, it } from 'vitest';
import { aggregateAuthors, computeAgeDays } from '../src/core/analyzers/summaryAnalyzer';
import type { CommitInfo } from '../src/core/models/types';

function commit(name: string, email: string, date: string): CommitInfo {
  return {
    hash: Math.random().toString(36).slice(2),
    shortHash: 'abc1234',
    author: { name, email },
    committer: { name, email },
    date,
    subject: 's',
    body: '',
  };
}

describe('aggregateAuthors', () => {
  it('groups by email and sorts by commit count descending', () => {
    const commits: CommitInfo[] = [
      commit('Ivan', 'ivan@example.com', '2026-01-01T00:00:00Z'),
      commit('Ivan Salo', 'ivan@example.com', '2026-03-01T00:00:00Z'),
      commit('Mary', 'mary@example.com', '2026-02-01T00:00:00Z'),
    ];
    const authors = aggregateAuthors(commits);
    expect(authors).toHaveLength(2);
    expect(authors[0]!.commits).toBe(2);
    expect(authors[0]!.firstCommit).toBe('2026-01-01T00:00:00Z');
    expect(authors[0]!.lastCommit).toBe('2026-03-01T00:00:00Z');
  });

  it('returns an empty array for no commits', () => {
    expect(aggregateAuthors([])).toEqual([]);
  });
});

describe('computeAgeDays', () => {
  it('computes inclusive whole-day age between first and last commit', () => {
    expect(computeAgeDays('2026-01-01T00:00:00Z', '2026-01-11T00:00:00Z')).toBe(10);
  });

  it('returns 0 when either date is missing or invalid', () => {
    expect(computeAgeDays(null, '2026-01-11T00:00:00Z')).toBe(0);
    expect(computeAgeDays('2026-01-01T00:00:00Z', null)).toBe(0);
    expect(computeAgeDays('nope', 'nope')).toBe(0);
  });

  it('never returns a negative age', () => {
    expect(computeAgeDays('2026-02-01T00:00:00Z', '2026-01-01T00:00:00Z')).toBe(0);
  });
});
