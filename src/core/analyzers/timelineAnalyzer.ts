/**
 * Timeline analyzer.
 *
 * Produces a chronological (oldest-first) list of commits that touched a path,
 * each annotated with the lines added/removed for that path in that commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { GitClient } from '../git/gitClient.js';
import type {
  AnalysisOptions,
  CommitStats,
  TimelineEntry,
  TimelineReport,
} from '../models/types.js';

export interface TimelineOptions extends AnalysisOptions {
  /** Repository-relative or absolute path to build a timeline for. */
  readonly target: string;
}

export async function analyzeTimeline(options: TimelineOptions): Promise<TimelineReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const absolute = path.resolve(options.repoPath, options.target);
  const isFile = fs.existsSync(absolute) && fs.statSync(absolute).isFile();

  const logOptions = {
    path: options.target,
    follow: isFile,
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  };

  const [commits, numstat] = await Promise.all([git.log(logOptions), git.numstat(logOptions)]);
  const statsByHash = new Map<string, CommitStats>();
  for (const entry of numstat) {
    let insertions = 0;
    let deletions = 0;
    for (const file of entry.files) {
      insertions += file.insertions ?? 0;
      deletions += file.deletions ?? 0;
    }
    statsByHash.set(entry.hash, {
      filesChanged: entry.files.length,
      insertions,
      deletions,
    });
  }

  // Oldest first for a natural reading order.
  const entries: TimelineEntry[] = [...commits].reverse().map((commit) => ({
    commit,
    stats: statsByHash.get(commit.hash) ?? { filesChanged: 0, insertions: 0, deletions: 0 },
  }));

  return { path: options.target, entries };
}
