/**
 * Activity analyzer.
 *
 * Buckets commits by weekday, hour, and month to reveal team cadence. Times
 * are read as the commit's own local wall-clock (from the ISO offset), so the
 * heatmap reflects when authors actually worked rather than the machine that
 * runs the analysis.
 */
import { GitClient } from '../git/gitClient.js';
import type { ActivityReport, AnalysisOptions, MonthCount } from '../models/types.js';

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):/;

/** Local-time weekday (0=Sun..6=Sat), hour (0..23), and month (YYYY-MM). */
export function parseLocalParts(
  iso: string,
): { weekday: number; hour: number; month: string } | null {
  const m = ISO.exec(iso);
  if (!m) return null;
  const [, y, mo, d, h] = m;
  const weekday = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay();
  return { weekday, hour: Number(h), month: `${y}-${mo}` };
}

export async function analyzeActivity(options: AnalysisOptions): Promise<ActivityReport> {
  const git = new GitClient(options.repoPath);
  await git.assertRepo();

  const commits = await git.log({
    ...(options.maxCommits !== undefined ? { maxCount: options.maxCommits } : {}),
    ...(options.since !== undefined ? { since: options.since } : {}),
  });

  const byWeekdayHour: number[][] = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const byWeekday = new Array<number>(7).fill(0);
  const byHour = new Array<number>(24).fill(0);
  const months = new Map<string, number>();

  for (const commit of commits) {
    const parts = parseLocalParts(commit.date);
    if (!parts) continue;
    byWeekdayHour[parts.weekday]![parts.hour]! += 1;
    byWeekday[parts.weekday]! += 1;
    byHour[parts.hour]! += 1;
    months.set(parts.month, (months.get(parts.month) ?? 0) + 1);
  }

  const byMonth: MonthCount[] = [...months.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  return {
    repoPath: git.repoPath,
    totalCommits: commits.length,
    byWeekdayHour,
    byWeekday,
    byHour,
    byMonth,
    busiestWeekday: indexOfMax(byWeekday),
    busiestHour: indexOfMax(byHour),
  };
}

function indexOfMax(values: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i]! > values[best]!) best = i;
  return best;
}
