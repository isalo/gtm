import { describe, expect, it } from 'vitest';
import { buildFileChurn, scoreHotspots } from '../src/core/analyzers/churn';
import type { NumstatCommit } from '../src/core/git/gitClient';
import type { CommitInfo, FileChurn } from '../src/core/models/types';

function commit(hash: string, name: string, date: string): CommitInfo {
  return {
    hash,
    shortHash: hash.slice(0, 7),
    author: { name, email: `${name.toLowerCase()}@example.com` },
    committer: { name, email: `${name.toLowerCase()}@example.com` },
    date,
    subject: 'change',
    body: '',
  };
}

describe('buildFileChurn', () => {
  it('aggregates commits, line counts, distinct authors and last-modified', () => {
    const commits: CommitInfo[] = [
      commit('a', 'Ivan', '2026-01-01T00:00:00Z'),
      commit('b', 'Mary', '2026-02-01T00:00:00Z'),
    ];
    const numstat: NumstatCommit[] = [
      { hash: 'a', files: [{ path: 'src/app.ts', insertions: 10, deletions: 2 }] },
      { hash: 'b', files: [{ path: 'src/app.ts', insertions: 5, deletions: 1 }] },
    ];

    const [churn] = buildFileChurn(commits, numstat);
    expect(churn).toMatchObject({
      path: 'src/app.ts',
      commits: 2,
      insertions: 15,
      deletions: 3,
      authors: 2,
      lastModified: '2026-02-01T00:00:00Z',
    });
  });

  it('treats binary (null) line counts as zero', () => {
    const commits = [commit('a', 'Ivan', '2026-01-01T00:00:00Z')];
    const numstat: NumstatCommit[] = [
      { hash: 'a', files: [{ path: 'logo.png', insertions: null, deletions: null }] },
    ];
    const [churn] = buildFileChurn(commits, numstat);
    expect(churn).toMatchObject({ insertions: 0, deletions: 0 });
  });
});

describe('scoreHotspots', () => {
  it('ranks high-churn, multi-author files first with a normalized score', () => {
    const churn: FileChurn[] = [
      { path: 'hot.ts', commits: 10, insertions: 0, deletions: 0, authors: 4, lastModified: '' },
      { path: 'cold.ts', commits: 1, insertions: 0, deletions: 0, authors: 1, lastModified: '' },
    ];
    const scored = scoreHotspots(churn);
    expect(scored[0]!.path).toBe('hot.ts');
    expect(scored[0]!.riskScore).toBeCloseTo(1, 5);
    expect(scored[1]!.riskScore).toBeLessThan(scored[0]!.riskScore);
    expect(scored[1]!.riskScore).toBeGreaterThanOrEqual(0);
  });

  it('never exceeds a score of 1', () => {
    const churn: FileChurn[] = [
      { path: 'a.ts', commits: 5, insertions: 0, deletions: 0, authors: 5, lastModified: '' },
    ];
    expect(scoreHotspots(churn)[0]!.riskScore).toBeLessThanOrEqual(1);
  });
});
