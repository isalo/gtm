/**
 * Renderer for `gtm explain <path>`.
 */
import chalk from 'chalk';
import type { ExplainReport, OutputFormat } from '../core/models/types.js';
import { field, formatDate, heading, relativeTime, toJson } from './format.js';

export function renderExplain(report: ExplainReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading(`Explain: ${report.path}`));

  if (!report.exists) {
    lines.push('');
    lines.push(`  No history found for '${report.path}'.`);
    return lines.join('\n');
  }

  lines.push(field('Commits', String(report.totalCommits)));
  lines.push(field('Created', formatDate(report.createdAt)));
  lines.push(
    field(
      'Last change',
      `${formatDate(report.lastModified)} (${relativeTime(report.lastModified)})`,
    ),
  );

  lines.push('');
  lines.push(heading('Ownership'));
  for (const entry of report.authors.slice(0, 5)) {
    const pct = `${(entry.share * 100).toFixed(0)}%`.padStart(4);
    lines.push(
      `  ${chalk.green(pct)} ${String(entry.commits).padStart(4)}c  ${entry.author.name} ${chalk.dim(`<${entry.author.email}>`)}`,
    );
  }

  if (report.recentCommits.length > 0) {
    lines.push('');
    lines.push(heading('Recent Commits'));
    for (const commit of report.recentCommits) {
      lines.push(
        `  ${chalk.yellow(commit.shortHash)} ${chalk.dim(relativeTime(commit.date).padEnd(14))} ${commit.subject}`,
      );
    }
  }

  return lines.join('\n');
}
