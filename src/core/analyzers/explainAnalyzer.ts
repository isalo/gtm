/**
 * Explain analyzer.
 *
 * Summarizes a single path's history: how many commits touched it, who owns
 * it, when it was created and last changed, and the most recent commits.
 */
import fs from 'node:fs';
import path from 'node:path';
import { GitClient } from '../git/gitClient.js';
import type {
  AnalysisOptions,
  CommitInfo,
  ExplainReport,
  OwnershipEntry,
} from '../models/types.js';
import { identityKey } from './identity.js';

const RECENT_COMMITS = 10;

export interface ExplainOptions extends AnalysisOptions {
  /** Repository-relative or absolute path to explain. */
  readonly target: string;
}

export async function analyzeExplain(options: ExplainOptions): Promise<ExplainReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  // `--follow` only makes sense for a single existing file (rename tracking).
  const absolute = path.resolve(options.repoPath, options.target);
  const isFile = fs.existsSync(absolute) && fs.statSync(absolute).isFile();

  const commits = await git.log({
    path: options.target,
    follow: isFile,
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  });

  const dates = commits.map((c) => c.date).filter(Boolean);

  return {
    path: options.target,
    exists: commits.length > 0,
    totalCommits: commits.length,
    authors: ownership(commits),
    createdAt: dates.length > 0 ? (dates[dates.length - 1] ?? null) : null,
    lastModified: dates.length > 0 ? (dates[0] ?? null) : null,
    recentCommits: commits.slice(0, RECENT_COMMITS),
  };
}

/** Ownership shares by author for a set of commits, sorted descending. */
export function ownership(commits: readonly CommitInfo[]): OwnershipEntry[] {
  const total = commits.length;
  if (total === 0) return [];

  const counts = new Map<string, { author: CommitInfo['author']; commits: number }>();
  for (const commit of commits) {
    const key = identityKey(commit.author);
    const existing = counts.get(key);
    if (existing) existing.commits += 1;
    else counts.set(key, { author: commit.author, commits: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.commits - a.commits)
    .map((entry) => ({
      author: entry.author,
      commits: entry.commits,
      share: entry.commits / total,
    }));
}
