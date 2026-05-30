/**
 * Renderer for `gtm author <name>`.
 */
import chalk from 'chalk';
import type { AuthorReport, OutputFormat } from '../core/models/types.js';
import { field, formatDate, heading, relativeTime, toJson } from './format.js';

export function renderAuthor(report: AuthorReport, format: OutputFormat): string {
  if (format === 'json') return toJson(report);

  const lines: string[] = [];
  lines.push(heading(`Author: ${report.query}`));

  if (!report.contribution) {
    lines.push('');
    lines.push(`  No commits found matching '${report.query}'.`);
    return lines.join('\n');
  }

  const c = report.contribution;
  if (report.matched.length > 0) {
    lines.push(field('Identities', report.matched.map((i) => `${i.name} <${i.email}>`).join(', ')));
  }
  lines.push(field('Commits', String(c.commits)));
  lines.push(field('Lines', `${chalk.green(`+${c.insertions}`)} ${chalk.red(`-${c.deletions}`)}`));
  lines.push(
    field('Active', `${formatDate(c.firstCommit)} -> ${formatDate(c.lastCommit)} (${relativeTime(c.lastCommit)})`),
  );

  if (report.topFiles.length > 0) {
    lines.push('');
    lines.push(heading('Most-Touched Files'));
    for (const file of report.topFiles) {
      lines.push(`  ${chalk.green(String(file.commits).padStart(4))}c  ${file.path}`);
    }
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
