import { describe, expect, it } from 'vitest';
import { parseCommits, parseNumstat } from '../src/core/git/gitClient';

const FIELD = '\u001f';
const RECORD = '\u001e';

function logRecord(fields: string[]): string {
  return fields.join(FIELD) + RECORD;
}

describe('parseCommits', () => {
  it('parses fields into structured commits', () => {
    const raw =
      logRecord([
        'deadbeefcafe',
        'deadbee',
        'Ivan Salo',
        'ivan@example.com',
        'Committer',
        'committer@example.com',
        '2026-06-01T10:00:00+02:00',
        'Add feature',
        'Body line one\nBody line two',
      ]) +
      logRecord([
        'feedface1234',
        'feedfac',
        'Mary',
        'mary@example.com',
        'Mary',
        'mary@example.com',
        '2026-05-01T09:00:00+02:00',
        'Fix bug',
        '',
      ]);

    const commits = parseCommits(raw);
    expect(commits).toHaveLength(2);
    expect(commits[0]).toMatchObject({
      hash: 'deadbeefcafe',
      shortHash: 'deadbee',
      author: { name: 'Ivan Salo', email: 'ivan@example.com' },
      committer: { name: 'Committer', email: 'committer@example.com' },
      date: '2026-06-01T10:00:00+02:00',
      subject: 'Add feature',
      body: 'Body line one\nBody line two',
    });
    expect(commits[1]!.subject).toBe('Fix bug');
    expect(commits[1]!.body).toBe('');
  });

  it('returns an empty array for empty output', () => {
    expect(parseCommits('')).toEqual([]);
    expect(parseCommits('   \n  ')).toEqual([]);
  });
});

describe('parseNumstat', () => {
  it('parses per-commit file rows and numeric line counts', () => {
    const raw =
      `${RECORD}deadbeef\n` +
      `10\t2\tsrc/app.ts\n` +
      `0\t5\tsrc/old.ts\n` +
      `${RECORD}feedface\n` +
      `3\t3\tREADME.md\n`;

    const commits = parseNumstat(raw);
    expect(commits).toHaveLength(2);
    expect(commits[0]).toEqual({
      hash: 'deadbeef',
      files: [
        { path: 'src/app.ts', insertions: 10, deletions: 2 },
        { path: 'src/old.ts', insertions: 0, deletions: 5 },
      ],
    });
    expect(commits[1]!.files[0]).toEqual({ path: 'README.md', insertions: 3, deletions: 3 });
  });

  it('represents binary files (dash counts) as null', () => {
    const raw = `${RECORD}abc123\n-\t-\tlogo.png\n`;
    const [commit] = parseNumstat(raw);
    expect(commit!.files[0]).toEqual({ path: 'logo.png', insertions: null, deletions: null });
  });

  it('returns an empty array for empty output', () => {
    expect(parseNumstat('')).toEqual([]);
  });
});
