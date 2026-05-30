/**
 * Shared churn computation.
 *
 * Joins commit metadata (author/date) with `--numstat` rows to produce
 * per-file {@link FileChurn}. Reused by hotspots and author analyzers so the
 * "how often / by how many people was this file changed" logic lives in one
 * place.
 */
import type { NumstatCommit } from '../git/gitClient.js';
import type { CommitInfo, FileChurn, Hotspot } from '../models/types.js';
import { identityKey } from './identity.js';

interface MutableChurn {
  path: string;
  commits: number;
  insertions: number;
  deletions: number;
  authors: Set<string>;
  lastModified: string;
}

/**
 * Aggregate per-file churn from commits + numstat. `commits` is used only to
 * resolve each commit's author and date by hash.
 */
export function buildFileChurn(
  commits: readonly CommitInfo[],
  numstat: readonly NumstatCommit[],
): FileChurn[] {
  const byHash = new Map<string, CommitInfo>(commits.map((c) => [c.hash, c]));
  const files = new Map<string, MutableChurn>();

  for (const entry of numstat) {
    const commit = byHash.get(entry.hash);
    const date = commit?.date ?? '';
    const authorKey = commit ? identityKey(commit.author) : entry.hash;

    for (const file of entry.files) {
      const existing = files.get(file.path);
      const target =
        existing ??
        files
          .set(file.path, {
            path: file.path,
            commits: 0,
            insertions: 0,
            deletions: 0,
            authors: new Set<string>(),
            lastModified: '',
          })
          .get(file.path)!;

      target.commits += 1;
      target.insertions += file.insertions ?? 0;
      target.deletions += file.deletions ?? 0;
      target.authors.add(authorKey);
      if (date > target.lastModified) target.lastModified = date;
    }
  }

  return [...files.values()].map((file) => ({
    path: file.path,
    commits: file.commits,
    insertions: file.insertions,
    deletions: file.deletions,
    authors: file.authors.size,
    lastModified: file.lastModified,
  }));
}

/**
 * Score files for risk on a 0..1 scale.
 *
 * Heuristic: files that change often AND are touched by many people are the
 * riskiest (high churn + diffuse ownership => knowledge gaps and bugs). We
 * normalize both signals against the max in the set and weight frequency more
 * heavily than author spread.
 */
export function scoreHotspots(churn: readonly FileChurn[]): Hotspot[] {
  const maxCommits = Math.max(1, ...churn.map((c) => c.commits));
  const maxAuthors = Math.max(1, ...churn.map((c) => c.authors));
  const COMMIT_WEIGHT = 0.7;
  const AUTHOR_WEIGHT = 0.3;

  return churn
    .map((file) => {
      const frequency = file.commits / maxCommits;
      const spread = file.authors / maxAuthors;
      const riskScore = Math.min(1, COMMIT_WEIGHT * frequency + AUTHOR_WEIGHT * spread);
      return { ...file, riskScore };
    })
    .sort((a, b) => b.riskScore - a.riskScore || b.commits - a.commits);
}
