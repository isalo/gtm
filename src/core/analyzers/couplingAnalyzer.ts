/**
 * Change-coupling analyzer.
 *
 * Detects "temporal coupling" — files that repeatedly change together in the
 * same commit. High coupling between files in different modules often reveals
 * hidden dependencies or missing abstractions that raw `git` won't show.
 *
 * Noise control:
 *  - Commits touching a very large number of files (merges, mass reformats,
 *    dependency bumps) create spurious coupling, so they're skipped via
 *    `maxFilesPerCommit`.
 *  - Pairs below `minShared` co-changes are dropped.
 */
import { GitClient } from '../git/gitClient.js';
import type { AnalysisOptions, CouplingPair, CouplingReport } from '../models/types.js';

const DEFAULT_TOP = 20;
const DEFAULT_MIN_SHARED = 3;
const DEFAULT_MAX_FILES_PER_COMMIT = 25;

export interface CouplingOptions extends AnalysisOptions {
  /** Maximum number of pairs to return. */
  readonly top?: number;
  /** Minimum co-changes for a pair to be reported. */
  readonly minShared?: number;
  /** Ignore commits that touch more than this many files. */
  readonly maxFilesPerCommit?: number;
}

export async function analyzeCoupling(options: CouplingOptions): Promise<CouplingReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const numstat = await git.numstat({
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  });

  const top = options.top ?? DEFAULT_TOP;
  const minShared = options.minShared ?? DEFAULT_MIN_SHARED;
  const maxFiles = options.maxFilesPerCommit ?? DEFAULT_MAX_FILES_PER_COMMIT;

  const fileCommits = new Map<string, number>();
  const pairCounts = new Map<string, number>();

  for (const commit of numstat) {
    const paths = commit.files.map((f) => f.path);
    if (paths.length < 2 || paths.length > maxFiles) {
      // Still count single-file commits toward each file's total.
      for (const p of paths) fileCommits.set(p, (fileCommits.get(p) ?? 0) + 1);
      continue;
    }
    for (const p of paths) fileCommits.set(p, (fileCommits.get(p) ?? 0) + 1);

    const sorted = [...paths].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}\u0000${sorted[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const pairs: CouplingPair[] = [];
  for (const [key, shared] of pairCounts) {
    if (shared < minShared) continue;
    const sep = key.indexOf('\u0000');
    const fileA = key.slice(0, sep);
    const fileB = key.slice(sep + 1);
    const commitsA = fileCommits.get(fileA) ?? shared;
    const commitsB = fileCommits.get(fileB) ?? shared;
    const coupling = shared / Math.max(1, Math.min(commitsA, commitsB));
    pairs.push({ fileA, fileB, sharedCommits: shared, commitsA, commitsB, coupling });
  }

  pairs.sort((a, b) => b.coupling - a.coupling || b.sharedCommits - a.sharedCommits);

  return {
    repoPath: git.repoPath,
    analyzedCommits: numstat.length,
    minShared,
    pairs: pairs.slice(0, top),
  };
}
