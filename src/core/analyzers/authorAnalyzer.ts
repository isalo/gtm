/**
 * Author analyzer.
 *
 * Builds a contribution profile for an author matched by name or email:
 * total commits, lines changed, active period, the files they touch most, and
 * their most recent commits.
 */
import { GitClient } from '../git/gitClient.js';
import type {
  AnalysisOptions,
  AuthorContribution,
  AuthorReport,
  CommitInfo,
  Identity,
} from '../models/types.js';
import { buildFileChurn } from './churn.js';
import { identityKey, identityMatches } from './identity.js';

const RECENT_COMMITS = 10;
const TOP_FILES = 10;

export interface AuthorOptions extends AnalysisOptions {
  /** Name or email substring to match. */
  readonly query: string;
}

export async function analyzeAuthor(options: AuthorOptions): Promise<AuthorReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const logOptions = {
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  };

  const [commits, numstat] = await Promise.all([git.log(logOptions), git.numstat(logOptions)]);

  const matchedCommits = commits.filter((c) => identityMatches(c.author, options.query));
  const matchedHashes = new Set(matchedCommits.map((c) => c.hash));
  const matchedNumstat = numstat.filter((n) => matchedHashes.has(n.hash));

  const matched = distinctIdentities(matchedCommits);
  const contribution = buildContribution(matchedCommits, matchedNumstat);
  const topFiles = buildFileChurn(matchedCommits, matchedNumstat)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, TOP_FILES);

  return {
    query: options.query,
    matched,
    contribution,
    topFiles,
    recentCommits: matchedCommits.slice(0, RECENT_COMMITS),
  };
}

function distinctIdentities(commits: readonly CommitInfo[]): Identity[] {
  const seen = new Map<string, Identity>();
  for (const commit of commits) {
    const key = identityKey(commit.author);
    if (!seen.has(key)) seen.set(key, commit.author);
  }
  return [...seen.values()];
}

function buildContribution(
  commits: readonly CommitInfo[],
  numstat: readonly {
    hash: string;
    files: readonly { insertions: number | null; deletions: number | null }[];
  }[],
): AuthorContribution | null {
  if (commits.length === 0) return null;

  let insertions = 0;
  let deletions = 0;
  for (const entry of numstat) {
    for (const file of entry.files) {
      insertions += file.insertions ?? 0;
      deletions += file.deletions ?? 0;
    }
  }

  const dates = commits
    .map((c) => c.date)
    .filter(Boolean)
    .sort();
  const first = commits[0]!.author;

  return {
    author: first,
    commits: commits.length,
    insertions,
    deletions,
    firstCommit: dates[0] ?? '',
    lastCommit: dates[dates.length - 1] ?? '',
  };
}
