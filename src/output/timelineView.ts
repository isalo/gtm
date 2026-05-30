/**
 * Renderer for `gtm timeline <path>`.
 */
import chalk from 'chalk';
import type { OutputFormat, TimelineReport } from '../core/models/types.js';
import { formatDate, heading, toJson } from './format.js';

export function renderTimeline(report: TimelineReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading(`Timeline: ${report.path}`));

  if (report.entries.length === 0) {
    lines.push('');
    lines.push(`  No history found for '${report.path}'.`);
    return lines.join('\n');
  }

  lines.push(chalk.dim(`  ${report.entries.length} commits (oldest first)`));
  lines.push('');

  for (const entry of report.entries) {
    const { commit, stats } = entry;
    const churn =
      `${chalk.green(`+${stats.insertions}`)} ${chalk.red(`-${stats.deletions}`)}`.padEnd(24);
    lines.push(
      `  ${chalk.dim(formatDate(commit.date))} ${chalk.yellow(commit.shortHash)} ${churn} ${commit.subject}`,
    );
    lines.push(`  ${' '.repeat(10)} ${chalk.dim(commit.author.name)}`);
  }

  return lines.join('\n');
}
