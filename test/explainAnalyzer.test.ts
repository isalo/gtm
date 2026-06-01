import { describe, expect, it } from 'vitest';
import { ownership } from '../src/core/analyzers/explainAnalyzer';
import type { CommitInfo } from '../src/core/models/types';

function commit(name: string): CommitInfo {
  return {
    hash: Math.random().toString(36).slice(2),
    shortHash: 'abc1234',
    author: { name, email: `${name.toLowerCase()}@example.com` },
    committer: { name, email: `${name.toLowerCase()}@example.com` },
    date: '2026-01-01T00:00:00Z',
    subject: 's',
    body: '',
  };
}

describe('ownership', () => {
  it('computes per-author shares that sum to 1, sorted descending', () => {
    const commits = [commit('Ivan'), commit('Ivan'), commit('Ivan'), commit('Mary')];
    const result = ownership(commits);
    expect(result[0]!.author.name).toBe('Ivan');
    expect(result[0]!.share).toBeCloseTo(0.75, 5);
    expect(result[1]!.share).toBeCloseTo(0.25, 5);
    const total = result.reduce((sum, entry) => sum + entry.share, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('returns an empty array when there are no commits', () => {
    expect(ownership([])).toEqual([]);
  });
});
