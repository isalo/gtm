/**
 * Bus-factor analyzer.
 *
 * Surfaces "knowledge silos" — files whose history is dominated by a single
 * author. A high single-author share means the project is fragile if that
 * person leaves, which is exactly the risk teams want to find when onboarding
 * or planning hand-offs.
 */
import { GitClient } from '../git/gitClient.js';
import type {
  AnalysisOptions,
  BusFactorFile,
  BusFactorReport,
  CommitInfo,
  Identity,
} from '../models/types.js';
import { identityKey } from './identity.js';

const DEFAULT_THRESHOLD = 0.8;
const DEFAULT_TOP = 20;

export interface BusFactorOptions extends AnalysisOptions {
  /** Single-author dominance threshold (0..1) to flag a file as siloed. */
  readonly threshold?: number;
  /** Maximum number of siloed files to return. */
  readonly top?: number;
}

interface FileAuthors {
  total: number;
  authors: Map<string, { author: Identity; commits: number }>;
}

export async function analyzeBusFactor(options: BusFactorOptions): Promise<BusFactorReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const logOptions = {
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  };

  const [commits, numstat] = await Promise.all([git.log(logOptions), git.numstat(logOptions)]);
  const byHash = new Map<string, CommitInfo>(commits.map((c) => [c.hash, c]));

  const files = new Map<string, FileAuthors>();
  for (const entry of numstat) {
    const commit = byHash.get(entry.hash);
    if (!commit) continue;
    const key = identityKey(commit.author);
    for (const file of entry.files) {
      const fa =
        files.get(file.path) ??
        files.set(file.path, { total: 0, authors: new Map() }).get(file.path)!;
      fa.total += 1;
      const a = fa.authors.get(key);
      if (a) a.commits += 1;
      else fa.authors.set(key, { author: commit.author, commits: 1 });
    }
  }

  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const top = options.top ?? DEFAULT_TOP;

  const siloed: BusFactorFile[] = [];
  for (const [path, fa] of files) {
    let primary = { author: { name: '', email: '' } as Identity, commits: 0 };
    for (const entry of fa.authors.values()) {
      if (entry.commits > primary.commits) primary = entry;
    }
    const primaryShare = primary.commits / fa.total;
    if (primaryShare >= threshold) {
      siloed.push({
        path,
        commits: fa.total,
        authors: fa.authors.size,
        primaryAuthor: primary.author,
        primaryShare,
      });
    }
  }

  // Most-changed siloed files first — those carry the most concentrated knowledge.
  siloed.sort((a, b) => b.commits - a.commits || b.primaryShare - a.primaryShare);

  return {
    repoPath: git.repoPath,
    analyzedCommits: commits.length,
    threshold,
    totalFiles: files.size,
    siloedFiles: siloed.length,
    files: siloed.slice(0, top),
  };
}
