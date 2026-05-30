/**
 * Renderer for `gtm summary`.
 *
 * Converts a {@link RepoSummary} into either colored text or JSON. This is the
 * only place that knows how a summary should *look*.
 */
import chalk from 'chalk';
import type { RepoSummary } from '../core/models/types.js';
import { field, formatDate, heading, relativeTime, toJson } from './format.js';

export function renderSummary(summary: RepoSummary, format: 'text' | 'json'): string {
  if (format === 'json') return toJson(summary);

  const lines: string[] = [];
  lines.push(heading('Repository Summary'));
  lines.push(field('Path', summary.repoPath));
  lines.push(field('Branch', summary.branch));
  lines.push(field('Commits', String(summary.totalCommits)));
  lines.push(field('Authors', String(summary.totalAuthors)));
  lines.push(field('Tracked files', String(summary.trackedFiles)));
  lines.push(
    field(
      'Active period',
      `${formatDate(summary.firstCommitDate)} -> ${formatDate(summary.lastCommitDate)} (${summary.ageDays} days)`,
    ),
  );

  if (summary.topAuthors.length > 0) {
    lines.push('');
    lines.push(heading('Top Authors'));
    for (const author of summary.topAuthors) {
      const label = `${author.author.name}`;
      lines.push(
        `  ${chalk.green(String(author.commits).padStart(5))}  ${label} ${chalk.dim(`<${author.author.email}>`)}`,
      );
    }
  }

  if (summary.recentCommits.length > 0) {
    lines.push('');
    lines.push(heading('Recent Commits'));
    for (const commit of summary.recentCommits) {
      lines.push(
        `  ${chalk.yellow(commit.shortHash)} ${chalk.dim(relativeTime(commit.date).padEnd(14))} ${commit.subject}`,
      );
    }
  }

  return lines.join('\n');
}
