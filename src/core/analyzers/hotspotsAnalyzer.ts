/**
 * Hotspots analyzer.
 *
 * Identifies risky files by combining change frequency with author spread.
 * Pure logic on top of the {@link GitClient}; ranking lives in {@link scoreHotspots}.
 */
import { GitClient } from '../git/gitClient.js';
import type { AnalysisOptions, HotspotsReport } from '../models/types.js';
import { buildFileChurn, scoreHotspots } from './churn.js';

const DEFAULT_LIMIT = 20;

export interface HotspotsOptions extends AnalysisOptions {
  /** Maximum number of files to return. */
  readonly limit?: number;
}

export async function analyzeHotspots(options: HotspotsOptions): Promise<HotspotsReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const logOptions = {
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  };

  const [commits, numstat] = await Promise.all([git.log(logOptions), git.numstat(logOptions)]);
  const churn = buildFileChurn(commits, numstat);
  const ranked = scoreHotspots(churn);
  const limit = options.limit ?? DEFAULT_LIMIT;

  return {
    repoPath: git.repoPath,
    analyzedCommits: commits.length,
    hotspots: ranked.slice(0, limit),
  };
}
