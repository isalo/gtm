/**
 * Summary analyzer.
 *
 * Pure business logic that turns raw git data into a {@link RepoSummary}.
 * It performs no console I/O and no direct git calls beyond the injected
 * {@link GitClient}, which keeps it unit-testable.
 */
import { GitClient } from '../git/gitClient.js';
import type {
  AnalysisOptions,
  AuthorContribution,
  CommitInfo,
  Identity,
  RepoSummary,
} from '../models/types.js';
import { identityKey } from './identity.js';

const RECENT_COMMITS = 5;
const TOP_AUTHORS = 5;

export async function analyzeSummary(options: AnalysisOptions): Promise<RepoSummary> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const logOptions = {
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  };

  const [branch, totalCommits, trackedFiles, commits] = await Promise.all([
    git.currentBranch(),
    git.commitCount(),
    git.trackedFileCount(),
    git.log(logOptions),
  ]);

  const authors = aggregateAuthors(commits);
  const dates = commits.map((c) => c.date).filter(Boolean).sort();
  const firstCommitDate = dates[0] ?? null;
  const lastCommitDate = dates[dates.length - 1] ?? null;

  return {
    repoPath: git.repoPath,
    branch,
    totalCommits,
    totalAuthors: authors.length,
    firstCommitDate,
    lastCommitDate,
    ageDays: computeAgeDays(firstCommitDate, lastCommitDate),
    trackedFiles,
    topAuthors: authors.slice(0, TOP_AUTHORS),
    recentCommits: commits.slice(0, RECENT_COMMITS),
  };
}

/** Group commits by author email, sorted by commit count descending. */
export function aggregateAuthors(commits: readonly CommitInfo[]): AuthorContribution[] {
  const byKey = new Map<string, MutableContribution>();

  for (const commit of commits) {
    const key = identityKey(commit.author);
    const existing = byKey.get(key);
    if (existing) {
      existing.commits += 1;
      if (commit.date < existing.firstCommit) existing.firstCommit = commit.date;
      if (commit.date > existing.lastCommit) existing.lastCommit = commit.date;
    } else {
      byKey.set(key, {
        author: commit.author,
        commits: 1,
        insertions: 0,
        deletions: 0,
        firstCommit: commit.date,
        lastCommit: commit.date,
      });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.commits - a.commits)
    .map((entry) => ({ ...entry }));
}

/** Inclusive repository age in whole days between first and last commit. */
export function computeAgeDays(first: string | null, last: string | null): number {
  if (!first || !last) return 0;
  const start = Date.parse(first);
  const end = Date.parse(last);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((end - start) / dayMs));
}

interface MutableContribution {
  author: Identity;
  commits: number;
  insertions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
}
